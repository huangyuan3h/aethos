#![allow(dead_code)]

use std::sync::Arc;

use rand::{distributions::Alphanumeric, Rng};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{FromRow, Row};
use tracing::{info, instrument};

use super::{
    crypto::{CryptoService, KeyManager},
    database::create_pool,
    error::ConfigError,
    paths::ConfigPaths,
};

pub type SharedConfigService = Arc<ConfigService>;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderSummary {
    pub id: i64,
    pub provider: String,
    pub display_name: String,
    pub default_model: Option<String>,
    pub is_default: bool,
    pub has_api_key: bool,
}

pub struct ProviderCredential {
    pub provider: String,
    pub display_name: String,
    pub default_model: Option<String>,
    pub api_key: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderUpsertPayload {
    pub provider: String,
    pub display_name: String,
    pub api_key: String,
    pub default_model: Option<String>,
    pub make_default: bool,
}

#[derive(Debug, FromRow)]
struct ProviderRow {
    id: i64,
    provider: String,
    display_name: String,
    default_model: Option<String>,
    is_default: i64,
    has_key: i64,
}

impl From<ProviderRow> for ProviderSummary {
    fn from(row: ProviderRow) -> Self {
        Self {
            id: row.id,
            provider: row.provider,
            display_name: row.display_name,
            default_model: row.default_model,
            is_default: row.is_default == 1,
            has_api_key: row.has_key == 1,
        }
    }
}

#[derive(Debug, Clone, Serialize, Default)]
pub struct UserPreferences {
    pub language: Option<String>,
    pub theme: Option<String>,
    pub system_prompt: Option<String>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ConversationSummary {
    pub id: String,
    pub title: String,
    pub pinned: bool,
    pub last_message_preview: Option<String>,
    pub last_message_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ConversationMessage {
    pub id: String,
    pub conversation_id: String,
    pub role: String,
    pub content: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct McpSource {
    pub id: i64,
    pub slug: String,
    pub name: String,
    pub kind: String,
    pub endpoint: Option<String>,
    pub priority: i64,
    pub last_synced_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpSourceUpsert {
    pub slug: String,
    pub name: String,
    pub kind: Option<String>,
    pub endpoint: Option<String>,
    pub priority: Option<i64>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct McpRegistryEntry {
    pub id: i64,
    pub slug: String,
    pub name: String,
    pub version: String,
    pub summary: Option<String>,
    pub author: Option<String>,
    pub homepage: Option<String>,
    pub tags: Option<String>,
    pub manifest: String,
    pub checksum: Option<String>,
    pub source_slug: Option<String>,
    pub synced_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpRegistryUpsert {
    pub slug: String,
    pub name: String,
    pub version: String,
    pub summary: Option<String>,
    pub author: Option<String>,
    pub homepage: Option<String>,
    pub tags: Option<Vec<String>>,
    pub manifest: Value,
    pub checksum: Option<String>,
    pub source_slug: Option<String>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct McpServerSummary {
    pub id: i64,
    pub slug: String,
    pub name: String,
    pub installed_version: Option<String>,
    pub status: String,
    pub install_path: Option<String>,
    pub auto_start: bool,
    pub config: Option<String>,
    pub last_health_check: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpServerUpsert {
    pub slug: String,
    pub name: String,
    pub installed_version: Option<String>,
    pub status: Option<String>,
    pub install_path: Option<String>,
    pub auto_start: Option<bool>,
    pub config: Option<Value>,
    pub secrets: Option<Value>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PreferencesUpdate {
    pub language: Option<String>,
    pub theme: Option<String>,
    #[serde(default)]
    pub system_prompt: Option<String>,
}

pub struct ConfigService {
    pool: sqlx::SqlitePool,
    crypto: CryptoService,
    pub paths: ConfigPaths,
}

impl ConfigService {
    pub async fn initialize() -> Result<SharedConfigService, ConfigError> {
        let paths = ConfigPaths::default()?;
        Self::with_paths(paths).await
    }

    pub async fn get_preferences(&self) -> Result<UserPreferences, ConfigError> {
        Ok(UserPreferences {
            language: self.get_setting("ui.language").await?,
            theme: self.get_setting("ui.theme").await?,
            system_prompt: self.get_setting("chat.systemPrompt").await?,
        })
    }

    pub async fn save_preferences(&self, prefs: PreferencesUpdate) -> Result<(), ConfigError> {
        if let Some(language) = prefs.language {
            self.set_setting("ui.language", &language, false).await?;
        }
        if let Some(theme) = prefs.theme {
            self.set_setting("ui.theme", &theme, false).await?;
        }
        if let Some(prompt) = prefs.system_prompt {
            self.set_setting("chat.systemPrompt", &prompt, false)
                .await?;
        }
        Ok(())
    }

    pub async fn with_paths(paths: ConfigPaths) -> Result<SharedConfigService, ConfigError> {
        let pool = create_pool(&paths).await?;
        let key_manager = KeyManager::new(&paths);
        let master_key =
            tokio::task::spawn_blocking(move || key_manager.resolve_master_key()).await??;
        let crypto = CryptoService::new(master_key)?;
        Ok(Arc::new(Self {
            pool,
            crypto,
            paths,
        }))
    }

    pub fn pool(&self) -> &sqlx::SqlitePool {
        &self.pool
    }

    #[instrument(skip(self, value))]
    pub async fn set_setting(
        &self,
        key: &str,
        value: &str,
        secret: bool,
    ) -> Result<(), ConfigError> {
        let maybe_value = if secret {
            Some(self.crypto.encrypt(value)?)
        } else {
            None
        };
        let stored = maybe_value.unwrap_or_else(|| value.to_string());
        sqlx::query(
            r#"
        INSERT INTO settings (key, value, is_secret, updated_at)
        VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value=excluded.value, is_secret=excluded.is_secret, updated_at=CURRENT_TIMESTAMP
      "#,
        )
        .bind(key)
        .bind(stored)
        .bind(if secret { 1 } else { 0 })
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn get_setting(&self, key: &str) -> Result<Option<String>, ConfigError> {
        let row = sqlx::query("SELECT value, is_secret FROM settings WHERE key = ?1")
            .bind(key)
            .fetch_optional(&self.pool)
            .await?;
        if let Some(row) = row {
            let value: String = row.try_get("value")?;
            let is_secret: i64 = row.try_get("is_secret")?;
            if is_secret == 1 {
                return self.crypto.decrypt(&value).map(Some);
            }
            return Ok(Some(value));
        }
        Ok(None)
    }

    pub async fn list_providers(&self) -> Result<Vec<ProviderSummary>, ConfigError> {
        let rows = sqlx::query_as::<_, ProviderRow>(
            r#"
        SELECT
          id,
          provider,
          display_name,
          default_model,
          is_default,
          CASE WHEN LENGTH(api_key) > 0 THEN 1 ELSE 0 END as has_key
        FROM providers
        ORDER BY display_name
      "#,
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn default_provider_credentials(&self) -> Result<ProviderCredential, ConfigError> {
        let row = sqlx::query(
            r#"
        SELECT provider, display_name, default_model, api_key
        FROM providers
        WHERE is_default = 1
        ORDER BY id ASC
        LIMIT 1
      "#,
        )
        .fetch_optional(&self.pool)
        .await?;

        let row = if let Some(row) = row {
            row
        } else {
            sqlx::query(
                r#"
            SELECT provider, display_name, default_model, api_key
            FROM providers
            ORDER BY id ASC
            LIMIT 1
          "#,
            )
            .fetch_optional(&self.pool)
            .await?
            .ok_or(ConfigError::MissingDefaultProvider)?
        };

        let encrypted_key: String = row.try_get("api_key")?;
        let api_key = self.crypto.decrypt(&encrypted_key)?;

        Ok(ProviderCredential {
            provider: row.try_get("provider")?,
            display_name: row.try_get("display_name")?,
            default_model: row.try_get("default_model")?,
            api_key,
        })
    }

    pub async fn upsert_provider(
        &self,
        payload: ProviderUpsertPayload,
    ) -> Result<ProviderSummary, ConfigError> {
        let mut tx = self.pool.begin().await?;
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM providers")
            .fetch_one(&mut *tx)
            .await?;
        let should_default = payload.make_default || count == 0;
        if should_default {
            sqlx::query("UPDATE providers SET is_default = 0")
                .execute(&mut *tx)
                .await?;
        }
        let encrypted = self.crypto.encrypt(&payload.api_key)?;
        sqlx::query(
            r#"
        INSERT INTO providers (provider, display_name, api_key, default_model, is_default)
        VALUES (?1, ?2, ?3, ?4, ?5)
        ON CONFLICT(provider) DO UPDATE SET
          display_name = excluded.display_name,
          api_key = excluded.api_key,
          default_model = excluded.default_model,
          is_default = CASE
            WHEN excluded.is_default = 1 THEN 1
            ELSE providers.is_default
          END,
          updated_at = CURRENT_TIMESTAMP
      "#,
        )
        .bind(&payload.provider)
        .bind(&payload.display_name)
        .bind(encrypted)
        .bind(&payload.default_model)
        .bind(if should_default { 1 } else { 0 })
        .execute(&mut *tx)
        .await?;
        tx.commit().await?;
        self.get_provider_by_slug(&payload.provider)
            .await?
            .ok_or_else(|| ConfigError::Database(sqlx::Error::RowNotFound))
    }

    pub async fn set_default_provider(&self, provider: &str) -> Result<(), ConfigError> {
        let mut tx = self.pool.begin().await?;
        sqlx::query("UPDATE providers SET is_default = CASE WHEN provider = ?1 THEN 1 ELSE 0 END")
            .bind(provider)
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;
        Ok(())
    }

    pub async fn has_any_provider(&self) -> Result<bool, ConfigError> {
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM providers")
            .fetch_one(&self.pool)
            .await?;
        Ok(count > 0)
    }

    fn generate_id() -> String {
        rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(21)
            .map(char::from)
            .collect()
    }

    pub async fn create_conversation(
        &self,
        title: Option<String>,
    ) -> Result<ConversationSummary, ConfigError> {
        let id = Self::generate_id();
        let title = title.unwrap_or_else(|| "New chat".to_string());
        sqlx::query(
            r#"
        INSERT INTO conversations (id, title)
        VALUES (?1, ?2)
      "#,
        )
        .bind(&id)
        .bind(&title)
        .execute(&self.pool)
        .await?;
        self.get_conversation(&id).await
    }

    pub async fn get_conversation(&self, id: &str) -> Result<ConversationSummary, ConfigError> {
        Ok(sqlx::query_as::<_, ConversationSummary>(
            r#"
        SELECT
          id,
          title,
          pinned,
          last_message_preview,
          last_message_at,
          created_at,
          updated_at
        FROM conversations
        WHERE id = ?1
      "#,
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?)
    }

    pub async fn list_conversations(&self) -> Result<Vec<ConversationSummary>, ConfigError> {
        let rows = sqlx::query_as::<_, ConversationSummary>(
            r#"
        SELECT
          id,
          title,
          pinned,
          last_message_preview,
          last_message_at,
          created_at,
          updated_at
        FROM conversations
        ORDER BY pinned DESC, COALESCE(last_message_at, updated_at) DESC, created_at DESC
      "#,
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(rows)
    }

    pub async fn rename_conversation(
        &self,
        id: &str,
        title: &str,
    ) -> Result<ConversationSummary, ConfigError> {
        sqlx::query(
            r#"
        UPDATE conversations
        SET title = ?1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?2
      "#,
        )
        .bind(title)
        .bind(id)
        .execute(&self.pool)
        .await?;
        self.get_conversation(id).await
    }

    pub async fn set_conversation_pin(
        &self,
        id: &str,
        pinned: bool,
    ) -> Result<ConversationSummary, ConfigError> {
        sqlx::query(
            r#"
        UPDATE conversations
        SET pinned = ?1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?2
      "#,
        )
        .bind(if pinned { 1 } else { 0 })
        .bind(id)
        .execute(&self.pool)
        .await?;
        self.get_conversation(id).await
    }

    pub async fn delete_conversation(&self, id: &str) -> Result<(), ConfigError> {
        sqlx::query("DELETE FROM conversations WHERE id = ?1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        info!(conversation_id = %id, "conversation deleted");
        Ok(())
    }

    pub async fn record_message(
        &self,
        conversation_id: &str,
        role: &str,
        content: &str,
    ) -> Result<ConversationMessage, ConfigError> {
        let message_id = Self::generate_id();
        let preview = content.chars().take(200).collect::<String>();
        let mut tx = self.pool.begin().await?;
        sqlx::query(
            r#"
        INSERT INTO messages (id, conversation_id, role, content)
        VALUES (?1, ?2, ?3, ?4)
      "#,
        )
        .bind(&message_id)
        .bind(conversation_id)
        .bind(role)
        .bind(content)
        .execute(&mut *tx)
        .await?;
        sqlx::query(
            r#"
        UPDATE conversations
        SET last_message_preview = ?1,
            last_message_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?2
      "#,
        )
        .bind(preview)
        .bind(conversation_id)
        .execute(&mut *tx)
        .await?;
        tx.commit().await?;
        self.get_message(&message_id).await
    }

    async fn get_message(&self, id: &str) -> Result<ConversationMessage, ConfigError> {
        Ok(sqlx::query_as::<_, ConversationMessage>(
            r#"
        SELECT id, conversation_id, role, content, created_at
        FROM messages
        WHERE id = ?1
      "#,
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?)
    }

    pub async fn get_conversation_messages(
        &self,
        conversation_id: &str,
        limit: Option<i64>,
    ) -> Result<Vec<ConversationMessage>, ConfigError> {
        let mut query = String::from(
            r#"
        SELECT id, conversation_id, role, content, created_at
        FROM messages
        WHERE conversation_id = ?1
        ORDER BY created_at ASC
      "#,
        );
        if limit.is_some() {
            query.push_str(" LIMIT ?2");
        }
        let mut sql = sqlx::query_as::<_, ConversationMessage>(&query).bind(conversation_id);
        if let Some(limit) = limit {
            sql = sql.bind(limit);
        }
        let rows = sql.fetch_all(&self.pool).await?;
        Ok(rows)
    }

    pub async fn list_mcp_sources(&self) -> Result<Vec<McpSource>, ConfigError> {
        let rows = sqlx::query_as::<_, McpSource>(
            r#"
        SELECT id, slug, name, kind, endpoint, priority, last_synced_at, created_at, updated_at
        FROM mcp_sources
        ORDER BY priority ASC, name COLLATE NOCASE ASC
      "#,
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(rows)
    }

    pub async fn upsert_mcp_source(
        &self,
        payload: McpSourceUpsert,
    ) -> Result<McpSource, ConfigError> {
        sqlx::query(
            r#"
        INSERT INTO mcp_sources (slug, name, kind, endpoint, priority, updated_at)
        VALUES (?1, ?2, ?3, ?4, COALESCE(?5, 100), CURRENT_TIMESTAMP)
        ON CONFLICT(slug) DO UPDATE SET
          name = excluded.name,
          kind = excluded.kind,
          endpoint = excluded.endpoint,
          priority = excluded.priority,
          updated_at = CURRENT_TIMESTAMP
      "#,
        )
        .bind(&payload.slug)
        .bind(&payload.name)
        .bind(payload.kind.unwrap_or_else(|| "custom".to_string()))
        .bind(payload.endpoint)
        .bind(payload.priority.unwrap_or(100))
        .execute(&self.pool)
        .await?;
        let source = sqlx::query_as::<_, McpSource>(
            r#"
        SELECT id, slug, name, kind, endpoint, priority, last_synced_at, created_at, updated_at
        FROM mcp_sources
        WHERE slug = ?1
      "#,
        )
        .bind(&payload.slug)
        .fetch_one(&self.pool)
        .await?;
        Ok(source)
    }

    pub async fn delete_mcp_source(&self, slug: &str) -> Result<(), ConfigError> {
        sqlx::query("DELETE FROM mcp_sources WHERE slug = ?1")
            .bind(slug)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn list_mcp_registry(&self) -> Result<Vec<McpRegistryEntry>, ConfigError> {
        let rows = sqlx::query_as::<_, McpRegistryEntry>(
            r#"
        SELECT
          id, slug, name, version, summary, author, homepage, tags, manifest,
          checksum, source_slug, synced_at, created_at, updated_at
        FROM mcp_registry
        ORDER BY name COLLATE NOCASE ASC, version DESC
      "#,
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(rows)
    }

    pub async fn upsert_mcp_registry_entry(
        &self,
        payload: McpRegistryUpsert,
    ) -> Result<McpRegistryEntry, ConfigError> {
        let tags = payload.tags.map(|items| items.join(","));
        let manifest = serde_json::to_string(&payload.manifest)?;
        sqlx::query(
            r#"
        INSERT INTO mcp_registry
          (slug, name, version, summary, author, homepage, tags, manifest, checksum, source_slug, synced_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(slug, version) DO UPDATE SET
          name = excluded.name,
          summary = excluded.summary,
          author = excluded.author,
          homepage = excluded.homepage,
          tags = excluded.tags,
          manifest = excluded.manifest,
          checksum = excluded.checksum,
          source_slug = excluded.source_slug,
          synced_at = excluded.synced_at,
          updated_at = CURRENT_TIMESTAMP
      "#,
        )
        .bind(&payload.slug)
        .bind(&payload.name)
        .bind(&payload.version)
        .bind(payload.summary)
        .bind(payload.author)
        .bind(payload.homepage)
        .bind(tags)
        .bind(manifest)
        .bind(payload.checksum)
        .bind(payload.source_slug)
        .execute(&self.pool)
        .await?;

        let entry = sqlx::query_as::<_, McpRegistryEntry>(
            r#"
        SELECT
          id, slug, name, version, summary, author, homepage, tags, manifest,
          checksum, source_slug, synced_at, created_at, updated_at
        FROM mcp_registry
        WHERE slug = ?1 AND version = ?2
      "#,
        )
        .bind(&payload.slug)
        .bind(&payload.version)
        .fetch_one(&self.pool)
        .await?;
        Ok(entry)
    }

    pub async fn list_mcp_servers(&self) -> Result<Vec<McpServerSummary>, ConfigError> {
        let rows = sqlx::query_as::<_, McpServerSummary>(
            r#"
        SELECT
          id, slug, name, installed_version, status, install_path,
          auto_start, config, last_health_check, created_at, updated_at
        FROM mcp_servers
        ORDER BY name COLLATE NOCASE ASC
      "#,
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(rows)
    }

    pub async fn upsert_mcp_server(
        &self,
        payload: McpServerUpsert,
    ) -> Result<McpServerSummary, ConfigError> {
        let config_json = payload
            .config
            .map(|value| serde_json::to_string(&value))
            .transpose()?;
        let secrets_json = payload
            .secrets
            .map(|value| serde_json::to_string(&value))
            .transpose()?;
        let encrypted_secrets = if let Some(json) = secrets_json {
            Some(self.crypto.encrypt(&json)?)
        } else {
            None
        };
        sqlx::query(
            r#"
        INSERT INTO mcp_servers
          (slug, name, installed_version, status, install_path, auto_start, config, secrets, updated_at)
        VALUES (?1, ?2, ?3, COALESCE(?4, 'stopped'), ?5, COALESCE(?6, 0), ?7, ?8, CURRENT_TIMESTAMP)
        ON CONFLICT(slug) DO UPDATE SET
          name = excluded.name,
          installed_version = excluded.installed_version,
          status = excluded.status,
          install_path = excluded.install_path,
          auto_start = excluded.auto_start,
          config = excluded.config,
          secrets = COALESCE(excluded.secrets, mcp_servers.secrets),
          updated_at = CURRENT_TIMESTAMP
      "#,
        )
        .bind(&payload.slug)
        .bind(&payload.name)
        .bind(payload.installed_version)
        .bind(payload.status.unwrap_or_else(|| "stopped".into()))
        .bind(payload.install_path)
        .bind(payload.auto_start.map(|flag| if flag { 1 } else { 0 }))
        .bind(config_json)
        .bind(encrypted_secrets)
        .execute(&self.pool)
        .await?;

        self.get_mcp_server(&payload.slug).await
    }

    async fn get_mcp_server(&self, slug: &str) -> Result<McpServerSummary, ConfigError> {
        sqlx::query_as::<_, McpServerSummary>(
            r#"
        SELECT
          id, slug, name, installed_version, status, install_path,
          auto_start, config, last_health_check, created_at, updated_at
        FROM mcp_servers
        WHERE slug = ?1
      "#,
        )
        .bind(slug)
        .fetch_one(&self.pool)
        .await
        .map_err(Into::into)
    }

    pub async fn delete_mcp_server(&self, slug: &str) -> Result<(), ConfigError> {
        sqlx::query("DELETE FROM mcp_servers WHERE slug = ?1")
            .bind(slug)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn update_mcp_server_status(
        &self,
        slug: &str,
        status: &str,
    ) -> Result<McpServerSummary, ConfigError> {
        sqlx::query(
            r#"
        UPDATE mcp_servers
        SET status = ?1, last_health_check = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE slug = ?2
      "#,
        )
        .bind(status)
        .bind(slug)
        .execute(&self.pool)
        .await?;
        self.get_mcp_server(slug).await
    }

    async fn get_provider_by_slug(
        &self,
        provider: &str,
    ) -> Result<Option<ProviderSummary>, ConfigError> {
        let row = sqlx::query_as::<_, ProviderRow>(
            r#"
        SELECT
          id,
          provider,
          display_name,
          default_model,
          is_default,
          CASE WHEN LENGTH(api_key) > 0 THEN 1 ELSE 0 END as has_key
        FROM providers
        WHERE provider = ?1
      "#,
        )
        .bind(provider)
        .fetch_optional(&self.pool)
        .await?;
        Ok(row.map(Into::into))
    }
}

#[cfg(test)]
mod tests {
    use tempfile::tempdir;

    use super::*;

    #[tokio::test]
    async fn secret_roundtrip() {
        let temp_dir = tempdir().unwrap();
        let paths = ConfigPaths::from_base_dir(temp_dir.path()).unwrap();
        let service = ConfigService::with_paths(paths).await.unwrap();

        service
            .set_setting("openai_key", "sk-test-secret", true)
            .await
            .unwrap();
        let value = service.get_setting("openai_key").await.unwrap();
        assert_eq!(value.unwrap(), "sk-test-secret");
    }

    #[tokio::test]
    async fn plain_setting_roundtrip() {
        let temp_dir = tempdir().unwrap();
        let paths = ConfigPaths::from_base_dir(temp_dir.path()).unwrap();
        let service = ConfigService::with_paths(paths).await.unwrap();

        service.set_setting("language", "en", false).await.unwrap();
        let value = service.get_setting("language").await.unwrap();
        assert_eq!(value.unwrap(), "en");
    }

    #[tokio::test]
    async fn provider_upsert_sets_default_when_first_entry() {
        let temp_dir = tempdir().unwrap();
        let paths = ConfigPaths::from_base_dir(temp_dir.path()).unwrap();
        let service = ConfigService::with_paths(paths).await.unwrap();

        let result = service
            .upsert_provider(ProviderUpsertPayload {
                provider: "openai".into(),
                display_name: "OpenAI".into(),
                api_key: "sk-test".into(),
                default_model: Some("gpt-4o-mini".into()),
                make_default: false,
            })
            .await
            .unwrap();
        assert!(result.is_default);
    }

    #[tokio::test]
    async fn provider_switches_default_when_requested() {
        let temp_dir = tempdir().unwrap();
        let paths = ConfigPaths::from_base_dir(temp_dir.path()).unwrap();
        let service = ConfigService::with_paths(paths).await.unwrap();

        service
            .upsert_provider(ProviderUpsertPayload {
                provider: "openai".into(),
                display_name: "OpenAI".into(),
                api_key: "sk-test".into(),
                default_model: None,
                make_default: true,
            })
            .await
            .unwrap();
        service
            .upsert_provider(ProviderUpsertPayload {
                provider: "anthropic".into(),
                display_name: "Anthropic".into(),
                api_key: "ak-test".into(),
                default_model: None,
                make_default: true,
            })
            .await
            .unwrap();

        let providers = service.list_providers().await.unwrap();
        let openai = providers.iter().find(|p| p.provider == "openai").unwrap();
        let anthropic = providers
            .iter()
            .find(|p| p.provider == "anthropic")
            .unwrap();
        assert!(!openai.is_default);
        assert!(anthropic.is_default);
    }

    #[tokio::test]
    async fn preferences_roundtrip() {
        let temp_dir = tempdir().unwrap();
        let paths = ConfigPaths::from_base_dir(temp_dir.path()).unwrap();
        let service = ConfigService::with_paths(paths).await.unwrap();

        service
            .save_preferences(PreferencesUpdate {
                language: Some("zh-CN".into()),
                theme: Some("dark".into()),
                system_prompt: Some("You are Aethos".into()),
            })
            .await
            .unwrap();
        let prefs = service.get_preferences().await.unwrap();
        assert_eq!(prefs.language.as_deref(), Some("zh-CN"));
        assert_eq!(prefs.theme.as_deref(), Some("dark"));
        assert_eq!(prefs.system_prompt.as_deref(), Some("You are Aethos"));
    }

    #[tokio::test]
    async fn can_fetch_default_provider_credentials() {
        let temp_dir = tempdir().unwrap();
        let paths = ConfigPaths::from_base_dir(temp_dir.path()).unwrap();
        let service = ConfigService::with_paths(paths).await.unwrap();

        service
            .upsert_provider(ProviderUpsertPayload {
                provider: "openai".into(),
                display_name: "OpenAI".into(),
                api_key: "sk-secret-123".into(),
                default_model: Some("gpt-4o-mini".into()),
                make_default: true,
            })
            .await
            .unwrap();

        let creds = service.default_provider_credentials().await.unwrap();
        assert_eq!(creds.provider, "openai");
        assert_eq!(creds.display_name, "OpenAI");
        assert_eq!(creds.default_model.as_deref(), Some("gpt-4o-mini"));
        assert_eq!(creds.api_key, "sk-secret-123");
    }

    #[tokio::test]
    async fn conversation_lifecycle_and_messages() {
        let temp_dir = tempdir().unwrap();
        let paths = ConfigPaths::from_base_dir(temp_dir.path()).unwrap();
        let service = ConfigService::with_paths(paths).await.unwrap();

        let convo = service
            .create_conversation(Some("First chat".into()))
            .await
            .unwrap();
        assert_eq!(convo.title, "First chat");

        let renamed = service
            .rename_conversation(&convo.id, "Renamed chat")
            .await
            .unwrap();
        assert_eq!(renamed.title, "Renamed chat");

        let pinned = service.set_conversation_pin(&convo.id, true).await.unwrap();
        assert!(pinned.pinned);

        service
            .record_message(&convo.id, "user", "Hello there")
            .await
            .unwrap();
        service
            .record_message(&convo.id, "assistant", "Hi!")
            .await
            .unwrap();

        let messages = service
            .get_conversation_messages(&convo.id, None)
            .await
            .unwrap();
        assert_eq!(messages.len(), 2);
        assert_eq!(messages[0].role, "user");
        assert_eq!(messages[1].role, "assistant");

        service.delete_conversation(&convo.id).await.unwrap();
        let list = service.list_conversations().await.unwrap();
        assert!(list.is_empty());
    }
}

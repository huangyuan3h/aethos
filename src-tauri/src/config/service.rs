#![allow(dead_code)]

use std::sync::Arc;

use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Row};
use tracing::instrument;

use super::{
    crypto::{CryptoService, KeyManager},
    database::create_pool,
    error::ConfigError,
    paths::ConfigPaths,
};

pub type SharedConfigService = Arc<ConfigService>;

#[derive(Debug, Clone, Serialize)]
pub struct ProviderSummary {
    pub id: i64,
    pub provider: String,
    pub display_name: String,
    pub default_model: Option<String>,
    pub is_default: bool,
    pub has_api_key: bool,
}

#[derive(Debug, Clone, Deserialize)]
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
}

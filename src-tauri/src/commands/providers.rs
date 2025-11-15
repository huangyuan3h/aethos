use serde::Serialize;
use tauri::State;

use crate::config::{
    service::{ProviderSummary, ProviderUpsertPayload, SharedConfigService},
    ConfigError,
};

#[derive(Debug, Serialize)]
pub struct ProvidersResponse {
    pub items: Vec<ProviderSummary>,
}

#[tauri::command]
pub async fn list_providers(
    config: State<'_, SharedConfigService>,
) -> Result<ProvidersResponse, String> {
    let items = config.list_providers().await.map_err(to_msg)?;
    Ok(ProvidersResponse { items })
}

#[tauri::command]
pub async fn upsert_provider(
    payload: ProviderUpsertPayload,
    config: State<'_, SharedConfigService>,
) -> Result<ProviderSummary, String> {
    config.upsert_provider(payload).await.map_err(to_msg)
}

#[tauri::command]
pub async fn set_default_provider(
    provider: String,
    config: State<'_, SharedConfigService>,
) -> Result<(), String> {
    config.set_default_provider(&provider).await.map_err(to_msg)
}

#[tauri::command]
pub async fn has_any_provider(config: State<'_, SharedConfigService>) -> Result<bool, String> {
    config.has_any_provider().await.map_err(to_msg)
}

fn to_msg(err: ConfigError) -> String {
    err.to_string()
}

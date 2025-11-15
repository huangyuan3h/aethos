use tauri::State;

use crate::config::service::{
    McpRegistryEntry, McpRegistryUpsert, McpServerSummary, McpServerUpsert, McpSource,
    McpSourceUpsert, SharedConfigService,
};

#[tauri::command]
pub async fn list_mcp_sources(
    config: State<'_, SharedConfigService>,
) -> Result<Vec<McpSource>, String> {
    config
        .list_mcp_sources()
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn upsert_mcp_source(
    payload: McpSourceUpsert,
    config: State<'_, SharedConfigService>,
) -> Result<McpSource, String> {
    config
        .upsert_mcp_source(payload)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn delete_mcp_source(
    slug: String,
    config: State<'_, SharedConfigService>,
) -> Result<(), String> {
    config
        .delete_mcp_source(&slug)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn list_mcp_registry(
    config: State<'_, SharedConfigService>,
) -> Result<Vec<McpRegistryEntry>, String> {
    config
        .list_mcp_registry()
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn upsert_mcp_registry_entry(
    payload: McpRegistryUpsert,
    config: State<'_, SharedConfigService>,
) -> Result<McpRegistryEntry, String> {
    config
        .upsert_mcp_registry_entry(payload)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn list_mcp_servers(
    config: State<'_, SharedConfigService>,
) -> Result<Vec<McpServerSummary>, String> {
    config
        .list_mcp_servers()
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn upsert_mcp_server(
    payload: McpServerUpsert,
    config: State<'_, SharedConfigService>,
) -> Result<McpServerSummary, String> {
    config
        .upsert_mcp_server(payload)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn delete_mcp_server(
    slug: String,
    config: State<'_, SharedConfigService>,
) -> Result<(), String> {
    config
        .delete_mcp_server(&slug)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn update_mcp_server_status(
    slug: String,
    status: String,
    config: State<'_, SharedConfigService>,
) -> Result<McpServerSummary, String> {
    config
        .update_mcp_server_status(&slug, &status)
        .await
        .map_err(|err| err.to_string())
}

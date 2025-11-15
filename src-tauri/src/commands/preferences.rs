use serde::Serialize;
use tauri::State;

use crate::config::{
    service::{PreferencesUpdate, SharedConfigService, UserPreferences},
    ConfigError,
};

#[derive(Debug, Serialize)]
pub struct PreferencesResponse {
    pub preferences: UserPreferences,
}

#[tauri::command]
pub async fn get_preferences(
    config: State<'_, SharedConfigService>,
) -> Result<PreferencesResponse, String> {
    let preferences = config.get_preferences().await.map_err(to_msg)?;
    Ok(PreferencesResponse { preferences })
}

#[tauri::command]
pub async fn save_preferences(
    update: PreferencesUpdate,
    config: State<'_, SharedConfigService>,
) -> Result<(), String> {
    config.save_preferences(update).await.map_err(to_msg)
}

fn to_msg(err: ConfigError) -> String {
    err.to_string()
}

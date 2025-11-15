#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod config;
mod services;

use commands::{
    chat::invoke_chat,
    preferences::{get_preferences, save_preferences},
    providers::{has_any_provider, list_providers, set_default_provider, upsert_provider},
};

fn main() {
    let config_service =
        tauri::async_runtime::block_on(config::service::ConfigService::initialize())
            .expect("failed to initialize config service");

    tauri::Builder::default()
        .manage(config_service)
        .invoke_handler(tauri::generate_handler![
            get_preferences,
            save_preferences,
            invoke_chat,
            list_providers,
            upsert_provider,
            set_default_provider,
            has_any_provider
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

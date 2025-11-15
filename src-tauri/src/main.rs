#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod config;
mod services;

use commands::{
    chat::{
        create_conversation, delete_conversation, get_conversation_messages, invoke_chat,
        list_conversations, pin_conversation, rename_conversation, stream_chat,
    },
    mcp::{
        delete_mcp_server, delete_mcp_source, list_mcp_registry, list_mcp_servers,
        list_mcp_sources, update_mcp_server_status, upsert_mcp_registry_entry, upsert_mcp_server,
        upsert_mcp_source,
    },
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
            stream_chat,
            create_conversation,
            list_conversations,
            rename_conversation,
            pin_conversation,
            delete_conversation,
            get_conversation_messages,
            list_mcp_sources,
            upsert_mcp_source,
            delete_mcp_source,
            list_mcp_registry,
            upsert_mcp_registry_entry,
            list_mcp_servers,
            upsert_mcp_server,
            delete_mcp_server,
            update_mcp_server_status,
            list_providers,
            upsert_provider,
            set_default_provider,
            has_any_provider
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

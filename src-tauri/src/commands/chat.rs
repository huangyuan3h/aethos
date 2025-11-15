use tauri::{State, Window};

use crate::config::service::{ConversationMessage, ConversationSummary, SharedConfigService};
use crate::services::chat::{
    send_chat, stream_chat as stream_chat_service, ChatRequest, ChatResponse,
};

#[tauri::command]
pub async fn invoke_chat(
    request: ChatRequest,
    config: State<'_, SharedConfigService>,
) -> Result<ChatResponse, String> {
    send_chat(&config, request)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn stream_chat(
    window: Window,
    request: ChatRequest,
    config: State<'_, SharedConfigService>,
) -> Result<(), String> {
    stream_chat_service(&window, &config, request)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn create_conversation(
    title: Option<String>,
    config: State<'_, SharedConfigService>,
) -> Result<ConversationSummary, String> {
    config
        .create_conversation(title)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn list_conversations(
    config: State<'_, SharedConfigService>,
) -> Result<Vec<ConversationSummary>, String> {
    config
        .list_conversations()
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn rename_conversation(
    id: String,
    title: String,
    config: State<'_, SharedConfigService>,
) -> Result<ConversationSummary, String> {
    config
        .rename_conversation(&id, &title)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn pin_conversation(
    id: String,
    pinned: bool,
    config: State<'_, SharedConfigService>,
) -> Result<ConversationSummary, String> {
    config
        .set_conversation_pin(&id, pinned)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn delete_conversation(
    id: String,
    config: State<'_, SharedConfigService>,
) -> Result<(), String> {
    config
        .delete_conversation(&id)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn get_conversation_messages(
    id: String,
    limit: Option<i64>,
    config: State<'_, SharedConfigService>,
) -> Result<Vec<ConversationMessage>, String> {
    config
        .get_conversation_messages(&id, limit)
        .await
        .map_err(|err| err.to_string())
}

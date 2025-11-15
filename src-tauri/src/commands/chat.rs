use tauri::{State, Window};

use crate::config::service::SharedConfigService;
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

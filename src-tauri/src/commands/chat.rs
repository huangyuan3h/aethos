use tauri::State;

use crate::config::service::SharedConfigService;
use crate::services::chat::{send_chat, ChatRequest, ChatResponse};

#[tauri::command]
pub async fn invoke_chat(
    request: ChatRequest,
    config: State<'_, SharedConfigService>,
) -> Result<ChatResponse, String> {
    send_chat(&config, request)
        .await
        .map_err(|err| err.to_string())
}

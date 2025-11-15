use std::time::Duration;

use futures_util::StreamExt;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use tauri::Emitter;
use thiserror::Error;
use tracing::{debug, info, warn};

use crate::config::service::{ConfigService, ProviderCredential};
use crate::config::ConfigError;

const OPENAI_CHAT_ENDPOINT: &str = "https://api.openai.com/v1/chat/completions";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatRequest {
    pub prompt: String,
    pub model: Option<String>,
    pub conversation_id: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatResponse {
    pub reply: String,
    pub model: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ChatStreamChunk {
    pub conversation_id: String,
    pub delta: String,
    pub done: bool,
    pub model: Option<String>,
}

#[derive(Debug, Error)]
pub enum ChatError {
    #[error("{0}")]
    Config(#[from] ConfigError),
    #[error("unsupported provider `{0}`")]
    UnsupportedProvider(String),
    #[error("no response received from provider")]
    EmptyResponse,
    #[error("network error: {0}")]
    Network(String),
    #[error("provider error ({status}): {message}")]
    Provider { status: StatusCode, message: String },
}

pub async fn send_chat(
    config: &ConfigService,
    request: ChatRequest,
) -> Result<ChatResponse, ChatError> {
    let credential = config.default_provider_credentials().await?;
    match credential.provider.as_str() {
        "openai" | "openrouter" => send_openai(request, credential).await,
        other => Err(ChatError::UnsupportedProvider(other.to_string())),
    }
}

pub async fn stream_chat(
    window: &tauri::Window,
    config: &ConfigService,
    request: ChatRequest,
) -> Result<(), ChatError> {
    let credential = config.default_provider_credentials().await?;
    info!(
        provider = credential.provider.as_str(),
        "starting streaming chat"
    );
    match credential.provider.as_str() {
        "openai" | "openrouter" => stream_openai(window, request, credential).await,
        other => Err(ChatError::UnsupportedProvider(other.to_string())),
    }
}

async fn send_openai(
    request: ChatRequest,
    credential: ProviderCredential,
) -> Result<ChatResponse, ChatError> {
    let model = request
        .model
        .or(credential.default_model.clone())
        .unwrap_or_else(|| "gpt-4o-mini".to_string());

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|err| ChatError::Network(err.to_string()))?;

    let body = OpenAiRequest {
        model: model.clone(),
        messages: vec![OpenAiMessage {
            role: "user".into(),
            content: request.prompt,
        }],
        stream: None,
    };

    let response = client
        .post(OPENAI_CHAT_ENDPOINT)
        .bearer_auth(&credential.api_key)
        .json(&body)
        .send()
        .await
        .map_err(|err| ChatError::Network(err.to_string()))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response
            .text()
            .await
            .unwrap_or_else(|_| "unknown error".to_string());
        return Err(ChatError::Provider {
            status,
            message: text,
        });
    }

    let payload: OpenAiResponse = response
        .json()
        .await
        .map_err(|err| ChatError::Network(err.to_string()))?;

    let reply = payload
        .choices
        .into_iter()
        .find_map(|choice| choice.message.and_then(|m| m.content))
        .ok_or(ChatError::EmptyResponse)?;

    Ok(ChatResponse { reply, model })
}

async fn stream_openai(
    window: &tauri::Window,
    request: ChatRequest,
    credential: ProviderCredential,
) -> Result<(), ChatError> {
    let model = request
        .model
        .or(credential.default_model.clone())
        .unwrap_or_else(|| "gpt-4o-mini".to_string());

    let conversation_id = request
        .conversation_id
        .unwrap_or_else(|| "default".to_string());

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(60))
        .build()
        .map_err(|err| ChatError::Network(err.to_string()))?;

    let body = OpenAiRequest {
        model: model.clone(),
        messages: vec![OpenAiMessage {
            role: "user".into(),
            content: request.prompt,
        }],
        stream: Some(true),
    };

    let response = client
        .post(OPENAI_CHAT_ENDPOINT)
        .bearer_auth(&credential.api_key)
        .json(&body)
        .send()
        .await
        .map_err(|err| ChatError::Network(err.to_string()))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response
            .text()
            .await
            .unwrap_or_else(|_| "unknown error".to_string());
        return Err(ChatError::Provider {
            status,
            message: text,
        });
    }

    let mut buffer = String::new();
    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|err| ChatError::Network(err.to_string()))?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(idx) = buffer.find("\n\n") {
            let mut event = buffer[..idx].trim().to_string();
            buffer = buffer[idx + 2..].to_string();
            if !event.starts_with("data:") {
                continue;
            }
            event = event.replace("data:", "").trim().to_string();
            if event == "[DONE]" {
                debug!("stream finished");
                window
                    .emit(
                        "chat:chunk",
                        ChatStreamChunk {
                            conversation_id: conversation_id.clone(),
                            delta: String::new(),
                            done: true,
                            model: Some(model.clone()),
                        },
                    )
                    .map_err(|err| ChatError::Network(err.to_string()))?;
                return Ok(());
            }

            let payload: OpenAiStreamChunk =
                serde_json::from_str(&event).map_err(|err| ChatError::Network(err.to_string()))?;
            if let Some(delta) = payload
                .choices
                .into_iter()
                .find_map(|choice| choice.delta.and_then(|m| m.content))
            {
                if delta.is_empty() {
                    continue;
                }
                debug!(delta = delta.as_str(), "stream delta");
                window
                    .emit(
                        "chat:chunk",
                        ChatStreamChunk {
                            conversation_id: conversation_id.clone(),
                            delta,
                            done: false,
                            model: None,
                        },
                    )
                    .map_err(|err| ChatError::Network(err.to_string()))?;
            }
        }
    }

    warn!("stream ended without completion");
    Err(ChatError::EmptyResponse)
}

#[derive(Debug, Serialize)]
struct OpenAiRequest {
    model: String,
    messages: Vec<OpenAiMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    stream: Option<bool>,
}

#[derive(Debug, Serialize)]
struct OpenAiMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct OpenAiResponse {
    choices: Vec<OpenAiChoice>,
}

#[derive(Debug, Deserialize)]
struct OpenAiChoice {
    message: Option<OpenAiChoiceMessage>,
}

#[derive(Debug, Deserialize)]
struct OpenAiChoiceMessage {
    content: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OpenAiStreamChunk {
    choices: Vec<OpenAiStreamChoice>,
}

#[derive(Debug, Deserialize)]
struct OpenAiStreamChoice {
    delta: Option<OpenAiChoiceMessage>,
}

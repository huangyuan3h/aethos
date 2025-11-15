use std::time::Duration;

use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::config::service::{ConfigService, ProviderCredential};
use crate::config::ConfigError;

const OPENAI_CHAT_ENDPOINT: &str = "https://api.openai.com/v1/chat/completions";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatRequest {
    pub prompt: String,
    pub model: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatResponse {
    pub reply: String,
    pub model: String,
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

#[derive(Debug, Serialize)]
struct OpenAiRequest {
    model: String,
    messages: Vec<OpenAiMessage>,
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

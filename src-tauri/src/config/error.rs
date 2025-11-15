use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigError {
    #[error("failed to resolve project directory")]
    MissingProjectDir,
    #[error("no default provider configured")]
    MissingDefaultProvider,
    #[error("i/o error: {0}")]
    Io(#[from] std::io::Error),
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("encryption error: {0}")]
    Encryption(String),
    #[error("invalid path: {0}")]
    InvalidPath(String),
    #[error("migration error: {0}")]
    Migration(#[from] sqlx::migrate::MigrateError),
    #[error("base64 error: {0}")]
    Base64(#[from] base64::DecodeError),
    #[error("utf8 error: {0}")]
    Utf8(#[from] std::string::FromUtf8Error),
    #[error("task join error: {0}")]
    Join(#[from] tokio::task::JoinError),
}

impl From<ring::error::Unspecified> for ConfigError {
    fn from(_: ring::error::Unspecified) -> Self {
        Self::Encryption("ring operation failed".into())
    }
}

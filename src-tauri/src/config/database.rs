use std::str::FromStr;

use sqlx::{
    sqlite::{SqliteConnectOptions, SqliteJournalMode, SqliteSynchronous},
    SqlitePool,
};
use tracing::info;

use super::{error::ConfigError, paths::ConfigPaths};

pub async fn create_pool(paths: &ConfigPaths) -> Result<SqlitePool, ConfigError> {
    if let Some(parent) = paths.db_path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let path_str = paths
        .db_path
        .to_str()
        .ok_or_else(|| ConfigError::InvalidPath("database path contains invalid UTF-8".into()))?;

    let options = SqliteConnectOptions::from_str(path_str)?
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .synchronous(SqliteSynchronous::Normal);

    let pool = SqlitePool::connect_with(options).await?;
    sqlx::migrate!("./migrations").run(&pool).await?;
    info!(
        "SQLite config database ready at {}",
        paths.db_path.display()
    );
    Ok(pool)
}

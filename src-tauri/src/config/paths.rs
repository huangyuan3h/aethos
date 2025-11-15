#![allow(dead_code)]

use std::path::{Path, PathBuf};

use directories::ProjectDirs;

use super::error::ConfigError;

#[derive(Debug, Clone)]
pub struct ConfigPaths {
    pub base_dir: PathBuf,
    pub db_path: PathBuf,
    pub key_path: PathBuf,
}

impl ConfigPaths {
    pub fn from_base_dir<P: AsRef<Path>>(path: P) -> Result<Self, ConfigError> {
        let base_dir = path.as_ref().to_path_buf();
        std::fs::create_dir_all(&base_dir)?;
        Ok(Self {
            key_path: base_dir.join("master.key"),
            db_path: base_dir.join("aethos.db3"),
            base_dir,
        })
    }

    pub fn default() -> Result<Self, ConfigError> {
        let dirs =
            ProjectDirs::from("com", "Aethos", "App").ok_or(ConfigError::MissingProjectDir)?;
        Self::from_base_dir(dirs.config_dir())
    }
}

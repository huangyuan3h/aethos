#![allow(dead_code)]

#[cfg(target_os = "macos")]
use std::process::Command;
use std::{fs, path::PathBuf};

use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use rand::rngs::OsRng;
use rand::RngCore;
use ring::aead::{Aad, LessSafeKey, Nonce, UnboundKey, AES_256_GCM};
use ring::rand::SecureRandom;
use tracing::{debug, warn};

use super::error::ConfigError;
use super::paths::ConfigPaths;

const MASTER_KEY_BYTES: usize = 32;
const NONCE_BYTES: usize = 12;
const KEY_SERVICE: &str = "com.aethos.config";
const KEY_USER: &str = "encryption-master";

pub struct CryptoService {
    key: LessSafeKey,
    rng: ring::rand::SystemRandom,
}

impl CryptoService {
    pub fn new(master_key: [u8; MASTER_KEY_BYTES]) -> Result<Self, ConfigError> {
        let unbound = UnboundKey::new(&AES_256_GCM, &master_key)?;
        Ok(Self {
            key: LessSafeKey::new(unbound),
            rng: ring::rand::SystemRandom::new(),
        })
    }

    pub fn encrypt(&self, value: &str) -> Result<String, ConfigError> {
        let mut nonce = [0u8; NONCE_BYTES];
        self.rng
            .fill(&mut nonce)
            .map_err(|_| ConfigError::Encryption("failed to generate nonce".into()))?;

        let mut in_out = value.as_bytes().to_vec();
        in_out.resize(in_out.len() + AES_256_GCM.tag_len(), 0);
        self.key.seal_in_place_append_tag(
            Nonce::assume_unique_for_key(nonce),
            Aad::empty(),
            &mut in_out,
        )?;
        let mut payload = Vec::with_capacity(NONCE_BYTES + in_out.len());
        payload.extend_from_slice(&nonce);
        payload.extend_from_slice(&in_out);
        Ok(BASE64.encode(payload))
    }

    pub fn decrypt(&self, cipher: &str) -> Result<String, ConfigError> {
        let mut payload = BASE64.decode(cipher)?;
        if payload.len() <= NONCE_BYTES {
            return Err(ConfigError::Encryption("payload too small".into()));
        }
        let nonce_bytes: [u8; NONCE_BYTES] = payload[..NONCE_BYTES]
            .try_into()
            .map_err(|_| ConfigError::Encryption("invalid nonce length".into()))?;
        let nonce = Nonce::assume_unique_for_key(nonce_bytes);
        let mut buffer = payload.split_off(NONCE_BYTES);
        let plaintext = self
            .key
            .open_in_place(nonce, Aad::empty(), &mut buffer)
            .map_err(|_| ConfigError::Encryption("failed to decrypt payload".into()))?;
        let mut plain = plaintext.to_vec();
        while plain.last() == Some(&0) {
            plain.pop();
        }
        Ok(String::from_utf8(plain)?)
    }
}

pub struct KeyManager {
    key_path: PathBuf,
}

impl KeyManager {
    pub fn new(paths: &ConfigPaths) -> Self {
        Self {
            key_path: paths.key_path.clone(),
        }
    }

    pub fn resolve_master_key(&self) -> Result<[u8; MASTER_KEY_BYTES], ConfigError> {
        if let Some(bytes) = self.from_keychain()? {
            return Ok(bytes);
        }
        if let Some(bytes) = self.from_disk()? {
            return Ok(bytes);
        }
        let mut generated = [0u8; MASTER_KEY_BYTES];
        OsRng.fill_bytes(&mut generated);
        self.persist(&generated)?;
        Ok(generated)
    }

    fn from_keychain(&self) -> Result<Option<[u8; MASTER_KEY_BYTES]>, ConfigError> {
        #[cfg(target_os = "macos")]
        {
            let output = Command::new("/usr/bin/security")
                .args([
                    "find-generic-password",
                    "-s",
                    KEY_SERVICE,
                    "-a",
                    KEY_USER,
                    "-w",
                ])
                .output();
            match output {
                Ok(result) if result.status.success() => {
                    let secret = String::from_utf8(result.stdout)?;
                    return Self::decode_key(secret.trim()).map(Some);
                }
                Ok(result) => {
                    debug!(
                        "security find-generic-password exited with {}",
                        result.status
                    );
                    return Ok(None);
                }
                Err(err) => {
                    warn!("unable to access macOS keychain: {err}");
                    return Ok(None);
                }
            }
        }
        #[cfg(not(target_os = "macos"))]
        {
            let _ = self;
            Ok(None)
        }
    }

    fn from_disk(&self) -> Result<Option<[u8; MASTER_KEY_BYTES]>, ConfigError> {
        if !self.key_path.exists() {
            return Ok(None);
        }
        let contents = fs::read_to_string(&self.key_path)?;
        Self::decode_key(&contents).map(Some)
    }

    fn persist(&self, key: &[u8; MASTER_KEY_BYTES]) -> Result<(), ConfigError> {
        if self.write_keychain(key)? {
            return Ok(());
        }
        if let Some(parent) = self.key_path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(&self.key_path, BASE64.encode(key))?;
        debug!("stored master key on disk fallback");
        Ok(())
    }

    fn decode_key(encoded: &str) -> Result<[u8; MASTER_KEY_BYTES], ConfigError> {
        let bytes = BASE64.decode(encoded.trim())?;
        let array: [u8; MASTER_KEY_BYTES] = bytes
            .try_into()
            .map_err(|_| ConfigError::Encryption("master key length mismatch".into()))?;
        Ok(array)
    }

    fn write_keychain(&self, key: &[u8; MASTER_KEY_BYTES]) -> Result<bool, ConfigError> {
        #[cfg(target_os = "macos")]
        {
            let encoded = BASE64.encode(key);
            let status = Command::new("/usr/bin/security")
                .args([
                    "add-generic-password",
                    "-U",
                    "-s",
                    KEY_SERVICE,
                    "-a",
                    KEY_USER,
                    "-w",
                    &encoded,
                ])
                .status();
            match status {
                Ok(result) if result.success() => {
                    debug!("stored master key in macOS keychain");
                    return Ok(true);
                }
                Ok(result) => {
                    warn!("failed to store key in keychain: {result}");
                    return Ok(false);
                }
                Err(err) => {
                    warn!("unable to use security CLI: {err}");
                    return Ok(false);
                }
            }
        }
        #[cfg(not(target_os = "macos"))]
        {
            let _ = key;
            Ok(false)
        }
    }
}

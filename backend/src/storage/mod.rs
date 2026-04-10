use std::{fs, path::Path};

use base64::{engine::general_purpose::STANDARD, Engine as _};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::VaultError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersistedVault {
    pub version: u32,
    pub password_hash: String,
    pub key_salt_base64: String,
    pub vault_aes_nonce_base64: String,
    pub vault_chacha_nonce_base64: String,
    pub encrypted_payload_base64: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_accessed_at: Option<DateTime<Utc>>,
    pub failed_attempts: u32,
    pub lockout_until: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountRecord {
    pub email: String,
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub remember_session: bool,
    pub session_active: bool,
    pub session_token: Option<String>,
    pub session_started_at: Option<DateTime<Utc>>,
    pub session_last_active_at: Option<DateTime<Utc>>,
    pub session_expires_at: Option<DateTime<Utc>>,
    pub login_failed_attempts: u32,
    pub login_lockout_until: Option<DateTime<Utc>>,
    pub last_login_at: Option<DateTime<Utc>>,
    pub last_failed_login_at: Option<DateTime<Utc>>,
    pub trusted_devices: Vec<String>,
    pub last_device_id: Option<String>,
    pub security_log: Vec<SecurityLogEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultSettings {
    pub clipboard_watcher_enabled: bool,
    pub security_alerts_enabled: bool,
    pub auto_lock_minutes: u32,
}

impl Default for VaultSettings {
    fn default() -> Self {
        Self {
            clipboard_watcher_enabled: false,
            security_alerts_enabled: true,
            auto_lock_minutes: 5,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityLogEntry {
    pub id: String,
    pub occurred_at: DateTime<Utc>,
    pub action: String,
    pub target_kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityAlertRecord {
    pub id: String,
    pub created_at: DateTime<Utc>,
    pub severity: String,
    pub category: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityLogEntry {
    pub id: String,
    pub occurred_at: DateTime<Utc>,
    pub event: String,
    pub outcome: String,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PlainVault {
    pub passwords: Vec<PasswordSecret>,
    pub notes: Vec<NoteSecret>,
    pub files: Vec<FileSecret>,
    pub settings: VaultSettings,
    pub activity_log: Vec<ActivityLogEntry>,
    pub security_alerts: Vec<SecurityAlertRecord>,
    pub security_log: Vec<SecurityLogEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordSecret {
    pub id: String,
    pub site: String,
    pub username: String,
    pub password: String,
    pub notes: String,
    pub tags: Vec<String>,
    pub favorite: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteSecret {
    pub id: String,
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
    pub favorite: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileSecret {
    pub id: String,
    pub name: String,
    pub mime_type: String,
    pub size: usize,
    pub aes_nonce_base64: String,
    pub chacha_nonce_base64: String,
    pub tags: Vec<String>,
    pub favorite: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportedBlob {
    pub id: String,
    pub encrypted_bytes_base64: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupPackage {
    pub vault: PersistedVault,
    pub files: Vec<ExportedBlob>,
    pub exported_at: DateTime<Utc>,
}

pub fn load_persisted_vault(path: &Path) -> Result<Option<PersistedVault>, VaultError> {
    if !path.exists() {
        return Ok(None);
    }

    let raw = fs::read_to_string(path).map_err(VaultError::Io)?;
    let vault = serde_json::from_str(&raw).map_err(VaultError::Serde)?;
    Ok(Some(vault))
}

pub fn load_account(path: &Path) -> Result<Option<AccountRecord>, VaultError> {
    if !path.exists() {
        return Ok(None);
    }

    let raw = fs::read_to_string(path).map_err(VaultError::Io)?;
    let account = serde_json::from_str(&raw).map_err(VaultError::Serde)?;
    Ok(Some(account))
}

pub fn save_account(path: &Path, account: &AccountRecord) -> Result<(), VaultError> {
    let payload = serde_json::to_string_pretty(account).map_err(VaultError::Serde)?;
    atomic_write(path, &payload)
}

pub fn save_persisted_vault(path: &Path, vault: &PersistedVault) -> Result<(), VaultError> {
    let payload = serde_json::to_string_pretty(vault).map_err(VaultError::Serde)?;
    atomic_write(path, &payload)
}

pub fn encode(bytes: &[u8]) -> String {
    STANDARD.encode(bytes)
}

pub fn decode(value: &str) -> Result<Vec<u8>, VaultError> {
    STANDARD
        .decode(value)
        .map_err(|error| VaultError::Validation(format!("Invalid base64 payload: {error}")))
}

fn atomic_write(path: &Path, payload: &str) -> Result<(), VaultError> {
    let parent = path
        .parent()
        .ok_or_else(|| VaultError::Validation("Storage path is invalid.".into()))?;
    let temp_path = parent.join(format!(
        ".{}.tmp",
        path.file_name()
            .and_then(|value| value.to_str())
            .unwrap_or("securestore")
    ));

    fs::write(&temp_path, payload).map_err(VaultError::Io)?;
    fs::rename(&temp_path, path).map_err(VaultError::Io)
}

pub mod auth;
pub mod encryption;
pub mod file_handler;
pub mod storage;

use std::{collections::HashMap, path::PathBuf};

use chrono::{Duration, Utc};
use rand::{rngs::OsRng, seq::SliceRandom, Rng};
use serde::{Deserialize, Serialize};
use sha1::{Digest, Sha1};
use thiserror::Error;
use uuid::Uuid;
use zeroize::Zeroize;

use auth::{hash_master_password, hash_password, validate_account_password, verify_master_password, verify_password};
use encryption::{decrypt_bytes, derive_master_key, encrypt_bytes, random_bytes};
use file_handler::{blob_path, delete_blob, read_blob, reset_dir, write_blob};
use storage::{
    decode, encode, load_account, load_persisted_vault, save_account, save_persisted_vault, AccountRecord,
    ActivityLogEntry, BackupPackage, ExportedBlob, FileSecret, NoteSecret, PasswordSecret, PersistedVault, PlainVault,
    SecurityAlertRecord, SecurityLogEntry, VaultSettings,
};

const MAX_ACTIVITY_LOG: usize = 120;
const MAX_SECURITY_LOG: usize = 180;
const MAX_SECURITY_ALERTS: usize = 80;
const ACCOUNT_LOCKOUT_LIMIT: u32 = 5;
const SESSION_IDLE_MINUTES: i64 = 30;
const REMEMBERED_SESSION_HOURS: i64 = 12;
const ACTIVE_SESSION_HOURS: i64 = 8;

#[derive(Debug, Error)]
pub enum VaultError {
    #[error("{0}")]
    Validation(String),
    #[error("{0}")]
    Authentication(String),
    #[error("{0}")]
    Crypto(String),
    #[error("Vault storage is unavailable: {0}")]
    Io(#[from] std::io::Error),
    #[error("Unable to read vault data: {0}")]
    Serde(#[from] serde_json::Error),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PasswordStrength {
    Weak,
    Medium,
    Strong,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PasswordSecurityStatus {
    Weak,
    Reused,
    Compromised,
    Secure,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordAnalysis {
    pub strength: PasswordStrength,
    pub score: u8,
    pub suggestions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordGeneratorOptions {
    pub length: usize,
    pub uppercase: bool,
    pub lowercase: bool,
    pub numbers: bool,
    pub symbols: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratedPassword {
    pub password: String,
    pub analysis: PasswordAnalysis,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordCandidateInspection {
    pub analysis: PasswordAnalysis,
    pub reuse_count: usize,
    pub breached: bool,
    pub breach_count: u32,
    pub status: PasswordSecurityStatus,
    pub k_anonymity_prefix: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityInsights {
    pub weak_passwords: usize,
    pub reused_passwords: usize,
    pub compromised_passwords: usize,
    pub favorite_entries: usize,
    pub last_vault_access: Option<chrono::DateTime<Utc>>,
    pub suggestions: Vec<String>,
    pub security_score: u8,
    pub security_posture: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultStatus {
    pub initialized: bool,
    pub unlocked: bool,
    pub last_accessed_at: Option<chrono::DateTime<Utc>>,
    pub failed_attempts: u32,
    pub lockout_until: Option<chrono::DateTime<Utc>>,
    pub session_expires_at: Option<chrono::DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OnboardingStage {
    SignUp,
    Login,
    Welcome,
    Security,
    MasterPassword,
    Ready,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthStatus {
    pub account_exists: bool,
    pub authenticated: bool,
    pub email: Option<String>,
    pub remember_session: bool,
    pub onboarding_stage: OnboardingStage,
    pub vault_initialized: bool,
    pub login_lockout_until: Option<chrono::DateTime<Utc>>,
    pub session_expires_at: Option<chrono::DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignUpInput {
    pub email: String,
    pub password: String,
    pub confirm_password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginInput {
    pub email: String,
    pub password: String,
    pub remember_session: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangeAccountPasswordInput {
    pub current_password: String,
    pub new_password: String,
    pub confirm_password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultSettingsInput {
    pub clipboard_watcher_enabled: bool,
    pub security_alerts_enabled: bool,
    pub auto_lock_minutes: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordInput {
    pub id: Option<String>,
    pub site: String,
    pub username: String,
    pub password: String,
    pub notes: String,
    pub tags: Vec<String>,
    pub favorite: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteInput {
    pub id: Option<String>,
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
    pub favorite: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilePayloadInput {
    pub name: String,
    pub mime_type: String,
    pub bytes_base64: String,
    pub tags: Vec<String>,
    pub favorite: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordRecord {
    pub id: String,
    pub site: String,
    pub username: String,
    pub notes: String,
    pub tags: Vec<String>,
    pub favorite: bool,
    pub created_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
    pub strength: PasswordStrength,
    pub strength_score: u8,
    pub strength_suggestions: Vec<String>,
    pub reuse_count: usize,
    pub breached: bool,
    pub breach_count: u32,
    pub security_status: PasswordSecurityStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteRecord {
    pub id: String,
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
    pub favorite: bool,
    pub created_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileRecord {
    pub id: String,
    pub name: String,
    pub mime_type: String,
    pub size: usize,
    pub tags: Vec<String>,
    pub favorite: bool,
    pub created_at: chrono::DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultSnapshot {
    pub passwords: Vec<PasswordRecord>,
    pub notes: Vec<NoteRecord>,
    pub files: Vec<FileRecord>,
    pub settings: VaultSettings,
    pub activity_log: Vec<ActivityLogEntry>,
    pub security_alerts: Vec<SecurityAlertRecord>,
    pub security_log: Vec<SecurityLogEntry>,
    pub insights: SecurityInsights,
    pub status: VaultStatus,
}

#[derive(Default)]
struct SessionState {
    master_key: Option<[u8; 64]>,
    vault: Option<PlainVault>,
}

impl SessionState {
    fn unlocked(&self) -> bool {
        self.master_key.is_some() && self.vault.is_some()
    }

    fn clear(&mut self) {
        if let Some(mut key) = self.master_key.take() {
            key.zeroize();
        }
        self.vault = None;
    }
}

pub struct VaultManager {
    account_path: PathBuf,
    vault_path: PathBuf,
    files_dir: PathBuf,
    session: SessionState,
    authenticated_email: Option<String>,
}

impl VaultManager {
    pub fn new(base_dir: PathBuf) -> Result<Self, VaultError> {
        std::fs::create_dir_all(&base_dir).map_err(VaultError::Io)?;
        let files_dir = base_dir.join("files");
        std::fs::create_dir_all(&files_dir).map_err(VaultError::Io)?;
        Ok(Self {
            account_path: base_dir.join("account.json"),
            vault_path: base_dir.join("vault.json"),
            files_dir,
            session: SessionState::default(),
            authenticated_email: None,
        })
    }

    pub fn auth_status(&self) -> Result<AuthStatus, VaultError> {
        let account = load_account(&self.account_path)?;
        let vault_initialized = self.vault_path.exists();
        Ok(match account {
            Some(account) => {
                let authenticated = self.authenticated_email.is_some() || session_is_active(&account);
                AuthStatus {
                account_exists: true,
                authenticated,
                email: Some(account.email.clone()),
                remember_session: account.remember_session,
                onboarding_stage: if !authenticated {
                    OnboardingStage::Login
                } else if !vault_initialized {
                    OnboardingStage::Welcome
                } else {
                    OnboardingStage::Ready
                },
                vault_initialized,
                login_lockout_until: account.login_lockout_until,
                session_expires_at: account.session_expires_at,
            }
            },
            None => AuthStatus {
                account_exists: false,
                authenticated: false,
                email: None,
                remember_session: false,
                onboarding_stage: OnboardingStage::SignUp,
                vault_initialized,
                login_lockout_until: None,
                session_expires_at: None,
            },
        })
    }

    pub fn sign_up(&mut self, input: SignUpInput) -> Result<AuthStatus, VaultError> {
        if load_account(&self.account_path)?.is_some() {
            return Err(VaultError::Validation("An account already exists on this device.".into()));
        }
        let mut password = input.password;
        let mut confirm_password = input.confirm_password;
        let email = normalize_email(&input.email)?;
        if password != confirm_password {
            return Err(VaultError::Validation("Passwords do not match.".into()));
        }
        validate_account_password(&password)?;
        let password_hash = hash_password(&password, 10, "Account password")?;
        password.zeroize();
        confirm_password.zeroize();
        let now = Utc::now();
        save_account(
            &self.account_path,
            &AccountRecord {
                email: email.clone(),
                password_hash,
                created_at: now,
                updated_at: now,
                remember_session: false,
                session_active: true,
                session_token: Some(generate_session_token()),
                session_started_at: Some(now),
                session_last_active_at: Some(now),
                session_expires_at: Some(now + Duration::hours(ACTIVE_SESSION_HOURS)),
                login_failed_attempts: 0,
                login_lockout_until: None,
                last_login_at: Some(now),
                last_failed_login_at: None,
                trusted_devices: vec![current_device_id()],
                last_device_id: Some(current_device_id()),
                security_log: vec![new_security_event("account_created", "success", "Local SecureStore account created.")],
            },
        )?;
        self.authenticated_email = Some(email);
        self.auth_status()
    }

    pub fn login(&mut self, input: LoginInput) -> Result<AuthStatus, VaultError> {
        let mut account = load_account(&self.account_path)?
            .ok_or_else(|| VaultError::Validation("Create an account before signing in.".into()))?;
        if let Some(lockout_until) = account.login_lockout_until {
            if Utc::now() < lockout_until {
                append_account_security_event(
                    &mut account,
                    "login_attempt",
                    "blocked",
                    "Login blocked due to temporary account lockout.",
                );
                save_account(&self.account_path, &account)?;
                return Err(VaultError::Authentication(format!(
                    "Too many failed login attempts. Try again at {lockout_until}."
                )));
            }
        }
        let email = normalize_email(&input.email)?;
        if account.email != email {
            register_login_failure(&mut account);
            append_account_security_event(&mut account, "login_attempt", "failed", "Incorrect email submitted.");
            save_account(&self.account_path, &account)?;
            return Err(VaultError::Authentication("Incorrect email or password.".into()));
        }
        if !verify_password(&input.password, &account.password_hash)? {
            register_login_failure(&mut account);
            append_account_security_event(&mut account, "login_attempt", "failed", "Incorrect account password submitted.");
            save_account(&self.account_path, &account)?;
            return Err(VaultError::Authentication("Incorrect email or password.".into()));
        }
        let now = Utc::now();
        let device_id = current_device_id();
        if !account.trusted_devices.contains(&device_id) {
            account.trusted_devices.push(device_id.clone());
        }
        account.remember_session = input.remember_session;
        account.session_active = input.remember_session;
        account.updated_at = now;
        account.session_token = Some(generate_session_token());
        account.session_started_at = Some(now);
        account.session_last_active_at = Some(now);
        account.session_expires_at = Some(
            now + if input.remember_session {
                Duration::hours(REMEMBERED_SESSION_HOURS)
            } else {
                Duration::minutes(SESSION_IDLE_MINUTES)
            },
        );
        account.login_failed_attempts = 0;
        account.login_lockout_until = None;
        account.last_login_at = Some(now);
        account.last_device_id = Some(device_id);
        append_account_security_event(&mut account, "login_attempt", "success", "Account login accepted.");
        save_account(&self.account_path, &account)?;
        self.authenticated_email = Some(account.email);
        self.auth_status()
    }

    pub fn logout(&mut self) -> Result<AuthStatus, VaultError> {
        if let Some(mut account) = load_account(&self.account_path)? {
            account.session_active = false;
            account.session_token = None;
            account.session_started_at = None;
            account.session_last_active_at = None;
            account.session_expires_at = None;
            append_account_security_event(&mut account, "logout", "success", "Account session closed.");
            save_account(&self.account_path, &account)?;
        }
        self.authenticated_email = None;
        self.session.clear();
        self.auth_status()
    }

    pub fn change_account_password(&mut self, input: ChangeAccountPasswordInput) -> Result<AuthStatus, VaultError> {
        let mut account = self.require_authenticated_account()?;
        let current_password = input.current_password;
        let mut new_password = input.new_password;
        let mut confirm_password = input.confirm_password;
        if new_password != confirm_password {
            return Err(VaultError::Validation("New passwords do not match.".into()));
        }
        if !verify_password(&current_password, &account.password_hash)? {
            return Err(VaultError::Authentication("Current password is incorrect.".into()));
        }
        validate_account_password(&new_password)?;
        account.password_hash = hash_password(&new_password, 10, "Account password")?;
        new_password.zeroize();
        confirm_password.zeroize();
        account.updated_at = Utc::now();
        account.session_token = Some(generate_session_token());
        account.session_last_active_at = Some(Utc::now());
        append_account_security_event(&mut account, "account_password_changed", "success", "Account password rotated.");
        save_account(&self.account_path, &account)?;
        self.auth_status()
    }

    pub fn delete_account(&mut self, confirmation: &str) -> Result<AuthStatus, VaultError> {
        if confirmation.trim() != "DELETE" {
            return Err(VaultError::Validation("Type DELETE to confirm account deletion.".into()));
        }
        self.authenticated_email = None;
        self.session.clear();
        if self.account_path.exists() {
            std::fs::remove_file(&self.account_path).map_err(VaultError::Io)?;
        }
        if self.vault_path.exists() {
            std::fs::remove_file(&self.vault_path).map_err(VaultError::Io)?;
        }
        reset_dir(&self.files_dir)?;
        self.auth_status()
    }

    pub fn status(&self) -> Result<VaultStatus, VaultError> {
        let persisted = load_persisted_vault(&self.vault_path)?;
        Ok(match persisted {
            Some(vault) => VaultStatus {
                initialized: true,
                unlocked: self.session.unlocked(),
                last_accessed_at: vault.last_accessed_at,
                failed_attempts: vault.failed_attempts,
                lockout_until: vault.lockout_until,
                session_expires_at: load_account(&self.account_path)?
                    .and_then(|account| account.session_expires_at),
            },
            None => VaultStatus {
                initialized: false,
                unlocked: false,
                last_accessed_at: None,
                failed_attempts: 0,
                lockout_until: None,
                session_expires_at: load_account(&self.account_path)?
                    .and_then(|account| account.session_expires_at),
            },
        })
    }

    pub fn initialize(&mut self, password: &str) -> Result<VaultStatus, VaultError> {
        let _ = self.require_authenticated_account()?;
        if self.vault_path.exists() {
            return Err(VaultError::Validation("Vault already exists.".into()));
        }

        let password_hash = hash_master_password(password)?;
        let key_salt = random_bytes::<16>();
        let vault_aes_nonce = random_bytes::<12>();
        let vault_chacha_nonce = random_bytes::<12>();
        let key = derive_master_key(password, &key_salt)?;
        let payload = serde_json::to_vec(&PlainVault::default()).map_err(VaultError::Serde)?;
        let encrypted = encrypt_bytes(&key, &payload, &vault_aes_nonce, &vault_chacha_nonce)?;
        let now = Utc::now();
        let persisted = PersistedVault {
            version: 3,
            password_hash,
            key_salt_base64: encode(&key_salt),
            vault_aes_nonce_base64: encode(&vault_aes_nonce),
            vault_chacha_nonce_base64: encode(&vault_chacha_nonce),
            encrypted_payload_base64: encode(&encrypted),
            created_at: now,
            updated_at: now,
            last_accessed_at: None,
            failed_attempts: 0,
            lockout_until: None,
        };
        save_persisted_vault(&self.vault_path, &persisted)?;
        Ok(self.status()?)
    }

    pub fn unlock(&mut self, password: &str) -> Result<VaultStatus, VaultError> {
        let _ = self.require_authenticated_account()?;
        let mut persisted = load_persisted_vault(&self.vault_path)?
            .ok_or_else(|| VaultError::Validation("Vault is not initialized.".into()))?;

        if let Some(lockout_until) = persisted.lockout_until {
            if Utc::now() < lockout_until {
                return Err(VaultError::Authentication(format!(
                    "Too many failed unlock attempts. Try again at {lockout_until}."
                )));
            }
        }

        if !verify_master_password(password, &persisted.password_hash)? {
            persisted.failed_attempts += 1;
            let delay_seconds = (2u32.pow(persisted.failed_attempts.min(5)) as i64).min(60);
            persisted.lockout_until = Some(Utc::now() + Duration::seconds(delay_seconds));
            save_persisted_vault(&self.vault_path, &persisted)?;
            return Err(VaultError::Authentication("Master password is incorrect.".into()));
        }

        let key_salt = decode(&persisted.key_salt_base64)?;
        let key_salt: [u8; 16] = key_salt
            .try_into()
            .map_err(|_| VaultError::Validation("Stored key salt is invalid.".into()))?;
        let aes_nonce = decode(&persisted.vault_aes_nonce_base64)?;
        let aes_nonce: [u8; 12] = aes_nonce
            .try_into()
            .map_err(|_| VaultError::Validation("Stored AES vault nonce is invalid.".into()))?;
        let chacha_nonce = decode(&persisted.vault_chacha_nonce_base64)?;
        let chacha_nonce: [u8; 12] = chacha_nonce
            .try_into()
            .map_err(|_| VaultError::Validation("Stored ChaCha vault nonce is invalid.".into()))?;
        let ciphertext = decode(&persisted.encrypted_payload_base64)?;
        let key = derive_master_key(password, &key_salt)?;
        let plaintext = decrypt_bytes(&key, &ciphertext, &aes_nonce, &chacha_nonce)?;
        let mut vault = serde_json::from_slice::<PlainVault>(&plaintext).map_err(VaultError::Serde)?;

        persisted.failed_attempts = 0;
        persisted.lockout_until = None;
        persisted.last_accessed_at = Some(Utc::now());
        save_persisted_vault(&self.vault_path, &persisted)?;

        push_activity(&mut vault.activity_log, "unlock", "vault");
        push_security_event(&mut vault.security_log, "vault_unlock", "success", "Vault unlocked successfully.");
        self.session.master_key = Some(key);
        self.session.vault = Some(vault);
        self.persist_session()?;
        self.status()
    }

    pub fn lock(&mut self) -> Result<VaultStatus, VaultError> {
        self.session.clear();
        self.status()
    }

    pub fn update_settings(&mut self, input: VaultSettingsInput) -> Result<VaultSnapshot, VaultError> {
        self.touch()?;
        if ![1, 5, 15].contains(&input.auto_lock_minutes) {
            return Err(VaultError::Validation("Auto-lock timer must be 1, 5, or 15 minutes.".into()));
        }
        let vault = self.active_vault_mut()?;
        vault.settings = VaultSettings {
            clipboard_watcher_enabled: input.clipboard_watcher_enabled,
            security_alerts_enabled: input.security_alerts_enabled,
            auto_lock_minutes: input.auto_lock_minutes,
        };
        push_activity(&mut vault.activity_log, "settings_updated", "settings");
        self.persist_session()?;
        self.snapshot(None)
    }

    pub fn generate_password(&self, options: PasswordGeneratorOptions) -> Result<GeneratedPassword, VaultError> {
        if options.length < 8 || options.length > 64 {
            return Err(VaultError::Validation("Password length must be between 8 and 64.".into()));
        }

        let mut pools = Vec::new();
        if options.uppercase {
            pools.push("ABCDEFGHJKLMNPQRSTUVWXYZ");
        }
        if options.lowercase {
            pools.push("abcdefghijkmnopqrstuvwxyz");
        }
        if options.numbers {
            pools.push("23456789");
        }
        if options.symbols {
            pools.push("!@#$%^&*()-_=+[]{}:,.?");
        }
        if pools.is_empty() {
            return Err(VaultError::Validation("Enable at least one character group.".into()));
        }

        let mut rng = OsRng;
        let mut password_chars = Vec::new();
        for pool in &pools {
            let chars: Vec<char> = pool.chars().collect();
            password_chars.push(*chars.choose(&mut rng).ok_or_else(|| VaultError::Crypto("Generator pool error.".into()))?);
        }
        let all_chars: Vec<char> = pools.iter().flat_map(|pool| pool.chars()).collect();
        while password_chars.len() < options.length {
            password_chars.push(all_chars[rng.gen_range(0..all_chars.len())]);
        }
        password_chars.shuffle(&mut rng);
        let password: String = password_chars.into_iter().collect();
        let analysis = analyze_password(&password);
        Ok(GeneratedPassword { password, analysis })
    }

    pub fn inspect_password_candidate(
        &self,
        password: &str,
        exclude_id: Option<&str>,
    ) -> Result<PasswordCandidateInspection, VaultError> {
        let vault = self.active_vault()?;
        let reuse_count = vault
            .passwords
            .iter()
            .filter(|item| exclude_id.map(|id| item.id != id).unwrap_or(true))
            .filter(|item| item.password == password)
            .count();
        let breach = lookup_breach(password);
        let analysis = analyze_password(password);
        Ok(PasswordCandidateInspection {
            analysis: analysis.clone(),
            reuse_count,
            breached: breach.compromised,
            breach_count: breach.count,
            status: derive_password_status(&analysis, reuse_count, breach.compromised),
            k_anonymity_prefix: breach.prefix,
        })
    }

    pub fn snapshot(&mut self, query: Option<String>) -> Result<VaultSnapshot, VaultError> {
        self.touch()?;
        let vault = self.active_vault()?;
        let needle = query.unwrap_or_default().trim().to_lowercase();
        let reuse_map = password_reuse_map(&vault.passwords);

        let mut passwords = vault
            .passwords
            .iter()
            .filter(|item| {
                needle.is_empty()
                    || [item.site.as_str(), item.username.as_str(), item.notes.as_str()]
                        .into_iter()
                        .chain(item.tags.iter().map(String::as_str))
                        .any(|value| value.to_lowercase().contains(&needle))
            })
            .map(|item| {
                let analysis = analyze_password(&item.password);
                let breach = lookup_breach(&item.password);
                let reuse_count = *reuse_map.get(&item.password).unwrap_or(&1);
                let security_status = derive_password_status(&analysis, reuse_count, breach.compromised);
                PasswordRecord {
                    id: item.id.clone(),
                    site: item.site.clone(),
                    username: item.username.clone(),
                    notes: item.notes.clone(),
                    tags: item.tags.clone(),
                    favorite: item.favorite,
                    created_at: item.created_at,
                    updated_at: item.updated_at,
                    strength: analysis.strength.clone(),
                    strength_score: analysis.score,
                    strength_suggestions: analysis.suggestions.clone(),
                    reuse_count,
                    breached: breach.compromised,
                    breach_count: breach.count,
                    security_status,
                }
            })
            .collect::<Vec<_>>();
        passwords.sort_by_key(|item| (!item.favorite, item.site.to_lowercase()));

        let mut notes = vault
            .notes
            .iter()
            .filter(|item| {
                needle.is_empty()
                    || [item.title.as_str(), item.content.as_str()]
                        .into_iter()
                        .chain(item.tags.iter().map(String::as_str))
                        .any(|value| value.to_lowercase().contains(&needle))
            })
            .map(|item| NoteRecord {
                id: item.id.clone(),
                title: item.title.clone(),
                content: item.content.clone(),
                tags: item.tags.clone(),
                favorite: item.favorite,
                created_at: item.created_at,
                updated_at: item.updated_at,
            })
            .collect::<Vec<_>>();
        notes.sort_by_key(|item| (!item.favorite, item.title.to_lowercase()));

        let mut files = vault
            .files
            .iter()
            .filter(|item| {
                needle.is_empty()
                    || std::iter::once(item.name.as_str())
                        .chain(item.tags.iter().map(String::as_str))
                        .any(|value| value.to_lowercase().contains(&needle))
            })
            .map(|item| FileRecord {
                id: item.id.clone(),
                name: item.name.clone(),
                mime_type: item.mime_type.clone(),
                size: item.size,
                tags: item.tags.clone(),
                favorite: item.favorite,
                created_at: item.created_at,
            })
            .collect::<Vec<_>>();
        files.sort_by_key(|item| (!item.favorite, item.name.to_lowercase()));

        Ok(VaultSnapshot {
            passwords,
            notes,
            files,
            settings: vault.settings.clone(),
            activity_log: vault.activity_log.iter().rev().take(30).cloned().collect(),
            security_alerts: collect_security_alerts(vault),
            security_log: merge_security_logs(vault, load_account(&self.account_path)?.as_ref()),
            insights: compute_security_insights(vault, self.status()?.last_accessed_at),
            status: self.status()?,
        })
    }

    pub fn upsert_password(&mut self, input: PasswordInput) -> Result<VaultSnapshot, VaultError> {
        self.touch()?;
        let now = Utc::now();
        let inspection = self.inspect_password_candidate(&input.password, input.id.as_deref())?;
        let vault = self.active_vault_mut()?;

        if input.site.trim().is_empty() || input.username.trim().is_empty() {
            return Err(VaultError::Validation("Password entries require a site and username.".into()));
        }

        let normalized_tags = normalize_tags(input.tags);
        match input.id {
            Some(id) => {
                let item = vault
                    .passwords
                    .iter_mut()
                    .find(|entry| entry.id == id)
                    .ok_or_else(|| VaultError::Validation("Password entry not found.".into()))?;
                item.site = input.site;
                item.username = input.username;
                if !input.password.is_empty() {
                    item.password = input.password;
                }
                item.notes = input.notes;
                item.tags = normalized_tags;
                item.favorite = input.favorite;
                item.updated_at = now;
                push_activity(&mut vault.activity_log, "password_updated", "password");
                push_security_event(
                    &mut vault.security_log,
                    "password_updated",
                    "success",
                    &format!(
                        "Password entry evaluated as {:?} with reuse count {}.",
                        inspection.status, inspection.reuse_count
                    ),
                );
            }
            None => {
                if input.password.is_empty() {
                    return Err(VaultError::Validation("Password cannot be empty.".into()));
                }
                vault.passwords.push(PasswordSecret {
                    id: Uuid::new_v4().to_string(),
                    site: input.site,
                    username: input.username,
                    password: input.password,
                    notes: input.notes,
                    tags: normalized_tags,
                    favorite: input.favorite,
                    created_at: now,
                    updated_at: now,
                });
                push_activity(&mut vault.activity_log, "password_created", "password");
                push_security_event(
                    &mut vault.security_log,
                    "password_created",
                    "success",
                    &format!(
                        "Password entry evaluated as {:?} with reuse count {}.",
                        inspection.status, inspection.reuse_count
                    ),
                );
            }
        }

        refresh_security_alerts(vault);

        self.persist_session()?;
        self.snapshot(None)
    }

    pub fn delete_password(&mut self, id: &str) -> Result<VaultSnapshot, VaultError> {
        self.touch()?;
        let vault = self.active_vault_mut()?;
        vault.passwords.retain(|item| item.id != id);
        push_activity(&mut vault.activity_log, "password_deleted", "password");
        self.persist_session()?;
        self.snapshot(None)
    }

    pub fn reveal_password(&mut self, id: &str) -> Result<String, VaultError> {
        self.touch()?;
        let vault = self.active_vault()?;
        vault
            .passwords
            .iter()
            .find(|item| item.id == id)
            .map(|item| item.password.clone())
            .ok_or_else(|| VaultError::Validation("Password entry not found.".into()))
    }

    pub fn upsert_note(&mut self, input: NoteInput) -> Result<VaultSnapshot, VaultError> {
        self.touch()?;
        let now = Utc::now();
        let vault = self.active_vault_mut()?;

        if input.title.trim().is_empty() {
            return Err(VaultError::Validation("Notes require a title.".into()));
        }

        let normalized_tags = normalize_tags(input.tags);
        match input.id {
            Some(id) => {
                let item = vault
                    .notes
                    .iter_mut()
                    .find(|entry| entry.id == id)
                    .ok_or_else(|| VaultError::Validation("Note entry not found.".into()))?;
                item.title = input.title;
                item.content = input.content;
                item.tags = normalized_tags;
                item.favorite = input.favorite;
                item.updated_at = now;
                push_activity(&mut vault.activity_log, "note_updated", "note");
            }
            None => {
                vault.notes.push(NoteSecret {
                    id: Uuid::new_v4().to_string(),
                    title: input.title,
                    content: input.content,
                    tags: normalized_tags,
                    favorite: input.favorite,
                    created_at: now,
                    updated_at: now,
                });
                push_activity(&mut vault.activity_log, "note_created", "note");
            }
        }

        self.persist_session()?;
        self.snapshot(None)
    }

    pub fn delete_note(&mut self, id: &str) -> Result<VaultSnapshot, VaultError> {
        self.touch()?;
        let vault = self.active_vault_mut()?;
        vault.notes.retain(|item| item.id != id);
        push_activity(&mut vault.activity_log, "note_deleted", "note");
        self.persist_session()?;
        self.snapshot(None)
    }

    pub fn add_file(&mut self, input: FilePayloadInput) -> Result<VaultSnapshot, VaultError> {
        self.touch()?;
        let key = *self
            .session
            .master_key
            .as_ref()
            .ok_or_else(|| VaultError::Authentication("Vault is locked.".into()))?;
        let bytes = decode(&input.bytes_base64)?;
        if bytes.is_empty() {
            return Err(VaultError::Validation("Uploaded files cannot be empty.".into()));
        }
        let aes_nonce = random_bytes::<12>();
        let chacha_nonce = random_bytes::<12>();
        let encrypted = encrypt_bytes(&key, &bytes, &aes_nonce, &chacha_nonce)?;
        let id = Uuid::new_v4().to_string();
        let path = blob_path(&self.files_dir, &id);
        write_blob(&path, &encrypted)?;

        let vault = self.active_vault_mut()?;
        vault.files.push(FileSecret {
            id,
            name: input.name,
            mime_type: input.mime_type,
            size: bytes.len(),
            aes_nonce_base64: encode(&aes_nonce),
            chacha_nonce_base64: encode(&chacha_nonce),
            tags: normalize_tags(input.tags),
            favorite: input.favorite,
            created_at: Utc::now(),
        });
        push_activity(&mut vault.activity_log, "file_uploaded", "file");
        self.persist_session()?;
        self.snapshot(None)
    }

    pub fn read_file(&mut self, id: &str) -> Result<FilePayloadInput, VaultError> {
        self.touch()?;
        let key = *self
            .session
            .master_key
            .as_ref()
            .ok_or_else(|| VaultError::Authentication("Vault is locked.".into()))?;
        let vault = self.active_vault()?;
        let file = vault
            .files
            .iter()
            .find(|item| item.id == id)
            .ok_or_else(|| VaultError::Validation("Encrypted file not found.".into()))?;
        let aes_nonce = decode(&file.aes_nonce_base64)?;
        let aes_nonce: [u8; 12] = aes_nonce
            .try_into()
            .map_err(|_| VaultError::Validation("Stored AES file nonce is invalid.".into()))?;
        let chacha_nonce = decode(&file.chacha_nonce_base64)?;
        let chacha_nonce: [u8; 12] = chacha_nonce
            .try_into()
            .map_err(|_| VaultError::Validation("Stored ChaCha file nonce is invalid.".into()))?;
        let encrypted = read_blob(&blob_path(&self.files_dir, &file.id))?;
        let bytes = decrypt_bytes(&key, &encrypted, &aes_nonce, &chacha_nonce)?;

        Ok(FilePayloadInput {
            name: file.name.clone(),
            mime_type: file.mime_type.clone(),
            bytes_base64: encode(&bytes),
            tags: file.tags.clone(),
            favorite: file.favorite,
        })
    }

    pub fn delete_file(&mut self, id: &str) -> Result<VaultSnapshot, VaultError> {
        self.touch()?;
        delete_blob(&blob_path(&self.files_dir, id))?;
        let vault = self.active_vault_mut()?;
        vault.files.retain(|item| item.id != id);
        push_activity(&mut vault.activity_log, "file_deleted", "file");
        self.persist_session()?;
        self.snapshot(None)
    }

    pub fn export_backup(&self) -> Result<String, VaultError> {
        let session_files = self
            .session
            .vault
            .as_ref()
            .ok_or_else(|| VaultError::Authentication("Unlock the vault before exporting a backup.".into()))?
            .files
            .clone();
        let vault = load_persisted_vault(&self.vault_path)?
            .ok_or_else(|| VaultError::Validation("Vault is not initialized.".into()))?;
        let files = session_files
            .iter()
            .map(|file| -> Result<ExportedBlob, VaultError> {
                let encrypted = read_blob(&blob_path(&self.files_dir, &file.id))?;
                Ok(ExportedBlob {
                    id: file.id.clone(),
                    encrypted_bytes_base64: encode(&encrypted),
                })
            })
            .collect::<Result<Vec<_>, _>>()?;
        let package = BackupPackage {
            vault,
            files,
            exported_at: Utc::now(),
        };
        serde_json::to_string_pretty(&package).map_err(VaultError::Serde)
    }

    pub fn import_backup(&mut self, payload: &str) -> Result<VaultStatus, VaultError> {
        let package = serde_json::from_str::<BackupPackage>(payload).map_err(VaultError::Serde)?;
        self.session.clear();
        reset_dir(&self.files_dir)?;
        for file in &package.files {
            let bytes = decode(&file.encrypted_bytes_base64)?;
            write_blob(&blob_path(&self.files_dir, &file.id), &bytes)?;
        }
        save_persisted_vault(&self.vault_path, &package.vault)?;
        self.status()
    }

    fn touch(&mut self) -> Result<(), VaultError> {
        self.refresh_authenticated_session()?;
        let mut persisted = match load_persisted_vault(&self.vault_path)? {
            Some(vault) => vault,
            None => return Ok(()),
        };
        persisted.last_accessed_at = Some(Utc::now());
        save_persisted_vault(&self.vault_path, &persisted)
    }

    fn persist_session(&mut self) -> Result<(), VaultError> {
        let key = *self
            .session
            .master_key
            .as_ref()
            .ok_or_else(|| VaultError::Authentication("Vault is locked.".into()))?;
        let mut persisted = load_persisted_vault(&self.vault_path)?
            .ok_or_else(|| VaultError::Validation("Vault is not initialized.".into()))?;
        let aes_nonce = random_bytes::<12>();
        let chacha_nonce = random_bytes::<12>();
        let vault = self.active_vault()?;
        let plaintext = serde_json::to_vec(vault).map_err(VaultError::Serde)?;
        let ciphertext = encrypt_bytes(&key, &plaintext, &aes_nonce, &chacha_nonce)?;
        persisted.vault_aes_nonce_base64 = encode(&aes_nonce);
        persisted.vault_chacha_nonce_base64 = encode(&chacha_nonce);
        persisted.encrypted_payload_base64 = encode(&ciphertext);
        persisted.updated_at = Utc::now();
        persisted.last_accessed_at = Some(Utc::now());
        save_persisted_vault(&self.vault_path, &persisted)
    }

    fn active_vault(&self) -> Result<&PlainVault, VaultError> {
        self.session
            .vault
            .as_ref()
            .ok_or_else(|| VaultError::Authentication("Vault is locked.".into()))
    }

    fn active_vault_mut(&mut self) -> Result<&mut PlainVault, VaultError> {
        self.session
            .vault
            .as_mut()
            .ok_or_else(|| VaultError::Authentication("Vault is locked.".into()))
    }

    fn require_authenticated_account(&mut self) -> Result<AccountRecord, VaultError> {
        self.refresh_authenticated_session()?;
        let mut account = load_account(&self.account_path)?
            .ok_or_else(|| VaultError::Authentication("Sign in to SecureStore first.".into()))?;
        if self.authenticated_email.is_none() {
            if session_is_active(&account) {
                self.authenticated_email = Some(account.email.clone());
            } else {
                return Err(VaultError::Authentication("Sign in to SecureStore first.".into()));
            }
        }
        account.updated_at = Utc::now();
        account.session_last_active_at = Some(Utc::now());
        account.session_expires_at = Some(
            Utc::now()
                + if account.remember_session {
                    Duration::hours(REMEMBERED_SESSION_HOURS)
                } else {
                    Duration::minutes(SESSION_IDLE_MINUTES)
                },
        );
        save_account(&self.account_path, &account)?;
        Ok(account)
    }

    fn refresh_authenticated_session(&mut self) -> Result<(), VaultError> {
        if let Some(mut account) = load_account(&self.account_path)? {
            if session_has_expired(&account) {
                account.session_active = false;
                account.session_token = None;
                account.session_started_at = None;
                account.session_last_active_at = None;
                account.session_expires_at = None;
                append_account_security_event(&mut account, "session_expired", "expired", "Account session expired.");
                save_account(&self.account_path, &account)?;
                self.authenticated_email = None;
                self.session.clear();
            }
        }
        Ok(())
    }
}

fn push_activity(log: &mut Vec<ActivityLogEntry>, action: &str, target_kind: &str) {
    log.push(ActivityLogEntry {
        id: Uuid::new_v4().to_string(),
        occurred_at: Utc::now(),
        action: action.into(),
        target_kind: target_kind.into(),
    });
    if log.len() > MAX_ACTIVITY_LOG {
        let overflow = log.len() - MAX_ACTIVITY_LOG;
        log.drain(0..overflow);
    }
}

fn new_security_event(event: &str, outcome: &str, detail: &str) -> SecurityLogEntry {
    SecurityLogEntry {
        id: Uuid::new_v4().to_string(),
        occurred_at: Utc::now(),
        event: event.into(),
        outcome: outcome.into(),
        detail: detail.into(),
    }
}

fn append_account_security_event(account: &mut AccountRecord, event: &str, outcome: &str, detail: &str) {
    account.security_log.push(new_security_event(event, outcome, detail));
    if account.security_log.len() > MAX_SECURITY_LOG {
        let overflow = account.security_log.len() - MAX_SECURITY_LOG;
        account.security_log.drain(0..overflow);
    }
}

fn push_security_event(log: &mut Vec<SecurityLogEntry>, event: &str, outcome: &str, detail: &str) {
    log.push(new_security_event(event, outcome, detail));
    if log.len() > MAX_SECURITY_LOG {
        let overflow = log.len() - MAX_SECURITY_LOG;
        log.drain(0..overflow);
    }
}

fn upsert_alert(alerts: &mut Vec<SecurityAlertRecord>, severity: &str, category: &str, message: String) {
    if alerts.iter().any(|alert| alert.category == category && alert.message == message) {
        return;
    }
    alerts.push(SecurityAlertRecord {
        id: Uuid::new_v4().to_string(),
        created_at: Utc::now(),
        severity: severity.into(),
        category: category.into(),
        message,
    });
}

fn refresh_security_alerts(vault: &mut PlainVault) {
    let reuse_map = password_reuse_map(&vault.passwords);
    let mut alerts = Vec::new();

    for item in &vault.passwords {
        let analysis = analyze_password(&item.password);
        let reuse_count = *reuse_map.get(&item.password).unwrap_or(&1);
        let breach = lookup_breach(&item.password);

        if matches!(analysis.strength, PasswordStrength::Weak) {
            upsert_alert(
                &mut alerts,
                "warning",
                "weak_password",
                format!("{} uses a weak password that should be strengthened.", item.site),
            );
        }
        if reuse_count > 1 {
            upsert_alert(
                &mut alerts,
                "warning",
                "reused_password",
                format!("{} shares a password with {} entries.", item.site, reuse_count),
            );
        }
        if breach.compromised {
            upsert_alert(
                &mut alerts,
                "critical",
                "compromised_password",
                format!("{} matches a known compromised password signature.", item.site),
            );
        }
    }

    if alerts.is_empty() {
        upsert_alert(
            &mut alerts,
            "info",
            "security_posture",
            "No active vault security alerts. Current entries look healthy.".into(),
        );
    }

    vault.security_alerts = alerts.into_iter().rev().take(MAX_SECURITY_ALERTS).collect();
}

fn collect_security_alerts(vault: &PlainVault) -> Vec<SecurityAlertRecord> {
    let mut snapshot = vault.security_alerts.clone();
    if snapshot.is_empty() {
        let mut cloned = vault.clone();
        refresh_security_alerts(&mut cloned);
        snapshot = cloned.security_alerts;
    }
    snapshot.into_iter().rev().take(20).collect()
}

fn merge_security_logs(vault: &PlainVault, account: Option<&AccountRecord>) -> Vec<SecurityLogEntry> {
    let mut merged = vault.security_log.clone();
    if let Some(account) = account {
        merged.extend(account.security_log.clone());
    }
    merged.sort_by_key(|entry| std::cmp::Reverse(entry.occurred_at));
    merged.into_iter().take(40).collect()
}

fn normalize_tags(tags: Vec<String>) -> Vec<String> {
    let mut seen = Vec::<String>::new();
    for tag in tags {
        let normalized = tag.trim().to_lowercase();
        if !normalized.is_empty() && !seen.contains(&normalized) {
            seen.push(normalized);
        }
    }
    seen
}

fn normalize_email(email: &str) -> Result<String, VaultError> {
    let normalized = email.trim().to_lowercase();
    if normalized.is_empty() || !normalized.contains('@') || normalized.starts_with('@') || normalized.ends_with('@') {
        return Err(VaultError::Validation("Enter a valid email address.".into()));
    }
    Ok(normalized)
}

#[derive(Debug, Clone)]
struct BreachMatch {
    compromised: bool,
    count: u32,
    prefix: String,
}

fn lookup_breach(password: &str) -> BreachMatch {
    let digest = format!("{:X}", Sha1::digest(password.as_bytes()));
    let prefix = digest[..5].to_string();
    let suffix = &digest[5..];

    let count = compromised_password_signatures()
        .get(prefix.as_str())
        .and_then(|entries| entries.iter().find(|(candidate, _)| *candidate == suffix).map(|(_, count)| *count))
        .unwrap_or(0);

    BreachMatch {
        compromised: count > 0,
        count,
        prefix,
    }
}

fn compromised_password_signatures() -> HashMap<&'static str, Vec<(&'static str, u32)>> {
    HashMap::from([
        ("5BAA6", vec![("1E4C9B93F3F0682250B6CF8331B7EE68FD8", 26230667)]),
        ("7C4A8", vec![("D09CA3762AF61E59520943DC26494F8941B", 18004183)]),
        ("B1B37", vec![("73A05C0ED0176787A4F1574FF0075F7521E", 4369447)]),
        ("B7A87", vec![("5FC1EA228B9061041B7CEC4BD3C52AB3CE3", 1274988)]),
        ("2AA60", vec![("C01F5A1EAAE6F2B4866A1D8EEB2B7C43313", 940531)]),
    ])
}

fn derive_password_status(
    analysis: &PasswordAnalysis,
    reuse_count: usize,
    breached: bool,
) -> PasswordSecurityStatus {
    if breached {
        PasswordSecurityStatus::Compromised
    } else if reuse_count > 1 {
        PasswordSecurityStatus::Reused
    } else if matches!(analysis.strength, PasswordStrength::Weak) {
        PasswordSecurityStatus::Weak
    } else {
        PasswordSecurityStatus::Secure
    }
}

fn register_login_failure(account: &mut AccountRecord) {
    account.login_failed_attempts += 1;
    account.last_failed_login_at = Some(Utc::now());
    let delay_seconds = (2u32.pow(account.login_failed_attempts.min(ACCOUNT_LOCKOUT_LIMIT)) as i64).min(120);
    account.login_lockout_until = Some(Utc::now() + Duration::seconds(delay_seconds));
}

fn session_is_active(account: &AccountRecord) -> bool {
    account.session_active && !session_has_expired(account)
}

fn session_has_expired(account: &AccountRecord) -> bool {
    account
        .session_expires_at
        .map(|expires_at| Utc::now() >= expires_at)
        .unwrap_or(false)
}

fn generate_session_token() -> String {
    encode(&random_bytes::<32>())
}

fn current_device_id() -> String {
    let hostname = std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "securestore-device".into());
    hostname.to_lowercase()
}

pub fn analyze_password(password: &str) -> PasswordAnalysis {
    let mut score = 0u8;
    let mut suggestions = Vec::new();
    let has_upper = password.chars().any(|char| char.is_ascii_uppercase());
    let has_lower = password.chars().any(|char| char.is_ascii_lowercase());
    let has_number = password.chars().any(|char| char.is_ascii_digit());
    let has_symbol = password.chars().any(|char| !char.is_ascii_alphanumeric());

    score += match password.len() {
        0..=7 => 10,
        8..=11 => 35,
        12..=15 => 55,
        16..=23 => 75,
        _ => 85,
    };
    if has_upper {
        score += 5;
    } else {
        suggestions.push("Add uppercase letters".into());
    }
    if has_lower {
        score += 5;
    } else {
        suggestions.push("Add lowercase letters".into());
    }
    if has_number {
        score += 5;
    } else {
        suggestions.push("Add numbers".into());
    }
    if has_symbol {
        score += 10;
    } else {
        suggestions.push("Add symbols".into());
    }
    if password.len() < 14 {
        suggestions.push("Increase length".into());
    }

    let strength = if score < 45 {
        PasswordStrength::Weak
    } else if score < 75 {
        PasswordStrength::Medium
    } else {
        PasswordStrength::Strong
    };

    PasswordAnalysis {
        strength,
        score: score.min(100),
        suggestions,
    }
}

fn password_reuse_map(passwords: &[PasswordSecret]) -> HashMap<String, usize> {
    let mut counts = HashMap::new();
    for item in passwords {
        *counts.entry(item.password.clone()).or_insert(0usize) += 1;
    }
    counts
}

fn compute_security_insights(vault: &PlainVault, last_access: Option<chrono::DateTime<Utc>>) -> SecurityInsights {
    let reuse_map = password_reuse_map(&vault.passwords);
    let weak_passwords = vault
        .passwords
        .iter()
        .filter(|item| matches!(analyze_password(&item.password).strength, PasswordStrength::Weak))
        .count();
    let reused_passwords = reuse_map.values().filter(|count| **count > 1).count();
    let compromised_passwords = vault
        .passwords
        .iter()
        .filter(|item| lookup_breach(&item.password).compromised)
        .count();
    let favorite_entries = vault.passwords.iter().filter(|item| item.favorite).count()
        + vault.notes.iter().filter(|item| item.favorite).count()
        + vault.files.iter().filter(|item| item.favorite).count();

    let mut suggestions = Vec::new();
    if weak_passwords > 0 {
        suggestions.push(format!("Upgrade {weak_passwords} weak password entries."));
    }
    if reused_passwords > 0 {
        suggestions.push(format!("Replace reused passwords across {reused_passwords} password groups."));
    }
    if compromised_passwords > 0 {
        suggestions.push(format!("Rotate {compromised_passwords} password entries flagged against compromised signatures."));
    }
    if favorite_entries == 0 {
        suggestions.push("Pin your most important items for faster access.".into());
    }
    if suggestions.is_empty() {
        suggestions.push("Vault health looks strong. Keep rotating high-value credentials.".into());
    }

    let mut score: i32 = 100;
    score -= (weak_passwords as i32) * 12;
    score -= (reused_passwords as i32) * 15;
    score -= (compromised_passwords as i32) * 20;
    score += (favorite_entries.min(3) as i32) * 2;
    let security_score = score.clamp(0, 100) as u8;
    let security_posture = if security_score < 50 {
        "Your vault is at risk".to_string()
    } else if security_score < 80 {
        "Good security".to_string()
    } else {
        "Excellent security".to_string()
    };

    SecurityInsights {
        weak_passwords,
        reused_passwords,
        compromised_passwords,
        favorite_entries,
        last_vault_access: last_access,
        suggestions,
        security_score,
        security_posture,
    }
}

#[cfg(test)]
mod tests {
    use std::fs;

    use super::{analyze_password, PasswordGeneratorOptions, PasswordInput, PasswordStrength, SignUpInput, VaultManager};

    fn temp_dir() -> std::path::PathBuf {
        let path = std::env::temp_dir().join(format!("secure-vault-test-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&path).expect("create temp dir");
        path
    }

    fn create_account(manager: &mut VaultManager) {
        manager
            .sign_up(SignUpInput {
                email: "user@securestore.local".into(),
                password: "AccountPass123!".into(),
                confirm_password: "AccountPass123!".into(),
            })
            .expect("create account");
    }

    #[test]
    fn vault_file_does_not_contain_plaintext_secrets() {
        let dir = temp_dir();
        let mut manager = VaultManager::new(dir.clone()).expect("manager");
        create_account(&mut manager);
        manager.initialize("correct horse battery staple").expect("initialize");
        manager.unlock("correct horse battery staple").expect("unlock");
        manager
            .upsert_password(PasswordInput {
                id: None,
                site: "example".into(),
                username: "matth".into(),
                password: "super-secret".into(),
                notes: "private".into(),
                tags: vec!["personal".into()],
                favorite: false,
            })
            .expect("store password");

        let vault_file = fs::read_to_string(dir.join("vault.json")).expect("read vault file");
        assert!(!vault_file.contains("super-secret"));
        assert!(!vault_file.contains("matth"));
    }

    #[test]
    fn wrong_password_cannot_unlock_vault() {
        let dir = temp_dir();
        let mut manager = VaultManager::new(dir).expect("manager");
        create_account(&mut manager);
        manager.initialize("correct horse battery staple").expect("initialize");
        let result = manager.unlock("wrong password");
        assert!(result.is_err());
    }

    #[test]
    fn password_generator_respects_character_sets() {
        let manager = VaultManager::new(temp_dir()).expect("manager");
        let generated = manager
            .generate_password(PasswordGeneratorOptions {
                length: 20,
                uppercase: true,
                lowercase: true,
                numbers: true,
                symbols: true,
            })
            .expect("generated");
        assert_eq!(generated.password.len(), 20);
        assert!(generated.password.chars().any(|char| char.is_ascii_uppercase()));
        assert!(generated.password.chars().any(|char| char.is_ascii_lowercase()));
        assert!(generated.password.chars().any(|char| char.is_ascii_digit()));
        assert!(generated.password.chars().any(|char| !char.is_ascii_alphanumeric()));
    }

    #[test]
    fn password_strength_analyzer_flags_weak_passwords() {
        let analysis = analyze_password("password");
        assert!(matches!(analysis.strength, PasswordStrength::Weak));
        assert!(!analysis.suggestions.is_empty());
    }

    #[test]
    fn duplicate_detection_counts_reused_passwords() {
        let dir = temp_dir();
        let mut manager = VaultManager::new(dir).expect("manager");
        create_account(&mut manager);
        manager.initialize("correct horse battery staple").expect("initialize");
        manager.unlock("correct horse battery staple").expect("unlock");
        for site in ["mail", "bank"] {
            manager
                .upsert_password(PasswordInput {
                    id: None,
                    site: site.into(),
                    username: "user".into(),
                    password: "Reused!12345".into(),
                    notes: "".into(),
                    tags: vec![],
                    favorite: false,
                })
                .expect("store password");
        }
        let snapshot = manager.snapshot(None).expect("snapshot");
        assert!(snapshot.passwords.iter().all(|item| item.reuse_count == 2));
        assert_eq!(snapshot.insights.reused_passwords, 1);
    }

    #[test]
    fn breach_check_flags_known_compromised_passwords() {
        let dir = temp_dir();
        let mut manager = VaultManager::new(dir).expect("manager");
        create_account(&mut manager);
        manager.initialize("correct horse battery staple").expect("initialize");
        manager.unlock("correct horse battery staple").expect("unlock");
        manager
            .upsert_password(PasswordInput {
                id: None,
                site: "mail".into(),
                username: "user".into(),
                password: "password".into(),
                notes: "".into(),
                tags: vec![],
                favorite: false,
            })
            .expect("store password");

        let snapshot = manager.snapshot(None).expect("snapshot");
        assert!(snapshot.passwords[0].breached);
        assert!(snapshot.insights.compromised_passwords >= 1);
        assert!(snapshot
            .security_alerts
            .iter()
            .any(|alert| alert.category == "compromised_password"));
    }

    #[test]
    fn repeated_login_failures_trigger_lockout() {
        let dir = temp_dir();
        let mut manager = VaultManager::new(dir).expect("manager");
        create_account(&mut manager);
        manager.logout().expect("logout");

        for _ in 0..5 {
            let _ = manager.login(super::LoginInput {
                email: "user@securestore.local".into(),
                password: "wrongpass".into(),
                remember_session: false,
            });
        }

        let status = manager.auth_status().expect("auth status");
        assert!(status.login_lockout_until.is_some());
    }
}

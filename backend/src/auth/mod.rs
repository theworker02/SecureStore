use bcrypt::{hash, verify, DEFAULT_COST};

use crate::VaultError;

const ACCOUNT_PASSWORD_RULE_MESSAGE: &str =
    "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

pub fn hash_password(password: &str, min_length: usize, label: &str) -> Result<String, VaultError> {
    if password.len() < min_length {
        return Err(VaultError::Validation(format!(
            "{label} must be at least {min_length} characters."
        )));
    }

    hash(password, DEFAULT_COST).map_err(|error| VaultError::Crypto(error.to_string()))
}

pub fn verify_password(password: &str, password_hash: &str) -> Result<bool, VaultError> {
    verify(password, password_hash).map_err(|error| VaultError::Crypto(error.to_string()))
}

pub fn hash_master_password(password: &str) -> Result<String, VaultError> {
    hash_password(password, 12, "Master password")
}

pub fn verify_master_password(password: &str, password_hash: &str) -> Result<bool, VaultError> {
    verify_password(password, password_hash)
}

pub fn validate_account_password(password: &str) -> Result<(), VaultError> {
    let has_uppercase = password.chars().any(|character| character.is_ascii_uppercase());
    let has_lowercase = password.chars().any(|character| character.is_ascii_lowercase());
    let has_number = password.chars().any(|character| character.is_ascii_digit());
    let has_symbol = password.chars().any(|character| !character.is_ascii_alphanumeric());

    if password.len() < 8 || !has_uppercase || !has_lowercase || !has_number || !has_symbol {
        return Err(VaultError::Validation(ACCOUNT_PASSWORD_RULE_MESSAGE.into()));
    }

    Ok(())
}

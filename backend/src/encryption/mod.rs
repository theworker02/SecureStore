use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce as AesNonce,
};
use argon2::{Algorithm, Argon2, Params, Version};
use chacha20poly1305::{ChaCha20Poly1305, Nonce as ChaChaNonce};
use rand::{rngs::OsRng, RngCore};

use crate::VaultError;

const ARGON2_MEMORY_KIB: u32 = 64 * 1024;
const ARGON2_ITERATIONS: u32 = 3;
const ARGON2_PARALLELISM: u32 = 1;

pub fn random_bytes<const N: usize>() -> [u8; N] {
    let mut bytes = [0u8; N];
    OsRng.fill_bytes(&mut bytes);
    bytes
}

pub fn derive_master_key(password: &str, salt: &[u8]) -> Result<[u8; 64], VaultError> {
    let params = Params::new(ARGON2_MEMORY_KIB, ARGON2_ITERATIONS, ARGON2_PARALLELISM, Some(64))
        .map_err(|error| VaultError::Crypto(error.to_string()))?;
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let mut output = [0u8; 64];
    argon2
        .hash_password_into(password.as_bytes(), salt, &mut output)
        .map_err(|error| VaultError::Crypto(error.to_string()))?;
    Ok(output)
}

pub fn encrypt_bytes(
    key_material: &[u8; 64],
    plaintext: &[u8],
    aes_nonce: &[u8; 12],
    chacha_nonce: &[u8; 12],
) -> Result<Vec<u8>, VaultError> {
    let (aes_key, chacha_key) = key_material.split_at(32);
    let aes_cipher = Aes256Gcm::new_from_slice(aes_key).map_err(|error| VaultError::Crypto(error.to_string()))?;
    let aes_ciphertext = aes_cipher
        .encrypt(AesNonce::from_slice(aes_nonce), plaintext)
        .map_err(|error| VaultError::Crypto(error.to_string()))
        ?;
    let chacha_cipher = ChaCha20Poly1305::new_from_slice(chacha_key).map_err(|error| VaultError::Crypto(error.to_string()))?;
    chacha_cipher
        .encrypt(ChaChaNonce::from_slice(chacha_nonce), aes_ciphertext.as_ref())
        .map_err(|error| VaultError::Crypto(error.to_string()))
}

pub fn decrypt_bytes(
    key_material: &[u8; 64],
    ciphertext: &[u8],
    aes_nonce: &[u8; 12],
    chacha_nonce: &[u8; 12],
) -> Result<Vec<u8>, VaultError> {
    let (aes_key, chacha_key) = key_material.split_at(32);
    let chacha_cipher = ChaCha20Poly1305::new_from_slice(chacha_key).map_err(|error| VaultError::Crypto(error.to_string()))?;
    let aes_ciphertext = chacha_cipher
        .decrypt(ChaChaNonce::from_slice(chacha_nonce), ciphertext)
        .map_err(|_| VaultError::Authentication("Unable to decrypt vault with the provided password.".into()))?;
    let aes_cipher = Aes256Gcm::new_from_slice(aes_key).map_err(|error| VaultError::Crypto(error.to_string()))?;
    aes_cipher
        .decrypt(AesNonce::from_slice(aes_nonce), aes_ciphertext.as_ref())
        .map_err(|_| VaultError::Authentication("Unable to decrypt vault with the provided password.".into()))
}

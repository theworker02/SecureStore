# Encryption Details

## At Rest

- Vault JSON payloads are encrypted with AES-256-GCM and then wrapped again with ChaCha20-Poly1305.
- Encrypted file blobs use the same dual authenticated-encryption flow.
- No plaintext vault records are intentionally persisted.

## Password Handling

- Account passwords are hashed with bcrypt.
- Master passwords are verified and used to derive vault key material through Argon2id.

## Unlock Flow

1. The user authenticates locally.
2. The user enters the master password.
3. SecureStore verifies the stored master-password hash.
4. Argon2id derives the vault key material from the provided master password and stored salt.
5. The payload is decrypted through the ChaCha20-Poly1305 layer and then the AES-256-GCM layer.
6. Vault data is only available while the session remains unlocked.

## Compromise Detection

- SecureStore computes a SHA-1 digest locally.
- Only the first five hexadecimal characters are used for the k-anonymity-style prefix lookup.
- The current implementation uses offline local breach signatures to preserve offline-first operation.

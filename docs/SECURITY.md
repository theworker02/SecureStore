# SecureStore Security Notes

## Core Controls

- bcrypt hashes local account passwords before persistence
- Master passwords are handled separately from account passwords
- Argon2id derives 64 bytes of vault key material from the master password
- AES-256-GCM and ChaCha20-Poly1305 protect vault contents and file blobs at rest
- Failed login and unlock attempts trigger increasing delay and temporary lockout
- Security logs and alerts avoid storing plaintext secrets

## Monitoring Engine

- Every password entry is analyzed for strength, reuse, and compromised-password signature matches
- Vault snapshots now include security posture, alerts, and security logs
- Session state records last activity and expiration windows
- Trusted-device style tracking records the current local device label for account activity

## Hardening Added

- Strong account-password validation now requires uppercase, lowercase, number, special character, and minimum length
- Safer error propagation from Tauri command failures to the UI
- Atomic writes for persisted account and vault JSON files
- Session clear path zeroizes the in-memory master key
- Clipboard watcher requires explicit confirmation and never auto-saves data

## Security Boundaries

- Vault data is protected at rest, but decrypted records exist in memory while the vault is unlocked
- The compromised-password check uses local SHA-1 prefix/suffix matching rather than sending raw passwords
- Local account authentication does not replace the master password

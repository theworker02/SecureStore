# Changelog

## 2026-04-10

- Rebranded the desktop application and native metadata as SecureStore.
- Switched vault key derivation from PBKDF2 to Argon2id.
- Added layered AES-256-GCM and ChaCha20-Poly1305 encryption for vault payloads and encrypted files.
- Added a backend security engine for password strength, reuse, compromised-password detection, alerts, and posture scoring.
- Added login rate limiting, session expiration tracking, and richer security logs.
- Updated Tauri bundle icon configuration to include the project favicon and native icon asset.
- Refreshed the README and security documentation to match the current implementation.
- Added SecureStore+ lock-screen preview mode with premium branding, local persistence, reset behavior, and locked future-feature cards.
- Added Docker containerization for validation/web preview, root repository docs, release instructions, and GitHub-ready metadata.

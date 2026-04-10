# Contributing to SecureStore

Thanks for helping improve SecureStore.

## Setup

1. Install Node.js, Rust, and the Tauri prerequisites for your platform.
2. Run `npm install`.
3. Start the app with `npm run tauri:dev`.

## Checks

- Run `npx tsc --noEmit`.
- Run `cargo test -p secure_vault_backend`.
- Run `npm run build` when changing frontend or release packaging behavior.

## Security Expectations

- Do not commit `.env`, local vault data, generated app data, private keys, or database files.
- Do not log plaintext passwords, note content, encryption keys, session tokens, or decrypted file contents.
- Keep SecureStore offline-first unless a feature explicitly requires a reviewed network path.

More detail is available in [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

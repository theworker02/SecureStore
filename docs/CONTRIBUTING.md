# Contributing to SecureStore

## Setup

1. Install Node.js, Rust, and Tauri prerequisites.
2. Run `npm install`.
3. Start development with `npm run tauri:dev`.

## Expectations

- Keep the app offline-first.
- Do not introduce plaintext secret persistence.
- Avoid logging passwords, notes, keys, or decrypted payloads.
- Preserve the SecureStore visual language unless a broader design change is intentional.

## Before Opening a PR

- Run `cargo test -p secure_vault_backend`
- Run `npm run test:unit`
- Run `npm run build` when possible
- Run `docker build -t securestore:1.0.0 .` when container or release files change
- Update docs when flows, security assumptions, or setup steps change

## Git Hygiene

- Do not commit `.env` files, local vault data, generated app data, database files, private keys, or build artifacts.
- `.gitignore` protects common secret, runtime, and large generated files.
- Keep generated folders such as `node_modules`, `dist`, `target`, and `src-tauri/gen` out of commits.

## Scope

Good contributions include:

- security hardening
- UX polish
- tests
- docs
- performance and reliability fixes

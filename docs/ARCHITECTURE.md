# SecureStore Architecture

## Overview

SecureStore is split into a Rust/Tauri desktop layer and a React/Vite frontend.

## Frontend

- React + TypeScript UI rendered from `frontend/`
- Zustand state store in `frontend/state/vaultStore.ts`
- Tauri command bridge in `frontend/services/desktop.ts`
- Product shell, auth, onboarding, dashboard, docs, and settings pages
- SecureStore+ preview mode held in local frontend state and persisted through `localStorage`

## Backend

- Rust domain logic in `backend/src/lib.rs`
- Account password hashing and validation in `backend/src/auth/mod.rs`
- Argon2id + dual-encryption helpers in `backend/src/encryption/`
- Persisted vault and account records in `backend/src/storage/mod.rs`
- Encrypted file blob handling in `backend/src/file_handler/`

## Security Monitoring Layer

- Password strength scoring and entropy heuristics
- Password reuse detection across all entries
- Compromised-password signature matching through a k-anonymity-style SHA-1 prefix lookup
- Account login failure tracking and lockouts
- Vault unlock failure tracking and lockouts
- Session expiration and last-activity refresh
- Vault alerts and security logs exposed in snapshots

## Desktop Integration

- Tauri command registration in `src-tauri/src/main.rs`
- Tauri desktop configuration in `src-tauri/tauri.conf.json`
- Auto-port dev startup scripts in `scripts/`
- Containerized validation and frontend preview through `Dockerfile` and `docker-compose.yml`

## SecureStore+ Preview

SecureStore+ currently lives entirely in the frontend. It does not alter vault encryption, authentication, billing, or backend authorization. The lock screen reads a premium preview flag from `localStorage`, updates the shared logo component, and renders future-feature placeholders.

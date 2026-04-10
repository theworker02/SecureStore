# Usage Guide

## First Run

1. Create a local account.
2. Complete onboarding.
3. Create a master password.
4. Unlock the vault.

## Daily Use

- Add and search password entries
- Save secure notes
- Upload encrypted files
- Review activity log and security insights
- Adjust auto-lock and clipboard settings

## SecureStore+ Preview

On the lock screen, choose `Upgrade to SecureStore+` next to `Start over` to activate premium preview mode. This changes the lock-screen branding to SecureStore+, adds a premium active badge, and shows locked future-feature cards.

Choosing `Start over` resets SecureStore+ preview mode.

## Developer Mode

- `npm run dev` starts the Vite frontend on an available port
- `npm run tauri:dev` launches the coordinated desktop workflow

## Container Mode

- `docker build -t securestore:1.0.0 .` builds the validation/preview image
- `docker compose up --build` serves the frontend preview on `http://localhost:4173`
- Use native Tauri commands for actual desktop app packaging

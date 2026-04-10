# Containerization

SecureStore includes a Docker setup for reproducible validation and frontend preview.

## What The Container Does

- Installs Node.js, Rust, and Linux Tauri build prerequisites
- Runs `npm ci`
- Builds the Vite frontend
- Runs `cargo test -p secure_vault_backend`
- Serves the built frontend with Vite preview on port `4173`

## What The Container Does Not Do

The container is not the primary way to run the native desktop app. Tauri desktop windows and platform installers should still be built on the target operating system or a dedicated CI runner with desktop packaging support.

## Commands

```bash
docker build -t securestore:1.0.0 .
docker compose up --build
```

Open `http://localhost:4173` for the web preview.

The image uses the current stable `rust:1-bookworm` base so Cargo supports modern transitive crates that require stabilized Rust 2024 edition handling.

## Security Notes

- Runtime vault data is ignored by Git.
- `.env` files are ignored by Git.
- Do not mount real production vault data into the preview container.

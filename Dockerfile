# SecureStore container image
#
# This image is intended for reproducible frontend/backend validation and web preview.
# Tauri desktop packaging still requires native OS windowing/toolchain support outside
# this container.

FROM rust:1-bookworm AS base

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      gnupg \
      libwebkit2gtk-4.1-dev \
      libappindicator3-dev \
      librsvg2-dev \
      patchelf \
      build-essential \
      pkg-config \
      file \
      libssl-dev \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY Cargo.toml Cargo.lock ./
COPY backend ./backend
COPY src-tauri ./src-tauri
RUN cargo fetch

COPY index.html postcss.config.cjs tailwind.config.ts tsconfig.json vite.config.ts ./
COPY frontend ./frontend
COPY public ./public
COPY scripts ./scripts

RUN npm run build
RUN cargo test -p secure_vault_backend

EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]

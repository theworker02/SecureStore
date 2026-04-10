# Security Policy

## Supported Scope

Security reports are welcome for:

- Rust backend cryptography and secret handling
- Tauri desktop integration and native metadata
- Authentication, session, and onboarding flows
- Vault storage, backup, file handling, and security monitoring

## Reporting a Vulnerability

Please do not open public issues for active vulnerabilities.

Include:

- A clear description of the issue
- Steps to reproduce
- Impact assessment
- Affected files or flows
- Suggested remediation if available

## Disclosure Guidelines

- Give maintainers reasonable time to validate and patch the issue.
- Avoid publishing proof-of-concept material that exposes user data.
- Never post real secrets, vault contents, or personal credentials in reports.

## Current Hardening Highlights

- bcrypt-hashed account credentials
- Argon2id-derived vault key material
- Layered AES-256-GCM and ChaCha20-Poly1305 encryption for vault payloads and file blobs
- Exponential delay and lockout for failed login and vault unlock attempts
- Session expiration tracking and idle-session refresh logic
- Compromised-password detection using a k-anonymity-style local SHA-1 prefix lookup
- No plaintext vault persistence by design

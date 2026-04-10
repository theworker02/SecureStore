# Data Protection

## Stored Locally

SecureStore stores account state, vault metadata, encrypted vault content, and encrypted file blobs on the local machine.

## Not Stored in Plaintext

- Password entries
- Secure note content
- Encrypted file contents
- Master-password-derived vault payloads

## User-Controlled Actions

- Clipboard watcher prompts require confirmation
- Backup export and import stay local
- Account deletion removes account and vault files from the app data directory

## Current Privacy Position

SecureStore is offline-first. It does not depend on a cloud backend for core operation.

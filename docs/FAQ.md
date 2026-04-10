# FAQ

## Does SecureStore require internet access?

No. Core operation is offline-first.

## Is my account password the same as my master password?

No. The account password protects sign-in. The master password protects vault encryption.

## Are files encrypted too?

Yes. Uploaded files are encrypted before storage.

## Can copied clipboard text be saved automatically?

No. SecureStore can prompt, but it requires explicit confirmation.

## Why does the app auto-lock?

Auto-lock reduces exposure if the device is left unattended.

## What is SecureStore+?

SecureStore+ is currently a premium preview mode on the lock screen. It changes the visual branding and shows planned premium feature areas, but it does not add billing or backend-only premium enforcement yet.

## Can SecureStore run in Docker?

Docker is supported for reproducible validation and web preview. Native Tauri desktop packaging should still happen on the target operating system or a properly configured desktop CI runner.

import { desktopInvoke } from "@/services/desktop";
import type {
  DecryptedFile,
  FileInputPayload,
  NoteInput,
  VaultSettings,
  VaultStatus,
  VaultSnapshot,
  PasswordInput,
} from "@/types";

export function getVaultSnapshot(query = "") {
  return desktopInvoke<VaultSnapshot>("get_vault_snapshot", { query });
}

export function updateVaultSettings(input: VaultSettings) {
  return desktopInvoke<VaultSnapshot>("update_vault_settings", { input });
}

export function upsertPassword(input: PasswordInput) {
  return desktopInvoke<VaultSnapshot>("upsert_password_entry", { input });
}

export function deletePassword(id: string) {
  return desktopInvoke<VaultSnapshot>("delete_password_entry", { id });
}

export function revealPasswordSecret(id: string) {
  return desktopInvoke<string>("reveal_password_secret", { id });
}

export function upsertNote(input: NoteInput) {
  return desktopInvoke<VaultSnapshot>("upsert_note_entry", { input });
}

export function deleteNote(id: string) {
  return desktopInvoke<VaultSnapshot>("delete_note_entry", { id });
}

export function addFileEntry(input: FileInputPayload) {
  return desktopInvoke<VaultSnapshot>("add_file_entry", { input });
}

export function deleteFile(id: string) {
  return desktopInvoke<VaultSnapshot>("delete_file_entry", { id });
}

export function readFileEntry(id: string) {
  return desktopInvoke<DecryptedFile>("read_file_entry", { id });
}

export function exportBackup() {
  return desktopInvoke<string>("export_backup_payload");
}

export function importBackup(payload: string) {
  return desktopInvoke<VaultStatus>("import_backup_payload", { payload });
}

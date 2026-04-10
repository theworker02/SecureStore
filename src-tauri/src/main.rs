#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;

use secure_vault_backend::{
    AuthStatus, ChangeAccountPasswordInput, FilePayloadInput, GeneratedPassword, LoginInput, NoteInput,
    PasswordCandidateInspection, PasswordGeneratorOptions, PasswordInput, SignUpInput, VaultManager,
    VaultSettingsInput, VaultSnapshot, VaultStatus,
};
use tauri::{Manager, State, WindowEvent};

struct AppState {
    manager: Mutex<VaultManager>,
}

type CommandResult<T> = Result<T, String>;

#[tauri::command]
fn get_vault_status(state: State<'_, AppState>) -> CommandResult<VaultStatus> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.status().map_err(|error| error.to_string())
}

#[tauri::command]
fn get_auth_status(state: State<'_, AppState>) -> CommandResult<AuthStatus> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.auth_status().map_err(|error| error.to_string())
}

#[tauri::command]
fn sign_up_account(input: SignUpInput, state: State<'_, AppState>) -> CommandResult<AuthStatus> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.sign_up(input).map_err(|error| error.to_string())
}

#[tauri::command]
fn login_account(input: LoginInput, state: State<'_, AppState>) -> CommandResult<AuthStatus> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.login(input).map_err(|error| error.to_string())
}

#[tauri::command]
fn logout_account(state: State<'_, AppState>) -> CommandResult<AuthStatus> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.logout().map_err(|error| error.to_string())
}

#[tauri::command]
fn change_account_password(input: ChangeAccountPasswordInput, state: State<'_, AppState>) -> CommandResult<AuthStatus> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.change_account_password(input).map_err(|error| error.to_string())
}

#[tauri::command]
fn delete_account(confirmation: String, state: State<'_, AppState>) -> CommandResult<AuthStatus> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.delete_account(&confirmation).map_err(|error| error.to_string())
}

#[tauri::command]
fn initialize_vault(password: String, state: State<'_, AppState>) -> CommandResult<VaultStatus> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.initialize(&password).map_err(|error| error.to_string())
}

#[tauri::command]
fn unlock_vault(password: String, state: State<'_, AppState>) -> CommandResult<VaultStatus> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.unlock(&password).map_err(|error| error.to_string())
}

#[tauri::command]
fn lock_vault(state: State<'_, AppState>) -> CommandResult<VaultStatus> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.lock().map_err(|error| error.to_string())
}

#[tauri::command]
fn get_vault_snapshot(query: String, state: State<'_, AppState>) -> CommandResult<VaultSnapshot> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.snapshot(Some(query)).map_err(|error| error.to_string())
}

#[tauri::command]
fn update_vault_settings(input: VaultSettingsInput, state: State<'_, AppState>) -> CommandResult<VaultSnapshot> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.update_settings(input).map_err(|error| error.to_string())
}

#[tauri::command]
fn generate_password_value(options: PasswordGeneratorOptions, state: State<'_, AppState>) -> CommandResult<GeneratedPassword> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.generate_password(options).map_err(|error| error.to_string())
}

#[tauri::command]
fn inspect_password_candidate(password: String, exclude_id: Option<String>, state: State<'_, AppState>) -> CommandResult<PasswordCandidateInspection> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.inspect_password_candidate(&password, exclude_id.as_deref()).map_err(|error| error.to_string())
}

#[tauri::command]
fn upsert_password_entry(input: PasswordInput, state: State<'_, AppState>) -> CommandResult<VaultSnapshot> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.upsert_password(input).map_err(|error| error.to_string())
}

#[tauri::command]
fn delete_password_entry(id: String, state: State<'_, AppState>) -> CommandResult<VaultSnapshot> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.delete_password(&id).map_err(|error| error.to_string())
}

#[tauri::command]
fn reveal_password_secret(id: String, state: State<'_, AppState>) -> CommandResult<String> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.reveal_password(&id).map_err(|error| error.to_string())
}

#[tauri::command]
fn upsert_note_entry(input: NoteInput, state: State<'_, AppState>) -> CommandResult<VaultSnapshot> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.upsert_note(input).map_err(|error| error.to_string())
}

#[tauri::command]
fn delete_note_entry(id: String, state: State<'_, AppState>) -> CommandResult<VaultSnapshot> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.delete_note(&id).map_err(|error| error.to_string())
}

#[tauri::command]
fn add_file_entry(input: FilePayloadInput, state: State<'_, AppState>) -> CommandResult<VaultSnapshot> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.add_file(input).map_err(|error| error.to_string())
}

#[tauri::command]
fn read_file_entry(id: String, state: State<'_, AppState>) -> CommandResult<FilePayloadInput> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.read_file(&id).map_err(|error| error.to_string())
}

#[tauri::command]
fn delete_file_entry(id: String, state: State<'_, AppState>) -> CommandResult<VaultSnapshot> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.delete_file(&id).map_err(|error| error.to_string())
}

#[tauri::command]
fn export_backup_payload(state: State<'_, AppState>) -> CommandResult<String> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.export_backup().map_err(|error| error.to_string())
}

#[tauri::command]
fn import_backup_payload(payload: String, state: State<'_, AppState>) -> CommandResult<VaultStatus> {
    state.manager.lock().map_err(|_| "Vault state is unavailable.".to_string())?.import_backup(&payload).map_err(|error| error.to_string())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_dir = app.path().app_data_dir().map_err(|error| error.to_string())?;
            std::fs::create_dir_all(&app_dir).map_err(|error| error.to_string())?;
            app.manage(AppState {
                manager: Mutex::new(VaultManager::new(app_dir).map_err(|error| error.to_string())?),
            });
            Ok(())
        })
        .on_window_event(|window, event| {
            if matches!(event, WindowEvent::CloseRequested { .. }) {
                if let Ok(mut manager) = window.state::<AppState>().manager.lock() {
                    let _ = manager.lock();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_vault_status,
            get_auth_status,
            sign_up_account,
            login_account,
            logout_account,
            change_account_password,
            delete_account,
            initialize_vault,
            unlock_vault,
            lock_vault,
            get_vault_snapshot,
            update_vault_settings,
            generate_password_value,
            inspect_password_candidate,
            upsert_password_entry,
            delete_password_entry,
            reveal_password_secret,
            upsert_note_entry,
            delete_note_entry,
            add_file_entry,
            read_file_entry,
            delete_file_entry,
            export_backup_payload,
            import_backup_payload
        ])
        .run(tauri::generate_context!())
        .expect("secure vault failed to start");
}

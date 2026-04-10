import { desktopInvoke } from "@/services/desktop";
import type {
  AuthStatus,
  ChangeAccountPasswordInput,
  GeneratedPassword,
  LoginInput,
  PasswordCandidateInspection,
  PasswordGeneratorOptions,
  SignUpInput,
  VaultStatus,
} from "@/types";

export function getVaultStatus() {
  return desktopInvoke<VaultStatus>("get_vault_status");
}

export function getAuthStatus() {
  return desktopInvoke<AuthStatus>("get_auth_status");
}

export function signUpAccount(input: SignUpInput) {
  return desktopInvoke<AuthStatus>("sign_up_account", { input });
}

export function loginAccount(input: LoginInput) {
  return desktopInvoke<AuthStatus>("login_account", { input });
}

export function logoutAccount() {
  return desktopInvoke<AuthStatus>("logout_account");
}

export function changeAccountPassword(input: ChangeAccountPasswordInput) {
  return desktopInvoke<AuthStatus>("change_account_password", { input });
}

export function deleteAccount(confirmation: string) {
  return desktopInvoke<AuthStatus>("delete_account", { confirmation });
}

export function initializeVault(password: string) {
  return desktopInvoke<VaultStatus>("initialize_vault", { password });
}

export function unlockVault(password: string) {
  return desktopInvoke<VaultStatus>("unlock_vault", { password });
}

export function lockVault() {
  return desktopInvoke<VaultStatus>("lock_vault");
}

export function generatePassword(options: PasswordGeneratorOptions) {
  return desktopInvoke<GeneratedPassword>("generate_password_value", { options });
}

export function inspectPasswordCandidate(password: string, excludeId?: string) {
  return desktopInvoke<PasswordCandidateInspection>("inspect_password_candidate", { password, excludeId });
}

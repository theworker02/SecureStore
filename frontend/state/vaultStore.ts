import { create } from "zustand";
import type {
  AuthStatus,
  ChangeAccountPasswordInput,
  GeneratedPassword,
  LoginInput,
  NoteInput,
  PasswordCandidateInspection,
  PasswordGeneratorOptions,
  PasswordInput,
  SignUpInput,
  VaultSettings,
  VaultSnapshot,
  VaultStatus,
} from "@/types";
import {
  changeAccountPassword,
  deleteAccount,
  generatePassword,
  getAuthStatus,
  getVaultStatus,
  initializeVault,
  inspectPasswordCandidate,
  lockVault,
  loginAccount,
  logoutAccount,
  signUpAccount,
  unlockVault,
} from "@/services/auth";
import {
  addFileEntry,
  deleteFile,
  deleteNote,
  deletePassword,
  exportBackup,
  getVaultSnapshot,
  importBackup,
  readFileEntry,
  revealPasswordSecret,
  updateVaultSettings,
  upsertNote,
  upsertPassword,
} from "@/services/storage";

type View = "dashboard" | "vault" | "settings" | "docs" | "account";

type VaultStore = {
  auth: AuthStatus | null;
  status: VaultStatus | null;
  snapshot: VaultSnapshot | null;
  loading: boolean;
  error: string | null;
  notice: string | null;
  activeView: View;
  bootstrap: () => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (input: ChangeAccountPasswordInput) => Promise<void>;
  removeAccount: (confirmation: string) => Promise<void>;
  createVault: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<void>;
  lock: () => Promise<void>;
  refresh: (query?: string) => Promise<void>;
  updateSettings: (input: VaultSettings) => Promise<void>;
  savePassword: (input: PasswordInput) => Promise<void>;
  removePassword: (id: string) => Promise<void>;
  revealPassword: (id: string) => Promise<string>;
  saveNote: (input: NoteInput) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  addFile: (file: File, options: { tags: string[]; favorite: boolean }) => Promise<void>;
  removeFile: (id: string) => Promise<void>;
  openFile: (id: string) => Promise<{ name: string; mime_type: string; bytes_base64: string; tags: string[]; favorite: boolean }>;
  exportVault: () => Promise<string>;
  importVault: (payload: string) => Promise<void>;
  generatePasswordValue: (options: PasswordGeneratorOptions) => Promise<GeneratedPassword>;
  inspectPasswordValue: (password: string, excludeId?: string) => Promise<PasswordCandidateInspection>;
  setActiveView: (view: View) => void;
  clearError: () => void;
  setNotice: (notice: string | null) => void;
};

async function fileToBase64(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const maybeMessage = "message" in error ? Reflect.get(error, "message") : null;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }

  return "An unexpected SecureStore error occurred.";
}

export const useVaultStore = create<VaultStore>((set, get) => ({
  auth: null,
  status: null,
  snapshot: null,
  loading: false,
  error: null,
  notice: null,
  activeView: "dashboard",
  bootstrap: async () => {
    set({ loading: true, error: null });
    try {
      const [auth, status] = await Promise.all([getAuthStatus(), getVaultStatus().catch(() => null)]);
      set({ auth, status });
      if (auth.authenticated && status?.unlocked) {
        const snapshot = await getVaultSnapshot("");
        set({ snapshot, status: snapshot.status, loading: false });
        return;
      }
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: errorMessage(error) });
    }
  },
  signUp: async (input) => {
    set({ loading: true, error: null });
    try {
      const auth = await signUpAccount(input);
      set({ auth, loading: false, notice: "Account created. Let’s secure your vault." });
    } catch (error) {
      set({ loading: false, error: errorMessage(error) });
    }
  },
  login: async (input) => {
    set({ loading: true, error: null });
    try {
      const auth = await loginAccount(input);
      const status = await getVaultStatus().catch(() => null);
      if (status?.unlocked) {
        const snapshot = await getVaultSnapshot("");
        set({ auth, status: snapshot.status, snapshot, loading: false });
        return;
      }
      set({ auth, status, loading: false, notice: "Signed in to SecureStore." });
    } catch (error) {
      set({ loading: false, error: errorMessage(error) });
    }
  },
  logout: async () => {
    const auth = await logoutAccount();
    set({ auth, snapshot: null, status: null, notice: "Signed out.", activeView: "dashboard" });
  },
  changePassword: async (input) => {
    const auth = await changeAccountPassword(input);
    set({ auth, notice: "Account password updated." });
  },
  removeAccount: async (confirmation) => {
    const auth = await deleteAccount(confirmation);
    set({ auth, snapshot: null, status: null, notice: "Account and vault deleted." });
  },
  createVault: async (password) => {
    set({ loading: true, error: null });
    try {
      const status = await initializeVault(password);
      const auth = await getAuthStatus();
      set({ auth, status, loading: false, notice: "Vault created. You can unlock it now." });
    } catch (error) {
      set({ loading: false, error: errorMessage(error) });
    }
  },
  unlock: async (password) => {
    set({ loading: true, error: null });
    try {
      await unlockVault(password);
      const [auth, snapshot] = await Promise.all([getAuthStatus(), getVaultSnapshot("")]);
      set({ auth, status: snapshot.status, snapshot, loading: false, notice: null });
    } catch (error) {
      const status = await getVaultStatus().catch(() => null);
      set({ loading: false, error: errorMessage(error), status });
    }
  },
  lock: async () => {
    try {
      const status = await lockVault();
      set({ status, snapshot: null, loading: false });
    } catch (error) {
      set({ loading: false, error: errorMessage(error) });
    }
  },
  refresh: async (query = "") => {
    try {
      const snapshot = await getVaultSnapshot(query);
      set({ snapshot, status: snapshot.status });
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },
  updateSettings: async (input) => {
    const snapshot = await updateVaultSettings(input);
    set({ snapshot, status: snapshot.status, notice: "Settings updated." });
  },
  savePassword: async (input) => {
    const snapshot = await upsertPassword(input);
    set({ snapshot, status: snapshot.status, notice: "Password entry saved." });
  },
  removePassword: async (id) => {
    const snapshot = await deletePassword(id);
    set({ snapshot, status: snapshot.status, notice: "Password entry removed." });
  },
  revealPassword: (id) => revealPasswordSecret(id),
  saveNote: async (input) => {
    const snapshot = await upsertNote(input);
    set({ snapshot, status: snapshot.status, notice: "Secure note saved." });
  },
  removeNote: async (id) => {
    const snapshot = await deleteNote(id);
    set({ snapshot, status: snapshot.status, notice: "Secure note removed." });
  },
  addFile: async (file, options) => {
    const bytes_base64 = await fileToBase64(file);
    const snapshot = await addFileEntry({
      name: file.name,
      mime_type: file.type || "application/octet-stream",
      bytes_base64,
      tags: options.tags,
      favorite: options.favorite,
    });
    set({ snapshot, status: snapshot.status, notice: "Encrypted file added." });
  },
  removeFile: async (id) => {
    const snapshot = await deleteFile(id);
    set({ snapshot, status: snapshot.status, notice: "Encrypted file removed." });
  },
  openFile: (id) => readFileEntry(id),
  exportVault: () => exportBackup(),
  importVault: async (payload) => {
    const status = await importBackup(payload);
    set({
      snapshot: null,
      status,
      notice: "Encrypted backup imported. Unlock the restored vault to continue.",
    });
  },
  generatePasswordValue: (options) => generatePassword(options),
  inspectPasswordValue: (password, excludeId) => inspectPasswordCandidate(password, excludeId),
  setActiveView: (activeView) => set({ activeView }),
  clearError: () => set({ error: null }),
  setNotice: (notice) => set({ notice }),
}));

export type VaultStatus = {
  initialized: boolean;
  unlocked: boolean;
  last_accessed_at: string | null;
  failed_attempts: number;
  lockout_until: string | null;
  session_expires_at: string | null;
};

export type OnboardingStage =
  | "sign_up"
  | "login"
  | "welcome"
  | "security"
  | "master_password"
  | "ready";

export type AuthStatus = {
  account_exists: boolean;
  authenticated: boolean;
  email: string | null;
  remember_session: boolean;
  onboarding_stage: OnboardingStage;
  vault_initialized: boolean;
  login_lockout_until: string | null;
  session_expires_at: string | null;
};

export type SignUpInput = {
  email: string;
  password: string;
  confirm_password: string;
};

export type LoginInput = {
  email: string;
  password: string;
  remember_session: boolean;
};

export type ChangeAccountPasswordInput = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

export type PasswordStrength = "weak" | "medium" | "strong";
export type PasswordSecurityStatus = "weak" | "reused" | "compromised" | "secure";

export type PasswordRecord = {
  id: string;
  site: string;
  username: string;
  notes: string;
  tags: string[];
  favorite: boolean;
  created_at: string;
  updated_at: string;
  strength: PasswordStrength;
  strength_score: number;
  strength_suggestions: string[];
  reuse_count: number;
  breached: boolean;
  breach_count: number;
  security_status: PasswordSecurityStatus;
};

export type NoteRecord = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type FileRecord = {
  id: string;
  name: string;
  mime_type: string;
  size: number;
  tags: string[];
  favorite: boolean;
  created_at: string;
};

export type VaultSettings = {
  clipboard_watcher_enabled: boolean;
  security_alerts_enabled: boolean;
  auto_lock_minutes: number;
};

export type ActivityLogEntry = {
  id: string;
  occurred_at: string;
  action: string;
  target_kind: string;
};

export type SecurityAlertRecord = {
  id: string;
  created_at: string;
  severity: string;
  category: string;
  message: string;
};

export type SecurityLogEntry = {
  id: string;
  occurred_at: string;
  event: string;
  outcome: string;
  detail: string;
};

export type SecurityInsights = {
  weak_passwords: number;
  reused_passwords: number;
  compromised_passwords: number;
  favorite_entries: number;
  last_vault_access: string | null;
  suggestions: string[];
  security_score: number;
  security_posture: string;
};

export type VaultSnapshot = {
  passwords: PasswordRecord[];
  notes: NoteRecord[];
  files: FileRecord[];
  settings: VaultSettings;
  activity_log: ActivityLogEntry[];
  security_alerts: SecurityAlertRecord[];
  security_log: SecurityLogEntry[];
  insights: SecurityInsights;
  status: VaultStatus;
};

export type PasswordInput = {
  id?: string;
  site: string;
  username: string;
  password: string;
  notes: string;
  tags: string[];
  favorite: boolean;
};

export type NoteInput = {
  id?: string;
  title: string;
  content: string;
  tags: string[];
  favorite: boolean;
};

export type FileInputPayload = {
  name: string;
  mime_type: string;
  bytes_base64: string;
  tags: string[];
  favorite: boolean;
};

export type DecryptedFile = {
  name: string;
  mime_type: string;
  bytes_base64: string;
  tags: string[];
  favorite: boolean;
};

export type PasswordGeneratorOptions = {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
};

export type PasswordAnalysis = {
  strength: PasswordStrength;
  score: number;
  suggestions: string[];
};

export type GeneratedPassword = {
  password: string;
  analysis: PasswordAnalysis;
};

export type PasswordCandidateInspection = {
  analysis: PasswordAnalysis;
  reuse_count: number;
  breached: boolean;
  breach_count: number;
  status: PasswordSecurityStatus;
  k_anonymity_prefix: string;
};

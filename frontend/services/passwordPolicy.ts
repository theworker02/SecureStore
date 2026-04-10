export const PASSWORD_RULE_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

export type PasswordChecklist = {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
};

export function getPasswordChecklist(password: string): PasswordChecklist {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };
}

export function isStrongAccountPassword(password: string) {
  const checklist = getPasswordChecklist(password);
  return Object.values(checklist).every(Boolean);
}

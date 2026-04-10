import type { PasswordAnalysis, PasswordStrength, VaultSettings } from "@/types";

export function lockoutMessage(lockoutUntil: string | null) {
  if (!lockoutUntil) {
    return null;
  }

  const unlocksAt = new Date(lockoutUntil).getTime();
  const seconds = Math.max(0, Math.ceil((unlocksAt - Date.now()) / 1000));
  return seconds > 0 ? `Vault temporarily locked for ${seconds}s after failed attempts.` : null;
}

export function strengthTone(strength: PasswordStrength) {
  if (strength === "strong") {
    return "text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
  }
  if (strength === "medium") {
    return "text-amber-200 border-amber-400/30 bg-amber-400/10";
  }
  return "text-rose-200 border-rose-500/30 bg-rose-500/10";
}

export function estimatePasswordStrength(password: string): PasswordAnalysis {
  let score = 0;
  const suggestions: string[] = [];
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  score += password.length >= 16 ? 80 : password.length >= 12 ? 60 : password.length >= 8 ? 35 : 10;
  if (hasUpper) score += 5;
  else suggestions.push("Add uppercase letters");
  if (hasLower) score += 5;
  else suggestions.push("Add lowercase letters");
  if (hasNumber) score += 5;
  else suggestions.push("Add numbers");
  if (hasSymbol) score += 10;
  else suggestions.push("Add symbols");
  if (password.length < 14) suggestions.push("Increase length");

  return {
    strength: score < 45 ? "weak" : score < 75 ? "medium" : "strong",
    score: Math.min(score, 100),
    suggestions,
  };
}

export function normalizeTags(raw: string) {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

export function formatTags(tags: string[]) {
  return tags.join(", ");
}

export async function copySensitiveValue(value: string, autoClearSeconds = 20) {
  await navigator.clipboard.writeText(value);

  window.setTimeout(async () => {
    try {
      const current = await navigator.clipboard.readText();
      if (current === value) {
        await navigator.clipboard.writeText("");
      }
    } catch {
      // Clipboard access can fail if the OS revokes access between calls.
    }
  }, autoClearSeconds * 1000);
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadFile(name: string, mimeType: string, bytesBase64: string) {
  const binary = atob(bytesBase64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function autoLockMs(settings: VaultSettings | null) {
  return (settings?.auto_lock_minutes ?? 5) * 60 * 1000;
}

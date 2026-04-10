export function lockoutMessage(lockoutUntil: string | null) {
  if (!lockoutUntil) {
    return null;
  }

  const unlocksAt = new Date(lockoutUntil).getTime();
  const seconds = Math.max(0, Math.ceil((unlocksAt - Date.now()) / 1000));
  return seconds > 0 ? `Vault temporarily locked for ${seconds}s after failed attempts.` : null;
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

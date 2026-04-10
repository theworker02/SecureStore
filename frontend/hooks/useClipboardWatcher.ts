import { useEffect, useRef } from "react";

type ClipboardWatcherOptions = {
  enabled: boolean;
  onDetected: (text: string) => void;
};

export function shouldOfferClipboardSave(enabled: boolean, nextText: string, previousText: string | null) {
  if (!enabled) {
    return false;
  }
  const normalized = nextText.trim();
  if (!normalized || normalized.length < 8) {
    return false;
  }
  return normalized !== previousText;
}

export function useClipboardWatcher({ enabled, onDetected }: ClipboardWatcherOptions) {
  const lastSeenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const interval = window.setInterval(async () => {
      if (!document.hasFocus()) {
        return;
      }

      try {
        const text = await navigator.clipboard.readText();
        if (shouldOfferClipboardSave(enabled, text, lastSeenRef.current)) {
          lastSeenRef.current = text.trim();
          onDetected(text.trim());
        }
      } catch {
        // Clipboard read access may be unavailable on some platforms or moments.
      }
    }, 4000);

    return () => window.clearInterval(interval);
  }, [enabled, onDetected]);
}

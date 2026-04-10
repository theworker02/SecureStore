import { useEffect } from "react";

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

export function useAutoLock(
  enabled: boolean,
  timeoutMs: number,
  onLock: () => Promise<void>,
  onLongUnlock?: () => void,
) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let lastActivity = Date.now();
    let warned = false;

    const maybeLock = () => {
      const elapsed = Date.now() - lastActivity;
      if (!warned && elapsed > timeoutMs * 0.75) {
        warned = true;
        onLongUnlock?.();
      }
      if (elapsed >= timeoutMs) {
        void onLock();
      }
    };

    const reset = () => {
      lastActivity = Date.now();
      warned = false;
    };

    const onBlur = () => {
      void onLock();
    };

    const onVisibility = () => {
      if (document.hidden) {
        void onLock();
      } else if (Date.now() - lastActivity > timeoutMs) {
        void onLock();
      }
    };

    const interval = window.setInterval(maybeLock, 5000);
    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, reset, { passive: true }));
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, reset));
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, onLock, onLongUnlock, timeoutMs]);
}

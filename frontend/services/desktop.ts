type TauriCore = {
  invoke?: <T>(command: string, args?: Record<string, unknown>) => Promise<T>;
};

declare global {
  interface Window {
    __TAURI__?: {
      core?: TauriCore;
    };
    __TAURI_INTERNALS__?: TauriCore;
  }
}

function getInvoke() {
  return window.__TAURI__?.core?.invoke ?? window.__TAURI_INTERNALS__?.invoke;
}

function extractErrorMessage(error: unknown) {
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

    const maybeError = "error" in error ? Reflect.get(error, "error") : null;
    if (typeof maybeError === "string" && maybeError.trim()) {
      return maybeError;
    }
  }

  return null;
}

export async function desktopInvoke<T>(command: string, args?: Record<string, unknown>) {
  const invoke = getInvoke();
  if (!invoke) {
    throw new Error("SecureStore desktop bridge is unavailable. Launch the app through Tauri.");
  }

  try {
    return await invoke<T>(command, args);
  } catch (error) {
    const message = extractErrorMessage(error);
    throw new Error(message ?? `SecureStore could not complete "${command}".`);
  }
}

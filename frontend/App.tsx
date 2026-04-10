import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "@/components/Logo";
import OnboardingFlow from "@/components/OnboardingFlow";
import { useAutoLock } from "@/hooks/useAutoLock";
import { useClipboardWatcher } from "@/hooks/useClipboardWatcher";
import { autoLockMs } from "@/services/vaultIntelligence";
import { useVaultStore } from "@/state/vaultStore";
import LockPage from "@/pages/Lock";
import DashboardPage from "@/pages/Dashboard";
import VaultPage from "@/pages/Vault";
import SettingsPage from "@/pages/Settings";
import SignUpPage from "@/pages/SignUp";
import LoginPage from "@/pages/Login";
import DocsPage from "@/pages/Docs";
import AccountPage from "@/pages/Account";

export default function App() {
  const { bootstrap, auth, status, snapshot, activeView, lock, setNotice, setActiveView, clearError, loading } = useVaultStore();
  const [authScreen, setAuthScreen] = useState<"signup" | "login">("signup");
  const [premiumMode, setPremiumMode] = useState(() => localStorage.getItem("securestore-plus-mode") === "true");

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (auth?.account_exists) {
      setAuthScreen("login");
    }
  }, [auth?.account_exists]);

  const unlocked = Boolean(status?.unlocked && snapshot);

  useAutoLock(
    unlocked,
    autoLockMs(snapshot?.settings ?? null),
    lock,
    snapshot?.settings.security_alerts_enabled
      ? () => setNotice("Vault has been unlocked for a while. It will auto-lock soon.")
      : undefined,
  );

  const handleClipboardDetection = useCallback(
    () => {
      const confirmed = window.confirm("SecureStore noticed copied text. Do you want to save this to the vault?");
      if (confirmed) {
        setActiveView("vault");
        setNotice("Clipboard content detected. Open a new password entry and paste it when you are ready.");
      }
    },
    [setActiveView, setNotice],
  );

  useClipboardWatcher({
    enabled: Boolean(unlocked && snapshot?.settings.clipboard_watcher_enabled),
    onDetected: handleClipboardDetection,
  });

  const resetAuthFlow = useCallback(() => {
    clearError();
    setPremiumMode(false);
    localStorage.removeItem("securestore-plus-mode");
    setAuthScreen(auth?.account_exists ? "login" : "signup");
  }, [auth?.account_exists, clearError]);

  const activatePremiumMode = useCallback(() => {
    setPremiumMode(true);
    localStorage.setItem("securestore-plus-mode", "true");
    setNotice("SecureStore+ preview mode is active.");
  }, [setNotice]);

  let content;
  if (!auth?.account_exists) {
    content = authScreen === "login"
      ? <LoginPage onSwitch={() => setAuthScreen("signup")} onStartOver={resetAuthFlow} />
      : <SignUpPage onSwitch={() => setAuthScreen("login")} onStartOver={resetAuthFlow} />;
  } else if (!auth.authenticated) {
    content = authScreen === "signup"
      ? <SignUpPage onSwitch={() => setAuthScreen("login")} onStartOver={resetAuthFlow} />
      : <LoginPage onSwitch={() => setAuthScreen("signup")} onStartOver={resetAuthFlow} />;
  } else if (!auth.vault_initialized) {
    content = <OnboardingFlow />;
  } else if (!unlocked) {
    content = <LockPage premiumMode={premiumMode} onUpgrade={activatePremiumMode} onStartOver={resetAuthFlow} />;
  } else {
    switch (activeView) {
      case "settings":
        content = <SettingsPage />;
        break;
      case "docs":
        content = <DocsPage />;
        break;
      case "account":
        content = <AccountPage />;
        break;
      case "vault":
        content = <VaultPage />;
        break;
      case "dashboard":
      default:
        content = <DashboardPage />;
        break;
    }
  }

  return (
    <div className="secure-grid min-h-screen text-slate-100">
      <div className="scanlines absolute inset-0 pointer-events-none" />
      <div className="particles absolute inset-0 pointer-events-none" />
      <AnimatePresence mode="wait">
        <motion.div
          key={`${auth?.onboarding_stage ?? "init"}-${activeView}-${unlocked}`}
          initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          exit={{ opacity: 0, filter: "blur(6px)", scale: 0.985 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative min-h-screen"
        >
          {(loading && !auth) ? (
            <div className="flex min-h-screen items-center justify-center">
              <div className="glass neon-panel rounded-[32px] px-8 py-10 text-center">
                <div className="neon-spinner mx-auto mb-5" />
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/60">Initializing</p>
                <div className="mt-3 flex justify-center">
                  <Logo compact premium={premiumMode} />
                </div>
              </div>
            </div>
          ) : (
            <div className={`relative flex min-h-screen px-6 py-8 ${unlocked ? "items-start justify-stretch" : "items-center justify-center"}`}>{content}</div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

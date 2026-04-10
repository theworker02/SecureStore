import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Cloud, Crown, KeyRound, LockKeyhole, ShieldEllipsis, Share2, Sparkles } from "lucide-react";
import AuthBackButton from "@/components/AuthBackButton";
import Logo from "@/components/Logo";
import type { VaultStatus } from "@/types";
import { lockoutMessage } from "@/services/vaultIntelligence";

type VaultLockScreenProps = {
  status: VaultStatus | null;
  loading: boolean;
  error: string | null;
  onCreate: (password: string) => Promise<void>;
  onUnlock: (password: string) => Promise<void>;
  onBack: () => void;
  premiumMode: boolean;
  onUpgrade: () => void;
};

export default function VaultLockScreen({
  status,
  loading,
  error,
  onCreate,
  onUnlock,
  onBack,
  premiumMode,
  onUpgrade,
}: VaultLockScreenProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const initialized = Boolean(status?.initialized);
  const delayMessage = useMemo(() => lockoutMessage(status?.lockout_until ?? null), [status?.lockout_until]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!initialized) {
      if (password.length < 12 || password !== confirmPassword) {
        return;
      }
      await onCreate(password);
      setPassword("");
      setConfirmPassword("");
      return;
    }

    await onUnlock(password);
    setPassword("");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass grid w-full max-w-5xl overflow-hidden rounded-[32px] transition duration-300 lg:grid-cols-[1.05fr_0.95fr] ${premiumMode ? "securestore-plus-panel" : ""}`}
    >
      <section className="relative flex min-h-[440px] items-center justify-center border-b border-border p-8 lg:border-b-0 lg:border-r lg:p-10">
        <div className={`absolute inset-0 ${premiumMode ? "bg-[radial-gradient(circle_at_top_left,rgba(255,207,87,0.18),transparent_30%),radial-gradient(circle_at_70%_20%,rgba(122,0,255,0.18),transparent_34%)]" : "bg-[radial-gradient(circle_at_top_left,rgba(94,234,212,0.14),transparent_32%)]"}`} />
        <div className="relative mx-auto w-full max-w-xl space-y-7 text-center">
          <div className="flex items-center justify-between gap-4 text-left">
            <Logo compact premium={premiumMode} />
            <div className="flex flex-wrap justify-end gap-2">
              <AuthBackButton onClick={onBack} />
              <button
                type="button"
                onClick={onUpgrade}
                className="securestore-plus-button inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium"
              >
                <Crown className="h-4 w-4" />
                {premiumMode ? "SecureStore+ Active" : "Upgrade to SecureStore+"}
              </button>
            </div>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.28em] ${premiumMode ? "border-amber-300/25 bg-amber-300/10 text-amber-200" : "border-accent/15 bg-accent/10 text-accent"}`}>
            <Sparkles className="h-3.5 w-3.5" />
            {premiumMode ? "Premium Mode Active" : "Quantum-grade local encryption"}
          </div>
          <div>
            <h2 className="max-w-lg text-4xl font-semibold leading-tight text-white">
              {initialized ? "Unlock your encrypted workspace" : "Create a master key for your first vault"}
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-300">
              Sensitive data never lands on disk in plaintext. The Rust backend verifies your password with bcrypt,
              derives the encryption key, and decrypts data only while the vault is actively unlocked.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["AES + ChaCha", "Layered authenticated encryption for vault data."],
              ["Offline first", "All vault state lives locally on your machine."],
              ["Session lock", "Inactivity and manual lock clear active access."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-3xl border border-border bg-midnight/70 p-4">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
              </div>
            ))}
          </div>
          {premiumMode && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3 text-left sm:grid-cols-3">
              {[
                [Share2, "Secure sharing", "Available in SecureStore+"],
                [Cloud, "Cloud sync", "Available in SecureStore+"],
                [LockKeyhole, "Advanced encryption tools", "Available in SecureStore+"],
              ].map(([Icon, title, label]) => (
                <div key={title as string} className="rounded-2xl border border-amber-300/18 bg-amber-300/8 p-4 shadow-[0_0_18px_rgba(255,207,87,0.08)]">
                  <Icon className="h-4 w-4 text-amber-200" />
                  <p className="mt-3 text-sm font-semibold text-white">{title as string}</p>
                  <p className="mt-1 text-xs text-amber-100/70">{label as string}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <section className="flex items-center p-8 lg:p-10">
        <form onSubmit={(event) => void handleSubmit(event)} className="mx-auto w-full max-w-md space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950">
              {initialized ? <KeyRound className="h-5 w-5 text-slate-100" /> : <ShieldEllipsis className="h-5 w-5 text-slate-100" />}
            </div>
            <div>
              <p className="text-sm text-slate-400">{initialized ? "Unlock" : "First-time setup"}</p>
              <p className="text-xl font-semibold text-white">
                {initialized ? "Enter master password" : "Create master password"}
              </p>
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Master password</span>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-border bg-midnight px-4 py-3 text-white outline-none transition focus:border-accent/60"
              placeholder="Enter a long, memorable passphrase"
            />
          </label>

          {!initialized && (
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Confirm password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-2xl border border-border bg-midnight px-4 py-3 text-white outline-none transition focus:border-accent/60"
                placeholder="Repeat your master password"
              />
            </label>
          )}

          {!initialized && password.length > 0 && password.length < 12 && (
            <p className="text-sm text-amber-300">Use at least 12 characters for the master password.</p>
          )}
          {!initialized && confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="text-sm text-rose-300">The two password entries must match.</p>
          )}

          {(error || delayMessage) && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="neon-error rounded-2xl p-4 text-sm text-rose-100">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  {error && <p>{error}</p>}
                  {delayMessage && <p>{delayMessage}</p>}
                </div>
              </div>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading || (!initialized && (password.length < 12 || password !== confirmPassword))}
            className="w-full rounded-2xl bg-accent px-4 py-3 font-medium text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {loading ? "Securing vault..." : initialized ? "Unlock Vault" : "Create Vault"}
          </button>
        </form>
      </section>
    </motion.div>
  );
}

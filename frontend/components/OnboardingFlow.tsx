import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, DatabaseZap, ShieldCheck, Sparkles } from "lucide-react";
import AuthBackButton from "@/components/AuthBackButton";
import Logo from "@/components/Logo";
import { useVaultStore } from "@/state/vaultStore";

const STEPS = ["welcome", "security", "master"] as const;

export default function OnboardingFlow() {
  const { createVault, loading, error, logout } = useVaultStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const step = STEPS[stepIndex];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass neon-panel w-full max-w-3xl rounded-[36px] p-10">
      <div className="flex items-center justify-between gap-4">
        <Logo compact />
        <AuthBackButton onClick={() => void logout()} />
      </div>
      <div className="mt-6 flex gap-3">
        {STEPS.map((_, index) => (
          <div key={index} className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? "bg-cyan-300 shadow-[0_0_18px_rgba(0,234,255,0.45)]" : "bg-white/10"}`} />
        ))}
      </div>

      {step === "welcome" && (
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-cyan-300/60">Welcome</p>
            <h2 className="mt-3 text-4xl font-semibold text-white">Meet SecureStore</h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              SecureStore gives you a private security workspace for passwords, notes, and files with a local-first desktop architecture.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="rounded-3xl border border-cyan-400/20 bg-white/5 p-5">
              <Sparkles className="h-5 w-5 text-cyan-300" />
              <p className="mt-3 text-white">Fully branded cyber-security experience</p>
            </div>
            <div className="rounded-3xl border border-teal-400/20 bg-white/5 p-5">
              <DatabaseZap className="h-5 w-5 text-teal-300" />
              <p className="mt-3 text-white">All sensitive data stored locally on your device</p>
            </div>
          </div>
        </section>
      )}

      {step === "security" && (
        <section className="mt-8 space-y-5">
          <p className="text-sm uppercase tracking-[0.32em] text-cyan-300/60">Protection Model</p>
          <h2 className="text-4xl font-semibold text-white">How your data stays protected</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["AES-256-GCM", "Vault contents and file blobs are encrypted before storage."],
              ["bcrypt + PBKDF2", "Account and master-password flows rely on hardened password handling."],
              ["Local-first", "Nothing is uploaded automatically or stored remotely."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-3xl border border-cyan-400/15 bg-white/5 p-5">
                <ShieldCheck className="h-5 w-5 text-cyan-300" />
                <p className="mt-3 font-medium text-white">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {step === "master" && (
        <section className="mt-8 space-y-5">
          <p className="text-sm uppercase tracking-[0.32em] text-cyan-300/60">Master Password</p>
          <h2 className="text-4xl font-semibold text-white">Create your vault key</h2>
          <p className="max-w-2xl text-base leading-8 text-slate-300">
            This master password encrypts your vault. Use a long passphrase that is unique to this device.
          </p>
          <div className="grid gap-4">
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Master password" className="neon-input w-full rounded-2xl px-4 py-3 text-white" />
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm master password" className="neon-input w-full rounded-2xl px-4 py-3 text-white" />
          </div>
          {error && <div className="neon-error rounded-2xl px-4 py-3 text-sm">{error}</div>}
        </section>
      )}

      <div className="mt-8 flex justify-end gap-3">
        {stepIndex > 0 && <button onClick={() => setStepIndex((value) => value - 1)} className="rounded-2xl border border-cyan-400/20 bg-white/5 px-5 py-3 text-white">Back</button>}
        {step !== "master" ? (
          <button onClick={() => setStepIndex((value) => value + 1)} className="neon-button inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-medium text-slate-950">
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={() => void createVault(password)} disabled={loading || password !== confirmPassword || password.length < 12} className="neon-button inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-medium text-slate-950 disabled:opacity-50">
            {loading ? "Securing vault..." : "Create vault"}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

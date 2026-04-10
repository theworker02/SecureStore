import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Circle, UserPlus } from "lucide-react";
import AuthBackButton from "@/components/AuthBackButton";
import Logo from "@/components/Logo";
import { getPasswordChecklist, isStrongAccountPassword, PASSWORD_RULE_MESSAGE } from "@/services/passwordPolicy";
import { useVaultStore } from "@/state/vaultStore";

type SignUpProps = {
  onSwitch: () => void;
  onStartOver: () => void;
};

export default function SignUpPage({ onSwitch, onStartOver }: SignUpProps) {
  const { signUp, loading, error } = useVaultStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const checklist = getPasswordChecklist(password);
  const passwordValid = isStrongAccountPassword(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = Boolean(email.trim()) && passwordValid && passwordsMatch && !loading;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass neon-panel w-full max-w-xl rounded-[32px] p-8">
      <div className="flex items-center justify-between gap-4">
        <Logo compact />
        <AuthBackButton onClick={onStartOver} />
      </div>
      <div className="mt-8 flex items-center gap-3">
        <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-cyan-300">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-slate-400">Create your SecureStore account</p>
          <h2 className="text-2xl font-semibold text-white">Start with your local identity</h2>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className="neon-input w-full rounded-2xl px-4 py-3 text-white" />
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Account password" className="neon-input w-full rounded-2xl px-4 py-3 text-white" />
        <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" className="neon-input w-full rounded-2xl px-4 py-3 text-white" />
      </div>
      <div className="mt-5 rounded-2xl border border-cyan-400/15 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">Password requirements</p>
        <div className="mt-3 grid gap-2 text-sm">
          {[
            { label: "Minimum 8 characters", met: checklist.minLength },
            { label: "Has uppercase letter", met: checklist.uppercase },
            { label: "Has lowercase letter", met: checklist.lowercase },
            { label: "Has number", met: checklist.number },
            { label: "Has special character", met: checklist.special },
          ].map(({ label, met }) => (
            <div key={label} className={`flex items-center gap-2 ${met ? "text-emerald-300" : "text-slate-400"}`}>
              {met ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
      {password.length > 0 && !passwordValid && <div className="neon-error mt-5 rounded-2xl px-4 py-3 text-sm">{PASSWORD_RULE_MESSAGE}</div>}
      {confirmPassword.length > 0 && !passwordsMatch && <div className="neon-error mt-3 rounded-2xl px-4 py-3 text-sm">Passwords do not match.</div>}
      {error && <div className="neon-error mt-5 rounded-2xl px-4 py-3 text-sm">{error}</div>}
      <button onClick={() => void signUp({ email, password, confirm_password: confirmPassword })} disabled={!canSubmit} className="neon-button mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none">
        <ArrowRight className="h-4 w-4" />
        {loading ? "Creating account..." : "Create account"}
      </button>
      <button onClick={onSwitch} className="mt-4 w-full text-sm text-slate-400 transition hover:text-cyan-200">
        Already have an account? Sign in
      </button>
    </motion.div>
  );
}

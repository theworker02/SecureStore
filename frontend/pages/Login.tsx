import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Crown, LogIn } from "lucide-react";
import AuthBackButton from "@/components/AuthBackButton";
import Logo from "@/components/Logo";
import PremiumFeaturesModal from "@/components/PremiumFeaturesModal";
import { useVaultStore } from "@/state/vaultStore";

type LoginProps = {
  onSwitch: () => void;
  onStartOver: () => void;
};

export default function LoginPage({ onSwitch, onStartOver }: LoginProps) {
  const { login, loading, error } = useVaultStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [premiumOpen, setPremiumOpen] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass neon-panel w-full max-w-xl rounded-[32px] p-8">
      <div className="flex items-center justify-between gap-4">
        <Logo compact />
        <AuthBackButton onClick={onStartOver} />
      </div>
      <div className="mt-8 flex items-center gap-3">
        <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-cyan-300">
          <LogIn className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-slate-400">Welcome back to SecureStore</p>
          <h2 className="text-2xl font-semibold text-white">Authenticate locally</h2>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className="neon-input w-full rounded-2xl px-4 py-3 text-white" />
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Account password" className="neon-input w-full rounded-2xl px-4 py-3 text-white" />
        <label className="flex items-center gap-3 rounded-2xl border border-cyan-400/15 bg-white/5 px-4 py-3 text-sm text-slate-200">
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
          Remember session on this device
        </label>
      </div>
      {error && <div className="neon-error mt-5 rounded-2xl px-4 py-3 text-sm">{error}</div>}
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
        <button onClick={() => void login({ email, password, remember_session: remember })} disabled={loading} className="neon-button inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-medium text-slate-950">
          <ArrowRight className="h-4 w-4" />
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <button
          type="button"
          onClick={() => setPremiumOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/18 bg-cyan-400/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-400/16 hover:text-white"
        >
          <Crown className="h-4 w-4" />
          Upgrade
        </button>
      </div>
      <button onClick={onSwitch} className="mt-4 w-full text-sm text-slate-400 transition hover:text-cyan-200">
        Need an account? Create one
      </button>
      <PremiumFeaturesModal open={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </motion.div>
  );
}

import { AnimatePresence, motion } from "framer-motion";
import { Cloud, Fingerprint, ShieldCheck, Sparkles, X, Zap } from "lucide-react";

type PremiumFeaturesModalProps = {
  open: boolean;
  onClose: () => void;
};

const FEATURES = [
  {
    icon: Fingerprint,
    title: "Biometric unlock",
    description: "Use Windows Hello or platform biometrics as a faster second-factor unlock path.",
  },
  {
    icon: Cloud,
    title: "Encrypted sync",
    description: "Keep multiple devices aligned with zero-knowledge encrypted vault replication.",
  },
  {
    icon: ShieldCheck,
    title: "Expanded breach intelligence",
    description: "Get larger compromised-password feeds and richer monitoring alerts across more sources.",
  },
  {
    icon: Zap,
    title: "Priority protection tools",
    description: "Advanced sharing, trusted-device controls, and premium recovery tooling for power users.",
  },
];

export default function PremiumFeaturesModal({ open, onClose }: PremiumFeaturesModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/82 p-6 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="glass neon-panel w-full max-w-3xl rounded-[32px] p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/65">SecureStore Premium</p>
                <h3 className="mt-2 text-3xl font-semibold text-white">Upgrade your security workspace</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  Premium expands SecureStore with convenience and intelligence layers while preserving end-to-end local
                  control over sensitive secrets.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-cyan-400/20 bg-white/5 p-2 text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-3xl border border-cyan-400/14 bg-white/5 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="mt-4 text-lg font-semibold text-white">{title}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 rounded-3xl border border-cyan-400/16 bg-cyan-400/8 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-400/12 p-3 text-cyan-200">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Premium preview</p>
                  <p className="text-sm text-slate-400">Explore the roadmap before committing to the full upgrade path.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="neon-button rounded-2xl px-5 py-3 text-sm font-medium text-slate-950"
              >
                Continue with SecureStore
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

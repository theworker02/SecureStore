import { Activity, FolderLock, LayoutGrid, LogOut, Settings, ShieldCheck, Sparkles } from "lucide-react";
import clsx from "clsx";

type SidebarProps = {
  activeView: "dashboard" | "settings";
  onNavigate: (view: "dashboard" | "settings") => void;
  onLock: () => void;
  statusText: string;
  securityScore: number;
};

export default function Sidebar({ activeView, onNavigate, onLock, statusText, securityScore }: SidebarProps) {
  return (
    <aside className="glass flex min-h-[calc(100vh-3rem)] w-full max-w-[300px] flex-col rounded-[28px] p-5">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 shadow-glow">
          <FolderLock className="h-6 w-6 text-accent" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Secure Vault</p>
          <p className="text-lg font-semibold text-white">Security Assistant</p>
        </div>
      </div>

      <div className="mb-4 rounded-3xl border border-border bg-midnight/70 p-4">
        <div className="mb-2 flex items-center gap-2 text-accent">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-sm font-medium">Vault status</span>
        </div>
        <p className="text-sm text-slate-300">{statusText}</p>
      </div>

      <div className="mb-6 rounded-3xl border border-signal/20 bg-signal/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-signal">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Security Score</span>
          </div>
          <span className="text-2xl font-semibold text-white">{securityScore}</span>
        </div>
        <div className="mt-4 h-2 rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-300" style={{ width: `${securityScore}%` }} />
        </div>
      </div>

      <nav className="space-y-2">
        {[
          { key: "dashboard" as const, label: "Dashboard", icon: LayoutGrid },
          { key: "settings" as const, label: "Settings", icon: Settings },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            className={clsx(
              "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition",
              activeView === key
                ? "border border-accent/20 bg-accent/10 text-white shadow-glow"
                : "border border-transparent bg-white/0 text-slate-400 hover:border-border hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-6 rounded-3xl border border-border bg-midnight/70 p-4">
        <div className="mb-2 flex items-center gap-2 text-slate-300">
          <Activity className="h-4 w-4" />
          <span className="text-sm font-medium">Behavior</span>
        </div>
        <p className="text-sm text-slate-400">
          Clipboard prompts require confirmation, favorites stay pinned, and search is always one shortcut away.
        </p>
      </div>

      <div className="mt-auto rounded-3xl border border-ember/20 bg-ember/5 p-4">
        <p className="text-sm text-slate-300">
          Locking clears the active session from memory and protects the vault when the desktop loses focus.
        </p>
        <button
          onClick={onLock}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm font-medium text-rose-100 transition hover:bg-ember/20"
        >
          <LogOut className="h-4 w-4" />
          Lock Vault
        </button>
      </div>
    </aside>
  );
}

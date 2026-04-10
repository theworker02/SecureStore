import clsx from "clsx";
import { BookOpenText, LayoutGrid, LockKeyhole, Settings, UserRound } from "lucide-react";
import Logo from "@/components/Logo";

type View = "dashboard" | "vault" | "settings" | "docs" | "account";

type TopNavProps = {
  activeView: View;
  onNavigate: (view: View) => void;
  email?: string | null;
};

export default function TopNav({ activeView, onNavigate, email }: TopNavProps) {
  const items: Array<{ key: View; label: string; icon: typeof LayoutGrid }> = [
    { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { key: "vault", label: "Vault", icon: LockKeyhole },
    { key: "settings", label: "Settings", icon: Settings },
    { key: "docs", label: "Docs", icon: BookOpenText },
    { key: "account", label: "Account", icon: UserRound },
  ];

  return (
    <header className="glass sticky top-0 z-40 mx-6 mt-6 flex items-center justify-between rounded-[28px] px-5 py-4 backdrop-blur-xl">
      <Logo compact />
      <nav className="hidden gap-2 lg:flex">
        {items.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            className={clsx(
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm transition",
              activeView === key
                ? "border border-cyan-400/40 bg-cyan-400/10 text-white shadow-[0_0_18px_rgba(0,234,255,0.2)]"
                : "border border-transparent bg-white/0 text-slate-400 hover:border-cyan-400/15 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
      <div className="rounded-2xl border border-cyan-400/15 bg-white/5 px-4 py-2 text-right">
        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Account</p>
        <p className="text-sm text-slate-200">{email ?? "Local device"}</p>
      </div>
    </header>
  );
}

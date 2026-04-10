import { ArrowLeft } from "lucide-react";

type AuthBackButtonProps = {
  label?: string;
  onClick: () => void;
};

export default function AuthBackButton({ label = "Start over", onClick }: AuthBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/18 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/35 hover:bg-white/10 hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}

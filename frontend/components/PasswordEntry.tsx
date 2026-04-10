import { useState } from "react";
import { Copy, Eye, EyeOff, Pencil, ShieldAlert, ShieldCheck, Star, Trash2 } from "lucide-react";
import type { PasswordRecord } from "@/types";
import { strengthTone } from "@/services/vaultIntelligence";

type PasswordEntryProps = {
  item: PasswordRecord;
  onReveal: (id: string) => Promise<string>;
  onCopy: (secret: string) => Promise<void>;
  onEdit: (item: PasswordRecord) => void;
  onDelete: (id: string) => Promise<void>;
};

export default function PasswordEntry({ item, onReveal, onCopy, onEdit, onDelete }: PasswordEntryProps) {
  const [visibleSecret, setVisibleSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleReveal() {
    if (visibleSecret) {
      setVisibleSecret(null);
      return;
    }
    setLoading(true);
    try {
      setVisibleSecret(await onReveal(item.id));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    const secret = visibleSecret ?? (await onReveal(item.id));
    await onCopy(secret);
    setVisibleSecret(secret);
  }

  return (
    <div className="rounded-3xl border border-border bg-panel/90 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-lg font-semibold text-white">{item.site}</p>
            {item.favorite && <Star className="h-4 w-4 fill-amber-300 text-amber-300" />}
          </div>
          <p className="mt-1 text-sm text-slate-400">{item.username}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void handleCopy()} className="rounded-xl border border-border bg-white/5 p-2 text-slate-300 transition hover:text-white">
            <Copy className="h-4 w-4" />
          </button>
          <button onClick={() => void handleReveal()} className="rounded-xl border border-border bg-white/5 p-2 text-slate-300 transition hover:text-white">
            {visibleSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button onClick={() => onEdit(item)} className="rounded-xl border border-border bg-white/5 p-2 text-slate-300 transition hover:text-white">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => void onDelete(item.id)} className="rounded-xl border border-ember/20 bg-ember/5 p-2 text-rose-200 transition hover:bg-ember/15">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${strengthTone(item.strength)}`}>
          {item.strength === "strong" ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
          {item.strength} strength
        </span>
        {item.reuse_count > 1 && (
          <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-200">
            Reused in {item.reuse_count} entries
          </span>
        )}
        {item.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-border bg-white/5 px-3 py-1 text-xs text-slate-300">
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
        <p className="font-mono text-sm tracking-[0.18em] text-accent">
          {loading ? "decrypting..." : visibleSecret ? visibleSecret : "••••••••••••••••"}
        </p>
      </div>
      {item.notes && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.notes}</p>}
      {item.strength_suggestions.length > 0 && item.strength !== "strong" && (
        <p className="mt-4 text-xs text-slate-400">Suggestions: {item.strength_suggestions.join(", ")}</p>
      )}
    </div>
  );
}

import { Pencil, Star, Trash2 } from "lucide-react";
import type { NoteRecord } from "@/types";

type NoteEntryProps = {
  item: NoteRecord;
  onEdit: (item: NoteRecord) => void;
  onDelete: (id: string) => Promise<void>;
};

export default function NoteEntry({ item, onEdit, onDelete }: NoteEntryProps) {
  return (
    <div className="rounded-3xl border border-border bg-panel/90 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-lg font-semibold text-white">{item.title}</p>
            {item.favorite && <Star className="h-4 w-4 fill-amber-300 text-amber-300" />}
          </div>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">Updated {new Date(item.updated_at).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(item)} className="rounded-xl border border-border bg-white/5 p-2 text-slate-300 transition hover:text-white">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => void onDelete(item.id)} className="rounded-xl border border-ember/20 bg-ember/5 p-2 text-rose-200 transition hover:bg-ember/15">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-border bg-white/5 px-3 py-1 text-xs text-slate-300">
            #{tag}
          </span>
        ))}
      </div>
      <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300" dangerouslySetInnerHTML={{ __html: item.content }} />
    </div>
  );
}

import { Download, Eye, Star, Trash2 } from "lucide-react";
import type { FileRecord } from "@/types";

type FileEntryProps = {
  item: FileRecord;
  onDownload: (id: string) => Promise<void>;
  onPreview: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export default function FileEntry({ item, onDownload, onPreview, onDelete }: FileEntryProps) {
  return (
    <div className="rounded-3xl border border-border bg-panel/90 p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-lg font-semibold text-white">{item.name}</p>
            {item.favorite && <Star className="h-4 w-4 fill-amber-300 text-amber-300" />}
          </div>
          <p className="text-sm text-slate-400">{item.mime_type} • {(item.size / 1024).toFixed(1)} KB</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void onPreview(item.id)} className="rounded-xl border border-border bg-white/5 p-2 text-slate-300 transition hover:text-white">
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={() => void onDownload(item.id)} className="rounded-xl border border-border bg-white/5 p-2 text-slate-300 transition hover:text-white">
            <Download className="h-4 w-4" />
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
    </div>
  );
}

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search, StickyNote, KeySquare, ShieldAlert, Star, UploadCloud, X } from "lucide-react";
import PasswordEntry from "@/components/PasswordEntry";
import NoteEntry from "@/components/NoteEntry";
import FileEntry from "@/components/FileEntry";
import SecurityInsightsPanel from "@/components/SecurityInsightsPanel";
import PasswordGeneratorPanel from "@/components/PasswordGeneratorPanel";
import { copySensitiveValue, downloadFile, estimatePasswordStrength, formatTags, normalizeTags, strengthTone } from "@/services/vaultIntelligence";
import { useVaultStore } from "@/state/vaultStore";
import type { DecryptedFile, GeneratedPassword, NoteRecord, PasswordCandidateInspection, PasswordRecord } from "@/types";

type DraftMode = "password" | "note" | null;
type VaultDashboardProps = {
  mode?: "dashboard" | "vault";
};

const EMPTY_PASSWORD = { site: "", username: "", password: "", notes: "", tagsText: "", favorite: false };
const EMPTY_NOTE = { title: "", content: "", tagsText: "", favorite: false };

export default function VaultDashboard({ mode = "vault" }: VaultDashboardProps) {
  const {
    snapshot,
    savePassword,
    removePassword,
    revealPassword,
    saveNote,
    removeNote,
    addFile,
    removeFile,
    openFile,
    generatePasswordValue,
    inspectPasswordValue,
    notice,
    setNotice,
  } = useVaultStore();
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [draftMode, setDraftMode] = useState<DraftMode>(null);
  const [editingPassword, setEditingPassword] = useState<PasswordRecord | null>(null);
  const [editingNote, setEditingNote] = useState<NoteRecord | null>(null);
  const [passwordDraft, setPasswordDraft] = useState(EMPTY_PASSWORD);
  const [noteDraft, setNoteDraft] = useState(EMPTY_NOTE);
  const [generated, setGenerated] = useState<GeneratedPassword | null>(null);
  const [previewFile, setPreviewFile] = useState<DecryptedFile | null>(null);
  const [passwordInspection, setPasswordInspection] = useState<PasswordCandidateInspection | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const allTags = useMemo(() => {
    if (!snapshot) return [];
    return Array.from(
      new Set(
        [...snapshot.passwords, ...snapshot.notes, ...snapshot.files].flatMap((item) => item.tags),
      ),
    ).sort();
  }, [snapshot]);

  const filtered = useMemo(() => {
    if (!snapshot) return null;
    const needle = query.trim().toLowerCase();
    const matchesTag = (tags: string[]) => tagFilter === "all" || tags.includes(tagFilter);
    return {
      ...snapshot,
      passwords: snapshot.passwords.filter(
        (item) =>
          matchesTag(item.tags) &&
          (!needle ||
            [item.site, item.username, item.notes, item.tags.join(" ")].some((value) =>
              value.toLowerCase().includes(needle),
            )),
      ),
      notes: snapshot.notes.filter(
        (item) =>
          matchesTag(item.tags) &&
          (!needle || [item.title, item.content, item.tags.join(" ")].some((value) => value.toLowerCase().includes(needle))),
      ),
      files: snapshot.files.filter(
        (item) => matchesTag(item.tags) && (!needle || [item.name, item.tags.join(" ")].some((value) => value.toLowerCase().includes(needle))),
      ),
    };
  }, [query, snapshot, tagFilter]);

  const draftStrength = useMemo(() => estimatePasswordStrength(passwordDraft.password), [passwordDraft.password]);

  useEffect(() => {
    if (!passwordDraft.password) {
      setPasswordInspection(null);
      return;
    }
    let cancelled = false;
    void inspectPasswordValue(passwordDraft.password, editingPassword?.id).then((inspection) => {
      if (!cancelled) {
        setPasswordInspection(inspection);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [inspectPasswordValue, passwordDraft.password, editingPassword?.id]);
  if (!filtered || !snapshot) return null;

  function startPasswordEdit(item?: PasswordRecord) {
    setDraftMode("password");
    setGenerated(null);
    if (item) {
      setEditingPassword(item);
      setPasswordDraft({
        site: item.site,
        username: item.username,
        password: "",
        notes: item.notes,
        tagsText: formatTags(item.tags),
        favorite: item.favorite,
      });
      return;
    }
    setEditingPassword(null);
    setPasswordDraft(EMPTY_PASSWORD);
  }

  function startNoteEdit(item?: NoteRecord) {
    setDraftMode("note");
    if (item) {
      setEditingNote(item);
      setNoteDraft({ title: item.title, content: item.content, tagsText: formatTags(item.tags), favorite: item.favorite });
      return;
    }
    setEditingNote(null);
    setNoteDraft(EMPTY_NOTE);
  }

  async function handlePasswordSave() {
    await savePassword({
      id: editingPassword?.id,
      site: passwordDraft.site,
      username: passwordDraft.username,
      password: passwordDraft.password,
      notes: passwordDraft.notes,
      tags: normalizeTags(passwordDraft.tagsText),
      favorite: passwordDraft.favorite,
    });
    setDraftMode(null);
    setEditingPassword(null);
    setPasswordDraft(EMPTY_PASSWORD);
  }

  async function handleNoteSave() {
    await saveNote({
      id: editingNote?.id,
      title: noteDraft.title,
      content: noteDraft.content,
      tags: normalizeTags(noteDraft.tagsText),
      favorite: noteDraft.favorite,
    });
    setDraftMode(null);
    setEditingNote(null);
    setNoteDraft(EMPTY_NOTE);
  }

  async function handleFileUpload(file: File, tagsText = "", favorite = false) {
    await addFile(file, { tags: normalizeTags(tagsText), favorite });
  }

  async function previewEncryptedFile(id: string) {
    const file = await openFile(id);
    setPreviewFile(file);
  }

  async function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  }

  const reusedEntries = snapshot.passwords.filter((item) => item.reuse_count > 1).length;

  return (
    <div className="space-y-8">
      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <motion.div layout className="glass rounded-[28px] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{mode === "dashboard" ? "Overview" : "Vault Workspace"}</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">
                {mode === "dashboard" ? "Adaptive protection for your private data" : "Direct access to encrypted records"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                {mode === "dashboard"
                  ? "Instant search, favorites, tags, smart warnings, and security insights all run locally with the vault unlocked in memory only."
                  : "Work directly with passwords, notes, and encrypted files while keeping the same search, generator, and preview tooling close at hand."}
              </p>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                ["Passwords", String(filtered.passwords.length)],
                ["Notes", String(filtered.notes.length)],
                ["Files", String(filtered.files.length)],
                ["Reused", String(reusedEntries)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border bg-midnight/70 px-4 py-3">
                  <p className="text-2xl font-semibold text-white">{value}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-2xl border border-border bg-midnight py-3 pl-11 pr-4 text-white outline-none transition focus:border-accent/60"
                placeholder="Instant search across passwords, notes, files, and tags (Ctrl + K)"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => startPasswordEdit()} className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-teal-300">
                New Password
              </button>
              <button onClick={() => startNoteEdit()} className="rounded-2xl border border-border bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10">
                New Note
              </button>
              <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} className="rounded-2xl border border-border bg-midnight px-4 py-3 text-sm text-white">
                <option value="all">All tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        <PasswordGeneratorPanel
          generated={generated}
          onGenerate={async (options) => setGenerated(await generatePasswordValue(options))}
          onUse={(password) => {
            setDraftMode("password");
            setPasswordDraft((draft) => ({ ...draft, password }));
          }}
        />
      </section>

      {snapshot.settings.security_alerts_enabled && ((passwordInspection?.analysis.strength ?? draftStrength.strength) === "weak" || (passwordInspection?.reuse_count ?? 0) > 0 || reusedEntries > 0) && (
        <section className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
          {(passwordInspection?.reuse_count ?? 0) > 0
            ? `You are reusing this password in ${passwordInspection?.reuse_count} ${passwordInspection?.reuse_count === 1 ? "entry" : "entries"}.`
            : (passwordInspection?.analysis.strength ?? draftStrength.strength) === "weak"
              ? `Current draft password is weak. Suggestions: ${(passwordInspection?.analysis.suggestions ?? draftStrength.suggestions).join(", ")}.`
              : `You currently have ${reusedEntries} entries using reused passwords.`}
        </section>
      )}

      {notice && <section className="rounded-2xl border border-accent/20 bg-accent/10 p-4 text-sm text-accent">{notice}</section>}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {mode === "dashboard" ? (
          <>
            <SecurityInsightsPanel insights={snapshot.insights} />
            <div className="glass rounded-[28px] p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Quick Actions</p>
              <div className="mt-5 grid gap-3">
                <button onClick={() => startPasswordEdit()} className="flex items-center gap-3 rounded-2xl border border-border bg-midnight/70 p-4 text-left text-white transition hover:border-accent/30">
                  <KeySquare className="h-5 w-5 text-accent" />
                  Add a new password entry
                </button>
                <button onClick={() => startNoteEdit()} className="flex items-center gap-3 rounded-2xl border border-border bg-midnight/70 p-4 text-left text-white transition hover:border-signal/30">
                  <StickyNote className="h-5 w-5 text-signal" />
                  Add an encrypted note
                </button>
                <label
                  onDrop={(event) => void handleDrop(event)}
                  onDragOver={(event) => event.preventDefault()}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border bg-midnight/70 p-4 text-left text-white transition hover:border-accent/30"
                >
                  <UploadCloud className="h-5 w-5 text-accent" />
                  Drag and drop or click to upload an encrypted file
                  <input type="file" className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => event.target.files?.[0] && void handleFileUpload(event.target.files[0])} />
                </label>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="glass rounded-[28px] p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Quick Actions</p>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <button onClick={() => startPasswordEdit()} className="flex items-center gap-3 rounded-2xl border border-border bg-midnight/70 p-4 text-left text-white transition hover:border-accent/30">
                  <KeySquare className="h-5 w-5 text-accent" />
                  Add password
                </button>
                <button onClick={() => startNoteEdit()} className="flex items-center gap-3 rounded-2xl border border-border bg-midnight/70 p-4 text-left text-white transition hover:border-signal/30">
                  <StickyNote className="h-5 w-5 text-signal" />
                  Add note
                </button>
                <label
                  onDrop={(event) => void handleDrop(event)}
                  onDragOver={(event) => event.preventDefault()}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border bg-midnight/70 p-4 text-left text-white transition hover:border-accent/30"
                >
                  <UploadCloud className="h-5 w-5 text-accent" />
                  Upload file
                  <input type="file" className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => event.target.files?.[0] && void handleFileUpload(event.target.files[0])} />
                </label>
              </div>
            </div>
            <SecurityInsightsPanel insights={snapshot.insights} />
          </>
        )}
      </div>

      {draftMode === "password" && (
        <section className="glass rounded-[28px] p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">{editingPassword ? "Edit password" : "New password"}</h3>
            <button onClick={() => setDraftMode(null)} className="rounded-full border border-border p-2 text-slate-300"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <input value={passwordDraft.site} onChange={(event) => setPasswordDraft((draft) => ({ ...draft, site: event.target.value }))} placeholder="Site or app name" className="rounded-2xl border border-border bg-midnight px-4 py-3 text-white" />
            <input value={passwordDraft.username} onChange={(event) => setPasswordDraft((draft) => ({ ...draft, username: event.target.value }))} placeholder="Username" className="rounded-2xl border border-border bg-midnight px-4 py-3 text-white" />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
            <input type="password" value={passwordDraft.password} onChange={(event) => setPasswordDraft((draft) => ({ ...draft, password: event.target.value }))} placeholder="Password" className="rounded-2xl border border-border bg-midnight px-4 py-3 text-white" />
            <button onClick={() => void generatePasswordValue({ length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true }).then(setGenerated)} className="rounded-2xl border border-border bg-white/5 px-4 py-3 text-sm font-medium text-white">Generate</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs ${strengthTone(passwordInspection?.analysis.strength ?? draftStrength.strength)}`}>{passwordInspection?.analysis.strength ?? draftStrength.strength} {passwordInspection?.analysis.score ?? draftStrength.score}/100</span>
            <label className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-slate-300">
              <input type="checkbox" checked={passwordDraft.favorite} onChange={(event) => setPasswordDraft((draft) => ({ ...draft, favorite: event.target.checked }))} />
              <Star className="h-3.5 w-3.5" />
              Favorite
            </label>
            {(passwordInspection?.reuse_count ?? 0) > 0 && <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-200">Reused in {passwordInspection?.reuse_count} entries</span>}
          </div>
          {(passwordInspection?.analysis.suggestions ?? draftStrength.suggestions).length > 0 && <p className="mt-3 text-sm text-slate-400">Suggestions: {(passwordInspection?.analysis.suggestions ?? draftStrength.suggestions).join(", ")}</p>}
          <textarea rows={4} value={passwordDraft.notes} onChange={(event) => setPasswordDraft((draft) => ({ ...draft, notes: event.target.value }))} placeholder="Notes" className="mt-4 w-full rounded-2xl border border-border bg-midnight px-4 py-3 text-white" />
          <input value={passwordDraft.tagsText} onChange={(event) => setPasswordDraft((draft) => ({ ...draft, tagsText: event.target.value }))} placeholder="Tags, comma separated" className="mt-4 w-full rounded-2xl border border-border bg-midnight px-4 py-3 text-white" />
          <div className="mt-4 flex gap-3">
            <button onClick={() => void handlePasswordSave()} className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-slate-950">Save Password</button>
            <button onClick={() => setDraftMode(null)} className="rounded-2xl border border-border bg-white/5 px-4 py-3 text-sm font-medium text-white">Cancel</button>
          </div>
        </section>
      )}

      {draftMode === "note" && (
        <section className="glass rounded-[28px] p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">{editingNote ? "Edit note" : "New secure note"}</h3>
            <button onClick={() => setDraftMode(null)} className="rounded-full border border-border p-2 text-slate-300"><X className="h-4 w-4" /></button>
          </div>
          <input value={noteDraft.title} onChange={(event) => setNoteDraft((draft) => ({ ...draft, title: event.target.value }))} placeholder="Note title" className="mt-4 w-full rounded-2xl border border-border bg-midnight px-4 py-3 text-white" />
          <textarea rows={8} value={noteDraft.content} onChange={(event) => setNoteDraft((draft) => ({ ...draft, content: event.target.value }))} placeholder="Encrypted note content" className="mt-4 w-full rounded-2xl border border-border bg-midnight px-4 py-3 text-white" />
          <input value={noteDraft.tagsText} onChange={(event) => setNoteDraft((draft) => ({ ...draft, tagsText: event.target.value }))} placeholder="Tags, comma separated" className="mt-4 w-full rounded-2xl border border-border bg-midnight px-4 py-3 text-white" />
          <label className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-slate-300">
            <input type="checkbox" checked={noteDraft.favorite} onChange={(event) => setNoteDraft((draft) => ({ ...draft, favorite: event.target.checked }))} />
            Favorite
          </label>
          <div className="mt-4 flex gap-3">
            <button onClick={() => void handleNoteSave()} className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-slate-950">Save Note</button>
            <button onClick={() => setDraftMode(null)} className="rounded-2xl border border-border bg-white/5 px-4 py-3 text-sm font-medium text-white">Cancel</button>
          </div>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Passwords</h3>
            <span className="text-sm text-slate-500">{filtered.passwords.length}</span>
          </div>
          {filtered.passwords.map((item) => (
            <PasswordEntry key={item.id} item={item} onReveal={revealPassword} onCopy={(secret) => copySensitiveValue(secret, 20)} onEdit={startPasswordEdit} onDelete={removePassword} />
          ))}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Secure Notes</h3>
            <span className="text-sm text-slate-500">{filtered.notes.length}</span>
          </div>
          {filtered.notes.map((item) => (
            <NoteEntry key={item.id} item={item} onEdit={startNoteEdit} onDelete={removeNote} />
          ))}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">File Vault</h3>
            <span className="text-sm text-slate-500">{filtered.files.length}</span>
          </div>
          {filtered.files.map((item) => (
            <FileEntry
              key={item.id}
              item={item}
              onDelete={removeFile}
              onPreview={previewEncryptedFile}
              onDownload={async (id) => {
                const file = await openFile(id);
                downloadFile(file.name, file.mime_type, file.bytes_base64);
              }}
            />
          ))}
        </div>
      </section>

      <section className="glass rounded-[28px] p-6">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-signal" />
          <h3 className="text-xl font-semibold text-white">Activity Log</h3>
        </div>
        <div className="mt-4 grid gap-3">
          {snapshot.activity_log.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-border bg-white/5 px-4 py-3 text-sm">
              <span className="text-slate-200">{entry.action.replaceAll("_", " ")}</span>
              <span className="text-slate-500">{new Date(entry.occurred_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>

      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6">
          <div className="glass max-h-[80vh] w-full max-w-3xl overflow-auto rounded-[28px] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">{previewFile.name}</h3>
              <button onClick={() => setPreviewFile(null)} className="rounded-full border border-border p-2 text-slate-300"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4">
              {previewFile.mime_type.startsWith("image/") ? (
                <img src={`data:${previewFile.mime_type};base64,${previewFile.bytes_base64}`} alt={previewFile.name} className="max-h-[60vh] rounded-2xl" />
              ) : previewFile.mime_type.startsWith("text/") || previewFile.mime_type.includes("json") ? (
                <pre className="overflow-auto rounded-2xl border border-border bg-midnight p-4 text-sm text-slate-200 whitespace-pre-wrap">{atob(previewFile.bytes_base64)}</pre>
              ) : (
                <p className="text-slate-300">Preview is unavailable for this file type. Use download to access it securely.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

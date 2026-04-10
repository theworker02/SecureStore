import { ChangeEvent, useState } from "react";
import { Download, Upload } from "lucide-react";
import TopNav from "@/components/TopNav";
import { downloadText } from "@/services/vaultIntelligence";
import { useVaultStore } from "@/state/vaultStore";

export default function SettingsPage() {
  const { activeView, setActiveView, auth, exportVault, importVault, snapshot, updateSettings, notice } = useVaultStore();
  const [message, setMessage] = useState<string | null>(null);

  async function handleExport() {
    const payload = await exportVault();
    downloadText(`securestore-backup-${Date.now()}.json`, payload);
    setMessage("Encrypted backup exported.");
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const payload = await file.text();
    await importVault(payload);
    setMessage("Encrypted backup imported. Re-enter the master password to unlock the restored vault.");
    event.target.value = "";
  }

  const settings = snapshot?.settings;

  return (
    <>
      <TopNav activeView={activeView} onNavigate={setActiveView} email={auth?.email} />
      <main className="mx-6 mb-6 mt-6 space-y-6">
        <section className="glass neon-panel rounded-[28px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/60">Settings</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Automation and security controls</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Tune how aggressively SecureStore locks, whether clipboard monitoring is active, and how security alerts are surfaced.
          </p>
        </section>

        {settings && (
          <section className="grid gap-6 xl:grid-cols-2">
            <div className="glass neon-panel rounded-[28px] p-6">
              <h3 className="text-xl font-semibold text-white">Assistant preferences</h3>
              <div className="mt-5 space-y-4">
                <label className="flex items-center justify-between rounded-2xl border border-cyan-400/15 bg-white/5 px-4 py-3">
                  <span className="text-sm text-slate-200">Clipboard watcher</span>
                  <input type="checkbox" checked={settings.clipboard_watcher_enabled} onChange={(event) => void updateSettings({ ...settings, clipboard_watcher_enabled: event.target.checked })} />
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-cyan-400/15 bg-white/5 px-4 py-3">
                  <span className="text-sm text-slate-200">Security alerts</span>
                  <input type="checkbox" checked={settings.security_alerts_enabled} onChange={(event) => void updateSettings({ ...settings, security_alerts_enabled: event.target.checked })} />
                </label>
                <label className="block rounded-2xl border border-cyan-400/15 bg-white/5 px-4 py-3">
                  <span className="text-sm text-slate-200">Auto-lock timeout</span>
                  <select value={settings.auto_lock_minutes} onChange={(event) => void updateSettings({ ...settings, auto_lock_minutes: Number(event.target.value) })} className="neon-input mt-3 w-full rounded-2xl px-4 py-3 text-white">
                    <option value={1}>1 minute</option>
                    <option value={5}>5 minutes</option>
                    <option value={15}>15 minutes</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="glass neon-panel rounded-[28px] p-6">
              <h3 className="text-xl font-semibold text-white">Backups</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">Exported backups remain encrypted. Import replaces the current on-disk vault only after validation.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={() => void handleExport()} className="neon-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 font-medium text-slate-950">
                  <Download className="h-4 w-4" />
                  Export encrypted backup
                </button>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-cyan-400/15 bg-white/5 px-4 py-3 text-sm font-medium text-white">
                  <Upload className="h-4 w-4" />
                  Import backup
                  <input type="file" accept="application/json" className="hidden" onChange={(event) => void handleImport(event)} />
                </label>
              </div>
            </div>
          </section>
        )}

        {(message || notice) && <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">{message ?? notice}</section>}
      </main>
    </>
  );
}

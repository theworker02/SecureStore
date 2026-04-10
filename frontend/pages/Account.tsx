import { useState } from "react";
import TopNav from "@/components/TopNav";
import { useVaultStore } from "@/state/vaultStore";

export default function AccountPage() {
  const { activeView, setActiveView, auth, changePassword, logout, removeAccount, error, notice } = useVaultStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  return (
    <>
      <TopNav activeView={activeView} onNavigate={setActiveView} email={auth?.email} />
      <main className="mx-6 mb-6 mt-6 grid gap-6 xl:grid-cols-2">
        <section className="glass neon-panel rounded-[28px] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/60">Account</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Profile & credentials</h2>
          <p className="mt-4 text-sm text-slate-300">Signed in as {auth?.email ?? "Unknown account"}</p>
          <div className="mt-6 space-y-4">
            <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Current password" className="neon-input w-full rounded-2xl px-4 py-3 text-white" />
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" className="neon-input w-full rounded-2xl px-4 py-3 text-white" />
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" className="neon-input w-full rounded-2xl px-4 py-3 text-white" />
          </div>
          <button onClick={() => void changePassword({ current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword })} className="neon-button mt-5 rounded-2xl px-5 py-3 font-medium text-slate-950">
            Change password
          </button>
          <button onClick={() => void logout()} className="mt-4 block rounded-2xl border border-cyan-400/20 bg-white/5 px-5 py-3 text-white">
            Log out
          </button>
        </section>

        <section className="glass neon-panel rounded-[28px] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-rose-300/60">Danger Zone</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Delete local account</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            This removes the SecureStore account and local vault data from this device. Type <span className="font-semibold text-white">DELETE</span> to confirm.
          </p>
          <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Type DELETE to confirm" className="neon-input mt-5 w-full rounded-2xl px-4 py-3 text-white" />
          <button onClick={() => void removeAccount(confirmation)} className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-rose-100">
            Delete account
          </button>
          {(error || notice) && <div className="neon-error mt-5 rounded-2xl px-4 py-3 text-sm">{error ?? notice}</div>}
        </section>
      </main>
    </>
  );
}

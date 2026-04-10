import TopNav from "@/components/TopNav";
import { useVaultStore } from "@/state/vaultStore";

export default function DocsPage() {
  const { activeView, setActiveView, auth } = useVaultStore();

  const sections = [
    {
      title: "What is SecureStore",
      body: "SecureStore is a local-first desktop vault for passwords, secure notes, and encrypted file storage with an account layer, onboarding, and intelligent security insights.",
    },
    {
      title: "How encryption works",
      body: "Account passwords are hashed with bcrypt. Your vault master password is verified separately and used to derive the encryption key for AES-256-GCM protected vault data and file blobs.",
    },
    {
      title: "How your data is protected",
      body: "Secrets remain encrypted at rest, the unlocked vault exists only in memory, clipboard prompts require confirmation, and activity logs avoid writing sensitive secret values.",
    },
    {
      title: "How to use the vault",
      body: "Create an account, complete onboarding, set a master password, unlock the vault, then store passwords, notes, files, tags, and favorites from the main workspace.",
    },
    {
      title: "FAQ",
      body: "SecureStore is offline-first by default, supports encrypted backup export/import, and auto-locks on inactivity or desktop focus loss according to your settings.",
    },
  ];

  return (
    <>
      <TopNav activeView={activeView} onNavigate={setActiveView} email={auth?.email} />
      <main className="mx-6 mb-6 mt-6 grid gap-6">
        {sections.map((section) => (
          <section key={section.title} className="glass neon-panel rounded-[28px] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/60">Docs</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{section.title}</h2>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300">{section.body}</p>
          </section>
        ))}
      </main>
    </>
  );
}

import TopNav from "@/components/TopNav";
import VaultDashboard from "@/components/VaultDashboard";
import { useVaultStore } from "@/state/vaultStore";

export default function VaultPage() {
  const { auth, activeView, setActiveView } = useVaultStore();

  return (
    <>
      <TopNav activeView={activeView} onNavigate={setActiveView} email={auth?.email} />
      <main className="mx-6 mb-6 mt-6">
        <VaultDashboard mode="vault" />
      </main>
    </>
  );
}

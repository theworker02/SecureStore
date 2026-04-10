import VaultLockScreen from "@/components/VaultLockScreen";
import { useVaultStore } from "@/state/vaultStore";

type LockPageProps = {
  premiumMode: boolean;
  onUpgrade: () => void;
  onStartOver: () => void;
};

export default function LockPage({ premiumMode, onUpgrade, onStartOver }: LockPageProps) {
  const { status, loading, error, createVault, unlock, logout } = useVaultStore();
  return (
    <VaultLockScreen
      status={status}
      loading={loading}
      error={error}
      onCreate={createVault}
      onUnlock={unlock}
      onBack={() => {
        onStartOver();
        void logout();
      }}
      premiumMode={premiumMode}
      onUpgrade={onUpgrade}
    />
  );
}

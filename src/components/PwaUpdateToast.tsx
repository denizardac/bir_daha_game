import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { dismissUpdatePrompt, isUpdatePromptDismissed } from '@/pwa/updatePrompt';

interface PendingUpdate {
  apply: () => Promise<void>;
  version?: string;
}

type UpdateReadyEvent = CustomEvent<PendingUpdate>;

export function PwaUpdateToast() {
  const [pendingUpdate, setPendingUpdate] = useState<PendingUpdate | null>(null);
  const [applying, setApplying] = useState(false);
  const screen = useGameStore((state) => state.screen);
  const phase = useGameStore((state) => state.phase);
  const lineupEditorOpen = useGameStore((state) => state.lineupEditorOpen);
  const safeToReload = screen !== 'game' || (phase === 'cardSelect' && !lineupEditorOpen);

  useEffect(() => {
    const onReady = (event: Event) => {
      const detail = (event as UpdateReadyEvent).detail;
      if (isUpdatePromptDismissed(detail.version)) return;
      setPendingUpdate(detail);
    };
    window.addEventListener('bir-daha-update-ready', onReady);
    return () => window.removeEventListener('bir-daha-update-ready', onReady);
  }, []);

  if (!pendingUpdate) return null;

  const handleDismiss = () => {
    dismissUpdatePrompt(pendingUpdate.version);
    setPendingUpdate(null);
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await pendingUpdate.apply();
    } catch {
      setApplying(false);
    }
  };

  return (
    <aside className="pwa-update-toast" role="status" aria-live="polite">
      <div>
        <strong>Yeni sürüm hazır</strong>
        <p>{safeToReload ? 'İlerlemen kaydedildi; güvenle yenileyebilirsin.' : 'Maç veya karar tamamlanınca yenileyebilirsin.'}</p>
      </div>
      <div className="pwa-update-actions">
        <button type="button" className="pwa-update-later" onClick={handleDismiss}>Sonra</button>
        <button type="button" className="btn-primary" disabled={!safeToReload || applying} onClick={() => void handleApply()}>
          {applying ? 'Yenileniyor…' : 'Şimdi yenile'}
        </button>
      </div>
    </aside>
  );
}

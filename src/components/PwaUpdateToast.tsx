import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  clearPendingServiceWorkerUpdate,
  dismissUpdatePrompt,
  getPendingServiceWorkerUpdate,
  isUpdatePromptDismissed,
  UPDATE_READY_EVENT,
  type PendingServiceWorkerUpdate,
} from '@/pwa/updatePrompt';

type UpdateReadyEvent = CustomEvent<PendingServiceWorkerUpdate>;

export function PwaUpdateToast() {
  const [pendingUpdate, setPendingUpdate] = useState<PendingServiceWorkerUpdate | null>(() => {
    const pending = getPendingServiceWorkerUpdate();
    return pending && !isUpdatePromptDismissed(pending.version) ? pending : null;
  });
  const [applying, setApplying] = useState(false);
  const screen = useGameStore((state) => state.screen);
  const phase = useGameStore((state) => state.phase);
  const lineupEditorOpen = useGameStore((state) => state.lineupEditorOpen);
  const safeToReload = screen !== 'game' || (phase === 'cardSelect' && !lineupEditorOpen);

  useEffect(() => {
    const onReady = (event: Event) => {
      const detail = (event as UpdateReadyEvent).detail;
      if (isUpdatePromptDismissed(detail.version)) {
        clearPendingServiceWorkerUpdate();
        return;
      }
      setPendingUpdate(detail);
    };
    window.addEventListener(UPDATE_READY_EVENT, onReady);
    return () => window.removeEventListener(UPDATE_READY_EVENT, onReady);
  }, []);

  if (!pendingUpdate) return null;

  const handleDismiss = () => {
    dismissUpdatePrompt(pendingUpdate.version);
    clearPendingServiceWorkerUpdate();
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

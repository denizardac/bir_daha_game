import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';

type UpdateReadyEvent = CustomEvent<{ apply: () => Promise<void> }>;

export function PwaUpdateToast() {
  const [applyUpdate, setApplyUpdate] = useState<null | (() => Promise<void>)>(null);
  const screen = useGameStore((state) => state.screen);
  const phase = useGameStore((state) => state.phase);
  const lineupEditorOpen = useGameStore((state) => state.lineupEditorOpen);
  const safeToReload = screen !== 'game' || (phase === 'cardSelect' && !lineupEditorOpen);

  useEffect(() => {
    const onReady = (event: Event) => {
      const detail = (event as UpdateReadyEvent).detail;
      setApplyUpdate(() => detail.apply);
    };
    window.addEventListener('bir-daha-update-ready', onReady);
    return () => window.removeEventListener('bir-daha-update-ready', onReady);
  }, []);

  if (!applyUpdate) return null;
  return (
    <aside className="pwa-update-toast" role="status" aria-live="polite">
      <div>
        <strong>Yeni sürüm hazır</strong>
        <p>{safeToReload ? 'İlerlemen kaydedildi; güvenle yenileyebilirsin.' : 'Maç veya karar tamamlanınca yenileyebilirsin.'}</p>
      </div>
      <button type="button" className="btn-primary" disabled={!safeToReload} onClick={() => void applyUpdate()}>
        Şimdi yenile
      </button>
    </aside>
  );
}

import { useState } from 'react';
import { savePartial, loadPersisted } from '@/utils/storage';
import { useGameStore } from '@/store/gameStore';
import { createDebugCode } from '@/engine/debugCode';
import { copyText } from '@/utils/clipboard';
import { UiIcon } from '@/components/UiIcon';

export function SettingsScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const stats = loadPersisted();
  const [sound, setSound] = useState(stats.soundEnabled);
  const [debugCopied, setDebugCopied] = useState(false);

  const save = () => {
    savePartial({ soundEnabled: sound });
    setScreen('menu');
  };

  const copyDebugCode = async () => {
    const run = loadPersisted().currentRun;
    if (!run?.seed || !run.squad || !run.round) return;
    const copied = await copyText(createDebugCode({
      seed: run.seed,
      round: run.round,
      phase: run.phase,
      squad: run.squad,
      activeTactics: run.activeTactics,
      manualLineup: run.manualLineup,
    }));
    if (copied) {
      setDebugCopied(true);
      window.setTimeout(() => setDebugCopied(false), 1800);
    }
  };

  return (
    <div className="game-shell page-screen">
      <div className="page-screen-inner page-screen-inner--narrow">
        <button type="button" className="btn-secondary page-screen-back" onClick={() => setScreen('menu')}>
          ← Ana Menü
        </button>

        <header className="page-screen-header">
          <span className="page-screen-eyebrow">Oyun merkezi</span>
          <h1>Ayarlar</h1>
          <p>Maç günü deneyimini kendine göre düzenle.</p>
        </header>

        <div className="panel settings-panel">
          <div className="settings-section-head">
            <span className="settings-section-icon" aria-hidden><UiIcon name="zap" /></span>
            <div>
              <span>Ses</span>
              <strong>Maç atmosferi</strong>
              <p>Gol, kart seçimi ve sonuç anlarındaki sesleri yönet.</p>
            </div>
          </div>

          <label className="settings-toggle-row">
            <span className="settings-toggle-copy">
              <strong>Ses efektleri</strong>
              <small>{sound ? 'Saha ve menü sesleri açık' : 'Tüm oyun sesleri kapalı'}</small>
            </span>
            <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
            <span className="settings-toggle-track" aria-hidden><span /></span>
          </label>

          {stats.currentRun?.seed && (
            <div className="settings-diagnostic">
              <span className="settings-diagnostic-icon" aria-hidden><UiIcon name="clipboard" /></span>
              <div className="settings-diagnostic-copy">
                <strong>Sorun bildirme kodu</strong>
                <p>Bir hata yaşarsan bu kodu bize gönder. Kişisel bilgi ve skor içermez.</p>
              </div>
              <button type="button" className="btn-secondary" onClick={() => void copyDebugCode()}>
                {debugCopied ? 'Kopyalandı' : 'Kodu kopyala'}
              </button>
            </div>
          )}

          <div className="settings-panel-foot">
            <span>Tercihler bu cihazda saklanır.</span>
            <button type="button" className="btn-primary settings-save" onClick={save}>
              <UiIcon name="check" />
              Değişiklikleri kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

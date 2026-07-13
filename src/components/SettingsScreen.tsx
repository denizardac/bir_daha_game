import { useState } from 'react';
import { savePartial, loadPersisted } from '@/utils/storage';
import { useGameStore } from '@/store/gameStore';
import { createDebugCode } from '@/engine/debugCode';
import { copyText } from '@/utils/clipboard';

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
          <h1>Ayarlar</h1>
          <p>Oyun tercihlerini buradan yönet.</p>
        </header>

        <div className="panel settings-panel space-y-4">
          <label>
            <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
            <span>Ses efektleri</span>
          </label>
          {stats.currentRun?.seed && (
            <div className="settings-diagnostic">
              <div>
                <strong>Sorun bildirme kodu</strong>
                <p>Bir hata yaşarsan bu kodu bize gönder. Kişisel bilgi ve skor içermez.</p>
              </div>
              <button type="button" className="btn-secondary" onClick={() => void copyDebugCode()}>
                {debugCopied ? 'Kopyalandı' : 'Kodu kopyala'}
              </button>
            </div>
          )}
          <button type="button" className="btn-primary w-full" onClick={save}>Kaydet</button>
        </div>
      </div>
    </div>
  );
}

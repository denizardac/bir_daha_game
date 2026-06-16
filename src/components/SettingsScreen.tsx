import { useState } from 'react';
import { savePartial, loadPersisted } from '@/utils/storage';
import { useGameStore } from '@/store/gameStore';

export function SettingsScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const stats = loadPersisted();
  const [sound, setSound] = useState(stats.soundEnabled);

  const save = () => {
    savePartial({ soundEnabled: sound });
    setScreen('menu');
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
          <button type="button" className="btn-primary w-full" onClick={save}>Kaydet</button>
        </div>
      </div>
    </div>
  );
}

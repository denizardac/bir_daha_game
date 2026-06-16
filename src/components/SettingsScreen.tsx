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
    <div className="game-shell min-h-screen p-6">
      <div className="mx-auto max-w-md">
        <button type="button" className="btn-secondary mb-6" onClick={() => setScreen('menu')}>← Ana Menü</button>
        <h1 className="mb-6 text-4xl font-extrabold uppercase">Ayarlar</h1>
        <div className="panel space-y-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
            <span>Ses efektleri</span>
          </label>
          <button type="button" className="btn-primary w-full" onClick={save}>Kaydet</button>
        </div>
      </div>
    </div>
  );
}

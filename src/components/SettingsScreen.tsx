import { useState } from 'react';
import { CARD_TIMER_SECONDS } from '@/constants/game';
import { savePartial, loadPersisted } from '@/utils/storage';
import { useGameStore } from '@/store/gameStore';

export function SettingsScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const stats = loadPersisted();
  const [sound, setSound] = useState(stats.soundEnabled);
  const [music, setMusic] = useState(stats.musicEnabled);
  const [cardTimer, setCardTimer] = useState(stats.cardTimerEnabled ?? false);

  const save = () => {
    savePartial({ soundEnabled: sound, musicEnabled: music, cardTimerEnabled: cardTimer });
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
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={music} onChange={(e) => setMusic(e.target.checked)} />
            <span>Menü müziği (yakında)</span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={cardTimer} onChange={(e) => setCardTimer(e.target.checked)} className="mt-1" />
            <span>
              Kart zamanlayıcısı ({CARD_TIMER_SECONDS} sn)
              <span className="mt-1 block text-xs text-neutral-500">
                Açıkken süre dolunca otomatik kart seçilir. Kalan her saniye +5 puan (GDD).
              </span>
            </span>
          </label>
          <button type="button" className="btn-primary w-full" onClick={save}>Kaydet</button>
        </div>
      </div>
    </div>
  );
}

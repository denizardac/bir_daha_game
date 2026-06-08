import { SYNERGIES, TOTAL_SYNERGIES } from '@/data/synergies';
import { getPersistedStats, useGameStore } from '@/store/gameStore';

export function SynergiesScreen() {
  const discovered = getPersistedStats().discoveredSynergies;
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <div className="game-shell min-h-screen p-6">
      <div className="mx-auto max-w-2xl">
        <button type="button" className="btn-secondary mb-6" onClick={() => setScreen('menu')}>← Ana Menü</button>
        <h1 className="text-4xl font-extrabold uppercase">Sinerjiler</h1>
        <p className="mb-6 text-neutral-400">Keşfedilen: {discovered.length}/{TOTAL_SYNERGIES}</p>
        <div className="space-y-3">
          {SYNERGIES.map((s) => {
            const ok = discovered.includes(s.id);
            return (
              <div key={s.id} className={`synergy-list-item ${ok ? 'synergy-list-item--discovered' : 'synergy-list-item--hidden'}`}>
                <p className="text-xl font-bold">
                  <span className="synergy-list-icon">{ok ? s.icon : '?'}</span>
                  {ok ? s.name : '???'}
                </p>
                {ok && <p className="text-sm text-neutral-400">{s.description}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

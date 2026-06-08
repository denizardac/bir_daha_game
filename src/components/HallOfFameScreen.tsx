import { useState } from 'react';
import { formatScore } from '@/engine/scoring';
import { getSeasonLabel, listSeasonMonths, getHallOfFameForMonth, getSeasonKey } from '@/engine/hallOfFame';
import { getPersistedStats, useGameStore } from '@/store/gameStore';

function getPlaceholderMonths(currentKey: string, count = 2): string[] {
  const [y, m] = currentKey.split('-').map(Number);
  const placeholders: string[] = [];
  let year = y!;
  let month = m! - 1;
  for (let i = 0; i < count; i++) {
    month -= 1;
    if (month < 1) { month = 12; year -= 1; }
    placeholders.push(`${year}-${String(month).padStart(2, '0')}`);
  }
  return placeholders;
}

export function HallOfFameScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const stats = getPersistedStats();
  const activeKey = stats.seasonKey || getSeasonKey();
  const months = listSeasonMonths(stats);
  const [month, setMonth] = useState(activeKey);
  const entries = getHallOfFameForMonth(stats, month);
  const isActive = month === activeKey;
  const archivePlaceholders = getPlaceholderMonths(activeKey).filter((m) => !months.includes(m));

  return (
    <div className="game-shell min-h-screen p-6">
      <div className="mx-auto max-w-lg">
        <button type="button" className="btn-secondary mb-6" onClick={() => setScreen('menu')}>← Ana Menü</button>
        <h1 className="mb-1 text-4xl font-extrabold uppercase">Hall of Fame</h1>
        <p className="mb-6 text-neutral-400">Aylık sezon — her ay sıfırlanır, geçmiş aylar arşivde kalır.</p>

        {isActive && entries.length === 0 && (
          <div className="panel mb-4 border-amber-500/30 bg-amber-950/20">
            <p className="text-lg font-bold text-amber-200">{getSeasonLabel(activeKey)} sezonu devam ediyor</p>
            <p className="mt-1 text-sm text-neutral-300">İlk sırayı al — skorun burada kalıcı olur.</p>
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {months.map((m) => (
            <button
              key={m}
              type="button"
              className={`btn-secondary text-sm ${month === m ? 'border-amber-500 text-amber-300' : ''}`}
              onClick={() => setMonth(m)}
            >
              {getSeasonLabel(m)}{m === activeKey ? ' · Aktif' : ''}
            </button>
          ))}
        </div>

        <div className="panel space-y-2">
          <p className="text-sm text-neutral-500">{getSeasonLabel(month)} — Top 50</p>
          {entries.length === 0 && (
            <p className="text-neutral-500">Bu ay henüz kayıt yok. İlk sen ol!</p>
          )}
          {entries.map((e, idx) => (
            <div key={`${e.id}-${e.timestamp}`} className="flex justify-between border-b border-neutral-800 py-2 text-sm last:border-0">
              <span>
                #{idx + 1} {e.displayName}
                {e.flawless ? ' 🛡️' : ''}
                <span className="ml-2 text-neutral-600">{e.roundsCompleted}R</span>
              </span>
              <span className="font-bold text-amber-400">{formatScore(e.totalScore)}</span>
            </div>
          ))}
        </div>

        {archivePlaceholders.length > 0 && (
          <div className="panel mt-4 space-y-2 opacity-70">
            <p className="text-xs font-bold uppercase text-neutral-500">Geçmiş sezonlar</p>
            {archivePlaceholders.map((m) => (
              <p key={m} className="text-sm text-neutral-500">
                {getSeasonLabel(m)} — Kazanan: —
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

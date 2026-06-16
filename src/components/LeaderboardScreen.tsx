import { useEffect, useState } from 'react';
import { fetchRemoteLeaderboard, isRemoteLeaderboardEnabled } from '@/api/leaderboardRemote';
import { formatScore } from '@/engine/scoring';
import { getDailyList, getWeekKey } from '@/engine/leaderboard';
import { getDailySeed } from '@/engine/seed';
import { getPersistedStats, useGameStore } from '@/store/gameStore';
import type { LeaderboardEntry } from '@/types';

type Tab = 'daily' | 'weekly' | 'allTime' | 'flawless';

export function LeaderboardScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const stats = getPersistedStats();
  const [tab, setTab] = useState<Tab>('daily');
  const [remoteList, setRemoteList] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const remote = isRemoteLeaderboardEnabled();

  const localLists: Record<Tab, LeaderboardEntry[]> = {
    daily: getDailyList(stats),
    weekly: stats.weeklyLeaderboard.filter((e) => e.weekKey === getWeekKey()),
    allTime: stats.allTimeLeaderboard,
    flawless: stats.flawlessLeaderboard,
  };

  useEffect(() => {
    if (!remote) {
      setRemoteList(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchRemoteLeaderboard(tab, tab === 'daily' ? getDailySeed() : undefined)
      .then((rows) => {
        if (!cancelled) setRemoteList(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, remote]);

  const list = remote && remoteList !== null ? remoteList : localLists[tab];
  const labels: Record<Tab, string> = { daily: 'Günlük', weekly: 'Haftalık', allTime: 'All-Time', flawless: 'Namağlup' };

  return (
    <div className="game-shell min-h-screen p-6">
      <div className="mx-auto max-w-lg">
        <button type="button" className="btn-secondary mb-6" onClick={() => setScreen('menu')}>← Ana Menü</button>
        <h1 className="mb-2 text-4xl font-extrabold uppercase">Leaderboard</h1>
        {remote && (
          <p className="mb-4 text-sm text-emerald-400">Canlı sıralama</p>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {(Object.keys(labels) as Tab[]).map((t) => (
            <button key={t} type="button" className={`btn-secondary text-sm ${tab === t ? 'border-amber-500 text-amber-300' : ''}`} onClick={() => setTab(t)}>
              {labels[t]}
            </button>
          ))}
        </div>

        <div className="panel space-y-2">
          {loading && <p className="text-neutral-500">Yükleniyor…</p>}
          {!loading && list.length === 0 && <p className="text-neutral-500">Henüz skor yok</p>}
          {list.slice(0, 20).map((e, idx) => (
            <div key={`${e.id}-${e.timestamp}-${idx}`} className="flex justify-between border-b border-neutral-800 py-2 text-sm last:border-0">
              <span>#{idx + 1} {e.displayName}{e.flawless ? ' 🛡️' : ''}</span>
              <span className="font-bold">{formatScore(e.totalScore)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

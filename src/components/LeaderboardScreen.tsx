import { useEffect, useState } from 'react';
import { fetchRemoteLeaderboard, isRemoteLeaderboardEnabled } from '@/api/leaderboardRemote';
import { formatScore } from '@/engine/scoring';
import { getDailyList, getWeekKey, mergeBestLeaderboardEntries } from '@/engine/leaderboard';
import { getDailySeed } from '@/engine/seed';
import { getPersistedStats, useGameStore } from '@/store/gameStore';
import { UiIcon } from '@/components/UiIcon';
import { getAnonymousId } from '@/utils/storage';
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

  const list = remote && remoteList !== null
    ? mergeBestLeaderboardEntries(localLists[tab], remoteList)
    : localLists[tab];
  const labels: Record<Tab, string> = { daily: 'Günlük', weekly: 'Haftalık', allTime: 'Tüm Zamanlar', flawless: 'Namağlup' };

  // Rank window: kendi satırını vurgula; top-20 dışındaysan kendi çevreni ayrıca göster
  const TOP_COUNT = 20;
  const myId = getAnonymousId();
  const myIndex = list.findIndex((e) => e.id === myId);
  const windowRows = myIndex >= TOP_COUNT
    ? list
        .map((entry, idx) => ({ entry, rank: idx + 1 }))
        .slice(Math.max(TOP_COUNT, myIndex - 1), myIndex + 2)
    : [];

  const renderRow = (e: LeaderboardEntry, rank: number, key: string) => {
    const mine = e.id === myId;
    return (
      <div
        key={key}
        className={`flex justify-between border-b border-neutral-800 py-2 text-sm last:border-0 ${
          mine ? 'lb-row-self rounded-md border border-amber-500/50 bg-amber-500/10 px-2 font-semibold text-amber-200' : ''
        }`}
      >
        <span>#{rank} {e.displayName}{e.flawless && <UiIcon name="shield" className="lb-flawless-icon" />}{mine ? ' · sen' : ''}</span>
        <span className="font-bold">{formatScore(e.totalScore)}</span>
      </div>
    );
  };

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
          {list.slice(0, TOP_COUNT).map((e, idx) => renderRow(e, idx + 1, `top-${e.id}-${e.timestamp}-${idx}`))}
          {windowRows.length > 0 && (
            <>
              <p className="py-1 text-center text-xs tracking-widest text-neutral-600">···</p>
              {windowRows.map(({ entry, rank }) => renderRow(entry, rank, `win-${entry.id}-${entry.timestamp}-${rank}`))}
            </>
          )}
          {!loading && list.length > 0 && myIndex === -1 && (
            <p className="pt-2 text-center text-xs text-neutral-500">
              Bu listede henüz skorun yok — bir run bitir, sıran burada görünsün.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

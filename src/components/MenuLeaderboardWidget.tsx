import { useEffect, useMemo, useState } from 'react';
import { formatScore } from '@/engine/scoring';
import { getDailyList, getWeekKey } from '@/engine/leaderboard';
import { fetchRemoteLeaderboard, isRemoteLeaderboardEnabled } from '@/api/leaderboardRemote';
import { getDailySeed } from '@/engine/seed';
import { getPersistedStats, useGameStore } from '@/store/gameStore';
import { getAnonymousId } from '@/utils/storage';
import type { LeaderboardEntry } from '@/types';
import { UiIcon } from '@/components/UiIcon';

type Tab = 'daily' | 'weekly' | 'allTime';

const TAB_LABELS: Record<Tab, string> = { daily: 'Günlük', weekly: 'Haftalık', allTime: 'Tüm Zamanlar' };

type DisplayRow =
  | { kind: 'entry'; entry: LeaderboardEntry; rank: number; isMe: boolean }
  | { kind: 'gap' };

function sortByScore(list: LeaderboardEntry[]) {
  return [...list].sort((a, b) => b.totalScore - a.totalScore);
}

function buildDisplayRows(sorted: LeaderboardEntry[], myId: string, maxRows = 5): DisplayRow[] {
  const myIndex = sorted.findIndex((e) => e.id === myId);
  const myRank = myIndex >= 0 ? myIndex + 1 : null;

  if (myRank === null) {
    return sorted.slice(0, maxRows).map((entry, i) => ({
      kind: 'entry',
      entry,
      rank: i + 1,
      isMe: false,
    }));
  }

  if (myRank <= maxRows) {
    return sorted.slice(0, maxRows).map((entry, i) => ({
      kind: 'entry',
      entry,
      rank: i + 1,
      isMe: entry.id === myId,
    }));
  }

  const rows: DisplayRow[] = sorted.slice(0, maxRows - 1).map((entry, i) => ({
    kind: 'entry',
    entry,
    rank: i + 1,
    isMe: false,
  }));

  if (myRank > maxRows) rows.push({ kind: 'gap' });

  rows.push({
    kind: 'entry',
    entry: sorted[myIndex]!,
    rank: myRank,
    isMe: true,
  });

  return rows;
}

function rowName(entry: LeaderboardEntry, isMe: boolean) {
  if (isMe && !entry.displayName?.trim()) return 'Sen';
  return entry.displayName?.trim() || 'Anonim';
}

export function MenuLeaderboardWidget({ initialExpanded = false }: { initialExpanded?: boolean } = {}) {
  const stats = getPersistedStats();
  const myId = getAnonymousId();
  const setScreen = useGameStore((s) => s.setScreen);
  const [tab, setTab] = useState<Tab>('allTime');
  const [expanded, setExpanded] = useState(initialExpanded);
  const remote = isRemoteLeaderboardEnabled();
  const [remoteList, setRemoteList] = useState<LeaderboardEntry[] | null>(null);

  // Canlı sıralama: full leaderboard ekranıyla aynı kaynaktan çek — aksi halde
  // menüde yalnızca yerel (sen) görünüyordu.
  useEffect(() => {
    if (!remote) { setRemoteList(null); return; }
    let cancelled = false;
    fetchRemoteLeaderboard(tab, tab === 'daily' ? getDailySeed() : undefined)
      .then((rows) => { if (!cancelled) setRemoteList(rows); })
      .catch(() => { if (!cancelled) setRemoteList(null); });
    return () => { cancelled = true; };
  }, [tab, remote]);

  const localList = useMemo(
    () =>
      sortByScore(
        tab === 'daily'
          ? getDailyList(stats)
          : tab === 'allTime'
            ? stats.allTimeLeaderboard
            : stats.weeklyLeaderboard.filter((e: LeaderboardEntry) => e.weekKey === getWeekKey()),
      ),
    [tab, stats],
  );

  const fullList = remote && remoteList !== null ? sortByScore(remoteList) : localList;

  const rows = useMemo(() => buildDisplayRows(fullList, myId, expanded ? 8 : 5), [fullList, myId, expanded]);

  const myIndex = fullList.findIndex((e) => e.id === myId);
  const myRank = myIndex >= 0 ? myIndex + 1 : null;
  const myEntry = myIndex >= 0 ? fullList[myIndex] : null;
  const leader = fullList[0];

  return (
    <div className={`menu-widget menu-widget--lb ${expanded ? 'menu-widget--lb-expanded' : 'menu-widget--lb-collapsed'}`}>
      <button
        type="button"
        className="menu-lb-toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Leaderboard daralt' : 'Leaderboard genişlet'}
      >
        <UiIcon name="trophy" className="menu-widget-icon" />
        <span className="menu-widget-title">Leaderboard</span>
        {remote && <span className="menu-lb-live-badge">Canlı</span>}
        <span className="menu-lb-toggle-hint">{expanded ? 'Daralt' : 'Genişlet'}</span>
        <span className={`menu-lb-chevron ${expanded ? 'menu-lb-chevron--up' : ''}`} aria-hidden>▼</span>
      </button>

      <div className="menu-widget-tabs menu-lb-tabs" onClick={(e) => e.stopPropagation()} role="tablist">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`menu-tab ${tab === t ? 'menu-tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {!expanded && (
        <div className="menu-lb-compact">
          {leader ? (
            <p className="menu-lb-compact-line">
              <span className="menu-lb-compact-lead">#1 {rowName(leader, leader.id === myId)}</span>
              <span className="menu-lb-compact-score">{formatScore(leader.totalScore)}</span>
            </p>
          ) : (
            <p className="menu-lb-compact-empty">Henüz skor yok</p>
          )}
          {myEntry && myRank !== null && myRank !== 1 && (
            <p className="menu-lb-compact-me">
              Sen <strong>#{myRank}</strong> · {formatScore(myEntry.totalScore)}
            </p>
          )}
          {myEntry && myRank === 1 && (
            <p className="menu-lb-compact-me menu-lb-compact-me--lead">Lider sensin</p>
          )}
          {!myEntry && fullList.length > 0 && (
            <p className="menu-lb-compact-me">Bugün oyna — sıralamaya gir</p>
          )}
        </div>
      )}

      {expanded && (
        <div className="menu-lb-rows">
          {rows.length === 0 ? (
            <p className="menu-lb-empty">
              {tab === 'daily'
                ? 'Günlük seed run\'ı bitirince burada görünür — serbest mod skorları haftalık listede.'
                : 'Henüz skor yok — ilk sen ol!'}
            </p>
          ) : (
            rows.map((row, idx) => {
              if (row.kind === 'gap') {
                return (
                  <div key={`gap-${idx}`} className="menu-lb-gap" aria-hidden>
                    ···
                  </div>
                );
              }

              const { entry, rank, isMe } = row;
              const medal =
                rank === 1 ? 'menu-lb-row--gold' : rank === 2 ? 'menu-lb-row--silver' : rank === 3 ? 'menu-lb-row--bronze' : '';

              return (
                <div
                  key={`${entry.id}-${rank}`}
                  className={`menu-lb-row ${isMe ? 'menu-lb-row--me' : ''} ${medal}`}
                >
                  <span className="menu-lb-rank">#{rank}</span>
                  <span className="menu-lb-name">
                    <span className="menu-lb-name-text">{rowName(entry, isMe)}</span>
                    {isMe && entry.displayName?.trim() && (
                      <span className="menu-lb-you-pill">Sen</span>
                    )}
                    {entry.flawless && <UiIcon name="shield" className="menu-lb-flawless" title="Namağlup" />}
                  </span>
                  <span className="menu-lb-score">{formatScore(entry.totalScore)}</span>
                </div>
              );
            })
          )}
        </div>
      )}

      <button
        type="button"
        className="menu-lb-fullbtn"
        onClick={() => setScreen('leaderboard')}
      >
        <span>Tüm sıralamayı gör</span>
        <UiIcon name="arrow-right" />
      </button>
    </div>
  );
}

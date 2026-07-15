import { useEffect, useState } from 'react';
import { fetchRemoteLeaderboard, isRemoteLeaderboardEnabled } from '@/api/leaderboardRemote';
import { formatScore } from '@/engine/scoring';
import { getDailyList, getWeekKey, mergeBestLeaderboardEntries } from '@/engine/leaderboard';
import { formatDailyDate, getDailySeed } from '@/engine/seed';
import { getPersistedStats, useGameStore } from '@/store/gameStore';
import { UiIcon } from '@/components/UiIcon';
import { getAnonymousId } from '@/utils/storage';
import type { LeaderboardEntry } from '@/types';

type Tab = 'daily' | 'weekly' | 'allTime' | 'flawless';

const PERIODS: Record<Tab, { label: string; title: string; description: string }> = {
  daily: {
    label: 'Günlük',
    title: `Bugünün fikstürü · ${formatDailyDate()}`,
    description: 'Herkes aynı seed ile oynar; oyuncu başına yalnızca en iyi skor tutulur.',
  },
  weekly: {
    label: 'Haftalık',
    title: 'Haftanın en iyi Ranked runı',
    description: 'Pazartesi–pazar arasındaki Günlük Ranked sonuçlarından kişisel en iyiler yarışır.',
  },
  allTime: {
    label: 'Kariyer',
    title: 'Tüm zamanların Ranked rekorları',
    description: 'Yalnızca Günlük Ranked runları; Serbest Mod skorları bu listeye girmez.',
  },
  flawless: {
    label: 'Namağlup',
    title: 'Kusursuz Ranked runlar',
    description: 'Mağlubiyet almadan tamamlanan Günlük Ranked runlarının kariyer listesi.',
  },
};

export function LeaderboardScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const stats = getPersistedStats();
  const [tab, setTab] = useState<Tab>('daily');
  const [remoteList, setRemoteList] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const remote = isRemoteLeaderboardEnabled();
  const myId = getAnonymousId();

  const localLists: Record<Tab, LeaderboardEntry[]> = {
    daily: getDailyList(stats),
    weekly: stats.weeklyLeaderboard.filter((entry) => entry.weekKey === getWeekKey()),
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
      .then((rows) => { if (!cancelled) setRemoteList(rows); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab, remote]);

  const list = remote && remoteList !== null
    ? mergeBestLeaderboardEntries(localLists[tab], remoteList)
    : localLists[tab];
  const myIndex = list.findIndex((entry) => entry.id === myId);
  const leader = list[0];
  const period = PERIODS[tab];

  return (
    <div className="game-shell page-screen ranked-screen">
      <div className="page-screen-inner page-screen-inner--wide ranked-screen-inner">
        <nav className="ranked-topbar" aria-label="Ranked gezinme">
          <button type="button" className="btn-secondary page-screen-back" onClick={() => setScreen('menu')}>← Ana Menü</button>
          <button type="button" className="ranked-season-link" onClick={() => setScreen('hallOfFame')}>
            <UiIcon name="trophy" /> Sezon arşivi <UiIcon name="arrow-right" />
          </button>
        </nav>

        <header className="ranked-header">
          <div>
            <span className="page-screen-eyebrow">Günlük Seed rekabeti</span>
            <h1>Ranked</h1>
            <p>Tek rekabet hattı, dört net görünüm. Serbest Mod burada yer almaz.</p>
          </div>
          <div className="ranked-rule-ticket">
            <span>Ranked kuralı</span>
            <strong>Aynı seed · En iyi skor</strong>
            <small>Günlük sonuçlar haftaya, kariyere ve aylık sezona taşınır.</small>
          </div>
        </header>

        <div className="ranked-tabs" role="tablist" aria-label="Ranked dönemleri">
          {(Object.keys(PERIODS) as Tab[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={tab === key ? 'ranked-tab ranked-tab--active' : 'ranked-tab'}
              onClick={() => setTab(key)}
            >
              {PERIODS[key].label}
            </button>
          ))}
        </div>

        <section className="ranked-period-head">
          <div>
            <span>{period.label} Ranked</span>
            <h2>{period.title}</h2>
            <p>{period.description}</p>
          </div>
          {leader && (
            <div className="ranked-leader-lockup">
              <span>#1 {leader.displayName || 'Anonim'}</span>
              <strong>{formatScore(leader.totalScore)}</strong>
            </div>
          )}
        </section>

        <div className="ranked-board" aria-live="polite">
          {loading && <p className="ranked-empty">Canlı skorlar yükleniyor…</p>}
          {!loading && list.length === 0 && (
            <div className="ranked-empty ranked-empty--large">
              <UiIcon name="trophy" />
              <strong>Bu listede henüz skor yok.</strong>
              <span>Günlük Ranked runını tamamla; ilk çizgiyi sen çek.</span>
            </div>
          )}
          {!loading && list.map((entry, index) => {
            const mine = entry.id === myId;
            return (
              <div key={`${entry.id}-${entry.timestamp}-${index}`} className={`ranked-row ${mine ? 'ranked-row--mine' : ''}`}>
                <span className="ranked-row-rank">#{index + 1}</span>
                <span className="ranked-row-player">
                  <strong>{entry.displayName || 'Anonim'}</strong>
                  {mine && <small>Sen</small>}
                  {entry.flawless && <UiIcon name="shield" title="Namağlup" />}
                </span>
                <span className="ranked-row-round">{entry.roundsCompleted}R</span>
                <strong className="ranked-row-score">{formatScore(entry.totalScore)}</strong>
              </div>
            );
          })}
        </div>

        {!loading && list.length > 0 && myIndex === -1 && (
          <p className="ranked-join-note">Bu dönemde skorun yok. Günlük Ranked runını bitirdiğinde sıran burada görünecek.</p>
        )}
      </div>
    </div>
  );
}

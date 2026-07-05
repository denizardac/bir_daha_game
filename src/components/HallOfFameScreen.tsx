import { useEffect, useState } from 'react';
import { formatScore } from '@/engine/scoring';
import { getSeasonLabel, listSeasonMonths, getHallOfFameForMonth, getSeasonKey } from '@/engine/hallOfFame';
import { mergeBestScoreEntries } from '@/engine/leaderboard';
import { fetchRemoteHallOfFame, isRemoteLeaderboardEnabled } from '@/api/leaderboardRemote';
import { getPersistedStats, useGameStore } from '@/store/gameStore';
import type { HallOfFameEntry, LeaderboardEntry } from '@/types';

function getPlaceholderMonths(currentKey: string, count = 2): string[] {
  const [y, m] = currentKey.split('-').map(Number);
  const placeholders: string[] = [];
  let year = y!;
  let month = m!;
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
  const activeKey = getSeasonKey();
  const months = listSeasonMonths(stats, activeKey);
  const [month, setMonth] = useState(activeKey);
  const isActive = month === activeKey;
  const remote = isRemoteLeaderboardEnabled();
  const [remoteEntries, setRemoteEntries] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    if (!remote) { setRemoteEntries(null); return; }
    let cancelled = false;
    fetchRemoteHallOfFame(month)
      .then((rows) => {
        if (!cancelled) {
          setRemoteEntries(rows);
        }
      })
      .catch(() => { if (!cancelled) setRemoteEntries(null); });
    return () => { cancelled = true; };
  }, [remote, month]);

  const localEntries = getHallOfFameForMonth(stats, month);
  const entries: (HallOfFameEntry | LeaderboardEntry)[] =
    remote && remoteEntries !== null
      ? mergeBestScoreEntries<HallOfFameEntry | LeaderboardEntry>(localEntries, remoteEntries)
      : localEntries;
  const archivePlaceholders = getPlaceholderMonths(activeKey).filter((m) => !months.includes(m));
  const champion = entries[0];
  const podiumEntries = entries.slice(0, 3);
  const tableEntries = entries.slice(3);
  const pastMonths = months.filter((m) => m !== activeKey);

  return (
    <div className="game-shell page-screen hof-screen">
      <div className="page-screen-inner page-screen-inner--wide hof-screen-inner">
        <button type="button" className="btn-secondary page-screen-back" onClick={() => setScreen('menu')}>
          ← Ana Menü
        </button>

        <header className="page-screen-header hof-screen-header">
          <div className="hof-header-content">
            <div>
              <h1>Hall of Fame</h1>
              <p>Aylık sezon — her ay sıfırlanır, geçmiş şampiyonlar ebediyen arşivde kalır.</p>
            </div>
            {entries.length > 0 && (
              <div className="hof-header-stats">
                <div className="hof-header-stat">
                  <p className="hof-header-stat-value">{entries.length}</p>
                  <p className="hof-header-stat-label">Yarışmacı</p>
                </div>
                <div className="hof-header-stat hof-header-stat--sep">
                  <p className="hof-header-stat-value">{champion?.roundsCompleted ?? 15}</p>
                  <p className="hof-header-stat-label">Round / Run</p>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="hof-season-tabs-row">
          <div className="hof-hero-tabs">
            {months.map((m) => (
              <button
                key={m}
                type="button"
                className={`hof-tab ${month === m ? 'hof-tab--active' : ''}`}
                onClick={() => setMonth(m)}
              >
                {getSeasonLabel(m)}{m === activeKey ? ' · Aktif' : ''}
              </button>
            ))}
          </div>
          {isActive && (
            <div className="hof-active-badge">
              <span className="hof-active-dot" aria-hidden />
              <span>{getSeasonLabel(month)} · Sezon Aktif</span>
            </div>
          )}
        </div>

        {/* PODIUM — top 3 */}
        {entries.length > 0 && (
          <div className="hof-podium">
            {/* 2nd place */}
            <div className="hof-podium-card hof-podium-card--silver">
              {podiumEntries[1] ? (
                <>
                  <div className="hof-podium-header">
                    <span className="hof-podium-rank">#2</span>
                    <span className="hof-podium-medal">🥈</span>
                  </div>
                  <p className="hof-podium-name">{podiumEntries[1].displayName}{podiumEntries[1].flawless ? ' 🛡️' : ''}</p>
                  <p className="hof-podium-score">{formatScore(podiumEntries[1].totalScore)}</p>
                  <p className="hof-podium-meta">{podiumEntries[1].roundsCompleted} Round</p>
                </>
              ) : (
                <p className="hof-podium-empty">Açık sıra</p>
              )}
            </div>

            {/* 1st place — center/hero */}
            <div className="hof-podium-card hof-podium-card--gold">
              <div className="hof-podium-champ-pill">Aylık Şampiyon</div>
              <div className="hof-podium-header">
                <span className="hof-podium-medal">👑</span>
              </div>
              <p className="hof-podium-name hof-podium-name--champ">{champion!.displayName}{champion!.flawless ? ' 🛡️' : ''}</p>
              <p className="hof-podium-kicker">{getSeasonLabel(month)} lideri</p>
              <p className="hof-podium-score hof-podium-score--gold">{formatScore(champion!.totalScore)}</p>
              <p className="hof-podium-meta">{champion!.roundsCompleted} round tamamlandı · sezonun en yükseği</p>
            </div>

            {/* 3rd place */}
            <div className="hof-podium-card hof-podium-card--bronze">
              {podiumEntries[2] ? (
                <>
                  <div className="hof-podium-header">
                    <span className="hof-podium-rank">#3</span>
                    <span className="hof-podium-medal">🥉</span>
                  </div>
                  <p className="hof-podium-name">{podiumEntries[2].displayName}{podiumEntries[2].flawless ? ' 🛡️' : ''}</p>
                  <p className="hof-podium-score">{formatScore(podiumEntries[2].totalScore)}</p>
                  <p className="hof-podium-meta">{podiumEntries[2].roundsCompleted} Round</p>
                </>
              ) : (
                <p className="hof-podium-empty">Açık sıra</p>
              )}
            </div>
          </div>
        )}

        {entries.length === 0 && (
          <div className="hof-empty-state">
            <p className="hof-empty">Bu sezon henüz kayıt yok. İlk sırayı al!</p>
          </div>
        )}

        <div className="hof-layout hof-layout--wide">
          <div className="panel hof-entries-panel">
            <p className="hof-panel-title">{getSeasonLabel(month)} — Top 50</p>
            {tableEntries.length === 0 && entries.length > 0 ? (
              <p className="hof-empty">Podium dışı kayıt yok.</p>
            ) : tableEntries.length === 0 ? null : (
              <div className="hof-entry-list">
                {tableEntries.map((e, idx) => (
                  <div key={`${e.id}-${e.timestamp}`} className="hof-entry-row">
                    <span className="hof-entry-rank">#{idx + 4}</span>
                    <span className="hof-entry-name">
                      {e.displayName}
                      {e.flawless ? ' 🛡️' : ''}
                      <span className="hof-entry-rounds">{e.roundsCompleted}R</span>
                    </span>
                    <span className="hof-entry-score">{formatScore(e.totalScore)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel hof-archive-panel">
            <p className="hof-panel-title">Geçmiş Sezonlar</p>
            {pastMonths.length > 0 ? (
              <div className="hof-archive-list">
                {pastMonths.map((m) => {
                  const champ = getHallOfFameForMonth(stats, m)[0];
                  return (
                    <div key={m} className="hof-archive-row">
                      <span className="hof-archive-medal">🥇</span>
                      <div className="hof-archive-info">
                        <p className="hof-archive-month">{getSeasonLabel(m)}</p>
                        <p className="hof-archive-item">
                          {champ ? (
                            <>Şampiyon: <strong>{champ.displayName}</strong></>
                          ) : 'Kayıt yok'}
                        </p>
                        {champ && (
                          <p className="hof-archive-score">{formatScore(champ.totalScore)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {archivePlaceholders.map((m) => (
                  <div key={m} className="hof-archive-row hof-archive-row--empty">
                    <span className="hof-archive-medal" style={{ opacity: 0.35 }}>🥇</span>
                    <div className="hof-archive-info">
                      <p className="hof-archive-month">{getSeasonLabel(m)}</p>
                      <p className="hof-archive-item">Kayıt yok</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : archivePlaceholders.length > 0 ? (
              <div className="hof-archive-list">
                {archivePlaceholders.map((m) => (
                  <div key={m} className="hof-archive-row hof-archive-row--empty">
                    <span className="hof-archive-medal" style={{ opacity: 0.35 }}>🥇</span>
                    <div className="hof-archive-info">
                      <p className="hof-archive-month">{getSeasonLabel(m)}</p>
                      <p className="hof-archive-item">Kayıt yok</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="hof-empty">Geçmiş sezon kaydı yok.</p>
            )}

            <div className="hof-cta-card">
              <p className="hof-cta-icon" aria-hidden>🔥</p>
              <p className="hof-cta-title">Sıralamaya gir</p>
              <p className="hof-cta-desc">15 round'u tamamla, en yüksek skorunla bu ayın Hall of Fame'inde yerini al.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { formatScore } from '@/engine/scoring';
import { getSeasonLabel, listSeasonMonths, getHallOfFameForMonth, getSeasonKey, isRankedSeason } from '@/engine/hallOfFame';
import { fetchRemoteHallOfFame, isRemoteLeaderboardEnabled } from '@/api/leaderboardRemote';
import { UiIcon } from '@/components/UiIcon';
import { getVerifiedChampionTitle } from '@/engine/seasonTitles';
import { getPersistedStats, useGameStore } from '@/store/gameStore';
import { getAnonymousId } from '@/utils/storage';
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
  const months = [...new Set([...listSeasonMonths(stats, activeKey), ...getPlaceholderMonths(activeKey, 3)])].sort().reverse();
  const [month, setMonth] = useState(activeKey);
  const isActive = month === activeKey;
  const rankedSeason = isRankedSeason(month);
  const remote = isRemoteLeaderboardEnabled();
  const [remoteEntries, setRemoteEntries] = useState<LeaderboardEntry[] | null>(null);
  const monthlyLegend = useGameStore((s) => s.monthlyLegend);

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
  const entries: (HallOfFameEntry | LeaderboardEntry)[] = remote && remoteEntries !== null
    ? remoteEntries
    : localEntries;
  const verifiedTitle = getVerifiedChampionTitle(monthlyLegend, getAnonymousId(), activeKey);
  const myTitles = verifiedTitle ? [verifiedTitle] : [];
  const champion = entries[0];
  const podiumEntries = entries.slice(0, 3);
  const tableEntries = entries.slice(3);

  return (
    <div className="game-shell page-screen hof-screen">
      <div className="page-screen-inner page-screen-inner--wide hof-screen-inner">
        <button type="button" className="btn-secondary page-screen-back" onClick={() => setScreen('menu')}>
          ← Ana Menü
        </button>

        <header className="page-screen-header hof-screen-header">
          <div className="hof-header-content">
            <div>
              <span className="page-screen-eyebrow">Ranked sezon arşivi</span>
              <h1>Hall of Fame</h1>
              <p>{rankedSeason
                ? 'Yalnızca Günlük Ranked sonuçları. Aktif ayda lider, ay kapandığında tek şampiyon.'
                : 'Eski karma kurallarla kapanan sezon; verilmiş şampiyonluk ve Ayın Efsanesi kaydı korunur.'}</p>
            </div>
            <div className="hof-ranking-rule">
              <span>{rankedSeason ? 'Sezon puanı' : 'Legacy kural'}</span>
              <strong>{rankedSeason ? 'Ay içindeki tek en iyi Ranked skorun' : 'Dönemin karma global sıralaması'}</strong>
              <small>{rankedSeason
                ? 'Serbest Mod ve tekrar denemelerinin düşük skorları tabloyu etkilemez.'
                : 'Temmuz 2026’da başlayan Ranked ayrımından önceki sonuçlar geriye dönük değiştirilmez.'}</small>
            </div>
          </div>
        </header>

        {myTitles.length > 0 && (
          <div className="hof-my-titles" aria-label="Kazandığın kalıcı unvanlar">
            <p className="hof-my-titles-kicker">Doğrulanmış unvanın</p>
            <div className="hof-my-titles-list">
              {myTitles.map((t) => (
                <span key={t.monthKey} className={`hof-title-badge hof-title-badge--p${t.placement}`}>
                  <UiIcon name={t.icon} />
                  <strong>{t.label}</strong>
                  <small>{formatScore(t.score)}</small>
                </span>
              ))}
            </div>
          </div>
        )}

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

        <div className={`hof-season-status ${isActive ? 'hof-season-status--live' : 'hof-season-status--closed'}`}>
          <span>{isActive ? 'CANLI SEZON' : rankedSeason ? 'KAPANMIŞ SEZON' : 'LEGACY SEZON'}</span>
          <strong>{getSeasonLabel(month)}</strong>
          <small>{isActive
            ? 'Liderlik ay sonuna kadar değişebilir.'
            : rankedSeason
              ? 'Sıralama kesinleşti; birinci artık sezon şampiyonu.'
              : 'Eski karma sıralama kurallarıyla kapanan şampiyonluk kaydı korunur.'}</small>
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
                    <span className="hof-podium-medal"><UiIcon name="medal" /></span>
                  </div>
                  <p className="hof-podium-name">{podiumEntries[1].displayName}{podiumEntries[1].flawless && <UiIcon name="shield" className="hof-flawless-icon" />}</p>
                  <p className="hof-podium-score">{formatScore(podiumEntries[1].totalScore)}</p>
                  <p className="hof-podium-meta">{podiumEntries[1].roundsCompleted} Round</p>
                </>
              ) : (
                <p className="hof-podium-empty">Açık sıra</p>
              )}
            </div>

            {/* 1st place — center/hero */}
            <div className="hof-podium-card hof-podium-card--gold">
              <div className="hof-podium-champ-pill">{isActive ? 'Sezon Lideri' : 'Aylık Şampiyon'}</div>
              <div className="hof-podium-header">
                <span className="hof-podium-medal"><UiIcon name="trophy" /></span>
              </div>
              <p className="hof-podium-name hof-podium-name--champ">{champion!.displayName}{champion!.flawless && <UiIcon name="shield" className="hof-flawless-icon" />}</p>
              <p className="hof-podium-kicker">{getSeasonLabel(month)} {isActive ? 'lideri' : 'şampiyonu'}</p>
              <p className="hof-podium-score hof-podium-score--gold">{formatScore(champion!.totalScore)}</p>
              <p className="hof-podium-meta">{champion!.roundsCompleted} round · {isActive ? 'şimdilik sezonun en yükseği' : 'kapanış skoru'}</p>
            </div>

            {/* 3rd place */}
            <div className="hof-podium-card hof-podium-card--bronze">
              {podiumEntries[2] ? (
                <>
                  <div className="hof-podium-header">
                    <span className="hof-podium-rank">#3</span>
                    <span className="hof-podium-medal"><UiIcon name="medal" /></span>
                  </div>
                  <p className="hof-podium-name">{podiumEntries[2].displayName}{podiumEntries[2].flawless && <UiIcon name="shield" className="hof-flawless-icon" />}</p>
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

        <div className="hof-layout hof-layout--wide hof-layout--single">
          <div className="panel hof-entries-panel">
            <p className="hof-panel-title">{getSeasonLabel(month)} · {rankedSeason ? 'Ranked' : 'Legacy'} Top 50</p>
            {tableEntries.length === 0 && entries.length > 0 ? (
              <p className="hof-empty">Podium dışı kayıt yok.</p>
            ) : tableEntries.length === 0 ? null : (
              <div className="hof-entry-list">
                {tableEntries.map((e, idx) => (
                  <div key={`${e.id}-${e.timestamp}`} className="hof-entry-row">
                    <span className="hof-entry-rank">#{idx + 4}</span>
                    <span className="hof-entry-name">
                      {e.displayName}
                      {e.flawless && <UiIcon name="shield" className="hof-flawless-icon" />}
                      <span className="hof-entry-rounds">{e.roundsCompleted}R</span>
                    </span>
                    <span className="hof-entry-score">{formatScore(e.totalScore)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="hof-cta-card hof-cta-card--wide">
          <p className="hof-cta-icon" aria-hidden><UiIcon name="flame" /></p>
          <div>
            <p className="hof-cta-title">Sezon sıralamasına gir</p>
            <p className="hof-cta-desc">Günlük Ranked runını tamamla; ay içindeki en iyi skorun otomatik olarak burada yarışsın.</p>
          </div>
          <button type="button" className="btn-primary" onClick={() => setScreen('menu')}>Ranked Oyna</button>
        </div>

      </div>
    </div>
  );
}

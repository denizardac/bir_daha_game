import { useState } from 'react';
import { formatScore } from '@/engine/scoring';
import { getSeasonLabel, listSeasonMonths, getHallOfFameForMonth, getSeasonKey } from '@/engine/hallOfFame';
import { getPersistedStats, useGameStore } from '@/store/gameStore';

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
  const activeKey = stats.seasonKey || getSeasonKey();
  const months = listSeasonMonths(stats);
  const [month, setMonth] = useState(activeKey);
  const entries = getHallOfFameForMonth(stats, month);
  const isActive = month === activeKey;
  const archivePlaceholders = getPlaceholderMonths(activeKey).filter((m) => !months.includes(m));
  const champion = entries[0];

  return (
    <div className="game-shell page-screen hof-screen">
      <div className="page-screen-inner page-screen-inner--wide hof-screen-inner">
        <button type="button" className="btn-secondary page-screen-back" onClick={() => setScreen('menu')}>
          ← Ana Menü
        </button>

        <header className="page-screen-header hof-screen-header">
          <h1>Hall of Fame</h1>
          <p>Aylık sezon — her ay sıfırlanır, geçmiş aylar arşivde kalır.</p>
        </header>

        <div className="hof-hero">
          <div className="hof-hero-main">
            <p className="hof-hero-kicker">{getSeasonLabel(month)}</p>
            {champion ? (
              <>
                <p className="hof-hero-name">{champion.displayName}{champion.flawless ? ' 🛡️' : ''}</p>
                <p className="hof-hero-score">{formatScore(champion.totalScore)}</p>
                <p className="hof-hero-meta">{champion.roundsCompleted} round tamamlandı</p>
              </>
            ) : (
              <>
                <p className="hof-hero-name hof-hero-name--empty">Henüz şampiyon yok</p>
                <p className="hof-hero-meta">İlk sırayı al — skorun burada kalıcı olur.</p>
              </>
            )}
          </div>
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
        </div>

        <div className="hof-layout hof-layout--wide">
          <div className="panel hof-entries-panel">
            <p className="hof-panel-title">{getSeasonLabel(month)} — Top 50</p>
            {entries.length === 0 ? (
              <p className="hof-empty">Bu ay henüz kayıt yok. İlk sen ol!</p>
            ) : (
              <div className="hof-entry-list">
                {entries.map((e, idx) => (
                  <div key={`${e.id}-${e.timestamp}`} className={`hof-entry-row ${idx === 0 ? 'hof-entry-row--first' : ''}`}>
                    <span className="hof-entry-rank">#{idx + 1}</span>
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

          {archivePlaceholders.length > 0 && (
            <div className="panel hof-archive-panel">
              <p className="hof-panel-title">Geçmiş sezonlar</p>
              <div className="hof-archive-list">
                {archivePlaceholders.map((m) => (
                  <p key={m} className="hof-archive-item">
                    {getSeasonLabel(m)} — Kazanan: —
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {isActive && entries.length === 0 && (
          <p className="hof-active-note">Sezon devam ediyor — skorunu yükselt ve listeye gir.</p>
        )}
      </div>
    </div>
  );
}

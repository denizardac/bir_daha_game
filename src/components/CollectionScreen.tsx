import { useState } from 'react';
import { EVENT_CARDS } from '@/data/events';
import { PLAYER_POOL } from '@/data/players';
import { getPlayerArchetype } from '@/data/archetypes';
import { countUnlockedAchievements, getAchievementState } from '@/engine/achievements';
import { getPersistedStats, useGameStore } from '@/store/gameStore';

type Tab = 'efsane' | 'olay' | 'basarim';

/** Havuzdaki benzersiz efsane kartlar (isim bazlı) */
const LEGEND_POOL = (() => {
  const seen = new Set<string>();
  const out: typeof PLAYER_POOL = [];
  for (const p of PLAYER_POOL) {
    if (p.rarity === 'efsane' && !seen.has(p.name)) {
      seen.add(p.name);
      out.push(p);
    }
  }
  return out.sort((a, b) => Number(!!b.signature) - Number(!!a.signature) || b.currentRating - a.currentRating);
})();

export function CollectionScreen() {
  const stats = getPersistedStats();
  const setScreen = useGameStore((s) => s.setScreen);
  const [tab, setTab] = useState<Tab>('efsane');

  const seenEvents = new Set(stats.seenEvents);
  const collectedLegends = new Set(stats.collectedLegends);

  const legendOpen = LEGEND_POOL.filter((p) => collectedLegends.has(p.name)).length;
  const eventOpen = EVENT_CARDS.filter((e) => seenEvents.has(e.id)).length;
  const achievements = getAchievementState(stats);
  const achievementCount = countUnlockedAchievements(stats);

  return (
    <div className="game-shell page-screen">
      <div className="page-screen-inner page-screen-inner--wide">
        <button type="button" className="btn-secondary page-screen-back" onClick={() => setScreen('menu')}>← Ana Menü</button>

        <header className="page-screen-header">
          <h1>Koleksiyon</h1>
          <p>Açtıklarını topla — keşfettikçe dolar.</p>
        </header>

        <div className="collection-progress-head">
          <div className="collection-stat">
            <div className="collection-stat-value">{legendOpen}/{LEGEND_POOL.length}</div>
            <div className="collection-stat-label">Efsane</div>
          </div>
          <div className="collection-stat">
            <div className="collection-stat-value">{eventOpen}/{EVENT_CARDS.length}</div>
            <div className="collection-stat-label">Olay</div>
          </div>
          <div className="collection-stat">
            <div className="collection-stat-value">{achievementCount.unlocked}/{achievementCount.total}</div>
            <div className="collection-stat-label">Başarım</div>
          </div>
        </div>

        <div className="page-screen-tabs">
          {([['efsane', '🏆 Efsaneler'], ['olay', '🎭 Olaylar'], ['basarim', '🎖️ Başarımlar']] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`btn-secondary ${tab === id ? 'btn-secondary--active' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'efsane' && (
          <div className="collection-grid">
            {LEGEND_POOL.map((p) => {
              const ok = collectedLegends.has(p.name);
              const arch = getPlayerArchetype(p);
              return (
                <div
                  key={p.name}
                  className={`collection-tile ${ok ? '' : 'collection-tile--locked'}`}
                  style={ok && p.signature && p.signatureColor ? { borderColor: p.signatureColor } : undefined}
                >
                  <div className="collection-tile-icon">{ok ? (p.signature ? '✒️' : '🏆') : '🔒'}</div>
                  <div className="collection-tile-name">{ok ? p.name : '???'}</div>
                  <div className="collection-tile-sub">
                    {ok ? `${arch.label} · ${p.currentRating}` : 'Henüz çekilmedi'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'olay' && (
          <div className="collection-grid">
            {EVENT_CARDS.map((e) => {
              const ok = seenEvents.has(e.id);
              return (
                <div key={e.id} className={`collection-tile ${ok ? '' : 'collection-tile--locked'}`}>
                  <div className="collection-tile-icon">{ok ? e.icon : '🔒'}</div>
                  <div className="collection-tile-name">{ok ? e.title : '???'}</div>
                  <div className="collection-tile-sub">{ok ? e.category : 'Henüz görülmedi'}</div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'basarim' && (
          <div className="achievement-grid">
            {achievements.map(({ achievement, current, unlocked, percent }) => (
              <div
                key={achievement.id}
                className={`achievement-card achievement-card--${achievement.tier} ${unlocked ? 'achievement-card--unlocked' : ''}`}
              >
                <span className="achievement-icon" aria-hidden>{unlocked ? achievement.icon : '🔒'}</span>
                <div className="achievement-body">
                  <div className="achievement-head">
                    <strong className="achievement-name">{achievement.name}</strong>
                    <span className="achievement-tier">{achievement.tier}</span>
                  </div>
                  <p className="achievement-desc">{achievement.description}</p>
                  <div className="achievement-bar">
                    <span style={{ width: `${percent}%` }} />
                  </div>
                  <p className="achievement-progress">
                    {unlocked ? 'Açıldı' : `${current} / ${achievement.target}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

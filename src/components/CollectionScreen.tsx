import { useState } from 'react';
import { EVENT_CARDS } from '@/data/events';
import { PLAYER_POOL } from '@/data/players';
import { getPlayerArchetype } from '@/data/archetypes';
import { countUnlockedAchievements, getAchievementState } from '@/engine/achievements';
import { UiIcon, type UiIconName } from '@/components/UiIcon';
import { getPersistedStats, useGameStore } from '@/store/gameStore';

type Tab = 'efsane' | 'olay' | 'basarim';

const TAB_META: [Tab, string, UiIconName][] = [
  ['efsane', 'Efsaneler', 'trophy'],
  ['olay', 'Olaylar', 'book-open'],
  ['basarim', 'Başarımlar', 'medal'],
];

/** Olay kategorisi → ortak ikon seti (kart verisindeki emoji yerine) */
const EVENT_CATEGORY_ICON: Record<string, UiIconName> = {
  transfer: 'arrow-right',
  taktik: 'clipboard',
  moral: 'heart',
  fiziksel: 'shield',
  ozel: 'sparkles',
};

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
  const collectionStats = [
    { label: 'Efsane', value: legendOpen, total: LEGEND_POOL.length, tone: 'gold' },
    { label: 'Olay', value: eventOpen, total: EVENT_CARDS.length, tone: 'cyan' },
    { label: 'Başarım', value: achievementCount.unlocked, total: achievementCount.total, tone: 'rose' },
  ] as const;

  return (
    <div className="game-shell page-screen">
      <div className="page-screen-inner page-screen-inner--wide">
        <button type="button" className="btn-secondary page-screen-back" onClick={() => setScreen('menu')}>← Ana Menü</button>

        <header className="page-screen-header">
          <span className="page-screen-eyebrow">Kulüp arşivi</span>
          <h1>Koleksiyon</h1>
          <p>Her run, kulüp arşivinde kalıcı bir iz bırakır.</p>
        </header>

        <div className="collection-progress-head">
          {collectionStats.map((item) => {
            const percent = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
            return (
              <div key={item.label} className={`collection-stat collection-stat--${item.tone}`}>
                <div className="collection-stat-top">
                  <div>
                    <div className="collection-stat-value">{item.value}<span>/{item.total}</span></div>
                    <div className="collection-stat-label">{item.label}</div>
                  </div>
                  <span className="collection-stat-percent">%{percent}</span>
                </div>
                <div className="collection-stat-bar" aria-label={`${item.label} ilerlemesi yüzde ${percent}`}>
                  <span style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="page-screen-tabs">
          {TAB_META.map(([id, label, icon]) => (
            <button
              key={id}
              type="button"
              className={`btn-secondary collection-tab ${tab === id ? 'btn-secondary--active' : ''}`}
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
            >
              <UiIcon name={icon} />
              {label}
            </button>
          ))}
        </div>

        <div className="collection-section-intro">
          <span>{tab === 'efsane' ? 'Oyuncu vitrini' : tab === 'olay' ? 'Sezon günlüğü' : 'Kariyer hedefleri'}</span>
          <p>{tab === 'efsane' ? 'Çektiğin efsaneler burada görünür.' : tab === 'olay' ? 'Karşılaştığın olay kartları arşive eklenir.' : 'Hedefleri tamamladıkça rozetler açılır.'}</p>
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
                  <div className="collection-tile-icon">
                    <UiIcon name={ok ? (p.signature ? 'sparkles' : 'trophy') : 'lock'} />
                  </div>
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
                  <div className="collection-tile-icon">
                    <UiIcon name={ok ? (EVENT_CATEGORY_ICON[e.category] ?? 'circle-dot') : 'lock'} />
                  </div>
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
                <span className="achievement-icon" aria-hidden>
                  <UiIcon name={unlocked ? achievement.icon : 'lock'} />
                </span>
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

import { useState } from 'react';
import { EVENT_CARDS } from '@/data/events';
import { PLAYER_POOL } from '@/data/players';
import { getPlayerArchetype } from '@/data/archetypes';
import { countUnlockedAchievements, getAchievementState } from '@/engine/achievements';
import { getUnlockStatuses } from '@/engine/unlocks';
import { buildMonthlyLegendCard } from '@/engine/monthlyLegend';
import { getSeasonLabel } from '@/engine/hallOfFame';
import { UiIcon, type UiIconName } from '@/components/UiIcon';
import { getPersistedStats, useGameStore } from '@/store/gameStore';
import { POSITION_BADGE, POSITION_LABELS } from '@/utils/positionStyle';
import { iconForTag } from '@/utils/gameIcons';
import type { EventCard, PlayerCard } from '@/types';
import type { UnlockRewardKind } from '@/engine/unlocks';

type Tab = 'kilit' | 'efsane' | 'olay' | 'basarim';

const TAB_META: [Tab, string, UiIconName][] = [
  ['kilit', 'Kilitli İçerik', 'lock'],
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

const EVENT_TEASERS: Record<EventCard['category'], { label: string; theme: string }> = {
  transfer: { label: 'Transfer', theme: 'Kadro kararı' },
  taktik: { label: 'Taktik', theme: 'Maç planı' },
  moral: { label: 'Moral', theme: 'Takım dengesi' },
  fiziksel: { label: 'Fiziksel', theme: 'Hazırlık sınavı' },
  ozel: { label: 'Özel', theme: 'Nadir karşılaşma' },
};

function getRatingBand(rating: number): string {
  if (rating >= 90) return '90+ rating';
  if (rating >= 88) return '88–89 rating';
  if (rating >= 85) return '85–87 rating';
  return '84 ve altı';
}

const MECHANIC_DESCRIPTIONS: Record<string, string> = {
  mechanic_hedefli_scout: 'Serbest Modda run başına bir kez mevki seçerek ücretsiz oyuncu ararsın.',
  mechanic_kriz_kontrati: 'Kadro 5 kişiye düştüğünde toparlanma oyuncusu teklifini garanti eder.',
};

function PlayerReveal({ player }: { player: PlayerCard }) {
  return (
    <div className="collection-card-reveal collection-player-reveal">
      <div className="collection-player-score">
        <strong>{player.currentRating}</strong>
        <span>{POSITION_BADGE[player.position]}</span>
      </div>
      <div className="collection-player-copy">
        <span>{POSITION_LABELS[player.position]}</span>
        <div className="collection-player-tags">
          {player.tags.slice(0, 4).map((tag) => (
            <span key={tag}><UiIcon name={iconForTag(tag)} />{tag}</span>
          ))}
        </div>
        {player.signatureQuote && <q>{player.signatureQuote}</q>}
      </div>
    </div>
  );
}

function EventReveal({ event }: { event: EventCard }) {
  return (
    <div className="collection-card-reveal collection-event-reveal">
      <p>{event.description}</p>
      <div className="collection-event-options">
        <span><strong>{event.optionA.label}</strong>{event.optionA.description}</span>
        <span><strong>{event.optionB.label}</strong>{event.optionB.description}</span>
      </div>
    </div>
  );
}

function UnlockRewardPreview({
  kind,
  contentId,
  name,
  unlocked,
}: {
  kind: UnlockRewardKind;
  contentId: string;
  name: string;
  unlocked: boolean;
}) {
  const player = kind === 'player' ? PLAYER_POOL.find((candidate) => candidate.id === contentId) : undefined;
  const event = kind === 'event' ? EVENT_CARDS.find((candidate) => candidate.id === contentId) : undefined;
  const kindLabel = kind === 'player' ? 'Açılacak oyuncu' : kind === 'event' ? 'Açılacak olay' : 'Açılacak mekanik';
  const eventTeaser = event ? EVENT_TEASERS[event.category] : undefined;

  return (
    <div className={`unlock-reward-preview unlock-reward-preview--${kind} ${unlocked ? 'unlock-reward-preview--revealed' : 'unlock-reward-preview--teaser'}`} tabIndex={0}>
      <div className="unlock-reward-preview-head">
        <span>{kindLabel}</span>
        <strong>{unlocked || kind === 'mechanic' ? name : kind === 'player' ? 'Gizli imza' : 'Gizli olay'}</strong>
      </div>
      {player && unlocked && (
        <>
          <p>{player.currentRating} rating · {POSITION_BADGE[player.position]} · {POSITION_LABELS[player.position]}</p>
          <PlayerReveal player={player} />
        </>
      )}
      {player && !unlocked && (
        <div className="unlock-reward-teaser-line">
          <span>{POSITION_BADGE[player.position]} · {getRatingBand(player.currentRating)}</span>
          <small>{player.tags.length} trait</small>
        </div>
      )}
      {event && unlocked && <EventReveal event={event} />}
      {event && !unlocked && eventTeaser && (
        <div className="unlock-reward-teaser-line">
          <span>{eventTeaser.label} · {eventTeaser.theme}</span>
          <small>2 karar yolu</small>
        </div>
      )}
      {kind === 'mechanic' && <p>{MECHANIC_DESCRIPTIONS[contentId] ?? 'Serbest Modda yeni bir oyun kuralı açar.'}</p>}
    </div>
  );
}

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
  const monthlyLegendRecord = useGameStore((s) => s.monthlyLegend);
  const [tab, setTab] = useState<Tab>('kilit');

  const seenEvents = new Set(stats.seenEvents);
  const collectedLegends = new Set(stats.collectedLegends);
  const monthlyLegendCard = buildMonthlyLegendCard(monthlyLegendRecord);
  const legendPool = monthlyLegendCard
    ? [monthlyLegendCard, ...LEGEND_POOL.filter((player) => player.id !== monthlyLegendCard.id)]
    : LEGEND_POOL;

  const legendOpen = legendPool.filter((p) => collectedLegends.has(p.name)).length;
  const eventOpen = EVENT_CARDS.filter((e) => seenEvents.has(e.id)).length;
  const achievements = getAchievementState(stats);
  const achievementCount = countUnlockedAchievements(stats);
  const unlockStatuses = getUnlockStatuses(stats.unlocks);
  const unlockedContentCount = unlockStatuses.filter((status) => status.unlocked).length;
  const unlockNameById = new Map(unlockStatuses.map((status) => [status.unlock.id, status.unlock.name]));
  const collectionStats = [
    { label: 'İçerik', value: unlockedContentCount, total: unlockStatuses.length, tone: 'violet' },
    { label: 'Efsane', value: legendOpen, total: legendPool.length, tone: 'gold' },
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
          <span>{tab === 'kilit' ? 'Kalıcı ilerleme' : tab === 'efsane' ? 'Oyuncu vitrini' : tab === 'olay' ? 'Sezon günlüğü' : 'Kariyer hedefleri'}</span>
          <p>{tab === 'kilit' ? 'Serbest Mod hedeflerini tamamla; yeni oyuncu, olay ve mekanikler sonraki runlar için açılsın.' : tab === 'efsane' ? 'Çektiğin efsaneler burada görünür.' : tab === 'olay' ? 'Karşılaştığın olay kartları arşive eklenir.' : 'Hedefleri tamamladıkça rozetler açılır.'}</p>
        </div>

        {tab === 'kilit' && (
          <div className="unlock-collection-grid">
            {unlockStatuses.map((status) => {
              const rewardLabel = status.unlock.reward.kind === 'player'
                ? 'Oyuncu'
                : status.unlock.reward.kind === 'event'
                  ? 'Olay'
                  : 'Mekanik';
              const blockedBy = status.blockedByUnlockId ? unlockNameById.get(status.blockedByUnlockId) : undefined;
              return (
                <article
                  key={status.unlock.id}
                  className={`unlock-collection-card ${status.unlocked ? 'unlock-collection-card--open' : ''}`}
                >
                  <div className="unlock-collection-head">
                    <span className={`unlock-reward-kind unlock-reward-kind--${status.unlock.reward.kind}`}>
                      <UiIcon name={status.unlocked ? 'check' : status.unlock.reward.kind === 'player' ? 'user' : status.unlock.reward.kind === 'event' ? 'book-open' : 'sparkles'} />
                      {rewardLabel}
                    </span>
                    <strong>{status.unlocked ? 'Açıldı' : `%${status.percent}`}</strong>
                  </div>
                  <h2>{status.unlock.name}</h2>
                  <p>{status.unlock.description}</p>
                  <div className="unlock-progress-bar" aria-label={`${status.unlock.name} ilerlemesi yüzde ${status.percent}`}>
                    <span style={{ width: `${status.percent}%` }} />
                  </div>
                  <div className="unlock-collection-foot">
                    <span>{status.unlocked ? 'Tamamlandı' : blockedBy ? `Önce: ${blockedBy}` : `${status.current} / ${status.unlock.target}`}</span>
                  </div>
                  <UnlockRewardPreview {...status.unlock.reward} unlocked={status.unlocked} />
                </article>
              );
            })}
          </div>
        )}

        {tab === 'efsane' && (
          <>
            {monthlyLegendCard && monthlyLegendRecord && (
              <p className="collection-monthly-legend-note">
                <UiIcon name="trophy" /> {getSeasonLabel(monthlyLegendRecord.sourceMonthKey)} şampiyonu
                <strong>{monthlyLegendCard.name}</strong> bu ay iki modun ortak havuzunda.
              </p>
            )}
            <div className="collection-grid">
            {legendPool.map((p) => {
              const ok = collectedLegends.has(p.name);
              const arch = getPlayerArchetype(p);
              const ratingBand = getRatingBand(p.currentRating);
              const lockedLabel = `Kilitli oyuncu kartı · ${POSITION_BADGE[p.position]} · ${ratingBand} · ${p.tags.length} trait`;
              return (
                <article
                  key={p.id}
                  className={`collection-tile ${ok ? '' : 'collection-tile--locked'}`}
                  style={ok && p.signature && p.signatureColor ? { borderColor: p.signatureColor } : undefined}
                  tabIndex={ok ? 0 : undefined}
                  aria-label={ok ? `${p.name} kart detayı` : lockedLabel}
                >
                  <div className="collection-tile-icon">
                    <UiIcon name={ok ? (p.signature ? 'sparkles' : 'trophy') : 'lock'} />
                  </div>
                  <div className="collection-tile-name">{ok ? p.name : 'Gizli imza'}</div>
                  <div className="collection-tile-sub">
                    {ok ? `${POSITION_BADGE[p.position]} · ${arch.label}` : `${POSITION_BADGE[p.position]} · ${ratingBand}`}
                  </div>
                  {!ok && <span className="collection-lock-clue">{p.tags.length} trait</span>}
                  {ok && <PlayerReveal player={p} />}
                </article>
              );
            })}
            </div>
          </>
        )}

        {tab === 'olay' && (
          <div className="collection-grid">
            {EVENT_CARDS.map((e) => {
              const ok = seenEvents.has(e.id);
              const teaser = EVENT_TEASERS[e.category];
              return (
                <article
                  key={e.id}
                  className={`collection-tile ${ok ? '' : 'collection-tile--locked'}`}
                  tabIndex={ok ? 0 : undefined}
                  aria-label={ok ? `${e.title} olay detayı` : `Kilitli olay · ${teaser.label} · ${teaser.theme}`}
                >
                  <div className="collection-tile-icon">
                    <UiIcon name={ok ? (EVENT_CATEGORY_ICON[e.category] ?? 'circle-dot') : 'lock'} />
                  </div>
                  <div className="collection-tile-name">{ok ? e.title : 'Gizli olay'}</div>
                  <div className="collection-tile-sub">{ok ? teaser.label : `${teaser.label} · ${teaser.theme}`}</div>
                  {!ok && <span className="collection-lock-clue">2 karar yolu</span>}
                  {ok && <EventReveal event={e} />}
                </article>
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

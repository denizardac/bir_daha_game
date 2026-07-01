import type { CSSProperties } from 'react';
import { formatAltPositionsBadge } from '@/data/positionFlexibility';
import { getPlayerArchetype } from '@/data/archetypes';
import { TAG_DESCRIPTIONS } from '@/data/tags';
import { getPlayerCardInsight } from '@/engine/cardInsights';
import { HoverTip } from '@/components/HoverTip';
import { UiIcon } from '@/components/UiIcon';
import { RARITY_COLORS, RARITY_LABELS } from '@/types';
import type { ActiveTactic, PlayerCard } from '@/types';
import { POSITION_BADGE, POSITION_LABELS, TAG_AVATAR_BG, getPositionRoleColor, getPositionRoleColorByBadge } from '@/utils/positionStyle';
import { iconForTag } from '@/utils/gameIcons';

const RATING_COLOR: Record<string, string> = {
  normal: '#6b7280',
  iyi: '#f6cf6a',
  güçlü: '#fbbf24',
  efsane: '#ef4444',
};

export type CardPickMode = 'cards' | 'training';

type Props = {
  offers: PlayerCard[];
  squad: PlayerCard[];
  discovered: string[];
  maxSquadSize: number;
  activeTactics: ActiveTactic[];
  morale: number;
  rerollsRemaining: number;
  locked?: boolean;
  rerollKey: number;
  onSelect: (offer: PlayerCard) => void;
  onReroll: (slotIndex: number) => void;
};

function pickSummary(text: string, card: PlayerCard) {
  const firstEleven = text.match(/İlk 11'de ([^ ·(]+)(?: \(([^)]+)\))? slotuna girer/i);
  if (firstEleven) {
    const slot = firstEleven[1] ?? '';
    const qualifier = firstEleven[2] ?? '';
    const lower = text.toLocaleLowerCase('tr-TR');
    const mainBadge = POSITION_BADGE[card.position];
    const isSideSlot = Boolean(slot && slot !== mainBadge);
    return {
      inLineup: true,
      mainLine: "İlk 11'e girer",
      slot,
      isFlexFit: isSideSlot || qualifier.toLocaleLowerCase('tr-TR').includes('yan') || lower.includes('yan mevki') || lower.includes('alternatif'),
      hint: '',
    };
  }
  if (text.toLocaleLowerCase('tr-TR').includes('yedek')) {
    return {
      inLineup: false,
      mainLine: 'Yedek kalır',
      slot: '',
      isFlexFit: false,
      hint: '',
    };
  }
  return {
    inLineup: true,
    mainLine: 'Kadroya girer',
    slot: '',
    isFlexFit: false,
    hint: text.split(' · ')[0] ?? text,
  };
}

function getTagTip(tag: PlayerCard['tags'][number]) {
  return TAG_DESCRIPTIONS[tag] ?? tag;
}

function gradientColor(value: string): string {
  const colors = [...value.matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => m[0]);
  return colors[1] ?? colors[0] ?? '#8a948f';
}

function tagPillStyle(tag: PlayerCard['tags'][number]): CSSProperties {
  const color = gradientColor(TAG_AVATAR_BG[tag] ?? '');
  return {
    color,
    background: `${color}14`,
    borderColor: `${color}55`,
  };
}

function positionBadgeStyle(color: string, filled: boolean): CSSProperties {
  return filled
    ? { color: '#061412', background: color, borderColor: color }
    : { color, background: `${color}10`, borderColor: `${color}8a` };
}

export function PlayerCardCompareGrid({
  offers,
  squad,
  discovered,
  maxSquadSize,
  activeTactics,
  morale,
  rerollsRemaining,
  locked,
  rerollKey,
  onSelect,
  onReroll,
}: Props) {
  return (
    <div className="card-compare-wrap">
      <div className="card-compare-grid">
        <div className="card-compare-labels-col">
          <div className="card-compare-label-spacer" />
          <div className="card-compare-row-label">Mevki</div>
          <div className="card-compare-row-label card-compare-row-label--ilk11">İlk 11</div>
          <div className="card-compare-row-label card-compare-row-label--syn">Sinerji</div>
        </div>

        {offers.map((offer, slotIndex) => {
          const insight = getPlayerCardInsight(offer, squad, discovered, maxSquadSize, activeTactics, morale);
          const visibleSynergies = insight.synergies;
          const archetype = getPlayerArchetype(offer);
          const summary = pickSummary(insight.summary, offer);
          const altPositions = formatAltPositionsBadge(offer.position)?.split(' · ').filter(Boolean) ?? [];
          const rarityColor = RARITY_COLORS[offer.rarity];
          const ratingColor = RATING_COLOR[offer.rarity] ?? '#e5e7eb';
          const badgeIcon = offer.tags.length > 0 ? iconForTag(offer.tags[0]) : 'circle-dot';
          return (
            <article
              key={`${offer.id}-${rerollKey}-${slotIndex}`}
              className="card-compare-col"
              style={{ '--compare-rarity': rarityColor } as CSSProperties}
            >
              <div className="card-compare-rarity-bar" style={{ background: rarityColor }} />
              <div className="card-compare-card-header">
                <div className="card-compare-card-top">
                  <span
                    className="card-compare-rarity-badge"
                    style={{
                      color: rarityColor,
                      borderColor: `${rarityColor}66`,
                      background: `${rarityColor}12`,
                    }}
                  >
                    <UiIcon name={badgeIcon} className="card-compare-rarity-badge-icon" />
                    {RARITY_LABELS[offer.rarity]} · {archetype.label}
                  </span>
                  <button
                    type="button"
                    className="card-compare-reroll-slot"
                    disabled={locked || rerollsRemaining <= 0}
                    onClick={() => onReroll(slotIndex)}
                    aria-label={`${offer.name} kartını yenile`}
                    title={rerollsRemaining <= 0 ? 'Yenileme hakkın kalmadı' : 'Bu kartı yenile'}
                  >
                    <UiIcon name="refresh" />
                  </button>
                </div>
                <div className="card-compare-name-row">
                  <h3 className="card-compare-name">{offer.name}</h3>
                  <span className="card-compare-rating" style={{ color: ratingColor }}>{offer.currentRating}</span>
                </div>
                {offer.tags.length > 0 && (
                  <div className="card-compare-tags">
                    {offer.tags.map((tag) => (
                      <HoverTip key={tag} tip={getTagTip(tag)} placement="top" className="card-pick-trait-wrap">
                        <span
                          className={`card-pick-trait-pill tag-trait-badge tag-trait-badge--${tag.replace(/\s+/g, '-')}`}
                          style={tagPillStyle(tag)}
                        >
                          <UiIcon name={iconForTag(tag)} className="tag-trait-icon" />
                          <span className="tag-trait-name">{tag}</span>
                        </span>
                      </HoverTip>
                    ))}
                  </div>
                )}
              </div>

              {offer.signature && offer.signatureQuote && (
                <p
                  className="card-compare-signature"
                  style={offer.signatureColor ? { borderColor: offer.signatureColor, color: offer.signatureColor } : undefined}
                >
                  {offer.signatureQuote}
                </p>
              )}

              <div className="card-compare-mevki-row">
                <span
                  className="card-compare-pos-badge"
                  title={POSITION_LABELS[offer.position]}
                  style={positionBadgeStyle(getPositionRoleColor(offer.position), true)}
                >
                  {POSITION_BADGE[offer.position]}
                </span>
                {altPositions.map((pos) => {
                  return (
                    <span
                      key={pos}
                      className="card-compare-pos-badge card-compare-pos-badge--secondary"
                      style={positionBadgeStyle(getPositionRoleColorByBadge(pos), false)}
                    >
                      {pos}
                    </span>
                  );
                })}
              </div>

              <div className="card-compare-ilk11-row">
                <span className={`card-compare-ilk11-status ${summary.inLineup ? 'card-compare-ilk11-status--in' : 'card-compare-ilk11-status--bench'}`}>
                  <span className={`card-compare-status-dot ${summary.inLineup ? 'card-compare-status-dot--green' : 'card-compare-status-dot--red'}`} />
                  {summary.mainLine}
                </span>
                {summary.isFlexFit && summary.slot ? (
                  <span className="card-compare-ilk11-hint card-compare-ilk11-hint--warn">
                    <UiIcon name="alert-triangle" />
                    {summary.slot} slotu · yan mevki
                  </span>
                ) : summary.hint ? (
                  <span className={`card-compare-ilk11-hint ${summary.inLineup ? 'card-compare-ilk11-hint--muted' : 'card-compare-ilk11-hint--warn'}`}>
                    {summary.inLineup ? <UiIcon name="info" /> : <UiIcon name="info" />}
                    {summary.hint}
                  </span>
                ) : null}
              </div>

              <div className="card-compare-synergy-section">
                {visibleSynergies.length > 0 ? (
                  visibleSynergies.slice(0, 2).map((s) => {
                    const beforePct = Math.min(100, (s.before / s.required) * 100);
                    const afterPct = Math.min(100, (s.after / s.required) * 100);
                    const deltaPct = Math.max(0, afterPct - beforePct);
                    const leftPct = Math.min(beforePct, 100);
                    const missing = Math.max(0, s.required - s.after);
                    const synergyTip = `${s.description}\n${s.completes ? 'Bu seçim sinerjiyi açar.' : s.contribution}\n${s.reward}`;
                    return (
                      <div key={s.name} className={`card-compare-syn-item ${s.completes ? 'card-compare-syn-item--unlock' : ''}`}>
                        <div className="card-compare-syn-head">
                          <HoverTip tip={synergyTip} placement="top" className="card-compare-syn-name-tip">
                            <span className="card-compare-syn-name">{s.name}</span>
                          </HoverTip>
                          <span className="card-compare-syn-progress">
                            {s.before}→{s.after}<span className="card-compare-syn-required">/{s.required}</span>
                          </span>
                        </div>
                        <div className="card-compare-syn-bar">
                          <span className="card-compare-syn-bar-before" style={{ width: `${beforePct}%` }} />
                          <span
                            className={`card-compare-syn-bar-delta ${s.completes ? 'card-compare-syn-bar-delta--complete' : ''}`}
                            style={{ left: `${leftPct}%`, width: `${deltaPct}%` }}
                          />
                        </div>
                        <span className={`card-compare-syn-hint ${s.completes ? 'card-compare-syn-hint--unlock' : ''}`}>
                          {s.completes ? 'Seçince açılır' : `${missing} eksik kalır`}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <span className="card-compare-syn-empty">
                    <UiIcon name="circle-dot" />
                    Sinerji yok
                  </span>
                )}
              </div>

              <div className="card-compare-select-area">
                <button
                  type="button"
                  className="card-compare-select-btn"
                  disabled={locked}
                  onClick={() => onSelect(offer)}
                >
                  Seç
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

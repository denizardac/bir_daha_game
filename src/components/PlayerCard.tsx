import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatAltPositionsBadge } from '@/data/positionFlexibility';
import { getPlayerArchetype } from '@/data/archetypes';
import { getPlayerCardInsight } from '@/engine/cardInsights';
import { ReplacementPlayerTip } from '@/components/ReplacementPlayerTip';
import { HoverTip } from '@/components/HoverTip';
import { PlayerPortrait } from '@/components/PlayerPortrait';
import { TagTraitBadges } from '@/components/TagTraitBadges';
import { GameIcon } from '@/components/GameIcon';
import { TAG_DESCRIPTIONS, TAG_ICONS } from '@/data/tags';
import type { ActiveTactic, PlayerCard as PlayerCardType } from '@/types';
import { RARITY_LABELS } from '@/types';
import { POSITION_LABELS, POSITION_BADGE, formatPosition } from '@/utils/positionStyle';
import { getPlayerCardThemeClass, getPlayerCardThemeVars } from '@/utils/playerCardTheme';

interface Props {
  card: PlayerCardType;
  squad: PlayerCardType[];
  discovered: string[];
  maxSquadSize?: number;
  activeTactics?: ActiveTactic[];
  morale?: number;
  onSelect?: () => void;
  selected?: boolean;
  showTagHint?: boolean;
  tipPlacement?: 'left' | 'right' | 'auto';
  onReroll?: () => void;
  rerollDisabled?: boolean;
}

function SynergyRow({ s }: { s: ReturnType<typeof getPlayerCardInsight>['synergies'][number] }) {
  const pctBefore = Math.min(100, (s.before / s.required) * 100);
  const pctAfter = Math.min(100, (s.after / s.required) * 100);

  return (
    <div className={`card-synergy-row ${s.completes ? 'card-synergy-row--complete' : ''}`}>
      <p className="card-synergy-name">
        <span className="card-synergy-badge" aria-hidden />
        {s.name}
        {s.completes && <span className="card-synergy-unlock">AÇILIR</span>}
      </p>
      <p className="card-synergy-desc">{s.description}</p>
      <div className="card-synergy-progress-row">
        <span className="card-synergy-count">{s.before}/{s.required}</span>
        <span className="card-synergy-arrow">→</span>
        <span className="card-synergy-count card-synergy-count--after">{s.after}/{s.required}</span>
      </div>
      <div className="card-synergy-bar-track">
        <div className="card-synergy-bar-before" style={{ width: `${pctBefore}%` }} />
        <div className="card-synergy-bar-after" style={{ width: `${pctAfter}%` }} />
      </div>
      <p className="card-synergy-reward">
        {s.completes ? `Bonus: ${s.reward}` : `Tamamlanınca: ${s.reward}`}
      </p>
    </div>
  );
}

function getCompactImpactLines(
  card: PlayerCardType,
  insight: ReturnType<typeof getPlayerCardInsight>,
) {
  const summaryParts = insight.summary.split(' · ').filter(Boolean);
  const primary = summaryParts[0] ?? `Kadroya ${formatPosition(card.position)} olarak girer`;
  const synergy = insight.synergies[0];
  const secondary = synergy
    ? `${synergy.name}: ${synergy.before}/${synergy.required} -> ${synergy.after}/${synergy.required}${synergy.completes ? ' · açılır' : ''}`
    : summaryParts[1] ?? `${formatPosition(card.position)} rolünde kadro gücünü artırır`;

  return [primary, secondary];
}

export function PlayerCard({ card, squad, discovered, maxSquadSize = 11, activeTactics = [], morale = 50, onSelect, selected, showTagHint, tipPlacement = 'auto', onReroll, rerollDisabled }: Props) {
  const insight = getPlayerCardInsight(card, squad, discovered, maxSquadSize, activeTactics, morale);
  const themeVars = getPlayerCardThemeVars(card.rarity, card.position);
  const themeClass = getPlayerCardThemeClass(card.rarity, card.position);
  const altPos = formatAltPositionsBadge(card.position);
  const archetype = getPlayerArchetype(card);
  const hasDetail = insight.positionHints.length > 0 || insight.synergies.length > 0 || insight.tacticContributions.length > 0;
  const [showDetail, setShowDetail] = useState(false);
  const compactImpact = getCompactImpactLines(card, insight);

  return (
    <motion.div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (!onSelect) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-label={onSelect ? `${card.name}, rating ${card.currentRating}, ${formatPosition(card.position)}` : undefined}
      className={`card-fut card-fut--pick player-pick-card ${themeClass} relative flex w-full flex-col text-left ${
        onSelect ? 'player-pick-card--selectable' : ''
      } ${selected ? 'ring-2 ring-amber-400 gold-glow' : ''}`}
      style={themeVars}
      whileTap={undefined}
    >
      <div className="rarity-bar player-pick-card__bar" />
      {card.signature && (
        <span
          className="signature-ribbon"
          style={card.signatureColor ? { background: card.signatureColor } : undefined}
          title="İmza kart"
        >
          ✒ İMZA
        </span>
      )}
      <div className="player-pick-card__rarity-row">
        <div className="player-pick-card__rarity-main">
          <span className={`player-pick-card__rarity-label rarity-badge rarity-badge--${card.rarity}`}>
            {RARITY_LABELS[card.rarity]}
          </span>
          <span className="archetype-badge" title={archetype.label}>
            <span aria-hidden><GameIcon legacyIcon={archetype.icon} size={13} /></span> {archetype.label}
          </span>
          {card.rarity === 'efsane' && <span className="rarity-spark" aria-hidden>✦</span>}
        </div>
        {onReroll && (
          <button
            type="button"
            className="btn-reroll-slot btn-reroll-slot--in-card"
            disabled={rerollDisabled}
            title={rerollDisabled ? 'Yenileme hakkın kalmadı' : 'Bu kartı yenile (−1 hak)'}
            aria-label={`${card.name} kartını yenile`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (rerollDisabled) return;
              onReroll();
            }}
          >
            <GameIcon name="refresh" size={15} />
          </button>
        )}
      </div>

      <div className="card-body">
        <div className="card-pick-top">
          <div className="card-pick-hero card-pick-hero--compact">
            <PlayerPortrait player={card} size="sm" />
            <div className="card-pick-hero-body">
              <h3 className="player-name">{card.name}</h3>
              <div className="card-pick-stat-strip">
                <span className="card-pick-stat card-pick-stat--rating">{card.currentRating}</span>
                <span
                  className="card-pick-stat card-pick-stat--pos"
                  title={POSITION_LABELS[card.position]}
                >
                  {POSITION_BADGE[card.position]}
                </span>
                {altPos?.split(' · ').map((pos) => (
                  <span key={pos} className="card-pick-stat card-pick-stat--alt">{pos}</span>
                ))}
              </div>
          {card.tags.length > 0 && (
            <div className="card-pick-trait-row">
                  {card.tags.slice(0, 3).map((tag) => (
                    <HoverTip key={tag} tip={TAG_DESCRIPTIONS[tag]} className="card-pick-trait-wrap" placement={tipPlacement}>
                      <span className={`card-pick-trait-pill tag-trait-badge tag-trait-badge--${tag.replace(/\s+/g, '-')}`}>
                        <span className="tag-trait-icon" aria-hidden><GameIcon legacyIcon={TAG_ICONS[tag]} size={13} /></span>
                        <span className="tag-trait-name">{tag}</span>
                      </span>
                    </HoverTip>
                  ))}
                  {card.tags.length > 3 && <span className="tag-trait-badge tag-trait-badge--more">+{card.tags.length - 3}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="card-pick-body-scroll"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="card-pick-scroll">
            {showTagHint && card.tags[0] && (
              <p className="hint-flash">Aynı tag&apos;ler sinerji açar — Sinerji butonundan ilerlemeyi gör</p>
            )}

            {card.signature && card.signatureQuote && (
              <p className="signature-quote" style={card.signatureColor ? { borderColor: card.signatureColor } : undefined}>
                “{card.signatureQuote}”
              </p>
            )}

            <div className="card-insight card-insight--player card-pick-core">
              <p className="card-insight-title">Seçersen</p>
              {insight.replacedPlayer ? (
                <ReplacementPlayerTip player={insight.replacedPlayer} kind={insight.replacementKind ?? 'squad'}>
                  <p className="card-insight-line card-insight-line--lead card-insight-line--hoverable">
                    {compactImpact[0]}
                  </p>
                </ReplacementPlayerTip>
              ) : (
                <p className="card-insight-line card-insight-line--lead">{compactImpact[0]}</p>
              )}
              <p className="card-insight-line card-insight-line--compact">{compactImpact[1]}</p>
              {insight.tagBites.length > 0 && (
                <ul className="card-tag-bites card-tag-bites--compact">
                  {insight.tagBites.slice(0, 2).map(({ tag, desc }) => (
                    <li key={tag} className="card-tag-bite">
                      <HoverTip tip={desc} className="tag-trait-badge-wrap" placement={tipPlacement}>
                        <span className={`tag-trait-badge tag-trait-badge--${tag.replace(/\s+/g, '-')}`}>
                          <span className="tag-trait-icon" aria-hidden><GameIcon legacyIcon={TAG_ICONS[tag]} size={13} /></span>
                          <span className="tag-trait-name">{tag}</span>
                        </span>
                      </HoverTip>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {hasDetail && (
              <button
                type="button"
                className="card-insight-toggle"
                aria-expanded={showDetail}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetail((v) => !v);
                }}
              >
                Detay
              </button>
            )}
          </div>
        </div>
      </div>

      {onSelect && (
        <div className="card-pick-footer">
          {hasDetail && (
            <button
              type="button"
              className="card-detail-footer-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDetail(true);
              }}
            >
              Detay
            </button>
          )}
          <p className="select-cta">SEÇ</p>
        </div>
      )}
      {showDetail && (
        <div className="ui-modal-backdrop" role="presentation" onClick={(e) => { e.stopPropagation(); setShowDetail(false); }}>
          <div className="ui-modal player-detail-modal" role="dialog" aria-modal="true" aria-label={`${card.name} detayı`} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="ui-modal-close" aria-label="Kapat" onClick={() => setShowDetail(false)}>x</button>
            <div className="player-detail-head">
              <PlayerPortrait player={card} size="sm" />
              <div>
                <p className="card-insight-title">Kart detayı</p>
                <h2>{card.name}</h2>
                <p>{card.currentRating} · {formatPosition(card.position)}</p>
              </div>
            </div>
            <div className="card-pick-extra card-pick-extra--open">
              {insight.tacticContributions.length > 0 && activeTactics.length > 0 && (
                <div className="card-tactic-contrib-block">
                  <p className="card-insight-subtitle">Taktik katkısı</p>
                  {insight.tacticContributions.map((t) => (
                    <div key={t.tacticName} className="card-tactic-contrib-row">
                      <p className="card-tactic-contrib-name">{t.tacticName}</p>
                      {t.lines.map((line) => (
                        <p key={line} className="card-insight-line card-insight-line--bullet">{line}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {insight.positionHints.length > 0 && (
                <div className="card-position-hints">
                  <p className="card-insight-subtitle">Mevki & diziliş</p>
                  <ul className="card-position-hint-list">
                    {insight.positionHints.map((hint) => (
                      <li key={hint.text} className={`card-position-hint card-position-hint--${hint.tone}`}>
                        {hint.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {insight.synergies.length > 0 && (
                <div className="card-synergy-block">
                  <p className="card-insight-subtitle">Sinerjiye katkı</p>
                  {insight.synergies.map((s) => (
                    <SynergyRow key={s.name} s={s} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function PlayerCardMini({ card }: { card: PlayerCardType }) {
  const themeVars = getPlayerCardThemeVars(card.rarity, card.position);
  const themeClass = getPlayerCardThemeClass(card.rarity, card.position);

  return (
    <div
      className={`player-pick-card player-pick-card--mini ${themeClass} flex items-center gap-3 rounded-xl border-2 p-3`}
      style={themeVars}
    >
      <PlayerPortrait player={card} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold">{card.name}</p>
        <p className="text-sm text-neutral-400">
          {formatPosition(card.position)} · {card.currentRating}
        </p>
      </div>
      {card.tags.length > 0 && <TagTraitBadges tags={card.tags} compact />}
    </div>
  );
}

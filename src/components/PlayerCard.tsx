import { motion } from 'framer-motion';
import { formatAltPositionsBadge } from '@/data/positionFlexibility';
import { getPlayerCardInsight } from '@/engine/cardInsights';
import { ReplacementPlayerTip } from '@/components/ReplacementPlayerTip';
import { HoverTip } from '@/components/HoverTip';
import { PlayerPortrait } from '@/components/PlayerPortrait';
import { TagTraitBadges } from '@/components/TagTraitBadges';
import { TAG_ICONS } from '@/data/tags';
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

export function PlayerCard({ card, squad, discovered, maxSquadSize = 11, activeTactics = [], morale = 50, onSelect, selected, showTagHint, tipPlacement = 'auto' }: Props) {
  const insight = getPlayerCardInsight(card, squad, discovered, maxSquadSize, activeTactics, morale);
  const primaryWarn = insight.positionHints.find((h) => h.tone === 'warn');
  const themeVars = getPlayerCardThemeVars(card.rarity, card.position);
  const themeClass = getPlayerCardThemeClass(card.rarity, card.position);
  const altPos = formatAltPositionsBadge(card.position);

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
      <div className="player-pick-card__rarity-row">
        <span className={`player-pick-card__rarity-label rarity-badge rarity-badge--${card.rarity}`}>
          {RARITY_LABELS[card.rarity]}
        </span>
        {card.offerBoosted && (
          <span className="player-pick-card__boost-badge" title="Teklif kalitesi yükseltildi">⬆ Teklif</span>
        )}
        {card.rarity === 'efsane' && <span className="rarity-spark" aria-hidden>✦</span>}
      </div>

      <div className="card-body">
        <div className="card-pick-top">
          <div className="card-pick-hero">
            <PlayerPortrait player={card} size="md" />
            <div className="card-pick-hero-info">
              <div className="card-pick-name-row">
                <h3 className="player-name">{card.name}</h3>
                {card.tags.length > 0 && (
                  <div className="card-pick-hero-traits card-pick-hero-traits--inline">
                    <TagTraitBadges tags={card.tags} tipPlacement={tipPlacement} />
                  </div>
                )}
              </div>
              <div className="card-pick-stats">
                <span className="rating-big">{card.currentRating}</span>
                <span className="pos-badge player-pick-card__pos-badge" title={POSITION_LABELS[card.position]}>
                  {POSITION_BADGE[card.position]}
                </span>
              </div>
              <p className="player-pos-label">
                {formatPosition(card.position)}
                {altPos && <span className="player-alt-pos"> · {altPos}</span>}
              </p>
            </div>
          </div>
        </div>

        <div
          className="card-pick-body-scroll"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="card-pick-scroll">
            {showTagHint && card.tags[0] && (
              <p className="hint-flash">Aynı tag&apos;ler sinerji açar — sağ panelde ilerlemeni gör</p>
            )}

            {primaryWarn && (
              <p className="card-position-alert">{primaryWarn.text}</p>
            )}

            <div className="card-insight card-insight--player card-pick-core">
              <p className="card-insight-title">Seçersen</p>
              {insight.replacedPlayer ? (
                <ReplacementPlayerTip player={insight.replacedPlayer}>
                  <p className="card-insight-line card-insight-line--lead card-insight-line--hoverable">
                    {insight.summary}
                  </p>
                </ReplacementPlayerTip>
              ) : (
                <p className="card-insight-line card-insight-line--lead">{insight.summary}</p>
              )}
              {insight.tagBites.length > 0 && (
                <ul className="card-tag-bites card-tag-bites--compact">
                  {insight.tagBites.map(({ tag, desc }) => (
                    <li key={tag} className="card-tag-bite">
                      <HoverTip tip={desc} className="tag-trait-badge-wrap" placement={tipPlacement}>
                        <span className={`tag-trait-badge tag-trait-badge--${tag.replace(/\s+/g, '-')}`}>
                          <span className="tag-trait-icon" aria-hidden>{TAG_ICONS[tag]}</span>
                          <span className="tag-trait-name">{tag}</span>
                        </span>
                      </HoverTip>
                      <span className="card-tag-bite-desc">{desc}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {(insight.positionHints.length > 0 || insight.synergies.length > 0 || insight.tacticContributions.length > 0) && (
              <div className="card-pick-extra">
                {insight.tacticContributions.length > 0 && activeTactics.length > 0 && (
                  <div className="card-tactic-contrib-block">
                    <p className="card-insight-subtitle">Taktik katkısı</p>
                    {insight.tacticContributions.map((t) => (
                      <div key={t.tacticName} className="card-tactic-contrib-row">
                        <p className="card-tactic-contrib-name">{t.tacticName}</p>
                        {t.lines.map((line) => (
                          <p key={line} className="card-insight-line card-insight-line--bullet">✓ {line}</p>
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
            )}
          </div>
        </div>
      </div>

      {onSelect && (
        <div className="card-pick-footer">
          <p className="select-cta">SEÇ</p>
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

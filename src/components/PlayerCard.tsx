import { useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { formatAltPositionsBadge } from '@/data/positionFlexibility';
import { getPlayerArchetype } from '@/data/archetypes';
import { getPlayerCardInsight } from '@/engine/cardInsights';
import { HoverTip } from '@/components/HoverTip';
import { PlayerPortrait } from '@/components/PlayerPortrait';
import { TagTraitBadges } from '@/components/TagTraitBadges';
import { UiIcon } from '@/components/UiIcon';
import { SYNERGIES } from '@/data/synergies';
import { TAG_DESCRIPTIONS } from '@/data/tags';
import type { ActiveTactic, PlayerCard as PlayerCardType } from '@/types';
import { RARITY_COLORS, RARITY_LABELS } from '@/types';
import { POSITION_LABELS, POSITION_BADGE, formatPosition } from '@/utils/positionStyle';
import { getPlayerCardThemeClass, getPlayerCardThemeVars } from '@/utils/playerCardTheme';
import { iconForTag } from '@/utils/gameIcons';
import { joinTooltipLines } from '@/utils/tooltipText';

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
  const remaining = Math.max(0, s.required - s.after);
  const tokens = getSynergyRequirementTokens(s.description);

  return (
    <HoverTip tip={getSynergyTip(s)} placement="top" className="card-synergy-row-tip" stopPropagation={false}>
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
        <span className="card-synergy-remaining">{s.completes ? 'seçince açılır' : `${remaining} eksik kalacak`}</span>
      </div>
      {tokens.length > 1 && <SynergyRequirementChips tokens={tokens} />}
      <div className="card-synergy-bar-track">
        <div className="card-synergy-bar-before" style={{ width: `${pctBefore}%` }} />
        <div className="card-synergy-bar-after" style={{ width: `${pctAfter}%` }} />
      </div>
      <p className="card-synergy-reward">
        {s.completes ? `Bonus: ${s.reward}` : `Tamamlanınca: ${s.reward}`}
      </p>
    </div>
    </HoverTip>
  );
}

function getSynergyDeltaText(s: ReturnType<typeof getPlayerCardInsight>['synergies'][number]) {
  return s.completes ? `Seçince açılır` : `Seçince ${s.after}/${s.required}`;
}

function getSynergyAfterText(s: ReturnType<typeof getPlayerCardInsight>['synergies'][number]) {
  const remaining = Math.max(0, s.required - s.after);
  return s.completes ? 'Bonus aktif olur' : `${remaining} eksik kalacak`;
}

function getSynergyTip(s: ReturnType<typeof getPlayerCardInsight>['synergies'][number]) {
  const remaining = Math.max(0, s.required - s.after);
  const status = s.completes ? 'Bu seçim sinerjiyi açar.' : `Bu seçimden sonra ${remaining} rol eksik kalacak.`;
  return joinTooltipLines([s.description, status, `Ödül: ${s.reward}`]);
}

function getTagTip(tag: PlayerCardType['tags'][number], synergies: ReturnType<typeof getPlayerCardInsight>['synergies']) {
  const fromCard = synergies
    .filter((s) => `${s.name} ${s.description} ${s.contribution}`.toLocaleUpperCase('tr-TR').includes(tag))
    .map((s) => s.name);
  const fromCatalog = fromCard.length > 0
    ? fromCard
    : SYNERGIES
      .filter((s) => s.description.toLocaleUpperCase('tr-TR').includes(tag))
      .map((s) => s.name)
      .slice(0, 3);
  const synergyLine = fromCatalog.length > 0
    ? `Sinerji: ${fromCatalog.join(' Â· ')}`
    : 'Sinerji: uygun kombinasyonlarda deÄŸer kazanÄ±r';
  return `${TAG_DESCRIPTIONS[tag]}\n${synergyLine}`;
}

function getSynergyRequirementTokens(description: string) {
  const matches = [...description.matchAll(/([A-ZÇĞİÖŞÜ0-9 .]+?)\s+(\d+)\/(\d+)/g)];
  return matches
    .map((m) => ({
      label: m[1]!.trim().replace(/\s+/g, ' '),
      current: Number(m[2]),
      required: Number(m[3]),
    }))
    .filter((x) => x.label && Number.isFinite(x.current) && Number.isFinite(x.required) && x.required > 0)
    .slice(0, 4);
}

function SynergyRequirementChips({ tokens }: { tokens: ReturnType<typeof getSynergyRequirementTokens> }) {
  return (
    <div className="card-synergy-req-chips" aria-label="Sinerji koşulları">
      {tokens.map((token) => {
        const done = token.current >= token.required;
        return (
          <span key={`${token.label}-${token.required}`} className={`card-synergy-req-chip ${done ? 'card-synergy-req-chip--done' : ''}`}>
            <span>{token.label}</span>
            <strong>{Math.min(token.current, token.required)}/{token.required}</strong>
          </span>
        );
      })}
    </div>
  );
}

function getCompactPickSummary(summary: string) {
  const firstEleven = summary.match(/İlk 11'de ([^ ·(]+)(?: \(([^)]+)\))? slotuna girer/i);
  if (firstEleven) {
    return {
      label: 'İlk 11',
      value: firstEleven[1] ?? '',
      text: 'İlk 11’e girer',
      tone: 'good' as const,
    };
  }

  if (summary.toLocaleLowerCase('tr-TR').includes('yedek')) {
    return {
      label: 'Rol',
      value: 'Yedek',
      text: 'Yedek kalır',
      tone: 'warn' as const,
    };
  }

  return {
    label: 'Etki',
    value: '',
    text: summary.split(' · ')[0] ?? summary,
    tone: 'info' as const,
  };
}

function compactPositionHint(text: string) {
  return text
    .replace(/\s+—.+$/u, '')
    .replace(/^Alternatif mevkiler:.+$/u, '')
    .replace(/ slotuna yerleştirilir$/u, '')
    .replace(/ · ideal pozisyon$/u, '')
    .trim();
}

export function PlayerCard({ card, squad, discovered, maxSquadSize = 11, activeTactics = [], morale = 50, onSelect, selected, showTagHint, tipPlacement = 'auto', onReroll, rerollDisabled }: Props) {
  const insight = getPlayerCardInsight(card, squad, discovered, maxSquadSize, activeTactics, morale);
  const themeVars = {
    ...getPlayerCardThemeVars(card.rarity, card.position),
    '--pc-rarity-color': RARITY_COLORS[card.rarity],
  } as CSSProperties;
  const themeClass = getPlayerCardThemeClass(card.rarity, card.position);
  const altPos = formatAltPositionsBadge(card.position);
  const archetype = getPlayerArchetype(card);
  const compactSummary = getCompactPickSummary(insight.summary);
  const visiblePositionHints = insight.positionHints
    .map((hint) => ({ ...hint, text: compactPositionHint(hint.text) }))
    .filter((hint) =>
      hint.text
      && !hint.text.includes('Alternatif')
      && !hint.text.includes('uygun slot yok')
      && !hint.text.includes('Boş slot')
      && !hint.text.includes('Saha dolu')
      && !hint.text.includes('DEMİR KALE')
      && !hint.text.includes('yedek'),
    )
    .slice(0, 2);
  const hasDetail = visiblePositionHints.length > 0 || insight.tacticContributions.length > 0;
  const [showDetail, setShowDetail] = useState(false);

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
          İMZA
        </span>
      )}
      <div className="player-pick-card__rarity-row">
        <div className="player-pick-card__rarity-main">
          <span className={`player-pick-card__rarity-label rarity-badge rarity-badge--${card.rarity}`}>
            {RARITY_LABELS[card.rarity]}
          </span>
          <span className="archetype-badge" title={archetype.label}>
            <UiIcon name="circle-dot" /> {archetype.label}
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
            <UiIcon name="refresh" />
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
              <div className={`card-pick-trait-row ${card.tags.length === 0 ? 'card-pick-trait-row--empty' : ''}`} aria-hidden={card.tags.length === 0}>
                {card.tags.map((tag) => (
                  <HoverTip key={tag} tip={getTagTip(tag, insight.synergies)} className="card-pick-trait-wrap" placement={tipPlacement}>
                    <span className={`card-pick-trait-pill tag-trait-badge tag-trait-badge--${tag.replace(/\s+/g, '-')}`}>
                      <UiIcon name={iconForTag(tag)} className="tag-trait-icon" />
                      <span className="tag-trait-name">{tag}</span>
                    </span>
                  </HoverTip>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="card-pick-body-scroll"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="card-pick-scroll">
            {showTagHint && card.tags[0] && (
              <p className="hint-flash">Aynı tag&apos;ler sinerji açar — Sinerji butonundan ilerlemeni gör</p>
            )}

            {card.signature && card.signatureQuote && (
              <p className="signature-quote" style={card.signatureColor ? { borderColor: card.signatureColor } : undefined}>
                “{card.signatureQuote}”
              </p>
            )}

            <div className="card-insight card-insight--player card-pick-core">
              <p className="card-insight-title">Seçersen</p>
              <div className="card-impact-row">
                <span className={`card-impact-chip card-impact-chip--${compactSummary.tone}`}>
                  <strong>{compactSummary.label}</strong>
                  {compactSummary.value && <span>{compactSummary.value}</span>}
                </span>
                {insight.synergies[0] && (
                  <HoverTip tip={getSynergyTip(insight.synergies[0])} placement="top" className="card-impact-chip-tip">
                    <span className={`card-impact-chip card-impact-chip--synergy ${insight.synergies[0].completes ? 'card-impact-chip--unlock' : ''}`}>
                      <strong>{insight.synergies[0].name}</strong>
                      <span>{insight.synergies[0].after}/{insight.synergies[0].required}</span>
                    </span>
                  </HoverTip>
                )}
              </div>
              <p className="card-insight-line card-insight-line--lead">{compactSummary.text}</p>
              {insight.synergies.length > 0 && (
                <div className="card-synergy-strip">
                  {insight.synergies.slice(0, 1).map((s) => (
                    <HoverTip key={s.name} tip={getSynergyTip(s)} placement="top" className="card-synergy-mini-tip">
                    <div className={`card-synergy-mini ${s.completes ? 'card-synergy-mini--complete' : ''}`}>
                      <div className="card-synergy-mini-main">
                        <span>{s.name}</span>
                        <strong>{getSynergyDeltaText(s)}</strong>
                      </div>
                      <div className="card-synergy-mini-bottom">
                        <SynergyRequirementChips tokens={getSynergyRequirementTokens(s.description)} />
                        <em>{getSynergyAfterText(s)}</em>
                      </div>
                    </div>
                    </HoverTip>
                  ))}
                </div>
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
                <UiIcon name={showDetail ? 'x' : 'info'} />
                <span>{showDetail ? 'Kapat' : 'Detay'}</span>
              </button>
            )}

            {hasDetail && (
              <div className={`card-pick-extra ${showDetail ? 'card-pick-extra--open' : 'card-pick-extra--collapsed'}`}>
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
                {visiblePositionHints.length > 0 && (
                  <div className="card-position-hints">
                    <p className="card-insight-subtitle">Mevki & diziliş</p>
                    <ul className="card-position-hint-list">
                      {visiblePositionHints.map((hint) => (
                        <li key={hint.text} className={`card-position-hint card-position-hint--${hint.tone}`}>
                          {hint.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {insight.synergies.length > 0 && (
                  <div className="card-synergy-block">
                    <p className="card-insight-subtitle">Sinerji hedefi</p>
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

import { useEffect, useRef, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { HoverTip } from '@/components/HoverTip';
import { LineupPlayerHoverCard, getLineupPlayerHoverAria } from '@/components/LineupPlayerHoverCard';
import { UiIcon } from '@/components/UiIcon';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { getPlayablePositions } from '@/data/positionFlexibility';
import { TAG_DESCRIPTIONS } from '@/data/tags';
import { getBenchExplanations, getSquadLineupSummary, type ManualLineup } from '@/engine/lineupPreview';
import type { ActiveTactic, PlayerCard, Position } from '@/types';
import { formatLineupPlayerTip, formationSlotLabel, POSITION_BADGE, TAG_AVATAR_BG, getPositionRoleColor } from '@/utils/positionStyle';
import { iconForTag } from '@/utils/gameIcons';
import { formatSquadListName } from '@/utils/squadDisplayName';

interface Props {
  squad: PlayerCard[];
  activeTactics: ActiveTactic[];
  manualLineup?: ManualLineup;
}

function clampPct(value: number, min = 10, max = 90) {
  return Math.min(max, Math.max(min, value));
}

export function buildLineupPlayerTip(player: PlayerCard, slotCode: string, outOfPosition: boolean): string {
  const playableBadges = getPlayablePositions(player).map((p) => POSITION_BADGE[p]).join(' · ');
  const tagLine =
    player.tags.length > 0
      ? player.tags.join(' · ')
      : 'Tag yok';
  return formatLineupPlayerTip(player, slotCode, { playableBadges, tagLine, outOfPosition });
}

function gradientColor(value: string): string {
  const colors = [...value.matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => m[0]);
  return colors[1] ?? colors[0] ?? '#8a948f';
}

function tagChipStyle(tag: PlayerCard['tags'][number]): CSSProperties {
  const color = gradientColor(TAG_AVATAR_BG[tag] ?? '');
  return { color, background: `${color}18`, borderColor: `${color}66` };
}

function positionChipStyle(position: Position, filled: boolean): CSSProperties {
  const color = getPositionRoleColor(position);
  return filled
    ? { color: '#07111d', background: color, borderColor: color }
    : { color, background: `${color}12`, borderColor: `${color}88` };
}

function SecondaryPositionBadges({ player, className = '' }: { player: PlayerCard; className?: string }) {
  const secondary = getPlayablePositions(player).filter((p) => p !== player.position);
  if (secondary.length === 0) return null;
  return (
    <>
      <span className="lineup-squad-popover-role-arrow">→</span>
      <span className={`lineup-secondary-positions ${className}`}>
        {secondary.slice(0, 3).map((pos) => (
          <span key={pos} className="lineup-secondary-position" style={positionChipStyle(pos, false)}>
            {POSITION_BADGE[pos]}
          </span>
        ))}
      </span>
    </>
  );
}

function LineupSquadPopover({
  squad,
  summary,
}: {
  squad: PlayerCard[];
  summary: ReturnType<typeof getSquadLineupSummary>;
}) {
  const slotByPlayer = new Map<string, { label: string; index: number; outOfPosition: boolean }>();
  summary.lineup.forEach((slot) => {
    if (slot.player) {
      slotByPlayer.set(slot.player.id, {
        label: slot.slot.label,
        index: slot.index,
        outOfPosition: slot.outOfPosition,
      });
    }
  });

  const ordered = [...squad].sort((a, b) => {
    const aSlot = slotByPlayer.get(a.id);
    const bSlot = slotByPlayer.get(b.id);
    if (aSlot && bSlot) return aSlot.index - bSlot.index;
    if (aSlot) return -1;
    if (bSlot) return 1;
    return b.currentRating - a.currentRating;
  });

  const fieldPlayers = ordered.filter((p) => slotByPlayer.has(p.id));
  const benchPlayers = ordered.filter((p) => !slotByPlayer.has(p.id));
  const avgRating = squad.length > 0
    ? Math.round(squad.reduce((sum, player) => sum + player.currentRating, 0) / squad.length)
    : 0;

  function renderSquadRow(player: PlayerCard) {
    const slot = slotByPlayer.get(player.id);
    const visibleTags = player.tags;
    return (
      <div
        key={player.id}
        className={`lineup-squad-popover-row ${slot ? 'lineup-squad-popover-row--field' : 'lineup-squad-popover-row--bench'} ${
          player.position === 'KL' ? 'lineup-squad-popover-row--gk' : ''
        } ${slot?.outOfPosition ? 'lineup-squad-popover-row--warn' : ''}`}
      >
        <div className={`lineup-squad-popover-rating ${player.position === 'KL' ? 'lineup-squad-popover-rating--gk' : ''}`}>
          <strong>{player.currentRating}</strong>
        </div>
        <div className="lineup-squad-popover-body">
          <div className="lineup-squad-popover-name-row">
            <span className="lineup-squad-popover-name" title={player.name}>{formatSquadListName(player.name)}</span>
          </div>
          <div className="lineup-squad-popover-role-row">
            <span className="lineup-squad-popover-primary-pos" style={positionChipStyle(player.position, true)}>
              {POSITION_BADGE[player.position]}
            </span>
            {player.position === 'KL' ? (
              <span className="lineup-squad-popover-only">sadece kalede</span>
            ) : (
              <SecondaryPositionBadges player={player} />
            )}
          </div>
          <div className="lineup-squad-popover-tags">
            {!slot && <span className="lineup-squad-popover-bench-badge">Yedek</span>}
            {visibleTags.map((tag) => (
              <HoverTip key={tag} tip={TAG_DESCRIPTIONS[tag]} placement="right" className="lineup-squad-popover-tag-tip">
                <span className="lineup-squad-popover-tag" style={tagChipStyle(tag)}>
                  <UiIcon name={iconForTag(tag)} />
                  {tag}
                </span>
              </HoverTip>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside className="lineup-squad-popover" aria-label="Kadrodaki oyuncular">
      <div className="lineup-squad-popover-head">
        <p className="lineup-squad-popover-kicker">Kadro listesi</p>
        <p className="lineup-squad-popover-title">Oyuncular <span>{summary.squadSize} / 11</span></p>
        <div className="lineup-squad-popover-legend">
          <span><i className="lineup-squad-popover-legend-main" /> ana rol</span>
          <span><i className="lineup-squad-popover-legend-secondary" /> oynayabildiği yan roller</span>
        </div>
      </div>
      <div className="lineup-squad-popover-list">
        {fieldPlayers.map(renderSquadRow)}
        {benchPlayers.map(renderSquadRow)}
      </div>
      <div className="lineup-squad-popover-foot">
        <span>Yedek: <strong>{benchPlayers.length}</strong></span>
        <span>Ø Ort: <strong>{avgRating}</strong></span>
      </div>
    </aside>
  );
}

function LineupPitchContent({
  summary,
  squad,
  activeTactics,
  showBench,
  hideAside,
  showFormationTag,
}: {
  summary: ReturnType<typeof getSquadLineupSummary>;
  squad: PlayerCard[];
  activeTactics: ActiveTactic[];
  showBench?: boolean;
  hideAside?: boolean;
  showFormationTag?: boolean;
}) {
  const benchNotes = showBench ? getBenchExplanations(squad, activeTactics) : [];
  const emptySlots = 11 - summary.filled;
  const starterFit = summary.lineup.filter((slot) => slot.player && !slot.outOfPosition).length;
  const flexFit = summary.lineup.filter((slot) => slot.player && slot.outOfPosition).length;
  const leadBench = benchNotes[0];

  return (
    <div className="lineup-modal-body lineup-modal-body--v2">
      <div className={`lineup-modal-grid ${hideAside ? 'lineup-modal-grid--pitch-only' : ''}`}>
        <div className="lineup-pitch lineup-pitch--flyout lineup-pitch--center-modal lineup-pitch--v2" aria-label="Diziliş önizlemesi">
          <div className="lineup-pitch-grass" />
          <div className="lineup-pitch-stripes" aria-hidden />
          <div className="lineup-pitch-center" />
          <div className="lineup-pitch-box lineup-pitch-box--top" aria-hidden />
          <div className="lineup-pitch-box lineup-pitch-box--bottom" aria-hidden />
          <div className="lineup-pitch-glow" aria-hidden />
          {showFormationTag && (
            <span className="lineup-pitch-formation-tag">{summary.formationLabel.split(' (')[0]}</span>
          )}
          {summary.lineup.map((slot) => {
            const tipPlacement = slot.y <= 48 ? 'left' : 'right';
            const dot = (
              <div
                className={`lineup-dot lineup-dot--v3 ${slot.player ? 'lineup-dot--filled' : 'lineup-dot--empty'} ${
                  slot.outOfPosition ? 'lineup-dot--mismatch' : ''
                } ${slot.role === 'gk' || slot.player?.position === 'KL' ? 'lineup-dot--gk' : ''}`}
              >
                {slot.player ? (
                  <>
                    <span className="lineup-dot-rating">{slot.player.currentRating}</span>
                    <span className="lineup-dot-name">{formatSquadListName(slot.player.name)}</span>
                    <span className="lineup-dot-badge">{POSITION_BADGE[slot.player.position]}</span>
                  </>
                ) : (
                  <span className="lineup-dot-label">{slot.slot.label}</span>
                )}
              </div>
            );

            return (
              <div
                key={slot.index}
                className="lineup-dot-anchor"
                style={{
                  left: `${clampPct(100 - slot.y, 4, 96)}%`,
                  top: `${clampPct(slot.x, 10, 90)}%`,
                }}
              >
                {slot.player ? (
                  <HoverTip
                    tip={<LineupPlayerHoverCard player={slot.player} slotLabel={slot.slot.label} fit={slot.outOfPosition ? 'flex' : 'ideal'} />}
                    ariaLabel={getLineupPlayerHoverAria(slot.player, slot.slot.label, slot.outOfPosition ? 'flex' : 'ideal')}
                    placement={tipPlacement}
                    className="lineup-dot-hover"
                  >
                    {dot}
                  </HoverTip>
                ) : (
                  <HoverTip
                    tip={`Boş slot · ${formationSlotLabel(slot.slot.label)} (${slot.slot.label})`}
                    placement={tipPlacement}
                    className="lineup-dot-hover"
                  >
                    {dot}
                  </HoverTip>
                )}
              </div>
            );
          })}
        </div>

        {!hideAside && (
          <aside className="lineup-modal-aside">
            <div className="lineup-fit-panel">
              <p className="lineup-fit-kicker">Yerleşim notu</p>
              <strong>{emptySlots > 0 ? `${emptySlots} slot boş` : 'Saha hazır'}</strong>
              <span>{starterFit} ana mevki · {flexFit} yan mevki</span>
            </div>

            <div className="lineup-fit-grid">
              <div className="lineup-fit-stat">
                <span>Form</span>
                <strong>{summary.formationLabel}</strong>
              </div>
              <div className="lineup-fit-stat">
                <span>Risk</span>
                <strong>{summary.mismatches > 0 ? `${summary.mismatches} uyum` : 'Düşük'}</strong>
              </div>
            </div>

            <div className={`lineup-fit-note ${summary.gaps.length > 0 ? 'lineup-fit-note--warn' : ''}`}>
              <UiIcon name={summary.gaps.length > 0 ? 'info' : 'circle-dot'} />
              <span>{summary.gaps[0]?.text ?? 'İlk 11 dengeli görünüyor.'}</span>
            </div>

            {leadBench && (
              <div className="lineup-fit-bench">
                <span>Yedekte bekleyen</span>
                <strong title={leadBench.player.name}>{formatSquadListName(leadBench.player.name)}</strong>
                <small>{leadBench.reason}</small>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

export function LineupPreviewModal({
  open,
  onClose,
  squad,
  activeTactics,
  manualLineup = {},
}: Props & { open: boolean; onClose: () => void }) {
  const summary = getSquadLineupSummary(squad, activeTactics, manualLineup);
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, open, onClose);

  useEffect(() => {
    if (!open) return;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPad = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPad;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="lineup-preview-backdrop" onClick={onClose} aria-hidden />
      <div className="lineup-preview-modal-shell">
      {window.innerWidth >= 900 && <LineupSquadPopover squad={squad} summary={summary} />}
      <div
        ref={modalRef}
        className="lineup-preview-popover lineup-preview-popover--center lineup-preview-popover--hero lineup-preview-popover--v2 lineup-preview-popover--modal"
        role="dialog"
        aria-modal="true"
        aria-label="Diziliş önizlemesi"
      >
        <div className="lineup-preview-popover-head lineup-preview-popover-head--v2">
          <div>
            <p className="lineup-preview-popover-kicker">İlk 11 önizleme</p>
            <p className="lineup-preview-formation lineup-preview-formation--hero">{summary.formationLabel}</p>
          </div>
          <div className="lineup-preview-head-legend" aria-label="Mevki uyumu">
            <span className="le-legend le-legend--ideal">ana mevki</span>
            <span className="le-legend le-legend--flex">yan mevki</span>
          </div>
          <button type="button" className="lineup-preview-close" onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </div>
        <LineupPitchContent summary={summary} squad={squad} activeTactics={activeTactics} showBench />
        <div className="lineup-preview-modal-foot">
          <button type="button" className="btn-secondary lineup-preview-modal-close-btn" onClick={onClose}>
            Kapat
          </button>
        </div>
      </div>
      </div>
    </>,
    document.body,
  );
}

/** Sol panel — sadece özet + Göster butonu */
export function LineupPreviewSidebar({
  squad,
  activeTactics,
  manualLineup = {},
  onShow,
}: Props & { onShow?: () => void }) {
  const summary = getSquadLineupSummary(squad, activeTactics, manualLineup);
  const emptyOnField = 11 - summary.filled;

  return (
    <div className="lineup-preview-sidebar lineup-preview-sidebar--v2">
      <div className="lineup-preview-sidebar-main">
        <div className="lineup-preview-sidebar-row">
          <span className="lineup-preview-title">İlk 11</span>
          <span className="lineup-preview-formation">{summary.formationLabel}</span>
        </div>
        <span className="lineup-preview-meta-inline">
          {summary.filled}/11 saha · {summary.squadSize}/11 kadro
          {emptyOnField > 0 ? ` · ${emptyOnField} boş` : ''}
        </span>
        {onShow && (
          <button type="button" className="lineup-show-btn lineup-show-btn--block" onClick={onShow}>
            Dizilişi göster
          </button>
        )}
      </div>
    </div>
  );
}

/** Orta alan — sadece tıklayınca açılır */
export function LineupPreviewCenterTrigger({
  squad,
  activeTactics,
  manualLineup = {},
  className = '',
  onOpen,
  compact = false,
}: Props & { className?: string; onOpen: () => void; compact?: boolean }) {
  const summary = getSquadLineupSummary(squad, activeTactics, manualLineup);

  if (compact) {
    return (
      <button
        type="button"
        className={`lineup-compact-btn ${className}`}
        onClick={onOpen}
        aria-label="Diziliş önizlemesini göster"
        title={`${summary.formationLabel} · ${summary.filled}/11 saha`}
      >
        <UiIcon name="circle-dot" className="lineup-compact-btn-icon" />
        <span className="lineup-compact-btn-text">
          <span className="lineup-compact-btn-label">Diziliş</span>
          <span className="lineup-compact-btn-meta">Önizleme</span>
        </span>
        <UiIcon name="arrow-right" className="lineup-compact-btn-cta" />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`lineup-center-trigger lineup-center-trigger--v2 ${className}`}
      onClick={onOpen}
    aria-label="Diziliş önizlemesini göster"
  >
      <UiIcon name="circle-dot" className="lineup-center-trigger-icon" />
      <span className="lineup-center-trigger-body">
        <span className="lineup-center-trigger-title">Diziliş önizlemesi</span>
        <span className="lineup-center-trigger-sub">{summary.formationLabel}</span>
      </span>
      <span className="lineup-center-trigger-cta">Göster</span>
    </button>
  );
}

/** Kayıp ekranı vb. — her zaman açık tam önizleme */
export function LineupPreviewExpanded({ squad, activeTactics, manualLineup = {} }: Props) {
  const summary = getSquadLineupSummary(squad, activeTactics, manualLineup);
  return (
    <div className="lineup-preview lineup-preview--expanded lineup-preview--v2">
      <div className="lineup-preview-head">
        <p className="lineup-preview-title">İlk 11</p>
        <p className="lineup-preview-formation">{summary.formationLabel}</p>
      </div>
      <LineupPitchContent summary={summary} squad={squad} activeTactics={activeTactics} showBench />
    </div>
  );
}

/** Sadece saha — yan panel olmadan (örn. mağlubiyet ekranı) */
export function LineupPitchOnly({ squad, activeTactics, manualLineup = {} }: Props) {
  const summary = getSquadLineupSummary(squad, activeTactics, manualLineup);
  return <LineupPitchContent summary={summary} squad={squad} activeTactics={activeTactics} hideAside showFormationTag />;
}

export function LineupPreviewInline({ squad, activeTactics, manualLineup = {}, title = 'Seçili diziliş', headline }: Props & { title?: string; headline?: string }) {
  const summary = getSquadLineupSummary(squad, activeTactics, manualLineup);
  return (
    <div className="lineup-preview-inline">
      <div className="lineup-preview-inline-head">
        <div>
          <p className="lineup-preview-popover-kicker">{title}</p>
          <p className="lineup-preview-formation lineup-preview-formation--hero">{headline ?? summary.formationLabel}</p>
        </div>
        <span className="lineup-preview-inline-count">Diziliş</span>
      </div>
      <LineupPitchContent summary={summary} squad={squad} activeTactics={activeTactics} showBench />
    </div>
  );
}

/** Geriye uyumluluk */
export function LineupPreview({ squad, activeTactics, manualLineup = {}, collapsible = true }: Props & { collapsible?: boolean }) {
  if (!collapsible) {
    return <LineupPreviewExpanded squad={squad} activeTactics={activeTactics} manualLineup={manualLineup} />;
  }
  return <LineupPreviewSidebar squad={squad} activeTactics={activeTactics} manualLineup={manualLineup} />;
}

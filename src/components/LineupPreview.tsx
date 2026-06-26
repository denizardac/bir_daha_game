import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HoverTip } from '@/components/HoverTip';
import { LineupPlayerHoverCard, getLineupPlayerHoverAria } from '@/components/LineupPlayerHoverCard';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { getPlayablePositions } from '@/data/positionFlexibility';
import { TAG_DESCRIPTIONS, TAG_ICONS } from '@/data/tags';
import { getBenchExplanations, getSquadLineupSummary, type ManualLineup } from '@/engine/lineupPreview';
import type { ActiveTactic, PlayerCard } from '@/types';
import { formatLineupPlayerTip, formationSlotLabel, POSITION_BADGE } from '@/utils/positionStyle';

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
      ? player.tags.map((t) => `${TAG_ICONS[t]} ${t}`).join(' · ')
      : 'Tag yok';
  return formatLineupPlayerTip(player, slotCode, { playableBadges, tagLine, outOfPosition });
}

function lineupMetaParts(summary: ReturnType<typeof getSquadLineupSummary>) {
  return [
    `${summary.filled}/11 saha`,
    `${summary.squadSize}/11 kadro`,
    summary.mismatches > 0 ? `${summary.mismatches} uyumsuz` : '',
    summary.bench > 0 ? `${summary.bench} yedek` : '',
    summary.extraGoalkeepers > 0 ? `${summary.extraGoalkeepers} yedek KL` : '',
  ].filter(Boolean);
}

function SecondaryPositionBadges({ player, className = '' }: { player: PlayerCard; className?: string }) {
  const secondary = getPlayablePositions(player).filter((p) => p !== player.position);
  if (secondary.length === 0) return null;
  return (
    <span className={`lineup-secondary-positions ${className}`}>
      {secondary.slice(0, 3).map((pos) => (
        <span key={pos} className="lineup-secondary-position">{POSITION_BADGE[pos]}</span>
      ))}
    </span>
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

  return (
    <aside className="lineup-squad-popover" aria-label="Kadrodaki oyuncular">
      <div className="lineup-squad-popover-head">
        <p className="lineup-squad-popover-kicker">Kadro listesi</p>
        <p className="lineup-squad-popover-title">Oyuncular <span>{summary.squadSize}/11</span></p>
      </div>
      <div className="lineup-squad-popover-list">
        {ordered.map((player) => {
          const slot = slotByPlayer.get(player.id);
          return (
            <div
              key={player.id}
              className={`lineup-squad-popover-row ${slot ? 'lineup-squad-popover-row--field' : 'lineup-squad-popover-row--bench'} ${slot?.outOfPosition ? 'lineup-squad-popover-row--warn' : ''}`}
            >
              <div className={`lineup-squad-popover-rating ${player.position === 'KL' ? 'lineup-squad-popover-rating--gk' : ''}`}>
                <strong>{player.currentRating}</strong>
                <span>{POSITION_BADGE[player.position]}</span>
              </div>
              <div className="lineup-squad-popover-body">
                <div className="lineup-squad-popover-name-row">
                  <span className="lineup-squad-popover-name">{player.name}</span>
                  <span className="lineup-squad-popover-primary-pos">{POSITION_BADGE[player.position]}</span>
                  <SecondaryPositionBadges player={player} />
                  <span className={`lineup-squad-popover-slot ${slot ? 'lineup-squad-popover-slot--field' : 'lineup-squad-popover-slot--bench'}`}>
                    {slot ? slot.label : 'Yedek'}
                  </span>
                </div>
                {player.tags.length > 0 && (
                  <div className="lineup-squad-popover-tags">
                    {player.tags.slice(0, 3).map((tag) => (
                      <HoverTip key={tag} tip={TAG_DESCRIPTIONS[tag]} placement="right" className="lineup-squad-popover-tag-tip">
                        <span className="lineup-squad-popover-tag">
                          <span aria-hidden>{TAG_ICONS[tag]}</span>
                          {tag}
                        </span>
                      </HoverTip>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function LineupPitchContent({
  summary,
  squad,
  activeTactics,
  showBench,
}: {
  summary: ReturnType<typeof getSquadLineupSummary>;
  squad: PlayerCard[];
  activeTactics: ActiveTactic[];
  showBench?: boolean;
}) {
  const metaParts = lineupMetaParts(summary);
  const benchNotes = showBench ? getBenchExplanations(squad, activeTactics) : [];

  return (
    <div className="lineup-modal-body lineup-modal-body--v2">
      <div className="lineup-modal-stats">
        {summary.zoneCounts.map(({ zone, label, count }) => (
          <div key={zone} className={`lineup-stat-card ${count === 0 ? 'lineup-stat-card--empty' : ''}`}>
            <span className="lineup-stat-label">{label}</span>
            <span className="lineup-stat-value">{count}</span>
          </div>
        ))}
      </div>

      <div className="lineup-modal-grid">
        <div className="lineup-pitch lineup-pitch--flyout lineup-pitch--center-modal lineup-pitch--v2" aria-label="Diziliş önizlemesi">
          <div className="lineup-pitch-grass" />
          <div className="lineup-pitch-stripes" aria-hidden />
          <div className="lineup-pitch-center" />
          <div className="lineup-pitch-box lineup-pitch-box--top" aria-hidden />
          <div className="lineup-pitch-box lineup-pitch-box--bottom" aria-hidden />
          <div className="lineup-pitch-glow" aria-hidden />
          {summary.lineup.map((slot) => {
            const tipPlacement = slot.x >= 52 ? 'left' : 'right';
            const dot = (
              <div
                className={`lineup-dot lineup-dot--v3 ${slot.player ? 'lineup-dot--filled' : 'lineup-dot--empty'} ${
                  slot.outOfPosition ? 'lineup-dot--mismatch' : ''
                } ${slot.role === 'gk' || slot.player?.position === 'KL' ? 'lineup-dot--gk' : ''}`}
              >
                {slot.player ? (
                  <>
                    <span className="lineup-dot-rating">{slot.player.currentRating}</span>
                    <span className="lineup-dot-name">{slot.player.name.split(' ').pop()}</span>
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
                  left: `${clampPct(slot.x)}%`,
                  top: `${clampPct(slot.y, 8, 92)}%`,
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

        <aside className="lineup-modal-aside">
          <div className="lineup-modal-meta-card">
            <p className="lineup-modal-meta-title">Kadro özeti</p>
            <p className="lineup-modal-meta-line">{metaParts.join(' · ')}</p>
          </div>

          {summary.gaps.length > 0 && (
            <ul className="lineup-gap-list lineup-gap-list--v2">
              {summary.gaps.slice(0, 4).map((gap) => (
                <li key={gap.text} className={`lineup-gap-item lineup-gap-item--v2 lineup-gap-item--${gap.tone}`}>
                  {gap.text}
                </li>
              ))}
            </ul>
          )}

          {benchNotes.length > 0 && (
            <div className="lineup-bench-panel lineup-bench-panel--v2">
              <p className="lineup-bench-title">Yedekler</p>
              <ul className="lineup-bench-list">
                {benchNotes.map(({ player, reason }) => (
                  <li key={player.id} className={`lineup-bench-row ${player.position === 'KL' ? 'lineup-bench-row--gk' : ''}`}>
                    <span className="lineup-bench-name">{player.name}</span>
                    <span className="lineup-bench-meta">{POSITION_BADGE[player.position]} · {player.currentRating}</span>
                    <span className="lineup-bench-reason">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
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
      <LineupSquadPopover squad={squad} summary={summary} />
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
            <p className="lineup-preview-sub-hero">{summary.filled}/11 saha dolu · {summary.squadSize}/11 kadro</p>
          </div>
          <button type="button" className="lineup-preview-close" onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </div>
        <LineupPitchContent summary={summary} squad={squad} activeTactics={activeTactics} showBench />
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
  const emptyOnField = 11 - summary.filled;

  if (compact) {
    return (
      <button
        type="button"
        className={`lineup-compact-btn ${className}`}
        onClick={onOpen}
        aria-label="Diziliş önizlemesini göster"
        title={`${summary.formationLabel} · ${summary.filled}/11 saha`}
      >
        <span className="lineup-compact-btn-icon" aria-hidden>⚽</span>
        <span className="lineup-compact-btn-text">
          <span className="lineup-compact-btn-label">Dizilişi Göster</span>
          <span className="lineup-compact-btn-meta">
            Kadro {summary.squadSize}/11 · {emptyOnField > 0 ? `${emptyOnField} boş slot` : 'saha hazır'} — sahayı ve kadroyu gör
          </span>
        </span>
        <span className="lineup-compact-btn-cta">→</span>
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
      <span className="lineup-center-trigger-icon" aria-hidden>⚽</span>
      <span className="lineup-center-trigger-body">
        <span className="lineup-center-trigger-title">Diziliş önizlemesi</span>
        <span className="lineup-center-trigger-sub">
          {summary.formationLabel} · {summary.filled}/11 saha
          {emptyOnField > 0 ? ` · ${emptyOnField} boş slot` : ''}
        </span>
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

/** Geriye uyumluluk */
export function LineupPreview({ squad, activeTactics, manualLineup = {}, collapsible = true }: Props & { collapsible?: boolean }) {
  if (!collapsible) {
    return <LineupPreviewExpanded squad={squad} activeTactics={activeTactics} manualLineup={manualLineup} />;
  }
  return <LineupPreviewSidebar squad={squad} activeTactics={activeTactics} manualLineup={manualLineup} />;
}

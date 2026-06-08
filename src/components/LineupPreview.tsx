import { useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { HoverTip } from '@/components/HoverTip';
import { getPlayablePositions } from '@/data/positionFlexibility';
import { TAG_ICONS } from '@/data/tags';
import { getBenchExplanations, getSquadLineupSummary } from '@/engine/lineupPreview';
import type { ActiveTactic, PlayerCard } from '@/types';
import { formatLineupPlayerTip, formationSlotLabel, POSITION_BADGE } from '@/utils/positionStyle';

interface Props {
  squad: PlayerCard[];
  activeTactics: ActiveTactic[];
}

function clampPct(value: number, min = 10, max = 90) {
  return Math.min(max, Math.max(min, value));
}

function buildLineupPlayerTip(player: PlayerCard, slotCode: string, outOfPosition: boolean): string {
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

function useCenterModalStyle(open: boolean) {
  const [style, setStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (!open) {
      setStyle({});
      return;
    }

    const place = () => {
      const width = Math.min(920, Math.max(440, window.innerWidth * 0.88));
      const maxHeight = Math.min(900, window.innerHeight - 32);
      setStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width,
        maxHeight,
        zIndex: 420,
      });
    };

    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open]);

  return style;
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
                    tip={buildLineupPlayerTip(slot.player, slot.slot.label, slot.outOfPosition)}
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
}: Props & { open: boolean; onClose: () => void }) {
  const summary = getSquadLineupSummary(squad, activeTactics);
  const modalStyle = useCenterModalStyle(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="lineup-preview-backdrop" onClick={onClose} aria-hidden />
      <div
        className="lineup-preview-popover lineup-preview-popover--center lineup-preview-popover--hero lineup-preview-popover--v2"
        style={modalStyle}
        role="dialog"
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
    </>,
    document.body,
  );
}

/** Sol panel — sadece özet + Göster butonu */
export function LineupPreviewSidebar({
  squad,
  activeTactics,
  onShow,
}: Props & { onShow?: () => void }) {
  const summary = getSquadLineupSummary(squad, activeTactics);
  const emptyOnField = 11 - summary.filled;

  return (
    <div className="lineup-preview-sidebar lineup-preview-sidebar--v2">
      <div className="lineup-preview-sidebar-main">
        <div className="lineup-preview-sidebar-text">
          <span className="lineup-preview-title">İlk 11</span>
          <span className="lineup-preview-formation">{summary.formationLabel}</span>
          <span className="lineup-preview-meta-inline">
            {summary.filled}/11 saha · {summary.squadSize}/11 kadro
            {emptyOnField > 0 ? ` · ${emptyOnField} boş` : ''}
          </span>
        </div>
        {onShow && (
          <button type="button" className="lineup-show-btn" onClick={onShow}>
            Göster
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
  className = '',
  onOpen,
  compact = false,
}: Props & { className?: string; onOpen: () => void; compact?: boolean }) {
  const summary = getSquadLineupSummary(squad, activeTactics);
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
          <span className="lineup-compact-btn-label">Diziliş</span>
          <span className="lineup-compact-btn-meta">
            {summary.filled}/11{emptyOnField > 0 ? ` · ${emptyOnField} boş` : ''}
          </span>
        </span>
        <span className="lineup-compact-btn-cta">Göster</span>
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
export function LineupPreviewExpanded({ squad, activeTactics }: Props) {
  const summary = getSquadLineupSummary(squad, activeTactics);
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
export function LineupPreview({ squad, activeTactics, collapsible = true }: Props & { collapsible?: boolean }) {
  if (!collapsible) {
    return <LineupPreviewExpanded squad={squad} activeTactics={activeTactics} />;
  }
  return <LineupPreviewSidebar squad={squad} activeTactics={activeTactics} />;
}

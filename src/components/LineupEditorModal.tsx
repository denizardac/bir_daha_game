import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { HoverTip } from '@/components/HoverTip';
import { LineupPlayerHoverCard, getLineupPlayerHoverAria } from '@/components/LineupPlayerHoverCard';
import { UiIcon } from '@/components/UiIcon';
import { TAG_DESCRIPTIONS } from '@/data/tags';
import { getPlayablePositions, getSlotFitTier } from '@/data/positionFlexibility';
import {
  assignSquadToFormation,
  getActiveFormationKey,
  resolveLineupDrop,
  slotAcceptsForEditor,
  type LineupSlot,
  type ManualLineup,
} from '@/engine/lineupPreview';
import type { ActiveTactic, PlayerCard, Position } from '@/types';
import { POSITION_BADGE, TAG_AVATAR_BG, getPositionRoleColor } from '@/utils/positionStyle';
import { iconForTag } from '@/utils/gameIcons';
import { formatSquadListName } from '@/utils/squadDisplayName';

interface Props {
  open: boolean;
  squad: PlayerCard[];
  activeTactics: ActiveTactic[];
  manualLineup: ManualLineup;
  highlightId?: string | null;
  onChange: (next: ManualLineup) => void;
  onReset: () => void;
  onConfirm: () => void;
  /** X / dış tık / Esc — seçimi iptal eder. Verilmezse onConfirm kullanılır. */
  onCancel?: () => void;
}

type DropTarget = { kind: 'slot'; index: number } | { kind: 'bench' };
type DragSource = { player: PlayerCard; from: number | 'bench' };
type DragGhost = { player: PlayerCard; x: number; y: number } | null;

function clampPct(value: number, min = 8, max = 92) {
  return Math.min(max, Math.max(min, value));
}

function pointerXY(e: MouseEvent | TouchEvent | PointerEvent): [number, number] {
  if ('changedTouches' in e && e.changedTouches.length) {
    return [e.changedTouches[0]!.clientX, e.changedTouches[0]!.clientY];
  }
  const me = e as MouseEvent;
  return [me.clientX, me.clientY];
}

function fitClass(player: PlayerCard, slot: LineupSlot['slot']): 'ideal' | 'flex' | 'forced' {
  if (slot.zone === 'kaleci') return player.position === 'KL' ? 'ideal' : 'forced';
  if (player.position === 'KL') return 'forced';
  return getSlotFitTier(player, slot.preferred);
}

function gradientColor(value: string): string {
  const colors = [...value.matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => m[0]);
  return colors[1] ?? colors[0] ?? '#8a948f';
}

function tagChipStyle(tag: PlayerCard['tags'][number]): CSSProperties {
  const color = gradientColor(TAG_AVATAR_BG[tag] ?? '');
  return { color, background: `${color}12`, borderColor: `${color}55` };
}

function positionChipStyle(position: Position, filled: boolean): CSSProperties {
  const color = getPositionRoleColor(position);
  return filled
    ? { color: '#061412', background: color, borderColor: color }
    : { color, background: `${color}10`, borderColor: `${color}8a` };
}

export function LineupEditorModal({
  open,
  squad,
  activeTactics,
  manualLineup,
  highlightId,
  onChange,
  onReset,
  onConfirm,
  onCancel,
}: Props) {
  const dismiss = onCancel ?? onConfirm;
  const formationKey = getActiveFormationKey(activeTactics);
  const lineup = useMemo(
    () => assignSquadToFormation(squad, formationKey, manualLineup),
    [squad, formationKey, manualLineup],
  );
  const lineupIds = new Set(lineup.filter((s) => s.player).map((s) => s.player!.id));
  const bench = squad.filter((p) => !lineupIds.has(p.id));
  // Bu formasyon kadronun mevkileriyle tam dolmuyorsa: boş slot + yedek oyuncu.
  // Oyuncuyu sürükleyip yerleştirmezse eksik kadroyla oynar (güç + sinerji düşer).

  const [dragSource, setDragSource] = useState<DragSource | null>(null);
  const [dragGhost, setDragGhost] = useState<DragGhost>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismiss]);

  if (!open) return null;

  function canDropOnSlot(player: PlayerCard, index: number): boolean {
    const slot = lineup[index]?.slot;
    return slot ? slotAcceptsForEditor(player, slot) : false;
  }

  function applyDrop(source: DragSource, target: DropTarget) {
    const next = resolveLineupDrop(
      manualLineup,
      lineup,
      bench,
      { playerId: source.player.id, from: source.from },
      target,
    );
    if (next) onChange(next);
  }

  function handleDragEnd(e: MouseEvent | TouchEvent | PointerEvent, source: DragSource) {
    setDragSource(null);
    setDragGhost(null);
    const [x, y] = pointerXY(e);
    const el = document.elementFromPoint(x, y)?.closest('[data-drop]') as HTMLElement | null;
    if (!el) return;
    const raw = el.getAttribute('data-drop')!;
    if (raw === 'bench') { applyDrop(source, { kind: 'bench' }); return; }
    const idx = Number(raw);
    if (Number.isInteger(idx)) applyDrop(source, { kind: 'slot', index: idx });
  }

  const dragPlayer = dragSource?.player ?? null;

  function updateDragGhost(e: MouseEvent | TouchEvent | PointerEvent, player: PlayerCard) {
    const [x, y] = pointerXY(e);
    setDragGhost({ player, x, y });
  }

  function SecondaryPositions({ player }: { player: PlayerCard }) {
    const secondary = getPlayablePositions(player).filter((p) => p !== player.position);
    if (secondary.length === 0) return null;
    return (
      <>
        <span className="le-squad-role-arrow">→</span>
        <span className="le-squad-secondary-positions">
          {secondary.slice(0, 3).map((pos) => (
            <span key={pos} className="le-squad-secondary-pos" style={positionChipStyle(pos, false)}>
              {POSITION_BADGE[pos]}
            </span>
          ))}
        </span>
      </>
    );
  }

  function PlayerChip({ player, from }: { player: PlayerCard; from: number | 'bench' }) {
    const isGk = player.position === 'KL';
    const onField = from !== 'bench';
    const slot = onField ? lineup[from as number]?.slot : undefined;
    const tier = slot ? fitClass(player, slot) : 'ideal';
    const hoverFit = onField ? tier : 'bench';
    const dragging = dragSource?.player.id === player.id;
    return (
      <HoverTip
        tip={<LineupPlayerHoverCard player={player} slotLabel={slot?.label} fit={hoverFit} />}
        ariaLabel={getLineupPlayerHoverAria(player, slot?.label, hoverFit)}
        placement="auto"
        className="le-chip-hover"
        stopPropagation={false}
      >
      <motion.div
        className={`le-chip le-chip--${onField ? `fit-${tier}` : 'bench'} ${isGk ? 'le-chip--gk' : ''} ${highlightId === player.id ? 'le-chip--highlight' : ''} ${dragging ? 'le-chip--dragging' : ''}`}
        drag
        dragSnapToOrigin
        dragMomentum={false}
        onDragStart={(e) => {
          setDragSource({ player, from });
          updateDragGhost(e as PointerEvent, player);
        }}
        onDrag={(e) => updateDragGhost(e as PointerEvent, player)}
        onDragEnd={(e) => handleDragEnd(e as PointerEvent, { player, from })}
        whileDrag={{
          scale: 1.02,
          zIndex: 10,
          opacity: 0.25,
          pointerEvents: 'none',
          cursor: 'grabbing',
        }}
        style={{ touchAction: 'none', cursor: 'grab' }}
      >
        <span className="le-chip-rating">{player.currentRating}</span>
        <span className="le-chip-name">{formatSquadListName(player.name)}</span>
        <span className="le-chip-badge">{POSITION_BADGE[player.position]}</span>
      </motion.div>
      </HoverTip>
    );
  }

  const squadAvg = squad.length
    ? Math.round(squad.reduce((s, p) => s + p.currentRating, 0) / squad.length)
    : 0;

  const fieldPlayersForList = lineup
    .map((slot) => slot.player)
    .filter((player): player is PlayerCard => Boolean(player));
  const benchPlayersForList = squad.filter((player) => !lineupIds.has(player.id));
  const formationDisplay = formationKey.replace(/(\d)(\d)(\d)/, '$1-$2-$3');

  function ratingBadgeClass(position: string): string {
    if (position === 'KL') return 'le-squad-rating-badge--gk';
    if (position === 'SF') return 'le-squad-rating-badge--fw';
    if (['SLK', 'SÖK', 'SĞK'].includes(position)) return 'le-squad-rating-badge--wng';
    return '';
  }

  return createPortal(
    <>
      <div className="lineup-preview-backdrop" onClick={dismiss} aria-hidden />
      <div className="le-modal-group">

      {/* LEFT PANEL: squad list (desktop only) */}
      {window.innerWidth >= 900 && <div className="le-squad-panel">
        <div className="le-squad-panel-head">
          <p className="le-squad-panel-kicker">Kadro Listesi</p>
          <div className="le-squad-panel-title-row">
            <span className="le-squad-panel-title">Oyuncular</span>
            <span className="le-squad-panel-count">{squad.length} / 11</span>
          </div>
          <div className="le-squad-panel-legend">
            <span><i className="le-squad-panel-legend-main" /> ana rol</span>
            <span><i className="le-squad-panel-legend-secondary" /> oynayabildiği yan roller</span>
          </div>
        </div>
        <div className="le-squad-panel-list">
          {fieldPlayersForList.map((player) => {
            const onField = lineupIds.has(player.id);
            return (
              <div
                key={player.id}
                className={`le-squad-row ${onField ? 'le-squad-row--field' : 'le-squad-row--bench'} ${player.position === 'KL' ? 'le-squad-row--gk' : ''} ${highlightId === player.id ? 'le-squad-row--highlight' : ''}`}
              >
                <div className={`le-squad-rating-badge ${ratingBadgeClass(player.position)}`}>
                  <span className="le-squad-rating">{player.currentRating}</span>
                  <span className="le-squad-pos">{POSITION_BADGE[player.position]}</span>
                </div>
                <div className="le-squad-info">
                  {(() => {
                    return (
                      <>
                        <div className="le-squad-name-row">
                          <span className="le-squad-name" title={player.name}>{formatSquadListName(player.name)}</span>
                        </div>
                        <div className="le-squad-role-row">
                          <span className="le-squad-primary-pos" style={positionChipStyle(player.position, true)}>{POSITION_BADGE[player.position]}</span>
                          {player.position === 'KL' ? <span className="le-squad-only">sadece kalede</span> : <SecondaryPositions player={player} />}
                        </div>
                      </>
                    );
                  })()}
                  <div className="le-squad-tags">
                    {player.tags.map((tag) => (
                      <HoverTip key={tag} tip={TAG_DESCRIPTIONS[tag]} placement="right" className="le-squad-tag-tip">
                        <span className="le-squad-tag" style={tagChipStyle(tag)}>
                          <UiIcon name={iconForTag(tag)} />
                          {tag}
                        </span>
                      </HoverTip>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {benchPlayersForList.length > 0 && (
            <>
              <div className="le-squad-section-label">YEDEKLER</div>
              {benchPlayersForList.map((player) => {
                return (
                  <div
                    key={player.id}
                    className={`le-squad-row le-squad-row--bench ${player.position === 'KL' ? 'le-squad-row--gk' : ''} ${highlightId === player.id ? 'le-squad-row--highlight' : ''}`}
                  >
                    <div className={`le-squad-rating-badge ${ratingBadgeClass(player.position)}`}>
                      <span className="le-squad-rating">{player.currentRating}</span>
                      <span className="le-squad-pos">{POSITION_BADGE[player.position]}</span>
                    </div>
                    <div className="le-squad-info">
                      <div className="le-squad-name-row">
                        <span className="le-squad-name" title={player.name}>{formatSquadListName(player.name)}</span>
                      </div>
                      <div className="le-squad-role-row">
                        <span className="le-squad-primary-pos" style={positionChipStyle(player.position, true)}>{POSITION_BADGE[player.position]}</span>
                        {player.position === 'KL' ? <span className="le-squad-only">sadece kalede</span> : <SecondaryPositions player={player} />}
                      </div>
                      <div className="le-squad-tags">
                        <span className="le-squad-bench-badge">Yedek</span>
                        {player.tags.map((tag) => (
                          <HoverTip key={tag} tip={TAG_DESCRIPTIONS[tag]} placement="right" className="le-squad-tag-tip">
                            <span className="le-squad-tag" style={tagChipStyle(tag)}>
                              <UiIcon name={iconForTag(tag)} />
                              {tag}
                            </span>
                          </HoverTip>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
        <div className="le-squad-panel-foot">
          <span>Yedek: <strong>{bench.length}</strong></span>
          <span>Ø Ort: <strong className="le-squad-avg">{squadAvg}</strong></span>
        </div>
      </div>}

      <div
        ref={containerRef}
        className="le-modal"
        role="dialog"
        aria-modal="true"
        aria-label="İlk 11 düzenle"
      >
        <div className="le-head">
          <div>
            <p className="le-kicker-small">İlk 11 Önizleme</p>
            <p className="le-kicker">{formationDisplay} (varsayılan)</p>
          </div>
          <div className="le-head-legend" aria-label="Mevki uyumu">
            <span className="le-legend le-legend--ideal">ana mevki</span>
            <span className="le-legend le-legend--flex">yan mevki</span>
          </div>
          <button type="button" className="lineup-preview-close" onClick={dismiss} aria-label="İptal et — kart seçimine dön">✕</button>
        </div>

        <div className="le-body">
          <div className="le-pitch lineup-pitch--center-modal">
            <div className="lineup-pitch-grass" />
            <div className="lineup-pitch-stripes" aria-hidden />
            <div className="lineup-pitch-center" />
            <div className="lineup-pitch-box lineup-pitch-box--top" aria-hidden />
            <div className="lineup-pitch-box lineup-pitch-box--bottom" aria-hidden />
            {lineup.map((slot) => {
              const valid = dragPlayer ? canDropOnSlot(dragPlayer, slot.index) : false;
              const tier = dragPlayer && valid ? fitClass(dragPlayer, slot.slot) : null;
              return (
                <div
                  key={slot.index}
                  data-drop={slot.index}
                  className={`le-slot ${dragPlayer ? (valid ? `le-slot--valid le-slot--${tier}` : 'le-slot--invalid') : ''}`}
                  style={{ left: `${clampPct(100 - slot.y, 4, 96)}%`, top: `${clampPct(slot.x, 10, 90)}%` }}
                >
                  {slot.player
                    ? <PlayerChip player={slot.player} from={slot.index} />
                    : <span className="le-slot-label">{slot.slot.label}</span>}
                </div>
              );
            })}
          </div>

          <div className="le-bench" data-drop="bench">
            <p className="le-bench-title">Yedekler {bench.length > 0 ? `(${bench.length})` : ''}</p>
            <div className="le-bench-list">
              {bench.length === 0 && <p className="le-bench-empty">Yedek yok — tüm kadro sahada</p>}
              {bench.map((player) => (
                <PlayerChip key={player.id} player={player} from="bench" />
              ))}
            </div>
          </div>
        </div>

        <div className="le-foot">
          <button
            type="button"
            className="le-reset-prominent"
            onClick={onReset}
            title="Sistemin önerdiği en uygun yerleşime döner"
          >
            <span className="le-reset-prominent-icon" aria-hidden>↺</span>
            <span className="le-reset-prominent-text">Optimal pozisyonlara dön</span>
          </button>
          <button type="button" className="btn-primary le-confirm" onClick={onConfirm}>Onayla ve devam et</button>
        </div>
      </div>

      </div>{/* end le-modal-group */}

      {dragGhost && (
        <motion.div
          className="le-drag-ghost"
          style={{ left: dragGhost.x, top: dragGhost.y }}
          initial={{ opacity: 0, scale: 0.86 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        >
          <span className="le-drag-ghost-rating">{dragGhost.player.currentRating}</span>
          <span className="le-drag-ghost-body">
            <span className="le-drag-ghost-name">{formatSquadListName(dragGhost.player.name)}</span>
            <span className="le-drag-ghost-pos">{POSITION_BADGE[dragGhost.player.position]}</span>
          </span>
        </motion.div>
      )}
    </>,
    document.body,
  );
}

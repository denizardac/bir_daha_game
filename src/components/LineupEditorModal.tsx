import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { getSlotFitTier } from '@/data/positionFlexibility';
import {
  assignSquadToFormation,
  getActiveFormationKey,
  resolveLineupDrop,
  slotAcceptsForEditor,
  type LineupSlot,
  type ManualLineup,
} from '@/engine/lineupPreview';
import type { ActiveTactic, PlayerCard } from '@/types';
import { POSITION_BADGE } from '@/utils/positionStyle';

interface Props {
  open: boolean;
  squad: PlayerCard[];
  activeTactics: ActiveTactic[];
  manualLineup: ManualLineup;
  highlightId?: string | null;
  onChange: (next: ManualLineup) => void;
  onReset: () => void;
  onConfirm: () => void;
}

type DropTarget = { kind: 'slot'; index: number } | { kind: 'bench' };
type DragSource = { player: PlayerCard; from: number | 'bench' };

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

export function LineupEditorModal({
  open,
  squad,
  activeTactics,
  manualLineup,
  highlightId,
  onChange,
  onReset,
  onConfirm,
}: Props) {
  const formationKey = getActiveFormationKey(activeTactics);
  const lineup = useMemo(
    () => assignSquadToFormation(squad, formationKey, manualLineup),
    [squad, formationKey, manualLineup],
  );
  const lineupIds = new Set(lineup.filter((s) => s.player).map((s) => s.player!.id));
  const bench = squad.filter((p) => !lineupIds.has(p.id));

  const [dragSource, setDragSource] = useState<DragSource | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onConfirm(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onConfirm]);

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
    const [x, y] = pointerXY(e);
    const el = document.elementFromPoint(x, y)?.closest('[data-drop]') as HTMLElement | null;
    if (!el) return;
    const raw = el.getAttribute('data-drop')!;
    if (raw === 'bench') { applyDrop(source, { kind: 'bench' }); return; }
    const idx = Number(raw);
    if (Number.isInteger(idx)) applyDrop(source, { kind: 'slot', index: idx });
  }

  const dragPlayer = dragSource?.player ?? null;

  function PlayerChip({ player, from }: { player: PlayerCard; from: number | 'bench' }) {
    const isGk = player.position === 'KL';
    const onField = from !== 'bench';
    const slot = onField ? lineup[from as number]?.slot : undefined;
    const tier = slot ? fitClass(player, slot) : 'ideal';
    return (
      <motion.div
        className={`le-chip le-chip--${onField ? `fit-${tier}` : 'bench'} ${isGk ? 'le-chip--gk' : ''} ${highlightId === player.id ? 'le-chip--highlight' : ''}`}
        drag
        dragSnapToOrigin
        dragMomentum={false}
        onDragStart={() => setDragSource({ player, from })}
        onDragEnd={(e) => handleDragEnd(e as PointerEvent, { player, from })}
        whileDrag={{ scale: 1.12, zIndex: 60, pointerEvents: 'none', cursor: 'grabbing' }}
        style={{ touchAction: 'none', cursor: 'grab' }}
      >
        <span className="le-chip-rating">{player.currentRating}</span>
        <span className="le-chip-name">{player.name.split(' ').pop()}</span>
        <span className="le-chip-badge">{POSITION_BADGE[player.position]}</span>
      </motion.div>
    );
  }

  return createPortal(
    <>
      <div className="lineup-preview-backdrop" onClick={onConfirm} aria-hidden />
      <div
        ref={containerRef}
        className="le-modal"
        role="dialog"
        aria-modal="true"
        aria-label="İlk 11 düzenle"
      >
        <div className="le-head">
          <div>
            <p className="le-kicker">İlk 11'i düzenle</p>
            <p className="le-sub">Oyuncuları sürükleyip yerleştir · <span className="le-legend le-legend--ideal">ana mevki</span> <span className="le-legend le-legend--flex">yan mevki</span></p>
          </div>
          <button type="button" className="lineup-preview-close" onClick={onConfirm} aria-label="Kapat">✕</button>
        </div>

        <div className="le-body">
          <div className="le-pitch">
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
                  style={{ left: `${clampPct(slot.x)}%`, top: `${clampPct(slot.y)}%` }}
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
          <button type="button" className="btn-secondary le-reset" onClick={onReset}>↺ Otomatiğe dön</button>
          <button type="button" className="btn-primary le-confirm" onClick={onConfirm}>Onayla ve devam</button>
        </div>
      </div>
    </>,
    document.body,
  );
}

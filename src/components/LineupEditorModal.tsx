import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { HoverTip } from '@/components/HoverTip';
import { LineupPlayerHoverCard, getLineupPlayerHoverAria } from '@/components/LineupPlayerHoverCard';
import { UiIcon } from '@/components/UiIcon';
import { TAG_DESCRIPTIONS } from '@/data/tags';
import { getPlayablePositions, getSlotFitTier } from '@/data/positionFlexibility';
import {
  assignSquadToFormation,
  canSelectTransferDeparture,
  finalizePlayerTransfer,
  getActiveFormationKey,
  resolveLineupDrop,
  slotAcceptsForEditor,
  type LineupSlot,
  type ManualLineup,
} from '@/engine/lineupPreview';
import { simulateRosterDecision } from '@/engine/rosterDecision';
import type { ActiveTactic, PlayerCard, Position } from '@/types';
import { POSITION_BADGE, TAG_AVATAR_BG, formationSlotLabel, getPositionRoleColor } from '@/utils/positionStyle';
import { iconForTag } from '@/utils/gameIcons';
import { formatSquadListName } from '@/utils/squadDisplayName';

interface Props {
  open: boolean;
  squad: PlayerCard[];
  activeTactics: ActiveTactic[];
  morale: number;
  discoveredSynergies: string[];
  manualLineup: ManualLineup;
  highlightId?: string | null;
  outgoingId?: string | null;
  maxSquadSize: number;
  onChange: (next: ManualLineup) => void;
  onOutgoingChange: (playerId: string) => void;
  onReset: () => void;
  onConfirm: () => void;
  /** X / dış tık / Esc — seçimi iptal eder. Verilmezse onConfirm kullanılır. */
  onCancel?: () => void;
}

type DropTarget = { kind: 'slot'; index: number } | { kind: 'bench' };
type DragSource = { player: PlayerCard; from: number | 'bench' };
type DragGhost = { player: PlayerCard; x: number; y: number } | null;
type EditorStage = 'departure' | 'lineup';

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

function SquadTraitsRail({ player }: { player: PlayerCard }) {
  return (
    <div className="le-squad-traits-rail" role="group" aria-label={`${player.name} traitleri`}>
      {player.tags.map((tag) => (
        <HoverTip key={tag} tip={TAG_DESCRIPTIONS[tag]} placement="right" className="le-squad-tag-tip">
          <span className="le-squad-tag" style={tagChipStyle(tag)}>
            <UiIcon name={iconForTag(tag)} />
            {tag}
          </span>
        </HoverTip>
      ))}
    </div>
  );
}

export function LineupEditorModal({
  open,
  squad,
  activeTactics,
  morale,
  discoveredSynergies,
  manualLineup,
  highlightId,
  outgoingId,
  maxSquadSize,
  onChange,
  onOutgoingChange,
  onReset,
  onConfirm,
  onCancel,
}: Props) {
  const dismiss = onCancel ?? onConfirm;
  const formationKey = getActiveFormationKey(activeTactics);
  const activeSquad = useMemo(
    () => finalizePlayerTransfer(squad, outgoingId ?? null),
    [squad, outgoingId],
  );
  const lineup = useMemo(
    () => assignSquadToFormation(activeSquad, formationKey, manualLineup),
    [activeSquad, formationKey, manualLineup],
  );
  const lineupIds = new Set(lineup.filter((s) => s.player).map((s) => s.player!.id));
  const bench = activeSquad.filter((p) => !lineupIds.has(p.id));
  const highlightedPlayer = highlightId ? squad.find((player) => player.id === highlightId) ?? null : null;
  const outgoingPlayer = outgoingId ? squad.find((player) => player.id === outgoingId) ?? null : null;
  const suggestedOutgoingId = useRef(outgoingId).current;
  const previousSquad = useMemo(
    () => highlightedPlayer ? squad.filter((player) => player.id !== highlightedPlayer.id) : activeSquad,
    [activeSquad, highlightedPlayer, squad],
  );
  const previousLineup = useMemo(
    () => assignSquadToFormation(previousSquad, formationKey, manualLineup),
    [formationKey, manualLineup, previousSquad],
  );
  const [baselineStarterIds] = useState(
    () => new Set(previousLineup.flatMap((slot) => slot.player ? [slot.player.id] : [])),
  );
  const newlyBenchedIds = useMemo(
    () => new Set(bench.filter((player) => baselineStarterIds.has(player.id)).map((player) => player.id)),
    [baselineStarterIds, bench],
  );
  const transferImpact = useMemo(() => {
    if (!highlightedPlayer || !outgoingId) return null;
    const previousSquad = squad.filter((player) => player.id !== highlightedPlayer.id);
    return simulateRosterDecision(previousSquad, highlightedPlayer, {
      maxSquadSize,
      morale,
      activeTactics,
      manualLineup,
      outgoingPlayerId: outgoingId,
    });
  }, [activeTactics, highlightedPlayer, manualLineup, maxSquadSize, morale, outgoingId, squad]);
  const visibleSynergyImpacts = transferImpact?.departureSynergyImpacts
    .filter((impact) => impact.status === 'deactivated' || impact.status === 'regressed')
    .filter((impact) => !impact.synergy.hidden || discoveredSynergies.includes(impact.synergy.id))
    .sort((a, b) => {
      const priority = { activated: 4, deactivated: 0, progressed: 3, regressed: 1, unchanged: 2 };
      return priority[a.status] - priority[b.status];
    })
    .slice(0, 4) ?? [];
  const departureCandidates = highlightId
    ? squad
      .filter((player) => canSelectTransferDeparture(squad, highlightId, player.id, maxSquadSize))
      .sort((a, b) => {
        if (a.id === suggestedOutgoingId) return -1;
        if (b.id === suggestedOutgoingId) return 1;
        return a.currentRating - b.currentRating;
      })
    : [];
  const previousSlotByPlayerId = useMemo(
    () => new Map(previousLineup.flatMap((slot) => slot.player ? [[slot.player.id, slot] as const] : [])),
    [previousLineup],
  );
  const departureCandidateGroups = [
    {
      key: 'first-eleven',
      label: 'İLK 11',
      players: departureCandidates.filter((player) => previousSlotByPlayerId.has(player.id)),
    },
    {
      key: 'bench',
      label: 'YEDEKLER',
      players: departureCandidates.filter((player) => !previousSlotByPlayerId.has(player.id)),
    },
  ].filter((group) => group.players.length > 0);
  const outgoingGroupKey = outgoingPlayer && previousSlotByPlayerId.has(outgoingPlayer.id)
    ? 'first-eleven'
    : 'bench';
  const [openDepartureGroups, setOpenDepartureGroups] = useState<Set<string>>(
    () => new Set([outgoingGroupKey]),
  );
  useEffect(() => {
    setOpenDepartureGroups(new Set([outgoingGroupKey]));
  }, [outgoingGroupKey]);
  const outgoingPreviousSlot = outgoingPlayer ? previousSlotByPlayerId.get(outgoingPlayer.id) ?? null : null;
  const outgoingReplacement = outgoingPreviousSlot
    ? lineup.find((slot) => slot.slot.label === outgoingPreviousSlot.slot.label)?.player ?? null
    : null;
  const highlightedSlot = highlightId ? lineup.find((slot) => slot.player?.id === highlightId) ?? null : null;
  const highlightedTarget = highlightedSlot
    ? `${formationSlotLabel(highlightedSlot.slot.label)} (${highlightedSlot.slot.label})`
    : highlightedPlayer
      ? 'Yedek kulübesi'
      : null;
  const reduceMotion = useReducedMotion();
  // Bu formasyon kadronun mevkileriyle tam dolmuyorsa: boş slot + yedek oyuncu.
  // Oyuncuyu sürükleyip yerleştirmezse eksik kadroyla oynar (güç + sinerji düşer).

  const [dragSource, setDragSource] = useState<DragSource | null>(null);
  const [dragGhost, setDragGhost] = useState<DragGhost>(null);
  // Dokun-seç / dokun-yerleştir modu: mobilde sürüklemeye alternatif —
  // önce oyuncuya dokun (seçilir), sonra hedef slota/yedeğe dokun (taşınır).
  const [tapSource, setTapSource] = useState<DragSource | null>(null);
  const [editorStage, setEditorStage] = useState<EditorStage>(highlightedPlayer && outgoingPlayer ? 'departure' : 'lineup');
  const justDraggedRef = useRef(false);
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

  useEffect(() => {
    if (!open) {
      setTapSource(null);
    }
  }, [open]);

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
    justDraggedRef.current = true;
    window.setTimeout(() => { justDraggedRef.current = false; }, 0);
    const [x, y] = pointerXY(e);
    const el = document.elementFromPoint(x, y)?.closest('[data-drop]') as HTMLElement | null;
    if (!el) return;
    const raw = el.getAttribute('data-drop')!;
    if (raw === 'bench') { applyDrop(source, { kind: 'bench' }); return; }
    const idx = Number(raw);
    if (Number.isInteger(idx)) applyDrop(source, { kind: 'slot', index: idx });
  }

  function handleChipTap(player: PlayerCard, from: number | 'bench') {
    if (justDraggedRef.current) return;
    // Seçili oyuncu varken dolu bir slota (başka oyuncuya) dokunmak taşıma sayılır
    if (tapSource && tapSource.player.id !== player.id && from !== 'bench') {
      applyDrop(tapSource, { kind: 'slot', index: from as number });
      setTapSource(null);
      return;
    }
    setTapSource((prev) => (prev?.player.id === player.id ? null : { player, from }));
  }

  function handleSlotTap(index: number) {
    if (!tapSource) return;
    applyDrop(tapSource, { kind: 'slot', index });
    setTapSource(null);
  }

  function handleBenchTap() {
    if (!tapSource || tapSource.from === 'bench') return;
    applyDrop(tapSource, { kind: 'bench' });
    setTapSource(null);
  }

  const dragPlayer = dragSource?.player ?? tapSource?.player ?? null;

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
    const tapSelected = tapSource?.player.id === player.id;
    const highlighted = highlightId === player.id;
    const targetBadge = slot?.label ?? 'YEDEK';
    return (
      <HoverTip
        tip={<LineupPlayerHoverCard player={player} slotLabel={slot?.label} fit={hoverFit} />}
        ariaLabel={getLineupPlayerHoverAria(player, slot?.label, hoverFit)}
        placement="auto"
        className="le-chip-hover"
        stopPropagation={false}
      >
      <motion.button
        type="button"
        aria-label={`${getLineupPlayerHoverAria(player, slot?.label, hoverFit)}. ${tapSelected ? 'Seçildi; hedef slotu seç.' : 'Taşımak için seç.'}`}
        aria-pressed={tapSelected}
        className={`le-chip le-chip--${onField ? `fit-${tier}` : 'bench'} ${isGk ? 'le-chip--gk' : ''} ${highlighted ? 'le-chip--highlight' : ''} ${dragging ? 'le-chip--dragging' : ''} ${tapSelected ? 'le-chip--selected' : ''}`}
        initial={highlighted && !reduceMotion ? { opacity: 0, x: -42, scale: 0.78 } : false}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={highlighted && !reduceMotion
          ? { type: 'spring', stiffness: 310, damping: 22, delay: 0.12 }
          : { duration: 0 }}
        drag
        dragSnapToOrigin
        dragMomentum={false}
        onDragStart={(e) => {
          setTapSource(null);
          setDragSource({ player, from });
          updateDragGhost(e as PointerEvent, player);
        }}
        onDrag={(e) => updateDragGhost(e as PointerEvent, player)}
        onDragEnd={(e) => handleDragEnd(e as PointerEvent, { player, from })}
        onClick={(e) => {
          e.stopPropagation();
          handleChipTap(player, from);
        }}
        whileDrag={{
          scale: 1.02,
          zIndex: 10,
          opacity: 0.25,
          pointerEvents: 'none',
          cursor: 'grabbing',
        }}
        style={{ touchAction: 'none', cursor: 'grab' }}
      >
        {highlighted && (
          <motion.span
            className="le-new-placement-marker"
            initial={reduceMotion ? false : { opacity: 0, y: 6, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={reduceMotion ? { duration: 0 } : { delay: 0.48, duration: 0.24 }}
            aria-hidden
          >
            YENİ <span>→ {targetBadge}</span>
          </motion.span>
        )}
        <span className="le-chip-rating">{player.currentRating}</span>
        <span className="le-chip-name">{formatSquadListName(player.name)}</span>
        <span className="le-chip-badge">{POSITION_BADGE[player.position]}</span>
      </motion.button>
      </HoverTip>
    );
  }

  const squadAvg = activeSquad.length
    ? Math.round(activeSquad.reduce((s, p) => s + p.currentRating, 0) / activeSquad.length)
    : 0;

  const fieldPlayersForList = lineup
    .map((slot) => slot.player)
    .filter((player): player is PlayerCard => Boolean(player));
  const benchPlayersForList = activeSquad.filter((player) => !lineupIds.has(player.id));
  const formationDisplay = formationKey.replace(/(\d)(\d)(\d)/, '$1-$2-$3');
  const choosingDeparture = Boolean(highlightedPlayer && outgoingPlayer && editorStage === 'departure');
  const newlyBenchedPlayer = benchPlayersForList.find((player) => newlyBenchedIds.has(player.id)) ?? null;

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

      {/* LEFT PANEL: squad list */}
      <div className="le-squad-panel">
        <div className="le-squad-panel-head">
          <p className="le-squad-panel-kicker">{choosingDeparture ? 'Kadro Kararı' : 'Kadro Listesi'}</p>
          <div className="le-squad-panel-title-row">
            <span className="le-squad-panel-title">{choosingDeparture ? 'Transfer Tahtası' : 'Oyuncular'}</span>
            <span className="le-squad-panel-count">
              {outgoingPlayer ? `${squad.length} aday · ${maxSquadSize} yer` : `${activeSquad.length} / ${maxSquadSize}`}
            </span>
          </div>
          {choosingDeparture ? (
            <p className="le-transfer-board-intro">Yeni transfer için bir oyuncuyla yollar ayrılmalı. Kararı doğrudan kadrodan ver.</p>
          ) : (
            <div className="le-squad-panel-legend">
              <span><i className="le-squad-panel-legend-main" /> ana rol</span>
              <span><i className="le-squad-panel-legend-secondary" /> oynayabildiği yan roller</span>
            </div>
          )}
        </div>
        {choosingDeparture && outgoingPlayer && highlightedPlayer ? (
          <div className="le-squad-panel-list le-squad-panel-list--transfer">
            <section className="le-transfer-board" aria-label="Transfer tahtası">
              <div className="le-transfer-board-incoming">
                <span className="le-transfer-board-incoming-label">GELEN OYUNCU</span>
                <span className="le-transfer-board-incoming-rating">{highlightedPlayer.currentRating}</span>
                <span className="le-transfer-board-incoming-body">
                  <strong>{formatSquadListName(highlightedPlayer.name)}</strong>
                  <small>Ana mevki · {POSITION_BADGE[highlightedPlayer.position]}</small>
                  {highlightedPlayer.tags.length > 0 && (
                    <span className="le-transfer-board-incoming-tags">
                      {highlightedPlayer.tags.map((tag) => <i key={tag}>{tag}</i>)}
                    </span>
                  )}
                </span>
                <span className="le-transfer-board-incoming-mark" aria-hidden>+</span>
              </div>

              <div className="le-transfer-board-question">
                <span>KİM AYRILIYOR?</span>
                <small>Bir oyuncu seç</small>
              </div>
              <div className="le-transfer-board-candidates" role="listbox" aria-label="Kadrodan ayrılabilecek oyuncular">
                {departureCandidateGroups.map((group) => {
                  const isOpen = openDepartureGroups.has(group.key);
                  const groupPanelId = `departure-group-${group.key}`;
                  return (
                  <div key={group.key} className="le-transfer-board-candidate-group" role="group" aria-label={group.label}>
                    <button
                      type="button"
                      className="le-transfer-board-candidate-group-title"
                      aria-expanded={isOpen}
                      aria-controls={groupPanelId}
                      onClick={() => setOpenDepartureGroups((current) => {
                        const next = new Set(current);
                        if (next.has(group.key)) next.delete(group.key);
                        else next.add(group.key);
                        return next;
                      })}
                    >
                      <span>{group.label}</span>
                      <small>{group.players.length} oyuncu</small>
                      <UiIcon name="arrow-right" />
                    </button>
                    {isOpen && <div id={groupPanelId} className="le-transfer-board-candidate-group-list">
                    {group.players.map((player) => {
                      const selected = player.id === outgoingId;
                      const currentSlot = previousSlotByPlayerId.get(player.id);
                      const currentRole = currentSlot
                        ? `${formationSlotLabel(currentSlot.slot.label)} (${currentSlot.slot.label})`
                        : 'Yedek kulübesi';
                      return (
                        <button
                          key={player.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          aria-label={`${player.name}, ${player.currentRating}, ${POSITION_BADGE[player.position]}. ${selected ? 'Ayrılacak oyuncu seçildi' : 'Ayrılacak oyuncu olarak seç'}`}
                          className={`le-transfer-board-candidate ${selected ? 'le-transfer-board-candidate--selected' : ''}`}
                          onClick={() => onOutgoingChange(player.id)}
                        >
                          <span className="le-transfer-board-candidate-rating">{player.currentRating}</span>
                          <span className="le-transfer-board-candidate-body">
                            <strong>{formatSquadListName(player.name)}</strong>
                            <small>Şu an · {currentRole}</small>
                            <span className="le-transfer-board-candidate-meta">
                              <i>Ana · {POSITION_BADGE[player.position]}</i>
                              {player.tags.map((tag) => <i key={tag}>{tag}</i>)}
                            </span>
                          </span>
                          <span className="le-transfer-board-candidate-status" data-transfer-status>
                            {selected
                              ? <b>AYRILIYOR</b>
                              : player.id === suggestedOutgoingId
                                ? <b className="le-transfer-board-suggested">ÖNERİLEN</b>
                                : <UiIcon name="arrow-right" />}
                          </span>
                        </button>
                      );
                    })}
                    </div>}
                  </div>
                  );
                })}
              </div>

              <section className="le-transfer-board-decision" role="region" aria-label="Ayrılık kararı" aria-live="polite">
                <div className="le-transfer-board-decision-player">
                  <span className="le-transfer-board-decision-rating">{outgoingPlayer.currentRating}</span>
                  <div>
                    <small>AYRILACAK OYUNCU</small>
                    <strong>{formatSquadListName(outgoingPlayer.name)}</strong>
                  </div>
                  <span className="le-transfer-board-decision-status">AYRILIYOR</span>
                </div>
                <div className="le-transfer-board-decision-context">
                  <span>{outgoingPreviousSlot ? `Şu an · İlk 11 · ${formationSlotLabel(outgoingPreviousSlot.slot.label)} (${outgoingPreviousSlot.slot.label})` : 'Şu an · Yedek kulübesi'}</span>
                  <span>Ana mevki · {POSITION_BADGE[outgoingPlayer.position]}</span>
                  {outgoingPlayer.tags.map((tag) => <span key={tag} className="le-transfer-board-decision-trait">{tag}</span>)}
                </div>
                <p className="le-transfer-board-replacement">
                  <UiIcon name="arrow-right" />
                  {outgoingPreviousSlot
                    ? outgoingReplacement
                      ? <><span>Yerine</span> <strong>{formatSquadListName(outgoingReplacement.name)}</strong> <span>{outgoingPreviousSlot.slot.label} slotuna geçiyor.</span></>
                      : <><span>Yerine</span> <strong>kimse geçmiyor</strong> <span>· {outgoingPreviousSlot.slot.label} boş kalıyor.</span></>
                    : <span>Yedekten ayrılıyor; mevcut İlk 11 düzeni değişmiyor.</span>}
                </p>
                <div className="le-transfer-board-impact">
                  <div className="le-transfer-board-impact-head">
                    <span>BU AYRILIĞIN BEDELİ</span>
                    <small>Yalnızca negatif sinerji etkisi</small>
                  </div>
                  {visibleSynergyImpacts.length > 0 ? (
                    <div className="le-transfer-synergy-impact">
                      {visibleSynergyImpacts.map((impact) => (
                        <span key={impact.synergy.id} className={`le-transfer-synergy-chip le-transfer-synergy-chip--${impact.status}`}>
                          <strong>{impact.synergy.name}</strong>
                          <small>{impact.status === 'deactivated'
                            ? 'Kapanır'
                            : `${impact.beforeProgress?.current ?? 0} → ${impact.afterProgress?.current ?? 0}`}</small>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="le-transfer-board-impact-empty">Aktif sinerji kapanmıyor.</p>
                  )}
                </div>
              </section>
            </section>
          </div>
        ) : (
        <>
        {outgoingPlayer && highlightedPlayer && (
          <section className="le-transfer-summary" aria-label="Kesinleşen kadro kararı">
            <div className="le-transfer-summary-flow">
              <span className="le-transfer-summary-player le-transfer-summary-player--out">
                <small>AYRILIYOR</small>
                <strong>{formatSquadListName(outgoingPlayer.name)}</strong>
              </span>
              <UiIcon name="arrow-right" />
              <span className="le-transfer-summary-player le-transfer-summary-player--in">
                <small>GELİYOR</small>
                <strong>{formatSquadListName(highlightedPlayer.name)}</strong>
              </span>
            </div>
            {newlyBenchedPlayer && (
              <span className="le-transfer-summary-bench">{formatSquadListName(newlyBenchedPlayer.name)} yedeğe düşüyor</span>
            )}
            <button type="button" className="le-transfer-summary-change" onClick={() => setEditorStage('departure')}>
              Ayrılık kararını değiştir
            </button>
          </section>
        )}
        <div className="le-squad-panel-list">
          {benchPlayersForList.length > 0 && (
            <section className="le-bench-focus" aria-label="İlk 11 değişikliği">
              <div className="le-bench-focus-head">
                <div>
                  <span className="le-bench-focus-kicker">YEDEK KULÜBESİ</span>
                  <strong>İlk 11'i kur</strong>
                </div>
                <p><span>1</span> Oyuncuyu seç <i>→</i> <span>2</span> Sahadaki hedefe dokun</p>
              </div>
              <div className="le-bench-focus-list">
                {benchPlayersForList.map((player) => {
                  const selected = tapSource?.player.id === player.id;
                  const benchStatus = highlightId === player.id
                    ? 'Yeni transfer · yedekte'
                    : newlyBenchedIds.has(player.id)
                      ? 'Yedeğe düşüyor'
                      : 'Yedek';
                  return (
                    <div
                      key={player.id}
                      className={`le-squad-row le-squad-row--bench le-squad-row--bench-feature ${player.position === 'KL' ? 'le-squad-row--gk' : ''} ${highlightId === player.id ? 'le-squad-row--highlight' : ''}`}
                    >
                      <div className={`le-squad-rating-badge ${ratingBadgeClass(player.position)}`}>
                        <span className="le-squad-rating">{player.currentRating}</span>
                        <span className="le-squad-pos">{POSITION_BADGE[player.position]}</span>
                      </div>
                      <div className="le-squad-info">
                        <div className="le-squad-name-row">
                          <span className="le-squad-name" title={player.name}>{formatSquadListName(player.name)}</span>
                          <span className={`le-squad-bench-badge ${newlyBenchedIds.has(player.id) ? 'le-squad-bench-badge--new' : ''} ${highlightId === player.id ? 'le-squad-bench-badge--incoming' : ''}`}>
                            {benchStatus}
                          </span>
                        </div>
                        <div className="le-squad-role-row">
                          <span className="le-squad-primary-pos" style={positionChipStyle(player.position, true)}>{POSITION_BADGE[player.position]}</span>
                          {player.position === 'KL' ? <span className="le-squad-only">sadece kalede</span> : <SecondaryPositions player={player} />}
                        </div>
                      </div>
                      <SquadTraitsRail player={player} />
                      <button
                        type="button"
                        className={`le-squad-place-btn ${selected ? 'le-squad-place-btn--active' : ''}`}
                        aria-pressed={selected}
                        aria-label={selected
                          ? `${player.name} seçildi; hedef mevkiyi seç`
                          : `${player.name} oyuncusunu sahaya al`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setTapSource((current) => current?.player.id === player.id ? null : { player, from: 'bench' });
                        }}
                      >
                        <span>{selected ? 'Hedefi seç' : 'Sahaya al'}</span>
                        <UiIcon name="arrow-right" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {benchPlayersForList.length > 0 && (
            <div className="le-field-list-label">
              <span>SAHADAKİLER</span>
              <small>{fieldPlayersForList.length} oyuncu</small>
            </div>
          )}
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
                </div>
                <SquadTraitsRail player={player} />
              </div>
            );
          })}
        </div>
        </>
        )}
        <div className="le-squad-panel-foot">
          <span>Yedek: <strong>{bench.length}</strong></span>
          <span>Ø Ort: <strong className="le-squad-avg">{squadAvg}</strong></span>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`le-modal ${choosingDeparture ? 'le-modal--transfer-preview' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={choosingDeparture ? 'Ayrılık sonrası kadro önizlemesi' : 'İlk 11 düzenle'}
      >
        <div className="le-head">
          <div>
            <p className="le-kicker-small">{choosingDeparture ? 'Ayrılık Sonrası Önizleme' : 'İlk 11 Önizleme'}</p>
            <p className="le-kicker">{formationDisplay} (varsayılan)</p>
            {highlightedPlayer && highlightedTarget && (
              <motion.div
                key={`${highlightedPlayer.id}-${highlightedTarget}`}
                className="le-new-placement-notice"
                role="status"
                aria-live="polite"
                initial={reduceMotion ? false : { opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={reduceMotion ? { duration: 0 } : { delay: 0.18, duration: 0.28 }}
              >
                <span className="le-new-placement-notice-kicker">Yeni transfer</span>
                <strong>{formatSquadListName(highlightedPlayer.name)}</strong>
                <UiIcon name="arrow-right" />
                <span>{highlightedTarget}</span>
              </motion.div>
            )}
          </div>
          <div className="le-head-legend" aria-label="Mevki uyumu">
            <span className="le-legend le-legend--ideal">ana mevki</span>
            <span className="le-legend le-legend--flex">yan mevki</span>
          </div>
          <button type="button" className="lineup-preview-close" onClick={dismiss} aria-label="İptal et — kart seçimine dön"><UiIcon name="x" /></button>
        </div>

        <div className={`le-body ${choosingDeparture ? 'le-body--locked-preview' : ''}`}>
          <p className="sr-only" aria-live="polite">
            {tapSource ? `${tapSource.player.name} seçildi. Geçerli bir saha slotu veya yedek kulübesi seçin.` : ''}
          </p>
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
                  role={!slot.player ? 'button' : undefined}
                  tabIndex={!slot.player ? 0 : undefined}
                  aria-label={!slot.player ? `${slot.slot.label} boş slot${valid ? ', yerleştirmeye uygun' : ''}` : undefined}
                  className={`le-slot ${dragPlayer ? (valid ? `le-slot--valid le-slot--${tier}` : 'le-slot--invalid') : ''}`}
                  style={{ left: `${clampPct(100 - slot.y, 4, 96)}%`, top: `${clampPct(slot.x, 10, 90)}%` }}
                  onClick={() => { if (!slot.player) handleSlotTap(slot.index); }}
                  onKeyDown={(event) => {
                    if (!slot.player && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      handleSlotTap(slot.index);
                    }
                  }}
                >
                  {slot.player
                    ? <PlayerChip player={slot.player} from={slot.index} />
                    : <span className="le-slot-label">{slot.slot.label}</span>}
                </div>
              );
            })}
          </div>

          <div
            className="le-bench"
            data-drop="bench"
            onClick={handleBenchTap}
            role={tapSource?.from !== 'bench' ? 'button' : undefined}
            tabIndex={tapSource?.from !== 'bench' ? 0 : undefined}
            aria-label={tapSource?.from !== 'bench' ? 'Seçili oyuncuyu yedeğe al' : undefined}
            onKeyDown={(event) => {
              if (tapSource?.from !== 'bench' && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                handleBenchTap();
              }
            }}
          >
            <p className="le-bench-title">Yedekler {bench.length > 0 ? `(${bench.length})` : ''}</p>
            <div className="le-bench-list">
              {bench.length === 0 && <p className="le-bench-empty">Yedek yok — tüm kadro sahada</p>}
              {bench.map((player) => (
                <PlayerChip key={player.id} player={player} from="bench" />
              ))}
            </div>
          </div>
        </div>

        <div className={`le-foot ${choosingDeparture ? 'le-foot--transfer' : ''}`}>
          {choosingDeparture && outgoingPlayer ? (
            <button
              type="button"
              className="btn-primary le-confirm le-confirm--stage"
              aria-label={`${outgoingPlayer.name} ayrılıyor → İlk 11'i kur`}
              onClick={() => setEditorStage('lineup')}
            >
              <span>{formatSquadListName(outgoingPlayer.name)} ayrılıyor</span>
              <strong>İlk 11'i kur</strong>
              <UiIcon name="arrow-right" />
            </button>
          ) : (
            <>
              <button
                type="button"
                className="le-reset-prominent"
                onClick={onReset}
                title="Sistemin önerdiği en uygun yerleşime döner"
              >
                <span className="le-reset-prominent-icon" aria-hidden>↺</span>
                <span className="le-reset-prominent-text">Optimal pozisyonlara dön</span>
              </button>
              <button type="button" className="btn-primary le-confirm" onClick={onConfirm}>İlk 11'i onayla ve maça geç</button>
            </>
          )}
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

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
import { createDebugCode } from '@/engine/debugCode';
import { copyText } from '@/utils/clipboard';
import type { ActiveTactic, PlayerCard, Position } from '@/types';
import { POSITION_BADGE, TAG_AVATAR_BG, formationSlotLabel, getPositionRoleColor } from '@/utils/positionStyle';
import { iconForTag } from '@/utils/gameIcons';
import { formatSquadListName } from '@/utils/squadDisplayName';

interface Props {
  open: boolean;
  seed: string;
  round: number;
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
  seed,
  round,
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
  const visibleSynergyImpacts = transferImpact?.synergyImpacts
    .filter((impact) => impact.status !== 'unchanged')
    .filter((impact) => !impact.synergy.hidden || discoveredSynergies.includes(impact.synergy.id) || impact.afterActive)
    .sort((a, b) => {
      const priority = { activated: 0, deactivated: 1, progressed: 2, regressed: 3, unchanged: 4 };
      return priority[a.status] - priority[b.status];
    })
    .slice(0, 4) ?? [];
  const departureCandidates = highlightId
    ? squad
      .filter((player) => canSelectTransferDeparture(squad, highlightId, player.id, maxSquadSize))
      .sort((a, b) => {
        if (a.id === outgoingId) return -1;
        if (b.id === outgoingId) return 1;
        return a.currentRating - b.currentRating;
      })
    : [];
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
  const [departurePickerOpen, setDeparturePickerOpen] = useState(false);
  const [debugCopied, setDebugCopied] = useState(false);
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
      setDeparturePickerOpen(false);
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

  async function copyDebugCode() {
    const code = createDebugCode({
      seed,
      round,
      phase: 'cardSelect',
      squad,
      activeTactics,
      manualLineup,
      incomingPlayerId: highlightId,
      outgoingPlayerId: outgoingId,
    });
    if (await copyText(code)) {
      setDebugCopied(true);
      window.setTimeout(() => setDebugCopied(false), 1800);
    }
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
          <p className="le-squad-panel-kicker">Kadro Listesi</p>
          <div className="le-squad-panel-title-row">
            <span className="le-squad-panel-title">Oyuncular</span>
            <span className="le-squad-panel-count">
              {outgoingPlayer ? `${squad.length} aday · ${maxSquadSize} yer` : `${activeSquad.length} / ${maxSquadSize}`}
            </span>
          </div>
          <div className="le-squad-panel-legend">
            <span><i className="le-squad-panel-legend-main" /> ana rol</span>
            <span><i className="le-squad-panel-legend-secondary" /> oynayabildiği yan roller</span>
          </div>
        </div>
        {outgoingPlayer && highlightedPlayer && (
          <section className={`le-transfer-decision ${departurePickerOpen ? 'le-transfer-decision--open' : ''}`} aria-label="Kadrodan ayrılacak oyuncu">
            <div className="le-transfer-decision-head">
              <div>
                <span className="le-transfer-decision-kicker">KADRODAN AYRILACAK</span>
                <strong>Bu karar sinerjileri etkiler</strong>
              </div>
              <button
                type="button"
                className="le-transfer-change-btn"
                onClick={() => setDeparturePickerOpen((value) => !value)}
                aria-expanded={departurePickerOpen}
              >
                {departurePickerOpen ? 'Kapat' : 'Değiştir'}
              </button>
            </div>
            <div className="le-transfer-outgoing">
              <span className="le-transfer-outgoing-rating">{outgoingPlayer.currentRating}</span>
              <span className="le-transfer-outgoing-body">
                <strong>{formatSquadListName(outgoingPlayer.name)}</strong>
                <small>{POSITION_BADGE[outgoingPlayer.position]} · seçilen çıkış</small>
              </span>
              <UiIcon name="arrow-right" />
              <span className="le-transfer-incoming-mini">
                <strong>{formatSquadListName(highlightedPlayer.name)}</strong>
                <small>kadroya girer</small>
              </span>
            </div>
            {visibleSynergyImpacts.length > 0 && (
              <div className="le-transfer-synergy-impact" aria-live="polite">
                {visibleSynergyImpacts.map((impact) => {
                  const hiddenDiscovery = impact.synergy.hidden
                    && !discoveredSynergies.includes(impact.synergy.id)
                    && impact.status === 'activated';
                  const label = hiddenDiscovery ? 'Gizli sinerji keşfi' : impact.synergy.name;
                  const statusLabel = impact.status === 'activated'
                    ? 'Açılır'
                    : impact.status === 'deactivated'
                      ? 'Kapanır'
                      : impact.status === 'progressed'
                        ? `${impact.beforeProgress?.current ?? 0} → ${impact.afterProgress?.current ?? impact.beforeProgress?.required ?? 0}`
                        : `${impact.beforeProgress?.current ?? 0} → ${impact.afterProgress?.current ?? 0}`;
                  return (
                    <span key={impact.synergy.id} className={`le-transfer-synergy-chip le-transfer-synergy-chip--${impact.status}`}>
                      <strong>{label}</strong>
                      <small>{statusLabel}</small>
                    </span>
                  );
                })}
              </div>
            )}
            {departurePickerOpen && (
              <div className="le-transfer-candidates" role="listbox" aria-label="Kadrodan çıkarılabilecek oyuncular">
                {departureCandidates.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    role="option"
                    aria-selected={player.id === outgoingId}
                    className={`le-transfer-candidate ${player.id === outgoingId ? 'le-transfer-candidate--selected' : ''}`}
                    onClick={() => {
                      onOutgoingChange(player.id);
                      setDeparturePickerOpen(false);
                    }}
                  >
                    <span>{player.currentRating}</span>
                    <strong>{formatSquadListName(player.name)}</strong>
                    <small>{POSITION_BADGE[player.position]}</small>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
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
                        <button
                          type="button"
                          className={`le-squad-place-btn ${tapSource?.player.id === player.id ? 'le-squad-place-btn--active' : ''}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setTapSource((current) => current?.player.id === player.id ? null : { player, from: 'bench' });
                          }}
                        >
                          {tapSource?.player.id === player.id ? 'Slot seç' : 'Sahaya al'}
                        </button>
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
          <button type="button" className="le-debug-copy" onClick={() => void copyDebugCode()}>
            <UiIcon name="clipboard" />
            {debugCopied ? 'Kopyalandı' : 'Tanı kodu'}
          </button>
        </div>
      </div>

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

        <div className="le-body">
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

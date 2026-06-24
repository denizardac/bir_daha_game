import { clonePlayer } from '@/data/players';
import { getPlayablePositions, getSlotFitTier, playerPlaysPosition, slotFitIndex } from '@/data/positionFlexibility';
import { assignPlayersByRules, assignPlayersByRulesWithPins, canBeatOccupant, slotAcceptsPlayerForPlacement } from '@/engine/lineupPlacement';

export type ManualLineup = Record<number, string>;
const EMPTY_MANUAL_LINEUP: ManualLineup = {};
import { getTacticCategory } from '@/data/tactics';
import { getFormationDotsByKey, getFormationKey } from '@/engine/tacticVisual';
import { getDepartureScore, selectDepartingPlayer } from '@/engine/squadLogic';
import type { ActiveTactic, PlayerCard, Position } from '@/types';
import { formatSlotMismatchWarn, formationSlotLabel, POSITION_BADGE, POSITION_LABELS } from '@/utils/positionStyle';

function slotLabel(label: string): string {
  return formationSlotLabel(label);
}

export type PositionZone = 'kaleci' | 'savunma' | 'orta' | 'hucum';

export type PositionHintTone = 'info' | 'warn' | 'good';

export type PositionHint = {
  text: string;
  tone: PositionHintTone;
};

export type FormationSlotDef = {
  label: string;
  preferred: Position[];
  zone: PositionZone;
};

export type LineupSlot = {
  index: number;
  x: number;
  y: number;
  role?: 'gk' | 'field';
  slot: FormationSlotDef;
  player: PlayerCard | null;
  outOfPosition: boolean;
};

export type SquadZoneCount = {
  zone: PositionZone;
  label: string;
  count: number;
};

const ZONE_LABELS: Record<PositionZone, string> = {
  kaleci: 'Kaleci',
  savunma: 'Savunma',
  orta: 'Orta saha',
  hucum: 'Hücum',
};

export const POSITION_ZONE: Record<Position, PositionZone> = {
  KL: 'kaleci',
  STP: 'savunma',
  SLB: 'savunma',
  SÖB: 'savunma',
  DOS: 'orta',
  OS: 'orta',
  OOS: 'orta',
  SLK: 'hucum',
  SÖK: 'hucum',
  SF: 'hucum',
};

const MIDFIELD_POSITIONS = new Set<Position>(['DOS', 'OS', 'OOS']);

/** Kanat slotları — OS/DOS buraya asla yazılmaz (flex listesinde kanat yok) */
export const WING_SLOT_LABELS = new Set(['SĞK', 'SLK']);

export function isMidfieldPlayer(player: PlayerCard): boolean {
  return MIDFIELD_POSITIONS.has(player.position);
}

/** OS/DOS kanada, KL sahada, uyumsuz mevki — slot reddi */
export function slotAcceptsPlayer(player: PlayerCard, slot: FormationSlotDef): boolean {
  return slotAcceptsPlayerForPlacement(player, slot);
}

export function isIllegalCentralMidWingSlot(player: PlayerCard, slotLabel: string): boolean {
  if (!WING_SLOT_LABELS.has(slotLabel)) return false;
  const wingRole = slotLabel === 'SĞK' ? 'SÖK' : 'SLK';
  return !playerPlaysPosition(player, wingRole);
}

/** Güçlü yedek / yeni oyuncu zayıf starter'ın yerine geçebilir mi? (+1 yeter) */
export function canDisplaceStarter(
  challenger: PlayerCard,
  occupant: PlayerCard,
  slot: FormationSlotDef,
): boolean {
  if (!slotAcceptsPlayer(challenger, slot)) return false;
  return canBeatOccupant(challenger, occupant);
}

const FORMATION_SLOTS: Record<string, FormationSlotDef[]> = {
  '442': [
    { label: 'KL', preferred: ['KL'], zone: 'kaleci' },
    { label: 'SLB', preferred: ['SLB', 'STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'SĞB', preferred: ['SÖB', 'STP'], zone: 'savunma' },
    { label: 'SLK', preferred: ['SLK', 'OOS'], zone: 'hucum' },
    { label: 'DOS', preferred: ['DOS', 'OS'], zone: 'orta' },
    { label: 'OS', preferred: ['OS', 'OOS', 'DOS'], zone: 'orta' },
    { label: 'SĞK', preferred: ['SÖK', 'OOS'], zone: 'hucum' },
    { label: 'SF', preferred: ['SF'], zone: 'hucum' },
    { label: 'SF', preferred: ['SF'], zone: 'hucum' },
  ],
  '433': [
    { label: 'KL', preferred: ['KL'], zone: 'kaleci' },
    { label: 'SLB', preferred: ['SLB', 'STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'SĞB', preferred: ['SÖB', 'STP'], zone: 'savunma' },
    { label: 'DOS', preferred: ['DOS', 'OS'], zone: 'orta' },
    { label: 'OS', preferred: ['OS', 'OOS', 'DOS'], zone: 'orta' },
    { label: 'OOS', preferred: ['OOS', 'OS'], zone: 'orta' },
    { label: 'SLK', preferred: ['SLK'], zone: 'hucum' },
    { label: 'SF', preferred: ['SF'], zone: 'hucum' },
    { label: 'SĞK', preferred: ['SÖK'], zone: 'hucum' },
  ],
  '352': [
    { label: 'KL', preferred: ['KL'], zone: 'kaleci' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'SLK', preferred: ['SLK', 'SLB', 'SÖK'], zone: 'hucum' },
    { label: 'DOS', preferred: ['DOS', 'OS'], zone: 'orta' },
    { label: 'OS', preferred: ['OS', 'OOS'], zone: 'orta' },
    { label: 'OOS', preferred: ['OOS', 'OS'], zone: 'orta' },
    { label: 'SĞK', preferred: ['SÖK', 'SÖB', 'OOS'], zone: 'hucum' },
    { label: 'SF', preferred: ['SF'], zone: 'hucum' },
    { label: 'SF', preferred: ['SF'], zone: 'hucum' },
  ],
  '532': [
    { label: 'KL', preferred: ['KL'], zone: 'kaleci' },
    { label: 'SLB', preferred: ['SLB', 'STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'SĞB', preferred: ['SÖB', 'STP'], zone: 'savunma' },
    { label: 'DOS', preferred: ['DOS', 'OS'], zone: 'orta' },
    { label: 'OS', preferred: ['OS', 'OOS'], zone: 'orta' },
    { label: 'OOS', preferred: ['OOS', 'OS'], zone: 'orta' },
    { label: 'SF', preferred: ['SF'], zone: 'hucum' },
    { label: 'SF', preferred: ['SF'], zone: 'hucum' },
  ],
  '4231': [
    { label: 'KL', preferred: ['KL'], zone: 'kaleci' },
    { label: 'SLB', preferred: ['SLB', 'STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'SĞB', preferred: ['SÖB', 'STP'], zone: 'savunma' },
    { label: 'DOS', preferred: ['DOS'], zone: 'orta' },
    { label: 'DOS', preferred: ['DOS', 'OS'], zone: 'orta' },
    { label: 'SLK', preferred: ['SLK', 'OOS'], zone: 'hucum' },
    { label: 'OOS', preferred: ['OOS', 'OS'], zone: 'orta' },
    { label: 'SĞK', preferred: ['SÖK', 'OOS'], zone: 'hucum' },
    { label: 'SF', preferred: ['SF'], zone: 'hucum' },
  ],
  '343': [
    { label: 'KL', preferred: ['KL'], zone: 'kaleci' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'SLB', preferred: ['SLB', 'SLK'], zone: 'savunma' },
    { label: 'DOS', preferred: ['DOS', 'OS'], zone: 'orta' },
    { label: 'OS', preferred: ['OS', 'OOS'], zone: 'orta' },
    { label: 'SĞB', preferred: ['SÖB', 'SÖK'], zone: 'savunma' },
    { label: 'SLK', preferred: ['SLK', 'OOS'], zone: 'hucum' },
    { label: 'SF', preferred: ['SF'], zone: 'hucum' },
    { label: 'SĞK', preferred: ['SÖK', 'OOS'], zone: 'hucum' },
  ],
  'diamond': [
    { label: 'KL', preferred: ['KL'], zone: 'kaleci' },
    { label: 'SLB', preferred: ['SLB', 'STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'SĞB', preferred: ['SÖB', 'STP'], zone: 'savunma' },
    { label: 'DOS', preferred: ['DOS', 'OS'], zone: 'orta' },
    { label: 'OS', preferred: ['OS', 'DOS'], zone: 'orta' },
    { label: 'OS', preferred: ['OS', 'OOS'], zone: 'orta' },
    { label: 'OOS', preferred: ['OOS', 'OS'], zone: 'orta' },
    { label: 'SF', preferred: ['SF'], zone: 'hucum' },
    { label: 'SF', preferred: ['SF'], zone: 'hucum' },
  ],
  '4411': [
    { label: 'KL', preferred: ['KL'], zone: 'kaleci' },
    { label: 'SLB', preferred: ['SLB', 'STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'SĞB', preferred: ['SÖB', 'STP'], zone: 'savunma' },
    { label: 'SLK', preferred: ['SLK', 'OOS'], zone: 'hucum' },
    { label: 'DOS', preferred: ['DOS', 'OS'], zone: 'orta' },
    { label: 'OS', preferred: ['OS', 'OOS', 'DOS'], zone: 'orta' },
    { label: 'SĞK', preferred: ['SÖK', 'OOS'], zone: 'hucum' },
    { label: 'OOS', preferred: ['OOS', 'OS'], zone: 'orta' },
    { label: 'SF', preferred: ['SF'], zone: 'hucum' },
  ],
  '3412': [
    { label: 'KL', preferred: ['KL'], zone: 'kaleci' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'SLK', preferred: ['SLK', 'SLB', 'SÖK'], zone: 'hucum' },
    { label: 'DOS', preferred: ['DOS', 'OS'], zone: 'orta' },
    { label: 'OS', preferred: ['OS', 'OOS'], zone: 'orta' },
    { label: 'SĞK', preferred: ['SÖK', 'SÖB', 'OOS'], zone: 'hucum' },
    { label: 'OOS', preferred: ['OOS', 'OS'], zone: 'orta' },
    { label: 'SF', preferred: ['SF'], zone: 'hucum' },
    { label: 'SF', preferred: ['SF'], zone: 'hucum' },
  ],
  '451': [
    { label: 'KL', preferred: ['KL'], zone: 'kaleci' },
    { label: 'SLB', preferred: ['SLB', 'STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'SĞB', preferred: ['SÖB', 'STP'], zone: 'savunma' },
    { label: 'SLK', preferred: ['SLK', 'OOS'], zone: 'hucum' },
    { label: 'DOS', preferred: ['DOS', 'OS'], zone: 'orta' },
    { label: 'OS', preferred: ['OS', 'OOS', 'DOS'], zone: 'orta' },
    { label: 'OOS', preferred: ['OOS', 'OS'], zone: 'orta' },
    { label: 'SĞK', preferred: ['SÖK', 'OOS'], zone: 'hucum' },
    { label: 'SF', preferred: ['SF'], zone: 'hucum' },
  ],
};

const FORMATION_LABELS: Record<string, string> = {
  '442': '4-4-2',
  '433': '4-3-3',
  '352': '3-5-2',
  '532': '5-3-2',
  '4231': '4-2-3-1',
  '343': '3-4-3',
  'diamond': '4-1-2-1-2',
  '4411': '4-4-1-1',
  '3412': '3-4-1-2',
  '451': '4-5-1',
};

export function getActiveFormationKey(activeTactics: ActiveTactic[]): string {
  const formation = activeTactics.find((t) => getTacticCategory(t.id) === 'formasyon');
  return (formation && getFormationKey(formation.id)) || '442';
}

export function getActiveFormationLabel(activeTactics: ActiveTactic[]): string {
  const key = getActiveFormationKey(activeTactics);
  const formation = activeTactics.find((t) => getTacticCategory(t.id) === 'formasyon');
  if (formation) return formation.name;
  return `${FORMATION_LABELS[key] ?? key} (varsayılan)`;
}

function isOutOfPosition(player: PlayerCard, slot: FormationSlotDef): boolean {
  const tier = getSlotFitTier(player, slot.preferred);
  return tier === 'flex' || tier === 'forced';
}

function assignPlayersToSlots(
  slots: FormationSlotDef[],
  squad: PlayerCard[],
  manualLineup: ManualLineup = EMPTY_MANUAL_LINEUP,
): (PlayerCard | null)[] {
  return Object.keys(manualLineup).length
    ? assignPlayersByRulesWithPins(slots, squad, manualLineup)
    : assignPlayersByRules(slots, squad);
}

export function getStartingEleven(
  squad: PlayerCard[],
  activeTactics: ActiveTactic[],
  manualLineup: ManualLineup = EMPTY_MANUAL_LINEUP,
): PlayerCard[] {
  const formationKey = getActiveFormationKey(activeTactics);
  const lineup = assignSquadToFormation(squad, formationKey, manualLineup);
  return lineup.filter((s) => s.player).map((s) => s.player!);
}

export function assignSquadToFormation(
  squad: PlayerCard[],
  formationKey: string,
  manualLineup: ManualLineup = EMPTY_MANUAL_LINEUP,
): LineupSlot[] {
  const dots = getFormationDotsByKey(formationKey) ?? getFormationDotsByKey('442')!;
  const slots = FORMATION_SLOTS[formationKey] ?? FORMATION_SLOTS['442']!;
  const assigned = assignPlayersToSlots(slots, squad, manualLineup);

  return dots.map((dot, index) => {
    const slot = slots[index]!;
    const player = assigned[index] ?? null;
    return {
      index,
      x: dot.x,
      y: dot.y,
      role: dot.role,
      slot,
      player,
      outOfPosition: player ? isOutOfPosition(player, slot) : false,
    };
  });
}

export function getSquadZoneCounts(squad: PlayerCard[]): SquadZoneCount[] {
  const counts: Record<PositionZone, number> = { kaleci: 0, savunma: 0, orta: 0, hucum: 0 };
  for (const p of squad) counts[POSITION_ZONE[p.position]]++;

  return (Object.keys(counts) as PositionZone[]).map((zone) => ({
    zone,
    label: ZONE_LABELS[zone],
    count: counts[zone],
  }));
}

export function simulateSquadAfterPick(
  squad: PlayerCard[],
  card: PlayerCard,
  maxSquadSize: number,
  morale = 50,
  activeTactics: ActiveTactic[] = [],
): PlayerCard[] {
  return applyPlayerToSquad(squad, card, maxSquadSize, morale, activeTactics);
}

const INCOMING_PREVIEW_ID = '__incoming_preview__';

function squadWithIncomingPreview(squad: PlayerCard[], incoming: PlayerCard): PlayerCard[] {
  return [...squad, { ...clonePlayer(incoming), id: INCOMING_PREVIEW_ID }];
}

/** 12 kişilik kadroda ilk 11'e girmeyenler (gelen oyuncu dahil) */
function playersOutsideLineup(squad: PlayerCard[], activeTactics: ActiveTactic[]): PlayerCard[] {
  const formationKey = getActiveFormationKey(activeTactics);
  const lineup = assignSquadToFormation(squad, formationKey);
  const xiIds = new Set(lineup.filter((s) => s.player).map((s) => s.player!.id));
  return squad.filter((p) => !xiIds.has(p.id));
}

/** Kadro doluyken kimi çıkaracağını belirler — önce ilk 11'den düşen, aynı mevkide en zayıf */
export function getReplacementPlayer(
  squad: PlayerCard[],
  incoming: PlayerCard,
  morale = 50,
  activeTactics: ActiveTactic[] = [],
): PlayerCard {
  if (incoming.position === 'KL') {
    const gks = squad.filter((p) => p.position === 'KL');
    if (gks.length) {
      return [...gks].sort((a, b) => a.currentRating - b.currentRating)[0]!;
    }
  }

  const hypothetical = squadWithIncomingPreview(squad, incoming);
  const previewInXi = assignSquadToFormation(hypothetical, getActiveFormationKey(activeTactics))
    .some((s) => s.player?.id === INCOMING_PREVIEW_ID);

  if (previewInXi) {
    const dropped = playersOutsideLineup(hypothetical, activeTactics)
      .filter((p) => p.id !== INCOMING_PREVIEW_ID);
    if (dropped.length) {
      const samePos = dropped.filter((p) => p.position === incoming.position);
      const pool = samePos.length ? samePos : dropped;
      return [...pool].sort((a, b) => {
        const ratingDiff = a.currentRating - b.currentRating;
        if (ratingDiff !== 0) return ratingDiff;
        return getDepartureScore(a, morale) - getDepartureScore(b, morale);
      })[0]!;
    }
  }

  const lineupIds = getLineupPlayerIds(squad, activeTactics);
  const bench = squad.filter((p) => !lineupIds.has(p.id));

  if (bench.length > 0) {
    if (incoming.position !== 'KL') {
      const benchGk = bench.find((p) => p.position === 'KL');
      if (benchGk) return benchGk;
    }
    return [...bench].sort((a, b) => getDepartureScore(a, morale) - getDepartureScore(b, morale))[0]!;
  }

  const samePosStarters = getStartingEleven(squad, activeTactics)
    .filter((p) => p.position === incoming.position)
    .sort((a, b) => a.currentRating - b.currentRating);
  if (samePosStarters.length && incoming.currentRating > samePosStarters[0]!.currentRating) {
    return samePosStarters[0]!;
  }

  return selectDepartingPlayer(squad, morale);
}

/** Kadroda en fazla bir kaleci — fazlası düşük ratingli olarak çıkar */
export function normalizeSquadGoalkeepers(squad: PlayerCard[]): PlayerCard[] {
  const gks = squad.filter((p) => p.position === 'KL');
  if (gks.length <= 1) return squad;
  const keep = [...gks].sort((a, b) => b.currentRating - a.currentRating)[0]!;
  return squad.filter((p) => p.position !== 'KL' || p.id === keep.id);
}

export function applyPlayerToSquad(
  squad: PlayerCard[],
  incoming: PlayerCard,
  maxSquadSize: number,
  morale = 50,
  activeTactics: ActiveTactic[] = [],
): PlayerCard[] {
  const cloned = clonePlayer(incoming);

  // Tek kaleci — yeni KL gelince mevcut kaleci kadrodan çıkar
  if (cloned.position === 'KL') {
    const gks = squad.filter((p) => p.position === 'KL');
    if (gks.length > 0) {
      const out = [...gks].sort((a, b) => a.currentRating - b.currentRating)[0]!;
      return [...squad.filter((p) => p.id !== out.id), cloned];
    }
  }

  if (squad.length < maxSquadSize) return [...squad, cloned];
  const out = getReplacementPlayer(squad, incoming, morale, activeTactics);
  return [...squad.filter((p) => p.id !== out.id), cloned];
}

export type BenchExplanation = {
  player: PlayerCard;
  reason: string;
};

export function getBenchExplanations(squad: PlayerCard[], activeTactics: ActiveTactic[]): BenchExplanation[] {
  const summary = getSquadLineupSummary(squad, activeTactics);
  const emptySlots = summary.lineup.filter((s) => !s.player);

  return summary.benchPlayers.map((player) => {
    if (player.position === 'KL') {
      return {
        player,
        reason: 'Yedek kaleci — sahaya yalnızca asıl kaleci ayrılırsa girer',
      };
    }

    const playableEmpty = emptySlots.filter((s) => slotAcceptsPlayer(player, s.slot));

    let bestFit = 99;
    let bestSlotLabel = '';
    for (const slot of playableEmpty) {
      const fit = slotFitIndex(player, slot.slot.preferred);
      if (fit < bestFit) {
        bestFit = fit;
        bestSlotLabel = slot.slot.label;
      }
    }

    if (playableEmpty.length > 0 && bestFit < 99) {
      const filled = summary.filled;
      const totalSlots = summary.lineup.length;
      const squadFull = summary.squadSize >= totalSlots;
      const reason = squadFull && filled < totalSlots
        ? `Boş ${bestSlotLabel} slotuna uygun — saha ${filled}/${totalSlots}, yerleşim sırası bekliyor`
        : `Boş ${bestSlotLabel} slotuna uygun — kadro küçük olduğu için şimdilik yedek`;
      return { player, reason };
    }

    const strongerStarters = summary.lineup
      .filter(
        (s) =>
          s.player
          && slotAcceptsPlayer(player, s.slot)
          && !canDisplaceStarter(player, s.player, s.slot),
      )
      .map((s) => `${s.slot.label} (${s.player!.name} ${s.player!.currentRating})`);

    const emptyLabels = [...new Set(emptySlots.map((s) => s.slot.label))].join(', ');
    const playable = getPlayablePositions(player).map((p) => POSITION_BADGE[p]).join(', ');

    if (strongerStarters.length > 0) {
      const midBlockers = strongerStarters.filter((line) => {
        const slotLabel = line.split(' ')[0]!;
        const slot = summary.lineup.find((s) => s.slot.label === slotLabel);
        return slot?.slot.zone === 'orta';
      });
      if (midBlockers.length > 0 && isMidfieldPlayer(player)) {
        return {
          player,
          reason: `Orta saha dolu (${midBlockers.join(', ')})${emptyLabels ? ` — boş slotlar (${emptyLabels}) uyumsuz` : ''}`,
        };
      }
      return {
        player,
        reason: `Rating yetersiz — ${strongerStarters.join(', ')}${emptyLabels ? ` · boş slotlar (${emptyLabels}) uyumsuz` : ''}`,
      };
    }

    if (emptySlots.length > 0) {
      const filledMids = summary.lineup
        .filter((s) => s.player && s.slot.zone === 'orta' && slotAcceptsPlayer(player, s.slot))
        .map((s) => `${s.slot.label} (${s.player!.name} ${s.player!.currentRating})`);
      if (filledMids.length > 0 && isMidfieldPlayer(player)) {
        return {
          player,
          reason: `Orta saha dolu (${filledMids.join(', ')}) — boş slotlar (${emptyLabels}) uyumsuz`,
        };
      }
      return {
        player,
        reason: `Boş slotlar (${emptyLabels}) uyumsuz — oynayabildiği: ${playable}`,
      };
    }
    return {
      player,
      reason: 'Dizilişte daha uygun oyuncular var — şimdilik yedek',
    };
  });
}

export function getFilledSlotAfterPick(
  squad: PlayerCard[],
  incoming: PlayerCard,
  maxSquadSize: number,
  activeTactics: ActiveTactic[],
  morale = 50,
): LineupSlot | null {
  const formationKey = getActiveFormationKey(activeTactics);
  const before = assignSquadToFormation(squad, formationKey);
  const after = applyPlayerToSquad(squad, incoming, maxSquadSize, morale, activeTactics);
  const afterLineup = assignSquadToFormation(after, formationKey);

  for (const slot of before) {
    if (!slot.player && afterLineup[slot.index]?.player) {
      return afterLineup[slot.index]!;
    }
  }
  return null;
}

export function getLineupPlayerIds(
  squad: PlayerCard[],
  activeTactics: ActiveTactic[],
  manualLineup: ManualLineup = EMPTY_MANUAL_LINEUP,
): Set<string> {
  const formationKey = getActiveFormationKey(activeTactics);
  const lineup = assignSquadToFormation(squad, formationKey, manualLineup);
  return new Set(lineup.filter((s) => s.player).map((s) => s.player!.id));
}

function countPosition(squad: PlayerCard[], pos: Position): number {
  return squad.filter((p) => p.position === pos).length;
}

function hasPosition(squad: PlayerCard[], pos: Position): boolean {
  return squad.some((p) => p.position === pos);
}

export function getFormationGaps(squad: PlayerCard[], formationKey: string): PositionHint[] {
  const hints: PositionHint[] = [];
  const lineup = assignSquadToFormation(squad, formationKey);
  const label = FORMATION_LABELS[formationKey] ?? formationKey;

  const emptySlots = lineup.filter((s) => !s.player);
  const emptyByLabel = new Map<string, number>();
  for (const slot of emptySlots) {
    const key = slot.slot.label;
    emptyByLabel.set(key, (emptyByLabel.get(key) ?? 0) + 1);
  }
  for (const [slotCode, count] of emptyByLabel) {
    const name = slotLabel(slotCode);
    hints.push({
      text: count > 1 ? `${label}: ${count}× ${name} boş` : `${label}: ${name} slotu boş`,
      tone: 'warn',
    });
  }

  if (formationKey === '352' || formationKey === '532') {
    const stp = countPosition(squad, 'STP');
    if (stp < 3) {
      hints.push({ text: `${label} için ${3 - stp} stoper daha ideal`, tone: 'info' });
    }
  }

  if (!hasPosition(squad, 'KL')) {
    hints.push({ text: 'Kadroda kaleci yok', tone: 'warn' });
  }

  return hints.slice(0, 3);
}

export function getPositionHints(
  card: PlayerCard,
  squad: PlayerCard[],
  activeTactics: ActiveTactic[],
  maxSquadSize: number,
  morale = 50,
): PositionHint[] {
  const hints: PositionHint[] = [];
  const after = simulateSquadAfterPick(squad, card, maxSquadSize, morale, activeTactics);
  const formationKey = getActiveFormationKey(activeTactics);
  const formationLabel = FORMATION_LABELS[formationKey] ?? formationKey;

  if (!hasPosition(squad, 'KL') && card.position === 'KL') {
    hints.push({ text: 'Kadroda kaleci yok — bu KL değerli', tone: 'good' });
  }

  const stpBefore = countPosition(squad, 'STP');
  const stpAfter = countPosition(after, 'STP');
  if (card.position === 'STP') {
    if (stpAfter === 3 && stpBefore < 3) {
      hints.push({ text: '3. stoper — DEMİR KALE sinerjisine yaklaşırsın', tone: 'good' });
    } else if (stpAfter === 2 && stpBefore < 2) {
      hints.push({ text: '2. stoper — DEMİR KALE için 1 stoper daha gerekir', tone: 'info' });
    }
  }

  if (card.position === 'DOS' || card.position === 'OOS') {
    const hasDos = hasPosition(after, 'DOS');
    const hasOos = hasPosition(after, 'OOS');
    if (hasDos && hasOos && !(hasPosition(squad, 'DOS') && hasPosition(squad, 'OOS'))) {
      hints.push({ text: 'DOS + OOS birlikte — ORTA DUVAR sinerjisi mümkün', tone: 'good' });
    }
  }

  const lineupAfter = assignSquadToFormation(after, formationKey);
  const assignedSlot = lineupAfter.find((s) => s.player?.id === card.id);
  const targetSlot = assignedSlot && !isIllegalCentralMidWingSlot(card, assignedSlot.slot.label)
    ? assignedSlot
    : undefined;

  if (!targetSlot) {
    const emptyLabels = lineupAfter
      .filter((s) => !s.player)
      .map((s) => s.slot.label);
    const playable = getPlayablePositions(card).map((p) => POSITION_BADGE[p]).join(', ');
    const weakestSamePos = lineupAfter
      .filter((s) => s.player && s.player.position === card.position)
      .map((s) => ({ player: s.player!, slot: s.slot }))
      .sort((a, b) => a.player.currentRating - b.player.currentRating)[0];

    const weakestMid = isMidfieldPlayer(card)
      ? lineupAfter
          .filter((s) => s.player && s.slot.zone === 'orta')
          .map((s) => ({ player: s.player!, slot: s.slot }))
          .filter((x) => canDisplaceStarter(card, x.player, x.slot))
          .sort((a, b) => a.player.currentRating - b.player.currentRating)[0]
      : undefined;

    const swapTarget = weakestMid ?? (weakestSamePos && canDisplaceStarter(card, weakestSamePos.player, weakestSamePos.slot)
      ? weakestSamePos
      : undefined);

    if (swapTarget && card.currentRating > swapTarget.player.currentRating) {
      hints.push({
        text: `İlk 11'de ${slotLabel(swapTarget.slot.label)} slotuna girer — ${swapTarget.player.name} (${swapTarget.player.currentRating}) yedeğe iner`,
        tone: 'good',
      });
    } else if (weakestSamePos && card.currentRating > weakestSamePos.player.currentRating) {
      hints.push({
        text: `${weakestSamePos.player.name} (${weakestSamePos.player.currentRating}) senden zayıf ama mevki uyumu ilk 11'e almıyor`,
        tone: 'warn',
      });
    } else {
      hints.push({
        text: 'İlk 11\'de uygun slot yok — seçersen yedek kalır',
        tone: 'warn',
      });
    }
    if (emptyLabels.length) {
      const unmatchedEmpty = lineupAfter
        .filter((s) => !s.player && !slotAcceptsPlayer(card, s.slot))
        .map((s) => s.slot.label);
      if (unmatchedEmpty.length) {
        hints.push({
          text: `Boş slotlar (${unmatchedEmpty.join(', ')}) bu oyuncunun mevkileriyle uyuşmuyor`,
          tone: 'info',
        });
      }
    } else {
      hints.push({
        text: `Saha dolu — oynayabildiği: ${playable}`,
        tone: 'info',
      });
    }
    return hints.slice(0, 3);
  }

  if (targetSlot) {
    const slotName = slotLabel(targetSlot.slot.label);
    const idealPos = targetSlot.slot.preferred[0];
    const cardBadge = POSITION_BADGE[card.position];

    const fitTier = getSlotFitTier(card, targetSlot.slot.preferred);
    if (fitTier === 'forced') {
      hints.push({
        text: formatSlotMismatchWarn(card, targetSlot.slot.label, 'forced'),
        tone: 'warn',
      });
    } else if (fitTier === 'flex') {
      hints.push({
        text: formatSlotMismatchWarn(card, targetSlot.slot.label, 'flex'),
        tone: 'warn',
      });
    } else if (idealPos && card.position === idealPos) {
      hints.push({
        text: `${formationLabel} · ${slotName} · ideal pozisyon`,
        tone: 'good',
      });
    } else if (targetSlot.slot.label === cardBadge) {
      hints.push({
        text: `${formationLabel} · ${slotName} slotuna yerleştirilir`,
        tone: 'good',
      });
    } else if (targetSlot.slot.preferred.includes(card.position)) {
      hints.push({
        text: `${formationLabel} · ${slotName} slotunda ${cardBadge} oynar`,
        tone: 'info',
      });
    } else {
      hints.push({
        text: `${formationLabel} · ${slotName} slotunda ${cardBadge} — alternatif`,
        tone: 'info',
      });
    }
  }

  const altPositions = getPlayablePositions(card).slice(1);
  if (altPositions.length && hints.length < 3 && !hints.some((h) => h.text.includes('Alternatif'))) {
    hints.push({
      text: `Alternatif mevkiler: ${altPositions.map((p) => POSITION_LABELS[p]).join(', ')}`,
      tone: 'info',
    });
  }

  return hints
    .sort((a, b) => {
      const rank = (t: PositionHintTone) => (t === 'warn' ? 0 : t === 'good' ? 1 : 2);
      return rank(a.tone) - rank(b.tone);
    })
    .slice(0, 3);
}

/** Diziliş tahtası (dikey) → maç sahası (yatay) koordinat dönüşümü */
export function lineupSlotToMatchPitch(slot: LineupSlot): { x: number; y: number; gk?: boolean } {
  const depth = slot.y;
  const width = slot.x;
  const x = Math.round(8 + (100 - depth) * 0.36);
  const y = Math.round(Math.max(14, Math.min(86, width)));
  return {
    x,
    y,
    gk: slot.role === 'gk' || slot.player?.position === 'KL',
  };
}

export function getSquadLineupSummary(
  squad: PlayerCard[],
  activeTactics: ActiveTactic[],
  manualLineup: ManualLineup = EMPTY_MANUAL_LINEUP,
) {
  const formationKey = getActiveFormationKey(activeTactics);
  const lineup = assignSquadToFormation(squad, formationKey, manualLineup);
  const filled = lineup.filter((s) => s.player).length;
  const mismatches = lineup.filter((s) => s.player && s.outOfPosition).length;
  const lineupIds = new Set(lineup.filter((s) => s.player).map((s) => s.player!.id));
  const benchPlayers = squad.filter((p) => !lineupIds.has(p.id));
  const extraGoalkeepers = Math.max(0, squad.filter((p) => p.position === 'KL').length - 1);

  return {
    formationKey,
    formationLabel: getActiveFormationLabel(activeTactics),
    lineup,
    zoneCounts: getSquadZoneCounts(squad),
    gaps: getFormationGaps(squad, formationKey),
    filled,
    mismatches,
    bench: benchPlayers.length,
    benchPlayers,
    extraGoalkeepers,
    squadSize: squad.length,
  };
}

/**
 * Geçersiz pin'leri at: kadroda olmayan oyuncu, slot index'i formasyon dışı,
 * mevki uyumsuz veya çift atama. Formasyon/kadro değişince çağrılır.
 */
export function reconcileManualLineup(
  manualLineup: ManualLineup,
  squad: PlayerCard[],
  formationKey: string,
): ManualLineup {
  if (!Object.keys(manualLineup).length) return manualLineup;
  const slots = FORMATION_SLOTS[formationKey] ?? FORMATION_SLOTS['442']!;
  const byId = new Map(squad.map((p) => [p.id, p] as const));
  const result: ManualLineup = {};
  const usedPlayers = new Set<string>();
  for (const [k, pid] of Object.entries(manualLineup)) {
    const slotIdx = Number(k);
    if (!Number.isInteger(slotIdx) || slotIdx < 0 || slotIdx >= slots.length) continue;
    const player = byId.get(pid);
    if (!player || usedPlayers.has(pid)) continue;
    const slot = slots[slotIdx]!;
    const ok = slot.zone === 'kaleci'
      ? player.position === 'KL'
      : player.position !== 'KL' && slotAcceptsPlayer(player, slot);
    if (!ok) continue;
    result[slotIdx] = pid;
    usedPlayers.add(pid);
  }
  return result;
}

export type LineupDropSource = { playerId: string; from: number | 'bench' };
export type LineupDropTarget = { kind: 'slot'; index: number } | { kind: 'bench' };

/** Editör sürükle-bırak: slotun bu oyuncuyu kabul edip etmediği (KL kuralı + ideal/flex). */
export function slotAcceptsForEditor(player: PlayerCard, slot: FormationSlotDef): boolean {
  if (slot.zone === 'kaleci') return player.position === 'KL';
  if (player.position === 'KL') return false;
  return slotAcceptsPlayer(player, slot);
}

/**
 * Bir sürükle-bırak'ın yeni manualLineup'ını hesaplar (saf). Geçersiz/uyumsuz
 * bırakmada `null` döner (değişiklik yok). UI bu sonucu setManualLineup'a verir.
 */
export function resolveLineupDrop(
  manualLineup: ManualLineup,
  lineup: LineupSlot[],
  bench: PlayerCard[],
  source: LineupDropSource,
  target: LineupDropTarget,
): ManualLineup | null {
  const { playerId, from } = source;
  const player = lineup.find((s) => s.player?.id === playerId)?.player
    ?? bench.find((b) => b.id === playerId);
  if (!player) return null;
  const next: ManualLineup = { ...manualLineup };

  if (target.kind === 'bench') {
    if (from === 'bench') return null;
    const swapIn = bench
      .filter((b) => slotAcceptsForEditor(b, lineup[from]!.slot))
      .sort((a, b) => b.currentRating - a.currentRating)[0];
    if (swapIn) next[from] = swapIn.id;
    else delete next[from];
    return next;
  }

  const toIdx = target.index;
  const toSlot = lineup[toIdx]?.slot;
  if (!toSlot || !slotAcceptsForEditor(player, toSlot)) return null;
  const occupant = lineup[toIdx]?.player ?? null;

  if (from === 'bench') {
    next[toIdx] = playerId;
    if (occupant && occupant.id !== playerId) {
      for (const [k, v] of Object.entries(next)) {
        if (v === occupant.id && Number(k) !== toIdx) delete next[Number(k)];
      }
    }
    return next;
  }

  if (from === toIdx) return null;
  next[toIdx] = playerId;
  if (occupant) {
    if (!slotAcceptsForEditor(occupant, lineup[from]!.slot)) return null; // ters takas uyumsuz
    next[from] = occupant.id;
  } else {
    delete next[from];
  }
  return next;
}

export function getReplacementPreview(
  squad: PlayerCard[],
  card: PlayerCard,
  maxSquadSize: number,
  morale = 50,
  activeTactics: ActiveTactic[] = [],
): PlayerCard | null {
  if (squad.length < maxSquadSize) return null;
  return getReplacementPlayer(squad, card, morale, activeTactics);
}

import { clonePlayer } from '@/data/players';
import { getPlayablePositions, getSlotFitTier, slotFitIndex } from '@/data/positionFlexibility';
import { getTacticCategory } from '@/data/tactics';
import { getFormationDotsByKey, getFormationKey } from '@/engine/tacticVisual';
import { getDepartureScore, selectDepartingPlayer } from '@/engine/squadLogic';
import type { ActiveTactic, PlayerCard, Position } from '@/types';
import { formationSlotLabel, POSITION_BADGE, POSITION_LABELS } from '@/utils/positionStyle';

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

/** Kanat slotları — OS/DOS buraya asla yazılmaz */
export const WING_SLOT_LABELS = new Set(['SĞK', 'SLK']);

/** Merkez orta — yalnızca orta saha slotlarına */
const CENTRAL_ONLY_MIDS = new Set<Position>(['DOS', 'OS']);

export function isMidfieldPlayer(player: PlayerCard): boolean {
  return MIDFIELD_POSITIONS.has(player.position);
}

/** OS/DOS kanada, KL sahada, uyumsuz mevki — slot reddi */
export function slotAcceptsPlayer(player: PlayerCard, slot: FormationSlotDef): boolean {
  if (player.position === 'KL') return slot.zone === 'kaleci';
  if (slot.zone === 'kaleci') return false;
  if (slotFitIndex(player, slot.preferred) >= 99) return false;
  if (CENTRAL_ONLY_MIDS.has(player.position) && WING_SLOT_LABELS.has(slot.label)) return false;
  return true;
}

export function isIllegalCentralMidWingSlot(player: PlayerCard, slotLabel: string): boolean {
  return CENTRAL_ONLY_MIDS.has(player.position) && WING_SLOT_LABELS.has(slotLabel);
}

/** Güçlü yedek / yeni oyuncu zayıf starter'ın yerine geçebilir mi? */
export function canDisplaceStarter(
  challenger: PlayerCard,
  occupant: PlayerCard,
  slot: FormationSlotDef,
): boolean {
  const chFit = slotFitIndex(challenger, slot.preferred);
  const occFit = slotFitIndex(occupant, slot.preferred);
  if (!slotAcceptsPlayer(challenger, slot)) return false;

  const ratingGap = challenger.currentRating - occupant.currentRating;
  if (ratingGap <= 0) return false;
  if (chFit > occFit) return false;

  const idealCh = getSlotFitTier(challenger, slot.preferred) === 'ideal';
  const samePos = challenger.position === occupant.position;
  const midClash = isMidfieldPlayer(challenger) && isMidfieldPlayer(occupant) && slot.zone === 'orta';

  if (idealCh && ratingGap >= 1) return true;
  if (samePos && ratingGap >= 2) return true;
  if (midClash && chFit <= occFit && ratingGap >= 2) return true;
  if (chFit < occFit && ratingGap >= 3) return true;
  if (chFit === occFit && ratingGap >= 5) return true;
  return false;
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
    { label: 'SĞK', preferred: ['SÖK'], zone: 'hucum' },
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
    { label: 'SLB', preferred: ['SLB', 'DOS'], zone: 'savunma' },
    { label: 'DOS', preferred: ['DOS', 'OS'], zone: 'orta' },
    { label: 'OS', preferred: ['OS', 'OOS'], zone: 'orta' },
    { label: 'SĞB', preferred: ['SÖB', 'DOS'], zone: 'savunma' },
    { label: 'OOS', preferred: ['OOS', 'OS'], zone: 'orta' },
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
};

const FORMATION_LABELS: Record<string, string> = {
  '442': '4-4-2',
  '433': '4-3-3',
  '352': '3-5-2',
  '532': '5-3-2',
  '4231': '4-2-3-1',
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

function isGkSlot(slots: FormationSlotDef[], idx: number): boolean {
  return slots[idx]?.zone === 'kaleci';
}

function optimizeSlotAssignments(
  slots: FormationSlotDef[],
  assigned: (PlayerCard | null)[],
): void {
  for (let pass = 0; pass < 4; pass++) {
    let improved = false;
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const pi = assigned[i];
        const pj = assigned[j];
        if (!pi || !pj) continue;
        if (isGkSlot(slots, i) || isGkSlot(slots, j) || pi.position === 'KL' || pj.position === 'KL') continue;
        const before = slotFitIndex(pi, slots[i]!.preferred) + slotFitIndex(pj, slots[j]!.preferred);
        const after = slotFitIndex(pi, slots[j]!.preferred) + slotFitIndex(pj, slots[i]!.preferred);
        if (
          after < before
          && slotAcceptsPlayer(pi, slots[j]!)
          && slotAcceptsPlayer(pj, slots[i]!)
        ) {
          assigned[i] = pj;
          assigned[j] = pi;
          improved = true;
        }
      }
    }
    if (!improved) break;
  }
}

/** Kaleci saha dışına çıkmaz; yalnızca uyumlu mevkiler (fit < 99), sonra swap ile iyileştirme */
function assignPlayersToSlots(slots: FormationSlotDef[], squad: PlayerCard[]): (PlayerCard | null)[] {
  const assigned: (PlayerCard | null)[] = Array(slots.length).fill(null);
  const used = new Set<string>();
  const available = () => squad.filter((p) => !used.has(p.id));

  const take = (player: PlayerCard, slotIdx: number) => {
    assigned[slotIdx] = player;
    used.add(player.id);
  };

  const klIdx = slots.findIndex((s) => s.zone === 'kaleci');
  if (klIdx >= 0) {
    const gks = available().filter((p) => p.position === 'KL');
    if (gks.length) {
      const bestGk = [...gks].sort((a, b) => b.currentRating - a.currentRating)[0]!;
      take(bestGk, klIdx);
    }
  }

  const fieldSlotIndices = slots
    .map((_, i) => i)
    .filter((i) => slots[i]!.zone !== 'kaleci');

  // Önce ana mevki = slot ideal pozisyonu (OS → OS slotu, DOS → DOS slotu)
  for (const slotIdx of fieldSlotIndices) {
    if (assigned[slotIdx]) continue;
    const primary = slots[slotIdx]!.preferred[0];
    if (!primary) continue;
    const matches = available().filter((p) => p.position === primary);
    if (!matches.length) continue;
    const best = [...matches].sort((a, b) => b.currentRating - a.currentRating)[0]!;
    take(best, slotIdx);
  }

  while (true) {
    let bestSlot = -1;
    let bestPlayer: PlayerCard | null = null;
    let bestFit = 99;

    for (const slotIdx of fieldSlotIndices) {
      if (assigned[slotIdx]) continue;
      const slot = slots[slotIdx]!;
      for (const p of available()) {
        if (p.position === 'KL') continue;
        if (!slotAcceptsPlayer(p, slot)) continue;
        const fit = slotFitIndex(p, slot.preferred);
        if (fit < bestFit) {
          bestFit = fit;
          bestSlot = slotIdx;
          bestPlayer = p;
        }
      }
    }

    if (!bestPlayer || bestSlot < 0 || bestFit >= 99) break;
    take(bestPlayer, bestSlot);
  }

  displaceWeakerStarters(slots, assigned, squad);
  promoteUnassignedByDisplacingWeakest(slots, assigned, squad);
  optimizeSlotAssignments(slots, assigned);
  displaceWeakerStarters(slots, assigned, squad);
  evictIllegalSlotAssignments(slots, assigned, squad);

  for (let i = 0; i < assigned.length; i++) {
    const p = assigned[i];
    if (!p) continue;
    if (p.position === 'KL' && !isGkSlot(slots, i)) assigned[i] = null;
    if (p.position !== 'KL' && isGkSlot(slots, i)) assigned[i] = null;
  }

  const usedIds = () => new Set(assigned.filter(Boolean).map((p) => p!.id));
  const gkSlotIdx = slots.findIndex((s) => s.zone === 'kaleci');
  if (gkSlotIdx >= 0 && !assigned[gkSlotIdx]) {
    const gk = squad
      .filter((p) => p.position === 'KL' && !usedIds().has(p.id))
      .sort((a, b) => b.currentRating - a.currentRating)[0];
    if (gk) assigned[gkSlotIdx] = gk;
  }

  for (let i = 0; i < assigned.length; i++) {
    if (assigned[i] || isGkSlot(slots, i)) continue;
    const slot = slots[i]!;
    const pick = squad
      .filter((p) => !usedIds().has(p.id) && p.position !== 'KL')
      .filter((p) => slotAcceptsPlayer(p, slot))
      .map((p) => ({ p, fit: slotFitIndex(p, slot.preferred) }))
      .sort((a, b) => a.fit - b.fit || b.p.currentRating - a.p.currentRating)[0];
    if (pick) assigned[i] = pick.p;
  }

  evictIllegalSlotAssignments(slots, assigned, squad);
  return assigned;
}

/** OS/DOS kanat slotundan çıkar; güçlü oyuncuyu orta sahaya yerleştir */
function evictIllegalSlotAssignments(
  slots: FormationSlotDef[],
  assigned: (PlayerCard | null)[],
  squad: PlayerCard[],
): void {
  let evicted = false;
  for (let i = 0; i < slots.length; i++) {
    const p = assigned[i];
    if (!p) continue;
    if (!slotAcceptsPlayer(p, slots[i]!)) {
      assigned[i] = null;
      evicted = true;
    }
  }
  if (evicted) {
    promoteUnassignedByDisplacingWeakest(slots, assigned, squad);
    displaceWeakerStarters(slots, assigned, squad);
  }
}

/** Yüksek ratingli yedek, düşük ratingli starter'ın yerine geçer */
function displaceWeakerStarters(
  slots: FormationSlotDef[],
  assigned: (PlayerCard | null)[],
  squad: PlayerCard[],
): void {
  const onPitch = new Set(assigned.filter(Boolean).map((p) => p!.id));

  for (let pass = 0; pass < 5; pass++) {
    let changed = false;
    const bench = squad
      .filter((p) => !onPitch.has(p.id) && p.position !== 'KL')
      .sort((a, b) => b.currentRating - a.currentRating);

    for (const challenger of bench) {
      let bestIdx = -1;
      let bestOccRating = Infinity;

      for (let i = 0; i < slots.length; i++) {
        if (isGkSlot(slots, i)) continue;
        const occupant = assigned[i];
        if (!occupant || occupant.position === 'KL') continue;
        if (!canDisplaceStarter(challenger, occupant, slots[i]!)) continue;
        if (occupant.currentRating < bestOccRating) {
          bestOccRating = occupant.currentRating;
          bestIdx = i;
        }
      }

      if (bestIdx >= 0) {
        const displaced = assigned[bestIdx]!;
        assigned[bestIdx] = challenger;
        onPitch.delete(displaced.id);
        onPitch.add(challenger.id);
        changed = true;
      }
    }
    if (!changed) break;
  }
}

/** Boş slota sığmayan güçlü oyuncu, en zayıf uyumlu starter'ı düşürür */
function promoteUnassignedByDisplacingWeakest(
  slots: FormationSlotDef[],
  assigned: (PlayerCard | null)[],
  squad: PlayerCard[],
): void {
  const usedIds = () => new Set(assigned.filter(Boolean).map((p) => p!.id));
  const unassigned = squad
    .filter((p) => p.position !== 'KL' && !usedIds().has(p.id))
    .sort((a, b) => b.currentRating - a.currentRating);

  for (const challenger of unassigned) {
    let bestIdx = -1;
    let bestOccRating = Infinity;

    for (let i = 0; i < slots.length; i++) {
      if (isGkSlot(slots, i)) continue;
      const occupant = assigned[i];
      if (!occupant) continue;
      if (!canDisplaceStarter(challenger, occupant, slots[i]!)) continue;
      if (occupant.currentRating < bestOccRating) {
        bestOccRating = occupant.currentRating;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0) assigned[bestIdx] = challenger;
  }
}

export function getStartingEleven(squad: PlayerCard[], activeTactics: ActiveTactic[]): PlayerCard[] {
  const formationKey = getActiveFormationKey(activeTactics);
  const lineup = assignSquadToFormation(squad, formationKey);
  return lineup.filter((s) => s.player).map((s) => s.player!);
}

export function assignSquadToFormation(squad: PlayerCard[], formationKey: string): LineupSlot[] {
  const dots = getFormationDotsByKey(formationKey) ?? getFormationDotsByKey('442')!;
  const slots = FORMATION_SLOTS[formationKey] ?? FORMATION_SLOTS['442']!;
  const assigned = assignPlayersToSlots(slots, squad);

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

export function applyPlayerToSquad(
  squad: PlayerCard[],
  incoming: PlayerCard,
  maxSquadSize: number,
  morale = 50,
  activeTactics: ActiveTactic[] = [],
): PlayerCard[] {
  const cloned = clonePlayer(incoming);
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

    let bestFit = 99;
    let bestSlotLabel = '';
    for (const slot of emptySlots) {
      const fit = slotFitIndex(player, slot.slot.preferred);
      if (fit < bestFit) {
        bestFit = fit;
        bestSlotLabel = slot.slot.label;
      }
    }

    if (emptySlots.length > 0 && bestFit < 99) {
      return {
        player,
        reason: `Boş ${bestSlotLabel} slotuna uygun — kadro küçük olduğu için şimdilik yedek`,
      };
    }
    if (emptySlots.length > 0) {
      const emptyLabels = [...new Set(emptySlots.map((s) => s.slot.label))].join(', ');
      const playable = getPlayablePositions(player).map((p) => POSITION_BADGE[p]).join(', ');
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

export function getLineupPlayerIds(squad: PlayerCard[], activeTactics: ActiveTactic[]): Set<string> {
  const formationKey = getActiveFormationKey(activeTactics);
  const lineup = assignSquadToFormation(squad, formationKey);
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
      hints.push({
        text: `Boş slotlar (${emptyLabels.join(', ')}) bu oyuncunun mevkileriyle uyuşmuyor`,
        tone: 'info',
      });
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
      hints.unshift({
        text: `⚠ ${slotName} slotu — ana mevki ${cardBadge} değil, ciddi performans riski`,
        tone: 'warn',
      });
    } else if (fitTier === 'flex') {
      hints.unshift({
        text: `⚠ ${slotName} — ${POSITION_LABELS[card.position]} bu role alışık değil, düşük performans riski`,
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
        text: `${formationLabel} · ${slotName} (${targetSlot.slot.label}) · ${POSITION_LABELS[card.position]} (${cardBadge}) oynar`,
        tone: 'info',
      });
    } else {
      hints.push({
        text: `${formationLabel} · ${slotName} (${targetSlot.slot.label}) · ${POSITION_LABELS[card.position]} (${cardBadge}) — alternatif`,
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

export function getSquadLineupSummary(squad: PlayerCard[], activeTactics: ActiveTactic[]) {
  const formationKey = getActiveFormationKey(activeTactics);
  const lineup = assignSquadToFormation(squad, formationKey);
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

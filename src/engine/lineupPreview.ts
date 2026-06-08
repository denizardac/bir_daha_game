import { clonePlayer } from '@/data/players';
import { getPlayablePositions, playerPlaysPosition, slotFitIndex } from '@/data/positionFlexibility';
import { getTacticCategory } from '@/data/tactics';
import { getFormationDotsByKey, getFormationKey } from '@/engine/tacticVisual';
import { getDepartureScore, selectDepartingPlayer } from '@/engine/squadLogic';
import type { ActiveTactic, PlayerCard, Position } from '@/types';
import { POSITION_BADGE, POSITION_LABELS } from '@/utils/positionStyle';

const SLOT_LABELS: Record<string, string> = {
  KL: 'Kaleci',
  SLB: 'Sol Bek',
  SĞB: 'Sağ Bek',
  STP: 'Stoper',
  DOS: 'Def. Orta Saha',
  OS: 'Orta Saha',
  SLK: 'Sol Kanat',
  SĞK: 'Sağ Kanat',
  OOS: 'Of. Orta Saha',
  SF: 'Santrafor',
};

function slotLabel(label: string): string {
  return SLOT_LABELS[label] ?? label;
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

const FORMATION_SLOTS: Record<string, FormationSlotDef[]> = {
  '442': [
    { label: 'KL', preferred: ['KL'], zone: 'kaleci' },
    { label: 'SLB', preferred: ['SLB', 'STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'STP', preferred: ['STP'], zone: 'savunma' },
    { label: 'SĞB', preferred: ['SÖB', 'STP'], zone: 'savunma' },
    { label: 'SLK', preferred: ['SLK', 'OOS', 'OS'], zone: 'hucum' },
    { label: 'DOS', preferred: ['DOS', 'OS'], zone: 'orta' },
    { label: 'OS', preferred: ['OS', 'OOS', 'DOS'], zone: 'orta' },
    { label: 'SĞK', preferred: ['SÖK', 'OOS', 'OS'], zone: 'hucum' },
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
  return slotFitIndex(player, slot.preferred) === 99;
}

/** Kaleci saha dışına çıkmaz; kanatlar kanada, önce tam mevki eşleşmesi */
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

  for (let i = 0; i < slots.length; i++) {
    if (assigned[i] || slots[i]!.zone === 'kaleci') continue;
    const primary = slots[i]!.preferred[0];
    if (!primary) continue;
    const match = available().find((p) => playerPlaysPosition(p, primary));
    if (match) take(match, i);
  }

  const openSlots = slots
    .map((_, i) => i)
    .filter((i) => !assigned[i] && slots[i]!.zone !== 'kaleci')
    .sort((a, b) => slots[a]!.preferred.length - slots[b]!.preferred.length);

  for (const i of openSlots) {
    const slot = slots[i]!;
    let best: PlayerCard | null = null;
    let bestIdx = 99;
    for (const p of available()) {
      if (p.position === 'KL') continue;
      const idx = slotFitIndex(p, slot.preferred);
      if (idx < bestIdx) {
        bestIdx = idx;
        best = p;
      }
    }
    if (best) take(best, i);
  }

  for (const i of openSlots) {
    if (assigned[i]) continue;
    const slot = slots[i]!;
    const zoneMatch = available().find(
      (p) => p.position !== 'KL' && POSITION_ZONE[p.position] === slot.zone,
    );
    if (zoneMatch) take(zoneMatch, i);
  }

  for (let i = 0; i < slots.length; i++) {
    if (assigned[i]) continue;
    const slot = slots[i]!;
    let best: PlayerCard | null = null;
    let bestIdx = 99;
    for (const p of available()) {
      if (p.position === 'KL') continue;
      const idx = slotFitIndex(p, slot.preferred);
      if (idx < bestIdx) {
        bestIdx = idx;
        best = p;
      }
    }
    if (best && bestIdx < 99) take(best, i);
  }

  return assigned;
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

/** Kadro doluyken kimi çıkaracağını belirler — önce yedek, özellikle yedek kaleci */
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

  const lineupIds = getLineupPlayerIds(squad, activeTactics);
  const bench = squad.filter((p) => !lineupIds.has(p.id));

  if (bench.length > 0) {
    if (incoming.position !== 'KL') {
      const benchGk = bench.find((p) => p.position === 'KL');
      if (benchGk) return benchGk;
    }
    return [...bench].sort((a, b) => getDepartureScore(a, morale) - getDepartureScore(b, morale))[0]!;
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

    const bestFit = emptySlots.reduce<number>((best, slot) => {
      const fit = slotFitIndex(player, slot.slot.preferred);
      return fit < best ? fit : best;
    }, 99);

    if (emptySlots.length > 0 && bestFit < 99) {
      return {
        player,
        reason: 'Boş slota uygun ama kadro kotası dolu — yeni transfer yedek çıkarır',
      };
    }
    if (emptySlots.length > 0) {
      return {
        player,
        reason: `Boş slotlara mevki uymuyor (${POSITION_LABELS[player.position]})`,
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

  if (formationKey === '433') {
    if (!hasPosition(squad, 'SLK')) hints.push({ text: '4-3-3 için sol kanat eksik', tone: 'warn' });
    if (!hasPosition(squad, 'SÖK')) hints.push({ text: '4-3-3 için sağ kanat eksik', tone: 'warn' });
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

  if (formationKey === '433') {
    const needWings = [
      !hasPosition(after, 'SLK') ? 'sol kanat' : null,
      !hasPosition(after, 'SÖK') ? 'sağ kanat' : null,
    ].filter(Boolean) as string[];

    if (needWings.length && (card.position === 'SLK' || card.position === 'SÖK')) {
      hints.push({ text: `4-3-3 için ${needWings.join(' ve ')} gerekli — bu kart uyum sağlar`, tone: 'good' });
    } else if (needWings.length) {
      hints.push({ text: `${formationLabel} seçili — ${needWings.join(', ')} eksik`, tone: 'warn' });
    }
  }

  const lineupAfter = assignSquadToFormation(after, formationKey);
  const targetSlot = lineupAfter.find((s) => s.player?.id === card.id);
  if (targetSlot) {
    const slotName = slotLabel(targetSlot.slot.label);
    const idealPos = targetSlot.slot.preferred[0];
    const cardBadge = POSITION_BADGE[card.position];

    if (targetSlot.outOfPosition) {
      hints.push({
        text: `${formationLabel} · ${slotName} · dizilişe uyumsuz`,
        tone: 'warn',
      });
    } else if (idealPos && card.position === idealPos && !targetSlot.outOfPosition) {
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
        text: `${formationLabel} · ${slotName} · ${POSITION_LABELS[card.position]} oynar`,
        tone: 'info',
      });
    } else {
      hints.push({
        text: `${formationLabel} · ${slotName} · ${POSITION_LABELS[card.position]} (alternatif mevki)`,
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

  return hints.slice(0, 3);
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

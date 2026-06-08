import { getPlayablePositions, playerPlaysPosition, slotFitIndex } from '@/data/positionFlexibility';
import type { PlayerCard, Position } from '@/types';

export type PlacementZone = 'kaleci' | 'savunma' | 'orta' | 'hucum';

export type PlacementSlotDef = {
  label: string;
  preferred: Position[];
  zone: PlacementZone;
};

const MAX_RELOCATE_DEPTH = 3;

/** OOS yer değiştirme: SLK → SĞK → OS (flex listesindeki kanat önceliği) */
const OOS_DISPLACEMENT_SLOT_ORDER = ['SLK', 'SÖK', 'OS'] as const;

export type PlacementCtx = {
  slots: PlacementSlotDef[];
  assigned: (PlayerCard | null)[];
  fieldIndices: number[];
};

function assignedIds(assigned: (PlayerCard | null)[]): Set<string> {
  return new Set(assigned.filter(Boolean).map((p) => p!.id));
}

export function slotAcceptsPlayerForPlacement(player: PlayerCard, slot: PlacementSlotDef): boolean {
  if (player.position === 'KL') return slot.zone === 'kaleci';
  if (slot.zone === 'kaleci') return false;
  const slotRole = slot.preferred[0];
  if (!slotRole || !playerPlaysPosition(player, slotRole)) return false;
  return slotFitIndex(player, slot.preferred) < 99;
}

export function playableSlotIndices(ctx: PlacementCtx, player: PlayerCard): number[] {
  return ctx.fieldIndices.filter((i) => slotAcceptsPlayerForPlacement(player, ctx.slots[i]!));
}

/** Dizilişte yalnızca tam ana mevki slotu (preferred[0] === position) */
export function primarySlotIndex(ctx: PlacementCtx, player: PlayerCard): number | null {
  const idx = ctx.fieldIndices.find((i) => ctx.slots[i]!.preferred[0] === player.position);
  if (idx === undefined) return null;
  if (!slotAcceptsPlayerForPlacement(player, ctx.slots[idx]!)) return null;
  return idx;
}

function slotIndexByRole(ctx: PlacementCtx, role: Position): number | null {
  const idx = ctx.fieldIndices.find((i) => ctx.slots[i]!.preferred[0] === role);
  return idx ?? null;
}

export function canBeatOccupant(challenger: PlayerCard, occupant: PlayerCard): boolean {
  return challenger.currentRating > occupant.currentRating;
}

function isNativeInSlot(occupant: PlayerCard, slot: PlacementSlotDef): boolean {
  return occupant.position === slot.preferred[0];
}

function flexRoleOrder(player: PlayerCard, slot: PlacementSlotDef): number {
  const role = slot.preferred[0];
  if (!role) return 99;
  const idx = getPlayablePositions(player).indexOf(role);
  return idx >= 0 ? idx : 99;
}

/** Yer değiştirme: önce flex occupant, sonra düşük rating, sonra slot önceliği */
function compareDisplacementTargets(
  ctx: PlacementCtx,
  challenger: PlayerCard,
  aIdx: number,
  bIdx: number,
): number {
  const slotA = ctx.slots[aIdx]!;
  const slotB = ctx.slots[bIdx]!;
  const occA = ctx.assigned[aIdx]!;
  const occB = ctx.assigned[bIdx]!;
  const aNative = isNativeInSlot(occA, slotA) ? 1 : 0;
  const bNative = isNativeInSlot(occB, slotB) ? 1 : 0;
  if (aNative !== bNative) return aNative - bNative;
  const ratingDiff = occA.currentRating - occB.currentRating;
  if (ratingDiff !== 0) return ratingDiff;
  return displacementSlotOrder(challenger, slotA) - displacementSlotOrder(challenger, slotB);
}

function displacementSlotOrder(player: PlayerCard, slot: PlacementSlotDef): number {
  if (player.position === 'OOS') {
    const role = slot.preferred[0];
    const idx = OOS_DISPLACEMENT_SLOT_ORDER.indexOf(role as (typeof OOS_DISPLACEMENT_SLOT_ORDER)[number]);
    return idx >= 0 ? idx : 99;
  }
  return flexRoleOrder(player, slot);
}

function sortDisplacementSlotIndices(ctx: PlacementCtx, player: PlayerCard, indices: number[]): number[] {
  return [...indices].sort((a, b) => compareDisplacementTargets(ctx, player, a, b));
}

function tryRelocateToEmptyOnly(
  player: PlayerCard,
  ctx: PlacementCtx,
  blockedSlots: Set<number>,
): boolean {
  const emptyOrder = emptySlotIndicesOrdered(player, ctx);
  for (const i of emptyOrder) {
    if (blockedSlots.has(i)) continue;
    ctx.assigned[i] = player;
    return true;
  }
  return false;
}

/** Düşen oyuncuyu boş slota veya daha zayıfı düşürerek yerleştir (zincir) */
export function tryRelocatePlayer(
  player: PlayerCard,
  ctx: PlacementCtx,
  blockedSlots: Set<number>,
  depth = 0,
): boolean {
  if (depth >= MAX_RELOCATE_DEPTH) return false;

  if (tryRelocateToEmptyOnly(player, ctx, blockedSlots)) return true;

  const targets = sortDisplacementSlotIndices(
    ctx,
    player,
    playableSlotIndices(ctx, player)
      .filter((i) => !blockedSlots.has(i) && ctx.assigned[i])
      .filter((i) => canBeatOccupant(player, ctx.assigned[i]!)),
  );

  for (const i of targets) {
    const displaced = ctx.assigned[i]!;
    ctx.assigned[i] = player;
    const nextBlocked = new Set(blockedSlots);
    nextBlocked.add(i);
    if (tryRelocatePlayer(displaced, ctx, nextBlocked, depth + 1)) return true;
    ctx.assigned[i] = displaced;
  }
  return false;
}

function osSlotIndex(ctx: PlacementCtx): number | null {
  return slotIndexByRole(ctx, 'OS');
}

function isNativeOsOccupant(ctx: PlacementCtx): boolean {
  const osIdx = osSlotIndex(ctx);
  if (osIdx === null || !ctx.assigned[osIdx]) return false;
  return ctx.assigned[osIdx]!.position === 'OS';
}

/** Boş slot sırası — OOS: native OS varken kanat önce; yoksa OS → kanatlar */
function emptySlotIndicesOrdered(player: PlayerCard, ctx: PlacementCtx): number[] {
  const playable = playableSlotIndices(ctx, player).filter((i) => !ctx.assigned[i]);

  if (player.position === 'OOS') {
    const osIdx = osSlotIndex(ctx);
    const wingOrder: number[] = [];
    for (const role of ['SÖK', 'SLK'] as const) {
      const idx = slotIndexByRole(ctx, role);
      if (idx !== null && !ctx.assigned[idx] && playable.includes(idx)) wingOrder.push(idx);
    }
    const osEmpty = osIdx !== null && !ctx.assigned[osIdx] && playable.includes(osIdx);

    if (isNativeOsOccupant(ctx) && wingOrder.length > 0) return wingOrder;
    const order: number[] = [];
    if (osEmpty) order.push(osIdx!);
    order.push(...wingOrder);
    return order;
  }

  if (player.position === 'SÖK') {
    const order: number[] = [];
    for (const role of ['SÖK', 'SLK'] as const) {
      const idx = slotIndexByRole(ctx, role);
      if (idx !== null && !ctx.assigned[idx] && playable.includes(idx)) order.push(idx);
    }
    return order;
  }

  const primary = primarySlotIndex(ctx, player);
  const sorted = [...playable].sort((a, b) => flexRoleOrder(player, ctx.slots[a]!) - flexRoleOrder(player, ctx.slots[b]!));
  if (primary !== null && sorted.includes(primary)) {
    return [primary, ...sorted.filter((i) => i !== primary)];
  }
  return sorted;
}

/** Tam kadro: OOS, OS slotundaki native OS’i rating ile düşürür */
function tryDisplaceNativeOs(player: PlayerCard, ctx: PlacementCtx): boolean {
  if (player.position !== 'OOS') return false;
  const osIdx = osSlotIndex(ctx);
  if (osIdx === null || !ctx.assigned[osIdx]) return false;
  const occupant = ctx.assigned[osIdx]!;
  if (occupant.position !== 'OS' || !canBeatOccupant(player, occupant)) return false;
  ctx.assigned[osIdx] = player;
  tryRelocatePlayer(occupant, ctx, new Set([osIdx]), 0);
  return true;
}

/** OOS: OS’te flex oyuncu varken güçlü OS’e gir, zayıf kanada kay (S7) — yalnızca kanat boşsa */
function tryOosOsChainUpgrade(player: PlayerCard, ctx: PlacementCtx): boolean {
  if (player.position !== 'OOS') return false;
  const osIdx = osSlotIndex(ctx);
  if (osIdx === null || !ctx.assigned[osIdx]) return false;
  if (isNativeOsOccupant(ctx)) return false;

  const occupant = ctx.assigned[osIdx]!;
  if (!canBeatOccupant(player, occupant)) return false;

  let wingEmpty = false;
  for (const role of ['SÖK', 'SLK'] as const) {
    const wingIdx = slotIndexByRole(ctx, role);
    if (wingIdx === null || ctx.assigned[wingIdx]) continue;
    if (slotAcceptsPlayerForPlacement(player, ctx.slots[wingIdx]!)) {
      wingEmpty = true;
      break;
    }
  }
  if (!wingEmpty) return false;

  ctx.assigned[osIdx] = player;
  if (tryRelocateToEmptyOnly(occupant, ctx, new Set([osIdx]))) return true;
  ctx.assigned[osIdx] = occupant;
  return false;
}

/** Tek oyuncu için yerleştirme */
export function placePlayerOnPitch(player: PlayerCard, ctx: PlacementCtx): boolean {
  if (player.position === 'KL') return false;

  const playable = playableSlotIndices(ctx, player);
  if (!playable.length) return false;

  const primaryIdx = primarySlotIndex(ctx, player);
  const upgradeSlotIndices = sortDisplacementSlotIndices(
    ctx,
    player,
    playable
      .filter((i) => ctx.assigned[i] && canBeatOccupant(player, ctx.assigned[i]!)),
  );

  // A) Boş ana mevki slotu (OS → OS slotu, SÖK → SĞK slotu)
  if (primaryIdx !== null && !ctx.assigned[primaryIdx]) {
    ctx.assigned[primaryIdx] = player;
    return true;
  }

  // B) OOS zincir: OS’te flex varken upgrade + kaydırma
  if (tryOosOsChainUpgrade(player, ctx)) return true;

  // C) Boş slotlar (native OS varken kanat önceliği dahil)
  const emptyOrder = emptySlotIndicesOrdered(player, ctx);
  if (emptyOrder.length > 0) {
    ctx.assigned[emptyOrder[0]!] = player;
    return true;
  }

  // D) Tam kadro: zayıf native OS’i düşür (77 OOS → OS, 62 yedek)
  if (tryDisplaceNativeOs(player, ctx)) return true;

  // E) Yer değiştirme — flex occupant önceliği, sonra SLK → SĞK → OS
  for (const slotIdx of upgradeSlotIndices) {
    const displaced = ctx.assigned[slotIdx]!;
    ctx.assigned[slotIdx] = player;
    tryRelocatePlayer(displaced, ctx, new Set([slotIdx]), 0);
    return true;
  }

  return false;
}

export function assignFieldPlayers(ctx: PlacementCtx, squad: PlayerCard[]): void {
  const fieldPlayers = squad.filter((p) => p.position !== 'KL');

  for (let pass = 0; pass < 4; pass++) {
    const used = assignedIds(ctx.assigned);
    let changed = false;

    for (const slotIdx of ctx.fieldIndices) {
      if (ctx.assigned[slotIdx]) continue;
      const ideal = ctx.slots[slotIdx]!.preferred[0];
      if (!ideal) continue;
      const matches = fieldPlayers.filter((p) => p.position === ideal && !used.has(p.id));
      if (!matches.length) continue;
      const best = [...matches].sort((a, b) => b.currentRating - a.currentRating)[0]!;
      ctx.assigned[slotIdx] = best;
      used.add(best.id);
      changed = true;
    }

    const remaining = fieldPlayers
      .filter((p) => !assignedIds(ctx.assigned).has(p.id))
      .sort((a, b) => a.currentRating - b.currentRating);

    for (const player of remaining) {
      if (placePlayerOnPitch(player, ctx)) changed = true;
    }

    if (!changed) break;
  }
}

export function assignPlayersByRules(
  slots: PlacementSlotDef[],
  squad: PlayerCard[],
): (PlayerCard | null)[] {
  const assigned: (PlayerCard | null)[] = Array(slots.length).fill(null);
  const fieldIndices = slots.map((_, i) => i).filter((i) => slots[i]!.zone !== 'kaleci');
  const ctx: PlacementCtx = { slots, assigned, fieldIndices };

  const klIdx = slots.findIndex((s) => s.zone === 'kaleci');
  if (klIdx >= 0) {
    const gks = squad.filter((p) => p.position === 'KL');
    if (gks.length) {
      assigned[klIdx] = [...gks].sort((a, b) => b.currentRating - a.currentRating)[0]!;
    }
  }

  assignFieldPlayers(ctx, squad);
  return assigned;
}

export function resolveIncomingSlotIndex(
  incoming: PlayerCard,
  slots: PlacementSlotDef[],
  squadWithoutIncoming: PlayerCard[],
): number | null {
  const squad = [...squadWithoutIncoming, incoming];
  const assigned = assignPlayersByRules(slots, squad);
  const idx = assigned.findIndex((p) => p?.id === incoming.id);
  return idx >= 0 ? idx : null;
}

import { isEventRound } from '@/data/events';
import { PLAYER_POOL, clonePlayer } from '@/data/players';
import { filterPoolByRound } from '@/data/playerPoolMeta';
import { cloneTactic, TACTIC_CARDS } from '@/data/tactics';
import { createTrainingCard } from '@/data/training';
import { createRng, getRarityWeights, pickOne, weightedPick } from '@/engine/seed';
import { getTacticCategory } from '@/data/tactics';
import type { GameCard, PlayerCard, Rarity, TacticCard } from '@/types';

export type SquadRef = Pick<PlayerCard, 'id' | 'name' | 'position'>;

export type OfferDrawVariant = 'normal' | 'extradraw';
export type OfferDrawMode = 'players' | 'tacticBonus';

function rarityWeightsForDraw(round: number, rerollIndex: number): Record<Rarity, number> {
  const base = getRarityWeights(round);
  if (rerollIndex <= 0) return base;

  const boost = Math.min(rerollIndex * 7, 22);
  return {
    normal: Math.max(0, base.normal - boost),
    iyi: base.iyi + boost * 0.35,
    güçlü: base.güçlü + boost * 0.4,
    efsane: base.efsane + boost * 0.25,
  };
}

function filterByRarity(cards: PlayerCard[], rarity: Rarity): PlayerCard[] {
  return cards.filter((c) => c.rarity === rarity);
}

function getPoolForRound(round: number, seed: string, lossesCount: number, recoveryGuaranteed: boolean): PlayerCard[] {
  let pool = filterPoolByRound(PLAYER_POOL, round);
  const recoveryRng = createRng(seed, 'recovery', round, lossesCount);
  const recoveryChance = recoveryGuaranteed ? 1 : 0.35 + lossesCount * 0.15;

  if (lossesCount > 0 && round > 1 && recoveryRng() < recoveryChance) {
    const recovery = pool.filter((p) => p.tags.includes('POTANSİYEL') || p.tags.includes('MENTOR'));
    if (recovery.length) pool = [...recovery, ...pool];
  }

  return pool;
}

function upgradeWeakestCard(cards: PlayerCard[], pool: PlayerCard[], rng: () => number, minRating: number, markBoost = false): PlayerCard[] {
  const result = [...cards];
  const weakestIdx = result.reduce(
    (minI, c, i, arr) => (c.currentRating < arr[minI]!.currentRating ? i : minI),
    0,
  );
  const backup = pool.filter((p) => p.currentRating >= minRating && !result.some((c) => c.id === p.id));
  if (backup.length) {
    const upgraded = clonePlayer(backup[Math.floor(rng() * Math.min(backup.length, 6))]!);
    if (markBoost) upgraded.offerBoosted = true;
    result[weakestIdx] = upgraded;
  }
  return result;
}

function silentCardUpgrade(cards: PlayerCard[], pool: PlayerCard[], round: number, rng: () => number): PlayerCard[] {
  if (round > 3 || cards.length === 0) return cards;
  const avg = cards.reduce((s, c) => s + c.currentRating, 0) / cards.length;
  const minRating = Math.min(...cards.map((c) => c.currentRating));
  let result = cards;

  if (avg < 68 || minRating < 65) {
    result = upgradeWeakestCard(result, pool, rng, 70, true);
  }
  if (round === 1 && Math.max(...result.map((c) => c.currentRating)) < 72) {
    result = upgradeWeakestCard(result, pool, rng, 72, true);
  }
  return result;
}

function drawSinglePlayer(rng: () => number, round: number, pool: PlayerCard[], rerollIndex = 0): PlayerCard {
  const rarity = weightedPick(rng, rarityWeightsForDraw(round, rerollIndex));
  let candidates = filterByRarity(pool, rarity);
  if (!candidates.length) candidates = pool.filter((p) => p.rarity !== 'efsane' || round >= 9);
  if (!candidates.length) candidates = pool;
  return clonePlayer(candidates[Math.floor(rng() * candidates.length)]!);
}

function squadNameSet(squad: SquadRef[]): Set<string> {
  return new Set(squad.map((p) => p.name.trim().toLowerCase()));
}

function filterDrawPool(pool: PlayerCard[], squad: SquadRef[], usedNames: Set<string>): PlayerCard[] {
  const squadNames = squadNameSet(squad);
  const squadIds = new Set(squad.map((p) => p.id));
  const twoGks = squad.filter((p) => p.position === 'KL').length >= 2;
  return pool.filter((p) => {
    const nameKey = p.name.trim().toLowerCase();
    if (squadIds.has(p.id) || squadNames.has(nameKey) || usedNames.has(nameKey)) return false;
    if (twoGks && p.position === 'KL') return false;
    return true;
  });
}

function drawPlayers(
  seed: string,
  round: number,
  lossesCount: number,
  squad: SquadRef[],
  count: number,
  recoveryGuaranteed: boolean,
  rerollIndex = 0,
  variant: OfferDrawVariant = 'normal',
): PlayerCard[] {
  const rng = createRng(seed, variant === 'extradraw' ? 'extradraw-cards' : 'cards', round, rerollIndex);
  const rawPool = getPoolForRound(round, seed, lossesCount, recoveryGuaranteed);
  const cards: PlayerCard[] = [];
  const usedNames = new Set<string>();

  if (round === 1) {
    const pool = filterDrawPool(rawPool, squad, usedNames);
    const safe = pool.filter((p) => p.rating >= 65 && p.rating <= 78 && !p.tags.includes('GERİLEYEN') && !p.tags.includes('SAKATLIK RİSKİ') && !p.tags.includes('PERFORMANS DÜŞÜŞÜ') && !p.tags.includes('TARTIŞMALI'));
    const usePool = safe.length >= 3 ? safe : pool;
    for (let i = 0; i < 3; i++) {
      const available = usePool.filter((p) => !usedNames.has(p.name.trim().toLowerCase()));
      if (!available.length) break;
      const p = available[Math.floor(rng() * available.length)]!;
      usedNames.add(p.name.trim().toLowerCase());
      cards.push(clonePlayer(p));
    }
    const upgraded = silentCardUpgrade(cards, pool, round, rng);
    if (rerollIndex > 0) return upgradeWeakestCard(upgraded, pool, rng, 68 + rerollIndex * 2);
    return upgraded;
  }

  for (let i = 0; i < count; i++) {
    const pool = filterDrawPool(rawPool, squad, usedNames);
    const available = pool;
    const card = drawSinglePlayer(rng, round, available.length ? available : rawPool, rerollIndex);
    usedNames.add(card.name.trim().toLowerCase());
    cards.push(card);
  }

  if (round <= 3) {
    const pool = filterDrawPool(rawPool, squad, new Set());
    const upgraded = silentCardUpgrade(cards, pool, round, rng);
    if (rerollIndex > 0) return upgradeWeakestCard(upgraded, pool, rng, 68 + rerollIndex * 2);
    return upgraded;
  }
  if (rerollIndex > 0 && cards.length > 0) {
    const pool = filterDrawPool(rawPool, squad, new Set());
    return upgradeWeakestCard(cards, pool, rng, 66 + rerollIndex * 2);
  }
  return cards;
}

function drawTacticBonusOffers(
  seed: string,
  round: number,
  activeTacticIds: string[],
  rerollIndex = 0,
): GameCard[] {
  const rng = createRng(seed, 'tactic-bonus', round, rerollIndex);
  let pool = TACTIC_CARDS.filter((t) => !activeTacticIds.includes(t.id));
  if (pool.length < 2) pool = [...TACTIC_CARDS];

  const picked: TacticCard[] = [];
  const take = (candidates: TacticCard[]) => {
    const open = candidates.filter((c) => !picked.some((p) => p.id === c.id));
    if (!open.length) return;
    picked.push(cloneTactic(pickOne(rng, open)));
  };

  const hasFormation = activeTacticIds.some((id) => getTacticCategory(id) === 'formasyon');
  take(pool.filter((t) => {
    if (t.category !== 'formasyon') return false;
    if (t.id === 'tactic_442' && !hasFormation) return false;
    return true;
  }));
  take(pool.filter((t) => t.category === 'sistem'));
  while (picked.length < 2) {
    const open = pool.filter((c) => !picked.some((p) => p.id === c.id));
    if (!open.length) break;
    take(open);
  }

  const training = createTrainingCard(seed, round, rerollIndex);
  return [...picked.slice(0, 2), training];
}

export function drawOffers(
  seed: string,
  round: number,
  lossesCount: number,
  squad: SquadRef[],
  activeTacticIds: string[],
  recoveryGuaranteed: boolean,
  rerollIndex = 0,
  variant: OfferDrawVariant = 'normal',
  mode: OfferDrawMode = 'players',
): GameCard[] {
  if (mode === 'tacticBonus') {
    return drawTacticBonusOffers(seed, round, activeTacticIds, rerollIndex);
  }

  const players = drawPlayers(
    seed,
    round,
    lossesCount,
    squad,
    3,
    recoveryGuaranteed,
    rerollIndex,
    variant,
  );
  return players.slice(0, 3);
}

/** Tek slot için yeni oyuncu çek — diğer teklifler ve kadro hariç */
export function rerollSinglePlayerOffer(
  seed: string,
  round: number,
  lossesCount: number,
  squad: SquadRef[],
  excludeOffers: SquadRef[],
  slotIndex: number,
  rerollIndex: number,
  recoveryGuaranteed: boolean,
): PlayerCard {
  const rng = createRng(seed, 'slot-reroll', round, slotIndex, rerollIndex);
  const excludeNames = new Set([
    ...squadNameSet(squad),
    ...excludeOffers.map((p) => p.name.trim().toLowerCase()),
  ]);
  let pool = filterDrawPool(getPoolForRound(round, seed, lossesCount, recoveryGuaranteed), squad, excludeNames);
  if (!pool.length) {
    pool = filterDrawPool(PLAYER_POOL, squad, excludeNames);
  }

  let card = drawSinglePlayer(rng, round, pool, rerollIndex);
  let guard = 0;
  while (excludeNames.has(card.name.trim().toLowerCase()) && guard++ < 40) {
    card = drawSinglePlayer(rng, round, pool.length ? pool : PLAYER_POOL, rerollIndex);
  }

  if (rerollIndex > 0) {
    const fullPool = getPoolForRound(round, seed, lossesCount, recoveryGuaranteed);
    const upgraded = upgradeWeakestCard([card], fullPool, rng, 66 + rerollIndex * 2);
    card = upgraded[0]!;
  }

  return card;
}

export function getOfferDrawModeForRound(round: number, maxRounds = 15): OfferDrawMode {
  if (round === maxRounds) return 'players';
  if (isEventRound(round)) return 'players';
  return round > 0 && round % 3 === 0 ? 'tacticBonus' : 'players';
}

export function pickAutoOffer(offers: GameCard[], squadSize: number, maxSquadSize: number): GameCard {
  const tactics = offers.filter((o): o is TacticCard => o.kind === 'tactic');
  if (tactics.length === offers.length && tactics.length) {
    return tactics[0]!;
  }
  const players = offers.filter((o): o is PlayerCard => o.kind === 'player');
  if (squadSize < maxSquadSize && players.length) {
    return [...players].sort((a, b) => b.currentRating - a.currentRating)[0]!;
  }
  if (players.length) return [...players].sort((a, b) => b.currentRating - a.currentRating)[0]!;
  return offers[0]!;
}

/** @deprecated use drawOffers */
export function drawCards(seed: string, round: number, lossesCount: number, squad: SquadRef[]): PlayerCard[] {
  return drawOffers(seed, round, lossesCount, squad, [], false).filter((c): c is PlayerCard => c.kind === 'player');
}

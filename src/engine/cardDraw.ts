import { isEventRound } from '@/data/events';
import { PLAYER_POOL, clonePlayer } from '@/data/players';
import { filterPoolByRound } from '@/data/playerPoolMeta';
import { cloneTactic, TACTIC_CARDS } from '@/data/tactics';
import { createRng, getRarityWeights, pickOne, weightedPick } from '@/engine/seed';
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
  const takenNames = new Set(result.map((c) => c.name.trim().toLowerCase()));
  const backup = pool.filter(
    (p) => p.currentRating >= minRating
      && !result.some((c) => c.id === p.id)
      && !takenNames.has(p.name.trim().toLowerCase()),
  );
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
  const hasGk = squad.some((p) => p.position === 'KL');
  return pool.filter((p) => {
    const nameKey = p.name.trim().toLowerCase();
    if (squadIds.has(p.id) || squadNames.has(nameKey) || usedNames.has(nameKey)) return false;
    if (hasGk && p.position === 'KL') return false;
    return true;
  });
}

function dedupeOfferNames(cards: PlayerCard[]): PlayerCard[] {
  const seen = new Set<string>();
  const out: PlayerCard[] = [];
  for (const card of cards) {
    const key = card.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(card);
  }
  return out;
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
    if (rerollIndex > 0) return dedupeOfferNames(upgradeWeakestCard(upgraded, pool, rng, 68 + rerollIndex * 2));
    return dedupeOfferNames(upgraded);
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
    if (rerollIndex > 0) return dedupeOfferNames(upgradeWeakestCard(upgraded, pool, rng, 68 + rerollIndex * 2));
    return dedupeOfferNames(upgraded);
  }
  if (rerollIndex > 0 && cards.length > 0) {
    const pool = filterDrawPool(rawPool, squad, new Set());
    return dedupeOfferNames(upgradeWeakestCard(cards, pool, rng, 66 + rerollIndex * 2));
  }
  return dedupeOfferNames(cards);
}

function drawTacticBonusOffers(
  seed: string,
  round: number,
  activeTacticIds: string[],
  rerollIndex = 0,
): GameCard[] {
  const rng = createRng(seed, 'tactic-bonus', round, rerollIndex);

  // Her kategoriden, halihazırda aktif olmayan kartlardan 2 teklif çek.
  // Yeterli yoksa aktif olanları da havuza dahil et (fallback).
  const pickFrom = (category: 'formasyon' | 'sistem', count: number): TacticCard[] => {
    let pool = TACTIC_CARDS.filter((t) => t.category === category && !activeTacticIds.includes(t.id));
    if (pool.length < count) pool = TACTIC_CARDS.filter((t) => t.category === category);

    const picked: TacticCard[] = [];
    while (picked.length < count) {
      const open = pool.filter((c) => !picked.some((p) => p.id === c.id));
      if (!open.length) break;
      picked.push(cloneTactic(pickOne(rng, open)));
    }
    return picked;
  };

  const formations = pickFrom('formasyon', 2);
  const systems = pickFrom('sistem', 2);
  // Sıra: [formasyon, formasyon, sistem, sistem] — UI kategoriye göre ayırır.
  return [...formations, ...systems];
}

/**
 * Kadroda kaleci yoksa (örn. kaybedilince) tekliflerden en az biri kaleci
 * olsun — en zayıf kart yerine bir kaleci konur. Oyuncu yine de başka kart
 * seçebilir; bu yalnızca kaleci SEÇENEĞİNİ garanti eder.
 */
function ensureGoalkeeperOffer(
  cards: PlayerCard[],
  squad: SquadRef[],
  rawPool: PlayerCard[],
  rng: () => number,
): PlayerCard[] {
  if (squad.some((p) => p.position === 'KL')) return cards;
  if (cards.some((c) => c.position === 'KL')) return cards;

  const offerIds = new Set(cards.map((c) => c.id));
  const offerNames = new Set(cards.map((c) => c.name.trim().toLowerCase()));
  const isFreeGk = (p: PlayerCard) =>
    p.position === 'KL' && !offerIds.has(p.id) && !offerNames.has(p.name.trim().toLowerCase());

  let gkPool = rawPool.filter(isFreeGk);
  if (!gkPool.length) gkPool = PLAYER_POOL.filter(isFreeGk);
  if (!gkPool.length) return cards;

  const gk = clonePlayer(gkPool[Math.floor(rng() * gkPool.length)]!);
  const result = [...cards];
  const weakestIdx = result.reduce(
    (minI, c, i, arr) => (c.currentRating < arr[minI]!.currentRating ? i : minI),
    0,
  );
  result[weakestIdx] = gk;
  return result;
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
  const rawPool = getPoolForRound(round, seed, lossesCount, recoveryGuaranteed);
  const gkRng = createRng(seed, 'gk-guarantee', round, rerollIndex);
  const withGk = ensureGoalkeeperOffer(players, squad, rawPool, gkRng);
  return withGk.slice(0, 3);
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

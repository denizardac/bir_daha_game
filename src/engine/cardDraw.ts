import { isEventRound } from '@/data/events';
import {
  FREE_MODE_EXCLUSIVE_PLAYER_IDS,
  PERSONAL_UNLOCK_PLAYER_IDS,
  PLAYER_POOL,
  clonePlayer,
} from '@/data/players';
import { filterPoolByRound } from '@/data/playerPoolMeta';
import { SYNERGIES } from '@/data/synergies';
import { cloneTactic, TACTIC_CARDS } from '@/data/tactics';
import { createRng, getRarityWeights, pickOne, weightedPick } from '@/engine/seed';
import type { GameCard, PlayerCard, Rarity, TacticCard } from '@/types';

export type SquadRef = Pick<PlayerCard, 'id' | 'name' | 'position'>;

/**
 * Oyuncu kimliği için isim anahtarı. Kiralık/klon kartlar " (Kiralık)" gibi
 * parantezli ek taşır; bu ekleri ve büyük/küçük harf farkını yok sayarak
 * "Diego Ramos (Kiralık)" ile havuzdaki "Diego Ramos"u aynı kişi sayarız —
 * böylece aynı oyuncu hem kadroda hem teklifte gelmez.
 */
function nameKey(name: string): string {
  return name.replace(/\s*\(.*?\)\s*/g, ' ').trim().toLowerCase();
}

export type OfferDrawVariant = 'normal' | 'extradraw';
export type OfferDrawMode = 'players' | 'tacticBonus';

export type PlayerContentAccess = {
  isDailySeed: boolean;
  unlockedPlayerIds: readonly string[];
  /** Bu teklifte kesin gösterilecek, açılmış kişisel içerik. */
  guaranteedPlayerId?: string;
  /** Kriz Kontratı için 78+ toparlanma profili garanti eder. */
  guaranteeRecoveryPlayer?: boolean;
  /** Her iki moda da aynı giren, ay bazlı doğrulanmış global kartlar. */
  globalPlayers?: readonly PlayerCard[];
};

/** Günlük havuz kişisel kayıttan bağımsız; Serbest Mod yalnızca açık ödülleri ekler. */
export function getPlayerPoolForAccess(access?: PlayerContentAccess): PlayerCard[] {
  const globalPlayers = access?.globalPlayers ?? [];
  const appendGlobal = (base: PlayerCard[]) => {
    const ids = new Set(base.map((player) => player.id));
    return [...base, ...globalPlayers.filter((player) => !ids.has(player.id)).map(clonePlayer)];
  };
  if (!access || access.isDailySeed) {
    return appendGlobal(PLAYER_POOL.filter((player) => !FREE_MODE_EXCLUSIVE_PLAYER_IDS.has(player.id)));
  }
  const unlocked = new Set(access.unlockedPlayerIds);
  return appendGlobal(PLAYER_POOL.filter((player) => !PERSONAL_UNLOCK_PLAYER_IDS.has(player.id) || unlocked.has(player.id)));
}

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

function getPoolForRound(
  round: number,
  seed: string,
  lossesCount: number,
  recoveryGuaranteed: boolean,
  basePool: PlayerCard[] = PLAYER_POOL,
): PlayerCard[] {
  let pool = filterPoolByRound(basePool, round);
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
  if (result[weakestIdx]!.currentRating >= minRating) return result;

  const takenNames = new Set(result.map((c) => nameKey(c.name)));
  const backup = pool.filter(
    (p) => p.currentRating >= minRating
      && !result.some((c) => c.id === p.id)
      && !takenNames.has(nameKey(p.name)),
  );
  if (backup.length) {
    const upgraded = clonePlayer(backup[Math.floor(rng() * backup.length)]!);
    if (markBoost) upgraded.offerBoosted = true;
    result[weakestIdx] = upgraded;
  }
  return result;
}

function boostRerollPool(pool: PlayerCard[], round: number, rerollIndex: number): PlayerCard[] {
  if (rerollIndex <= 0) return pool;
  const floor = Math.min(78, 67 + round + rerollIndex * 2);
  const filtered = pool.filter((p) => {
    if (p.currentRating < floor) return false;
    if (rerollIndex >= 2 && (p.tags.includes('GERİLEYEN') || p.tags.includes('SAKATLIK RİSKİ') || p.tags.includes('PERFORMANS DÜŞÜŞÜ'))) return false;
    return true;
  });
  return filtered.length >= Math.min(4, pool.length) ? filtered : pool;
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
  return new Set(squad.map((p) => nameKey(p.name)));
}

function filterDrawPool(pool: PlayerCard[], squad: SquadRef[], usedNames: Set<string>): PlayerCard[] {
  const squadNames = squadNameSet(squad);
  const squadIds = new Set(squad.map((p) => p.id));
  const hasGk = squad.some((p) => p.position === 'KL');
  return pool.filter((p) => {
    const key = nameKey(p.name);
    if (squadIds.has(p.id) || squadNames.has(key) || usedNames.has(key)) return false;
    if (hasGk && p.position === 'KL') return false;
    return true;
  });
}

function dedupeOfferNames(cards: PlayerCard[]): PlayerCard[] {
  const seen = new Set<string>();
  const out: PlayerCard[] = [];
  for (const card of cards) {
    const key = nameKey(card.name);
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
  basePool: PlayerCard[] = PLAYER_POOL,
): PlayerCard[] {
  const rng = createRng(seed, variant === 'extradraw' ? 'extradraw-cards' : 'cards', round, rerollIndex);
  const rawPool = getPoolForRound(round, seed, lossesCount, recoveryGuaranteed, basePool);
  const cards: PlayerCard[] = [];
  const usedNames = new Set<string>();

  if (round === 1 && rerollIndex === 0) {
    const pool = filterDrawPool(rawPool, squad, usedNames);
    const safe = pool.filter((p) => p.rating >= 65 && p.rating <= 78 && !p.tags.includes('GERİLEYEN') && !p.tags.includes('SAKATLIK RİSKİ') && !p.tags.includes('PERFORMANS DÜŞÜŞÜ') && !p.tags.includes('TARTIŞMALI'));
    const usePool = safe.length >= 3 ? safe : pool;
    for (let i = 0; i < 3; i++) {
      const available = usePool.filter((p) => !usedNames.has(nameKey(p.name)));
      if (!available.length) break;
      const p = available[Math.floor(rng() * available.length)]!;
      usedNames.add(nameKey(p.name));
      cards.push(clonePlayer(p));
    }
    const upgraded = silentCardUpgrade(cards, usePool, round, rng);
    return dedupeOfferNames(upgraded);
  }

  for (let i = 0; i < count; i++) {
    const available = filterDrawPool(rawPool, squad, usedNames);
    // Havuz tükenirse bile kadroyu hariç tut (yalnızca usedNames'i gevşet) —
    // asla filtrelenmemiş rawPool'a düşme; aksi halde kadro üyesi tekrar gelebilir.
    const fallback = available.length ? available : filterDrawPool(rawPool, squad, new Set());
    if (!fallback.length) break;
    const drawPool = boostRerollPool(fallback, round, rerollIndex);
    const card = drawSinglePlayer(rng, round, drawPool, rerollIndex);
    usedNames.add(nameKey(card.name));
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

/** Tek kategori (formasyon VEYA sistem) için 2 yeni taktik teklifi — kategori reroll'u */
export function drawTacticCategoryOffers(
  seed: string,
  round: number,
  activeTacticIds: string[],
  category: 'formasyon' | 'sistem',
  rerollIndex: number,
  excludeIds: string[] = [],
): TacticCard[] {
  const rng = createRng(seed, 'tactic-cat-reroll', round, category, rerollIndex);
  const blocked = new Set([...activeTacticIds, ...excludeIds]);
  let pool = TACTIC_CARDS.filter((t) => t.category === category && !blocked.has(t.id));
  if (pool.length < 2) pool = TACTIC_CARDS.filter((t) => t.category === category && !excludeIds.includes(t.id));
  if (pool.length < 2) pool = TACTIC_CARDS.filter((t) => t.category === category);
  const picked: TacticCard[] = [];
  while (picked.length < 2) {
    const open = pool.filter((c) => !picked.some((p) => p.id === c.id));
    if (!open.length) break;
    picked.push(cloneTactic(pickOne(rng, open)));
  }
  return picked;
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
  basePool: PlayerCard[],
  rng: () => number,
): PlayerCard[] {
  if (squad.some((p) => p.position === 'KL')) return cards;
  if (cards.some((c) => c.position === 'KL')) return cards;

  const offerIds = new Set(cards.map((c) => c.id));
  const offerNames = new Set(cards.map((c) => nameKey(c.name)));
  const isFreeGk = (p: PlayerCard) =>
    p.position === 'KL' && !offerIds.has(p.id) && !offerNames.has(nameKey(p.name));

  let gkPool = rawPool.filter(isFreeGk);
  if (!gkPool.length) gkPool = basePool.filter(isFreeGk);
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

function replaceOfferPreservingGoalkeeper(
  cards: PlayerCard[],
  candidate: PlayerCard,
  squad: SquadRef[],
  protectedIds: ReadonlySet<string> = new Set(),
): PlayerCard[] {
  if (cards.some((card) => card.id === candidate.id || nameKey(card.name) === nameKey(candidate.name))) return cards;
  const result = [...cards];
  const squadHasGk = squad.some((player) => player.position === 'KL');
  const replaceable = result
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => !protectedIds.has(card.id))
    .filter(({ card }) => squadHasGk || candidate.position === 'KL' || card.position !== 'KL');
  if (!replaceable.length) return cards;
  const target = replaceable.sort((a, b) => a.card.currentRating - b.card.currentRating || a.index - b.index)[0]!;
  result[target.index] = clonePlayer(candidate);
  return result;
}

function recoveryCandidate(
  seed: string,
  round: number,
  pool: PlayerCard[],
  squad: SquadRef[],
  offers: PlayerCard[],
): PlayerCard | null {
  const recoveryTags = new Set(['POTANSİYEL', 'MENTOR', 'LİDER', 'KAPİTAN', 'DAYANIKLI']);
  const blockedIds = new Set([...squad.map((player) => player.id), ...offers.map((player) => player.id)]);
  const blockedNames = new Set([...squad.map((player) => nameKey(player.name)), ...offers.map((player) => nameKey(player.name))]);
  const hasGk = squad.some((player) => player.position === 'KL') || offers.some((player) => player.position === 'KL');
  const candidates = filterPoolByRound(pool, round).filter((player) =>
    player.currentRating >= 78
    && player.tags.some((tag) => recoveryTags.has(tag))
    && !blockedIds.has(player.id)
    && !blockedNames.has(nameKey(player.name))
    && (!hasGk || player.position !== 'KL'),
  );
  if (!candidates.length) return null;
  const rng = createRng(seed, 'crisis-recovery', round);
  return candidates[Math.floor(rng() * candidates.length)]!;
}

export function getScoutImprovementScore(squad: PlayerCard[], candidate: PlayerCard): number {
  let best = 0;
  for (const synergy of SYNERGIES) {
    if (!synergy.getProgress || synergy.check(squad, 50, { activeTactics: [] })) continue;
    const before = synergy.getProgress(squad);
    if (!before) continue;
    const after = synergy.getProgress(squad, candidate);
    const gain = after === null
      ? before.required - before.current + 4
      : after.current - before.current;
    best = Math.max(best, gain);
  }
  return best;
}

function targetedScoutCandidate(
  seed: string,
  round: number,
  pool: PlayerCard[],
  squad: PlayerCard[],
  offers: PlayerCard[],
): PlayerCard | null {
  const blockedIds = new Set([...squad.map((player) => player.id), ...offers.map((player) => player.id)]);
  const blockedNames = new Set([...squad.map((player) => nameKey(player.name)), ...offers.map((player) => nameKey(player.name))]);
  const hasGk = squad.some((player) => player.position === 'KL') || offers.some((player) => player.position === 'KL');
  const candidates = filterPoolByRound(pool, round)
    .filter((player) => !blockedIds.has(player.id) && !blockedNames.has(nameKey(player.name)))
    .filter((player) => !hasGk || player.position !== 'KL')
    .map((player) => ({ player, score: getScoutImprovementScore(squad, player) }))
    .filter((item) => item.score > 0);
  if (!candidates.length) return null;
  const bestScore = Math.max(...candidates.map((item) => item.score));
  const finalists = candidates.filter((item) => item.score === bestScore);
  const rng = createRng(seed, 'targeted-scout', round);
  return finalists[Math.floor(rng() * finalists.length)]!.player;
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
  access?: PlayerContentAccess,
): GameCard[] {
  if (mode === 'tacticBonus') {
    return drawTacticBonusOffers(seed, round, activeTacticIds, rerollIndex);
  }

  const basePool = getPlayerPoolForAccess(access);
  const players = drawPlayers(
    seed,
    round,
    lossesCount,
    squad,
    3,
    recoveryGuaranteed,
    rerollIndex,
    variant,
    basePool,
  );
  const rawPool = getPoolForRound(round, seed, lossesCount, recoveryGuaranteed, basePool);
  const gkRng = createRng(seed, 'gk-guarantee', round, rerollIndex);
  const withGk = ensureGoalkeeperOffer(players, squad, rawPool, basePool, gkRng);
  let result = withGk.slice(0, 3);
  const protectedIds = new Set<string>();
  if (access?.guaranteedPlayerId) {
    const guaranteed = basePool.find((player) => player.id === access.guaranteedPlayerId);
    if (guaranteed && !squad.some((player) => player.id === guaranteed.id || nameKey(player.name) === nameKey(guaranteed.name))) {
      result = replaceOfferPreservingGoalkeeper(result, guaranteed, squad, protectedIds);
      if (result.some((card) => card.id === guaranteed.id)) protectedIds.add(guaranteed.id);
    }
  }
  if (access?.guaranteeRecoveryPlayer) {
    const recovery = recoveryCandidate(seed, round, basePool, squad, result);
    if (recovery) result = replaceOfferPreservingGoalkeeper(result, recovery, squad, protectedIds);
  }
  return result;
}

/** Hedefli Scout: normal teklif üretir ve bir slotu Sinerji ilerleten adayla değiştirir. */
export function drawTargetedScoutOffers(
  seed: string,
  round: number,
  lossesCount: number,
  squad: PlayerCard[],
  activeTacticIds: string[],
  recoveryGuaranteed: boolean,
  rerollIndex: number,
  access?: PlayerContentAccess,
): GameCard[] {
  const baseAccess = access ? { ...access, guaranteedPlayerId: undefined, guaranteeRecoveryPlayer: false } : access;
  const regular = drawOffers(
    seed, round, lossesCount, squad, activeTacticIds, recoveryGuaranteed,
    rerollIndex, 'normal', 'players', baseAccess,
  ).filter((card): card is PlayerCard => card.kind === 'player');
  const pool = getPlayerPoolForAccess(access);
  const candidate = targetedScoutCandidate(seed, round, pool, squad, regular);
  return candidate ? replaceOfferPreservingGoalkeeper(regular, candidate, squad) : regular;
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
  access?: PlayerContentAccess,
): PlayerCard {
  const rng = createRng(seed, 'slot-reroll', round, slotIndex, rerollIndex);
  const excludeNames = new Set([
    ...squadNameSet(squad),
    ...excludeOffers.map((p) => nameKey(p.name)),
  ]);
  const basePool = getPlayerPoolForAccess(access);
  let pool = filterDrawPool(getPoolForRound(round, seed, lossesCount, recoveryGuaranteed, basePool), squad, excludeNames);
  if (!pool.length) {
    pool = filterDrawPool(basePool, squad, excludeNames);
  }

  const drawPool = boostRerollPool(pool, round, rerollIndex);
  let card = drawSinglePlayer(rng, round, drawPool, rerollIndex);
  let guard = 0;
  while (excludeNames.has(nameKey(card.name)) && guard++ < 40) {
    card = drawSinglePlayer(rng, round, drawPool.length ? drawPool : pool.length ? pool : basePool, rerollIndex);
  }

  if (rerollIndex > 0 && pool.length) {
    // Yükseltme havuzu da kadroyu VE diğer teklifleri hariç tutmalı — aksi halde
    // reroll, yandaki teklifteki (ör. yüksek ratingli bir kaleci) veya kadrodaki
    // bir oyuncuyu geri getirebilir. (filtrelenmemiş havuz kullanmak buydu.)
    const upgraded = upgradeWeakestCard([card], pool, rng, 66 + rerollIndex * 2);
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

import { SYNERGIES } from '@/data/synergies';
import { TAG_VALUE } from '@/data/tags';
import { injuryRatingPenalty, injuryRiskChance } from '@/engine/tagMechanics';
import { getStartingEleven } from '@/engine/lineupPreview';
import type { ActiveTactic, PlayerCard, SynergyDefinition } from '@/types';
import { formatStat } from '@/utils/formatNumber';

const PROTECTED_DEPARTURE_TAGS = ['MENTOR', 'LİDER', 'KAPİTAN'] as const;

export function getDepartureScore(player: PlayerCard, morale: number): number {
  const tagMultiplier = player.tags.reduce((acc, tag) => acc * (TAG_VALUE[tag] ?? 1), 1);
  const moraleContribution = player.tags.some((t) => PROTECTED_DEPARTURE_TAGS.includes(t as typeof PROTECTED_DEPARTURE_TAGS[number])) ? 1.2 : 1;
  const protectionBonus = player.tags.some((t) => PROTECTED_DEPARTURE_TAGS.includes(t as typeof PROTECTED_DEPARTURE_TAGS[number])) ? 28 : 0;
  return formatStat(player.currentRating * tagMultiplier * moraleContribution * (0.8 + morale / 200) + protectionBonus);
}

export function selectDepartingPlayer(
  squad: PlayerCard[],
  morale: number,
  activeTactics: ActiveTactic[] = [],
  manualLineup: Record<number, string> = {},
  protectedPlayerIds: string[] = [],
): PlayerCard {
  // Önce yedeklerden düşür — yedek = kadro derinliği; manuel/otomatik ilk 11
  // korunur (örn. tek kaleci, bilerek başlatılan zayıf oyuncu sahada kalır).
  const starterIds = new Set(getStartingEleven(squad, activeTactics, manualLineup).map((p) => p.id));
  const protectedIds = new Set(protectedPlayerIds);
  const bench = squad.filter((p) => !starterIds.has(p.id));
  const fromPool = bench.length ? bench : squad;
  const unprotectedPool = fromPool.filter((p) => !protectedIds.has(p.id));
  const fallbackUnprotectedPool = squad.filter((p) => !protectedIds.has(p.id));
  const departurePool = unprotectedPool.length ? unprotectedPool : (fallbackUnprotectedPool.length ? fallbackUnprotectedPool : fromPool);
  const candidates = departurePool.filter((p) => !(p.tags.includes('SAVAŞÇI') && !p.warriorProtected));
  const pool = candidates.length ? candidates : departurePool;
  const sorted = [...pool].sort((a, b) => getDepartureScore(a, morale) - getDepartureScore(b, morale));
  const pick = sorted[0]!;
  if (pick.tags.includes('SAVAŞÇI')) pick.warriorProtected = true;
  return pick;
}

export function applyPotentialGrowth(squad: PlayerCard[], round: number): PlayerCard[] {
  return squad.map((player) => {
    if (player.tags.includes('PİK DÖNEM')) return player;
    if (player.tags.includes('YENİ SEZON') && round <= 3) return player;
    if (!player.tags.includes('POTANSİYEL') && !player.tags.includes('YENİ SEZON')) return player;
    const ceiling = player.potentialCeiling ?? player.rating + 15;
    if (player.currentRating >= ceiling) return player;
    return { ...player, currentRating: player.currentRating + 1 };
  });
}

export function applyMentorGrowth(squad: PlayerCard[]): PlayerCard[] {
  if (!squad.some((p) => p.tags.includes('MENTOR'))) return squad;
  const hasAkademi = squad.some((p) => p.tags.includes('MENTOR')) && squad.some((p) => p.tags.includes('POTANSİYEL'));
  return squad.map((player) => {
    if (!player.tags.includes('POTANSİYEL')) return player;
    const ceiling = player.potentialCeiling ?? player.rating + 15;
    const bonus = hasAkademi ? 2 : 1;
    return { ...player, currentRating: Math.min(ceiling, player.currentRating + bonus) };
  });
}

export function applyInjuryRisk(squad: PlayerCard[], rng: () => number): PlayerCard[] {
  return squad.map((p) => {
    if (!p.tags.includes('SAKATLIK RİSKİ')) return p;
    if (rng() >= injuryRiskChance()) return p;
    return { ...p, tempRatingMod: (p.tempRatingMod ?? 0) + injuryRatingPenalty() };
  });
}

export function applyGerileyen(squad: PlayerCard[], activeTactics: ActiveTactic[] = []): PlayerCard[] {
  const hasRotasyon = activeTactics.some((t) => t.id === 'tactic_rotasyon');
  return squad.map((p) => {
    if (p.tags.includes('DAYANIKLI')) return p;

    const hasGerileyen = p.tags.includes('GERİLEYEN');
    const hasPerformans = p.tags.includes('PERFORMANS DÜŞÜŞÜ');
    if (!hasGerileyen && !hasPerformans) return p;

    const played = (p.matchesPlayed ?? 0) + 1;
    if (hasRotasyon) return { ...p, matchesPlayed: played };

    let drop = 0;
    if (played % 3 === 0) {
      if (hasGerileyen) drop += 1;
      if (hasPerformans) drop += 2;
    }
    return { ...p, matchesPlayed: played, currentRating: Math.max(55, p.currentRating - drop) };
  });
}

/** Maçtan sonraki kalıcı/geçici oyuncu state geçişinin tek kaynağı. */
export function applyPostMatchPlayerUpdates(
  squad: PlayerCard[],
  round: number,
  activeTactics: ActiveTactic[],
  injuryRng: () => number,
): PlayerCard[] {
  let next = applyPotentialGrowth(squad, round);
  next = applyMentorGrowth(next);
  next = next.map((player) => {
    const { tempRatingMod, ...rest } = player;
    void tempRatingMod;
    return rest;
  });
  next = applyInjuryRisk(next, injuryRng);
  return applyGerileyen(next, activeTactics);
}

export function passiveMoraleFromSquad(squad: PlayerCard[]): number {
  let bonus = 0;
  if (squad.some((p) => p.tags.includes('LİDER'))) bonus += 10;
  if (squad.some((p) => p.tags.includes('KAPİTAN'))) bonus += 15;
  if (squad.some((p) => p.tags.includes('SOYUNMA ODASI'))) bonus += 5;
  if (squad.filter((p) => p.tags.includes('YERLİ')).length >= 5) bonus += 5;
  return bonus;
}

export function applySynergyMoraleFloor(morale: number, minFromSynergy?: number): number {
  if (minFromSynergy) return Math.max(morale, minFromSynergy);
  return morale;
}

export function getWeakestPlayer(squad: PlayerCard[]): PlayerCard {
  return [...squad].sort((a, b) => a.currentRating - b.currentRating)[0]!;
}

export function getBrokenSynergies(
  before: PlayerCard[],
  after: PlayerCard[],
  morale: number,
  activeTactics: ActiveTactic[] = [],
  manualBefore: Record<number, string> = {},
  manualAfter: Record<number, string> = {},
): SynergyDefinition[] {
  const lineupBefore = getStartingEleven(before, activeTactics, manualBefore);
  const lineupAfter = getStartingEleven(after, activeTactics, manualAfter);
  const ctx = { activeTactics };
  const activeBefore = SYNERGIES.filter((s) => s.check(lineupBefore.length ? lineupBefore : before, morale, ctx));
  const activeAfterIds = new Set(
    SYNERGIES.filter((s) => s.check(lineupAfter.length ? lineupAfter : after, morale, ctx)).map((s) => s.id),
  );
  return activeBefore.filter((s) => !activeAfterIds.has(s.id));
}

export function sortSquadByRating(squad: PlayerCard[]): PlayerCard[] {
  return [...squad].sort((a, b) => b.currentRating - a.currentRating);
}

import { SYNERGIES } from '@/data/synergies';
import { TAG_VALUE } from '@/data/tags';
import type { PlayerCard, SynergyDefinition } from '@/types';
import { formatStat } from '@/utils/formatNumber';

export function getDepartureScore(player: PlayerCard, morale: number): number {
  const tagMultiplier = player.tags.reduce((acc, tag) => acc * (TAG_VALUE[tag] ?? 1), 1);
  const moraleContribution = player.tags.some((t) => ['LİDER', 'MENTOR', 'KAPİTAN'].includes(t)) ? 1.2 : 1;
  return formatStat(player.currentRating * tagMultiplier * moraleContribution * (0.8 + morale / 200));
}

export function selectDepartingPlayer(squad: PlayerCard[], morale: number): PlayerCard {
  const candidates = squad.filter((p) => !(p.tags.includes('SAVAŞÇI') && !p.warriorProtected));
  const pool = candidates.length ? candidates : squad;
  const sorted = [...pool].sort((a, b) => getDepartureScore(a, morale) - getDepartureScore(b, morale));
  const pick = sorted[0]!;
  if (pick.tags.includes('SAVAŞÇI')) pick.warriorProtected = true;
  return pick;
}

export function applyPotentialGrowth(squad: PlayerCard[], round: number): PlayerCard[] {
  return squad.map((player) => {
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

export function applyGerileyen(squad: PlayerCard[]): PlayerCard[] {
  return squad.map((p) => {
    if (!p.tags.includes('GERİLEYEN')) return p;
    const played = (p.matchesPlayed ?? 0) + 1;
    const drop = played % 3 === 0 ? 1 : 0;
    return { ...p, matchesPlayed: played, currentRating: Math.max(55, p.currentRating - drop) };
  });
}

export function passiveMoraleFromSquad(squad: PlayerCard[]): number {
  let bonus = 0;
  if (squad.some((p) => p.tags.includes('LİDER'))) bonus += 10;
  if (squad.some((p) => p.tags.includes('KAPİTAN'))) bonus += 15;
  if (squad.some((p) => p.tags.includes('SOYUNMA ODASI'))) bonus += 5;
  if (squad.filter((p) => p.tags.includes('YERLİ')).length >= 7) bonus += 5;
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
): SynergyDefinition[] {
  const activeBefore = SYNERGIES.filter((s) => s.check(before, morale));
  const activeAfterIds = new Set(SYNERGIES.filter((s) => s.check(after, morale)).map((s) => s.id));
  return activeBefore.filter((s) => !activeAfterIds.has(s.id));
}

export function sortSquadByRating(squad: PlayerCard[]): PlayerCard[] {
  return [...squad].sort((a, b) => b.currentRating - a.currentRating);
}

import { getActiveSynergies } from '@/data/synergies';
import { FINALE_MATCH_BONUS } from '@/engine/roundFlow';
import type { ActiveTactic, MatchResult, PlayerCard } from '@/types';

function streakMultiplier(streak: number): number {
  if (streak >= 4) return 1.35;
  if (streak === 3) return 1.2;
  if (streak === 2) return 1.1;
  return 1;
}

export function calculateRoundPoints(
  match: MatchResult,
  squad: PlayerCard[],
  morale: number,
  streak: number,
  round: number,
  lossesCount: number,
  activeTactics: ActiveTactic[] = [],
  timerSecondsLeft = 0,
  flawless = true,
): number {
  if (match.outcome === 'loss') return 0;

  const opponentRating = match.opponent.rating;
  let points = 0;

  if (match.outcome === 'win') {
    points += Math.max(0, opponentRating - 50) * 10;
    points += match.goalsFor * 50;
    points -= match.goalsAgainst * 20;
    if (match.cleanSheet) points += 100;
    const avg = squad.reduce((s, p) => s + p.currentRating, 0) / Math.max(squad.length, 1);
    if (opponentRating - avg >= 15) points += 500;
  } else {
    points += Math.floor(opponentRating * 2.5);
  }

  const synergies = getActiveSynergies(squad, morale, { activeTactics });
  for (const synergy of synergies) {
    if (synergy.perGoalBonus && match.goalsFor > 0) points += synergy.perGoalBonus * match.goalsFor;
    if (synergy.perWinBonus && match.outcome === 'win') points += synergy.perWinBonus;
    if (synergy.perRoundBonus) points += synergy.perRoundBonus;
  }

  for (const t of activeTactics) {
    if (t.technicalBonus) points += squad.filter((p) => p.tags.includes('TEKNİK')).length * (t.technicalBonus ?? 0);
    if (t.fastBonus) points += squad.filter((p) => p.tags.includes('HIZLI')).length * (t.fastBonus ?? 0);
  }

  if (match.outcome === 'win') points = Math.floor(points * streakMultiplier(streak));

  const mult = synergies.find((s) => s.scoreMultiplier)?.scoreMultiplier ?? 1;
  points = Math.floor(points * mult);

  if (round === 1 && match.outcome === 'win') points += 200;
  if (round === 15) points += FINALE_MATCH_BONUS;
  if (round === 15 && lossesCount === 0) points += 2000;
  if (squad.length <= 4 && match.outcome === 'win') points += 800;
  for (const id of match.newlyDiscoveredSynergies) {
    points += 200;
    void id;
  }

  points += timerSecondsLeft * 5;
  if (round === 15 && flawless && lossesCount === 0) points += 2000;

  return Math.max(0, Math.floor(points));
}

export function formatScore(score: number): string {
  return score.toLocaleString('tr-TR');
}

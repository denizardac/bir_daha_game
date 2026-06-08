import { getStartingSquad } from '@/data/players';
import { drawOffers } from '@/engine/cardDraw';
import { applyPlayerToSquad } from '@/engine/lineupPreview';
import { simulateMatch } from '@/engine/matchSimulation';
import { calculateRoundPoints } from '@/engine/scoring';
import { selectDepartingPlayer } from '@/engine/squadLogic';
import { getRandomSeed } from '@/engine/seed';
import { isPlayerCard } from '@/types';

export type PlaytestRunResult = {
  seed: string;
  finalScore: number;
  wins: number;
  draws: number;
  losses: number;
  roundsPlayed: number;
  finalMorale: number;
  finalSquadSize: number;
};

export type PlaytestSummary = {
  runs: number;
  avgScore: number;
  avgWins: number;
  avgLosses: number;
  avgMorale: number;
  minScore: number;
  maxScore: number;
};

/** Otomatik kart seçimi — en yüksek rating oyuncu */
function autoPick(offers: ReturnType<typeof drawOffers>) {
  const players = offers.filter(isPlayerCard);
  if (players.length) return [...players].sort((a, b) => b.rating - a.rating)[0]!;
  return offers[0]!;
}

export function simulateFullRun(seed: string, maxRounds = 15): PlaytestRunResult {
  let squad = getStartingSquad();
  let morale = 50;
  let score = 0;
  let streak = 0;
  let lossesCount = 0;
  let wins = 0;
  let draws = 0;
  let losses = 0;
  const discovered: string[] = [];
  const activeTactics: never[] = [];

  for (let round = 1; round <= maxRounds; round++) {
    if (round % 3 === 0 && round < maxRounds) {
      score += 35;
      morale = Math.min(100, morale + 8);
      continue;
    }

    const offers = drawOffers(seed, round, lossesCount, squad, [], false, 0);
    const pick = autoPick(offers);
    if (isPlayerCard(pick)) {
      squad = applyPlayerToSquad(squad, pick, 11, morale, activeTactics);
    }

    const match = simulateMatch(seed, round, squad, morale, 11, discovered, activeTactics, 0, 0, lossesCount);
    const points = calculateRoundPoints(match, squad, morale, streak, round, lossesCount, activeTactics, 0, lossesCount === 0);
    score += points;

    if (match.outcome === 'win') {
      wins++;
      streak++;
      morale = Math.min(100, morale + 10);
    } else if (match.outcome === 'draw') {
      draws++;
      streak = 0;
      morale = Math.max(0, morale - 5);
    } else {
      losses++;
      streak = 0;
      morale = Math.max(0, morale - 20);
      const out = selectDepartingPlayer(squad, morale);
      squad = squad.filter((p) => p.id !== out.id);
      lossesCount++;
      if (squad.length <= 4) break;
    }

    for (const id of match.newlyDiscoveredSynergies) {
      if (!discovered.includes(id)) discovered.push(id);
    }
  }

  return {
    seed,
    finalScore: score,
    wins,
    draws,
    losses,
    roundsPlayed: wins + draws + losses,
    finalMorale: morale,
    finalSquadSize: squad.length,
  };
}

export function runPlaytestBatch(count: number, baseSeed?: string): PlaytestSummary {
  const results: PlaytestRunResult[] = [];
  for (let i = 0; i < count; i++) {
    const seed = baseSeed ? `${baseSeed}_${i}` : getRandomSeed();
    results.push(simulateFullRun(seed));
  }

  const avg = (fn: (r: PlaytestRunResult) => number) =>
    results.reduce((s, r) => s + fn(r), 0) / results.length;

  return {
    runs: count,
    avgScore: Math.round(avg((r) => r.finalScore)),
    avgWins: Math.round(avg((r) => r.wins) * 10) / 10,
    avgLosses: Math.round(avg((r) => r.losses) * 10) / 10,
    avgMorale: Math.round(avg((r) => r.finalMorale)),
    minScore: Math.min(...results.map((r) => r.finalScore)),
    maxScore: Math.max(...results.map((r) => r.finalScore)),
  };
}

import { getStartingSquad } from '@/data/players';
import { drawOffers, getOfferDrawModeForRound } from '@/engine/cardDraw';
import { isEventRound } from '@/data/events';
import { getTacticCategory, getTacticEffect } from '@/data/tactics';
import { drawEvent, previewEventPlayer, resolveEvent } from '@/engine/events';
import { getEventRatingTarget, resolveEventRemoval } from '@/engine/eventRemoval';
import { isTacticBonusRound, TACTIC_BONUS_MORALE, TACTIC_BONUS_SCORE } from '@/engine/roundFlow';
import { applyPlayerToSquad } from '@/engine/lineupPreview';
import { simulateRosterDecision } from '@/engine/rosterDecision';
import { simulateMatch } from '@/engine/matchSimulation';
import { calculateRoundPoints } from '@/engine/scoring';
import { applyPostMatchPlayerUpdates, getWeakestPlayer, selectDepartingPlayer } from '@/engine/squadLogic';
import { createRng, getRandomSeed } from '@/engine/seed';
import { isPlayerCard, isTacticCard } from '@/types';
import type { ActiveTactic, PlayerCard } from '@/types';

/**
 * greedy = her zaman en yüksek ratingli kart (kaba bot).
 * synergy = rating + sinerji açma/ilerletme birlikte tartılır (insan-benzeri;
 * bir sinerjiyi tamamlıyorsa birkaç rating puanından feragat eder). İkincisi,
 * "sinerji hedefleyen bir oyuncu bunu açabilir mi?" sorusunu ölçmek için.
 */
export type PickStrategy = 'greedy' | 'synergy';

export type PlaytestRunResult = {
  seed: string;
  finalScore: number;
  wins: number;
  draws: number;
  losses: number;
  roundsPlayed: number;
  finalMorale: number;
  finalSquadSize: number;
  /** QA invariantleri için Run sonundaki gerçek oyuncu state'i. */
  finalSquad: PlayerCard[];
  /** Sinerji id → bu run'da kaç maçta aktifti (denge telemetrisi) */
  synergyActivations: Record<string, number>;
  /** Run boyunca seçilen taktik id'leri */
  tacticsUsed: string[];
  finaleReached: boolean;
  finaleWon: boolean;
};

export type PlaytestSummary = {
  runs: number;
  avgScore: number;
  avgWins: number;
  avgDraws: number;
  avgLosses: number;
  avgMorale: number;
  minScore: number;
  maxScore: number;
  /** Sinerji id → run başına ortalama aktivasyon */
  synergyUsage: Record<string, number>;
  /** Taktik id → kaç run'da seçildi */
  tacticUsage: Record<string, number>;
  finaleReachedRate: number;
  finaleWinRate: number;
};

/** Otomatik kart seçimi — en yüksek rating oyuncu (kaba bot) */
function greedyPick(offers: ReturnType<typeof drawOffers>) {
  const players = offers.filter(isPlayerCard);
  if (players.length) return [...players].sort((a, b) => b.rating - a.rating)[0]!;
  return offers[0]!;
}

/**
 * Sinerji-hedefli seçim: kartı eklediğinde AÇILAN sinerji başına büyük prim,
 * ilerleyen (yaklaşan) sinerji başına küçük nudge, üstüne kartın rating'i.
 * Böylece iyi bir oyuncu gibi bazen 1-2 rating düşük ama sinerji tamamlayan
 * kartı seçer — telemetride "hedefli oyunda hangi sinerji açılıyor" ölçülür.
 */
function synergyAwarePick(
  offers: ReturnType<typeof drawOffers>,
  squad: PlayerCard[],
  morale: number,
  activeTactics: ActiveTactic[],
) {
  const players = offers.filter(isPlayerCard);
  if (!players.length) return offers[0]!;

  let best = players[0]!;
  let bestScore = -Infinity;
  for (const cand of players) {
    const decision = simulateRosterDecision(squad, cand, {
      maxSquadSize: 11,
      morale,
      activeTactics,
    });
    const newlyActive = decision.synergyImpacts.filter((impact) => impact.status === 'activated').length;
    const progressNudge = decision.synergyImpacts.filter((impact) => impact.status === 'progressed').length;

    // Sinerji açmak ~22 rating değerinde (iyi oyuncu bir sinerji için feragat eder),
    // ilerletme ~4 rating değerinde. Beraberlikte rating tie-break yapar.
    const score = cand.currentRating + newlyActive * 22 + progressNudge * 4;
    if (score > bestScore) {
      bestScore = score;
      best = cand;
    }
  }
  return best;
}

function autoPick(
  offers: ReturnType<typeof drawOffers>,
  strategy: PickStrategy,
  squad: PlayerCard[],
  morale: number,
  activeTactics: ActiveTactic[],
) {
  return strategy === 'synergy'
    ? synergyAwarePick(offers, squad, morale, activeTactics)
    : greedyPick(offers);
}

function applyEventForPlaytest(
  seed: string,
  round: number,
  squad: PlayerCard[],
  morale: number,
  score: number,
  activeTactics: ActiveTactic[],
  lossesCount: number,
) {
  const event = drawEvent(seed, round, [], {
    streak: 0,
    morale,
    lossesCount,
    squadSize: squad.length,
    maxSquadSize: 11,
    round,
  });
  const choice = morale < 38 ? 'B' : 'A';
  const outcome = resolveEvent(event, choice, { squad, morale, score, activeTactics });
  let nextSquad = [...squad];
  let nextMorale = Math.min(100, Math.max(0, morale + outcome.moraleDelta));
  let nextScore = Math.max(0, score + outcome.scoreDelta);

  if (outcome.removeWeakest && nextSquad.length > 4) {
    const target = resolveEventRemoval(event.id, choice, nextSquad, activeTactics, outcome.sellPlayerId) ?? getWeakestPlayer(nextSquad);
    nextSquad = nextSquad.filter((p) => p.id !== target.id);
  }
  if (outcome.tempRatingDelta) {
    const target = getEventRatingTarget(event.id, choice, nextSquad, activeTactics);
    if (target) {
      nextSquad = nextSquad.map((p) =>
        p.id === target.id ? { ...p, tempRatingMod: (p.tempRatingMod ?? 0) + outcome.tempRatingDelta! } : p,
      );
    }
  }
  if (outcome.addYouth && nextSquad.length < 11) {
    nextSquad = [...nextSquad, previewEventPlayer(seed, round, event.id)];
  }
  if (outcome.grantTag) {
    const target = [...nextSquad].sort((a, b) => b.currentRating - a.currentRating)[0];
    if (target && !target.tags.includes(outcome.grantTag)) {
      nextSquad = nextSquad.map((p) =>
        p.id === target.id ? { ...p, tags: [...p.tags, outcome.grantTag!] } : p,
      );
    }
  }

  return {
    squad: nextSquad,
    morale: nextMorale,
    score: nextScore,
    nextMatchRisk: outcome.nextMatchRisk ?? 0,
    nextMatchBonus: outcome.nextMatchBonus ?? 0,
  };
}

export function simulateFullRun(seed: string, maxRounds = 15, strategy: PickStrategy = 'greedy'): PlaytestRunResult {
  let squad = getStartingSquad(seed, true);
  let morale = 50;
  let score = 0;
  let streak = 0;
  let lossesCount = 0;
  let wins = 0;
  let draws = 0;
  let losses = 0;
  const discovered: string[] = [];
  let activeTactics: ActiveTactic[] = [];
  let nextMatchRisk = 0;
  let nextMatchBonus = 0;
  const synergyActivations: Record<string, number> = {};
  const tacticsUsed = new Set<string>();
  let finaleReached = false;
  let finaleWon = false;

  for (let round = 1; round <= maxRounds; round++) {
    if (isEventRound(round)) {
      const eventResult = applyEventForPlaytest(seed, round, squad, morale, score, activeTactics, lossesCount);
      squad = eventResult.squad;
      morale = eventResult.morale;
      score = eventResult.score;
      nextMatchRisk = eventResult.nextMatchRisk;
      nextMatchBonus = eventResult.nextMatchBonus;
    }

    if (isTacticBonusRound(round, maxRounds)) {
      const offers = drawOffers(seed, round, lossesCount, squad, activeTactics.map((t) => t.id), false, 0, 'normal', 'tacticBonus');
      const formation = offers.find((o) => isTacticCard(o) && getTacticCategory(o.id) === 'formasyon');
      const system = offers.find((o) => isTacticCard(o) && getTacticCategory(o.id) === 'sistem');
      activeTactics = [
        ...(formation ? [getTacticEffect(formation.id)] : activeTactics.filter((t) => getTacticCategory(t.id) === 'formasyon')),
        ...(system ? [getTacticEffect(system.id)] : activeTactics.filter((t) => getTacticCategory(t.id) === 'sistem')),
      ];
      score += TACTIC_BONUS_SCORE;
      morale = Math.min(100, morale + TACTIC_BONUS_MORALE);
      continue;
    }

    const offers = drawOffers(
      seed,
      round,
      lossesCount,
      squad,
      activeTactics.map((t) => t.id),
      lossesCount > 0 && lossesCount <= 2,
      0,
      'normal',
      getOfferDrawModeForRound(round, maxRounds),
    );
    const pick = autoPick(offers, strategy, squad, morale, activeTactics);
    if (isPlayerCard(pick)) {
      squad = applyPlayerToSquad(squad, pick, 11, morale, activeTactics);
    }

    const match = simulateMatch({
      seed,
      round,
      squad,
      morale,
      discoveredSynergies: discovered,
      activeTactics,
      matchRisk: nextMatchRisk,
      matchBonus: nextMatchBonus,
      lossesCount,
    });
    const points = calculateRoundPoints(match, squad, morale, streak, round, lossesCount, activeTactics, 0, lossesCount === 0);
    score += points;
    nextMatchRisk = 0;
    nextMatchBonus = 0;
    squad = applyPostMatchPlayerUpdates(squad, round, activeTactics, createRng(seed, 'injury', round));

    for (const id of match.activeSynergies) {
      synergyActivations[id] = (synergyActivations[id] ?? 0) + 1;
    }
    for (const t of activeTactics) tacticsUsed.add(t.id);
    if (round === maxRounds) {
      finaleReached = true;
      finaleWon = match.outcome === 'win';
    }

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
      morale = Math.max(0, morale - 16);
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
    finalSquad: squad,
    synergyActivations,
    tacticsUsed: [...tacticsUsed],
    finaleReached,
    finaleWon,
  };
}

export function runPlaytestBatch(count: number, baseSeed?: string, strategy: PickStrategy = 'greedy'): PlaytestSummary {
  const results: PlaytestRunResult[] = [];
  for (let i = 0; i < count; i++) {
    const seed = baseSeed ? `${baseSeed}_${i}` : getRandomSeed();
    results.push(simulateFullRun(seed, 15, strategy));
  }

  const avg = (fn: (r: PlaytestRunResult) => number) =>
    results.reduce((s, r) => s + fn(r), 0) / results.length;

  const synergyUsage: Record<string, number> = {};
  const tacticUsage: Record<string, number> = {};
  for (const r of results) {
    for (const [id, n] of Object.entries(r.synergyActivations)) {
      synergyUsage[id] = (synergyUsage[id] ?? 0) + n;
    }
    for (const id of r.tacticsUsed) {
      tacticUsage[id] = (tacticUsage[id] ?? 0) + 1;
    }
  }
  for (const id of Object.keys(synergyUsage)) {
    synergyUsage[id] = Math.round((synergyUsage[id]! / results.length) * 100) / 100;
  }

  const finaleReachedCount = results.filter((r) => r.finaleReached).length;
  const finaleWonCount = results.filter((r) => r.finaleWon).length;

  return {
    runs: count,
    avgScore: Math.round(avg((r) => r.finalScore)),
    avgWins: Math.round(avg((r) => r.wins) * 10) / 10,
    avgDraws: Math.round(avg((r) => r.draws) * 10) / 10,
    avgLosses: Math.round(avg((r) => r.losses) * 10) / 10,
    avgMorale: Math.round(avg((r) => r.finalMorale)),
    minScore: Math.min(...results.map((r) => r.finalScore)),
    maxScore: Math.max(...results.map((r) => r.finalScore)),
    synergyUsage,
    tacticUsage,
    finaleReachedRate: Math.round((finaleReachedCount / results.length) * 100),
    finaleWinRate: finaleReachedCount ? Math.round((finaleWonCount / finaleReachedCount) * 100) : 0,
  };
}

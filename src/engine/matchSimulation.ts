import { getActiveSynergies } from '@/data/synergies';
import { getStartingEleven } from '@/engine/lineupPreview';
import { generateMatchEvents } from '@/engine/matchEvents';
import { createRng, generateOpponent, seedVariation } from '@/engine/seed';
import type { ActiveTactic, MatchHighlight, MatchResult, PlayerCard } from '@/types';

function matchSquad(squad: PlayerCard[], activeTactics: ActiveTactic[]): PlayerCard[] {
  const starters = getStartingEleven(squad, activeTactics);
  return starters.length ? starters : squad;
}

const GOAL_WEIGHTS = [
  { goals: 0, weight: 15 },
  { goals: 1, weight: 30 },
  { goals: 2, weight: 28 },
  { goals: 3, weight: 17 },
  { goals: 4, weight: 10 },
];

/** Güç katsayısına göre gol dağılımı — düşük güç = az gol, yüksek güç = çok gol */
export function rollGoals(rng: () => number, power: number): number {
  const p = Math.max(0.35, Math.min(2.5, power));

  const adjusted = GOAL_WEIGHTS.map(({ goals, weight }) => {
    if (goals === 0) {
      return { goals, weight: weight * Math.max(0.2, 1.4 - p * 0.42) };
    }
    return { goals, weight: weight * Math.pow(p, 0.32 + goals * 0.26) };
  });

  const total = adjusted.reduce((s, g) => s + g.weight, 0);
  let roll = rng() * total;
  for (const { goals, weight } of adjusted) {
    roll -= weight;
    if (roll <= 0) return goals;
  }
  return adjusted[adjusted.length - 1]!.goals;
}

function squadStrength(
  squad: PlayerCard[],
  morale: number,
  maxSquadSize: number,
  tactics: ActiveTactic[],
): number {
  const avg = squad.reduce((sum, p) => sum + p.currentRating, 0) / Math.max(squad.length, 1);
  const fill = 0.5 + 0.5 * (squad.length / maxSquadSize);
  const moraleFactor = 0.75 + (morale / 100) * 0.4;
  const tacticMod = tactics.reduce(
    (m, t) => m + (t.attackMod ?? 0) / 100 - (t.defenseMod && t.defenseMod < 0 ? Math.abs(t.defenseMod) / 200 : 0),
    1,
  );
  return avg * fill * moraleFactor * tacticMod;
}

function tekForvetMultiplier(squad: PlayerCard[], tactics: ActiveTactic[]): number {
  if (!tactics.some((t) => t.id === 'tactic_tekli_forvet')) return 1;
  const sfPlayers = squad.filter((p) => p.position === 'SF');
  const hasFinisherSf = sfPlayers.some((p) => p.tags.includes('FİNİŞÖR'));
  if (sfPlayers.length === 1 && hasFinisherSf) return 1.3;
  return 0.85;
}

function attackPower(squad: PlayerCard[], tactics: ActiveTactic[], ourStrength: number): number {
  const finisher = 1 + squad.filter((p) => p.tags.includes('FİNİŞÖR')).length * 0.08;
  const fast = 1 + squad.filter((p) => p.tags.includes('HIZLI')).length * 0.05
    + tactics.reduce((s, t) => s + (t.fastBonus ?? 0) / 100, 0);
  const tech = 1 + squad.filter((p) => p.tags.includes('TEKNİK')).length * 0.04
    + tactics.reduce((s, t) => s + (t.technicalBonus ?? 0) / 50, 0);
  return (ourStrength / 62) * finisher * fast * tech * tekForvetMultiplier(squad, tactics);
}

function applyStrengthNudges(
  rng: () => number,
  goalsFor: number,
  goalsAgainst: number,
  diff: number,
): { goalsFor: number; goalsAgainst: number } {
  let gf = goalsFor;
  let ga = goalsAgainst;

  if (diff > 26 && rng() < 0.45) gf += 1;
  else if (diff > 14 && gf <= 1 && rng() < 0.3) gf += 1;

  if (diff < -22 && rng() < 0.45) ga += 1;
  else if (diff < -12 && ga <= 1 && rng() < 0.3) ga += 1;

  if (gf === ga && Math.abs(diff) > 12) {
    if (diff > 0 && rng() < 0.38) gf += 1;
    else if (diff < 0 && rng() < 0.38) ga += 1;
  }

  return { goalsFor: Math.max(0, Math.min(6, gf)), goalsAgainst: Math.max(0, Math.min(6, ga)) };
}

export function simulateMatch(
  seed: string,
  round: number,
  squad: PlayerCard[],
  morale: number,
  _maxSquadSize: number,
  discoveredSynergies: string[],
  activeTactics: ActiveTactic[] = [],
  matchRisk = 0,
  matchBonus = 0,
  lossesCount = 0,
): MatchResult {
  const rng = createRng(seed, 'match', round);
  const opponent = generateOpponent(rng, round === 15 ? round + 2 : round);
  const variation = seedVariation(rng);

  const starters = matchSquad(squad, activeTactics);
  const ourStrength = squadStrength(starters, morale, 11, activeTactics) * variation;
  const theirStrength = opponent.rating * (0.9 + rng() * 0.2) * (1 + matchRisk);

  let goalsFor = rollGoals(rng, attackPower(starters, activeTactics, ourStrength));
  let goalsAgainst = rollGoals(rng, theirStrength / Math.max(ourStrength * 0.95, 1));

  const behind = goalsAgainst > goalsFor;
  const synergies = getActiveSynergies(starters, morale, { activeTactics, behindInMatch: behind });
  const synergyBoost = 1 + synergies.length * 0.04;
  const goalMult = synergies.find((s) => s.goalMultiplier)?.goalMultiplier ?? 1;

  if (goalMult !== 1 && goalsFor > 0) {
    goalsFor = Math.max(0, Math.round(goalsFor * goalMult));
  } else if (synergyBoost > 1 && goalsFor > 0 && rng() < (synergyBoost - 1) * 3) {
    goalsFor += 1;
  }

  for (const s of synergies) {
    if (s.cleanSheetDefenseBonus && goalsAgainst > 0 && rng() < s.cleanSheetDefenseBonus) {
      goalsAgainst -= 1;
    }
  }

  const diff = ourStrength * synergyBoost - theirStrength + matchBonus / 10 + (round <= 3 ? (4 - round) * 3 : 0);
  ({ goalsFor, goalsAgainst } = applyStrengthNudges(rng, goalsFor, goalsAgainst, diff));

  let outcome: MatchResult['outcome'];
  if (goalsFor > goalsAgainst) outcome = 'win';
  else if (goalsFor === goalsAgainst) outcome = 'draw';
  else outcome = 'loss';

  if (round === 1 && lossesCount === 0 && outcome !== 'win') {
    goalsFor = Math.max(goalsFor, goalsAgainst + 1);
    outcome = 'win';
  }

  const cleanSheet = goalsAgainst === 0;
  const highlights: MatchHighlight[] = [];
  const activeIds = synergies.map((s) => s.id);
  const newlyDiscovered = activeIds.filter((id) => !discoveredSynergies.includes(id));

  for (const synergy of synergies) {
    if (synergy.perGoalBonus && goalsFor > 0) {
      highlights.push({ text: `${synergy.icon} ${synergy.name}`, points: synergy.perGoalBonus * goalsFor });
    }
    if (synergy.perWinBonus && outcome === 'win') {
      highlights.push({ text: `${synergy.icon} ${synergy.name} galibiyet`, points: synergy.perWinBonus });
    }
  }
  if (cleanSheet && outcome === 'win') highlights.push({ text: '🛡️ MÜKEMMEL SAVUNMA', points: 100 });
  if (synergies.length >= 3) highlights.push({ text: '🌪️ SİNERJİ FIRTINASI', points: 150 });

  let wowMoment: string | undefined;
  if (opponent.rating >= 90 && outcome === 'win') wowMoment = 'ŞOKCU GALİBİYET — dev rakibi yendin!';
  if (cleanSheet && outcome === 'win') wowMoment = wowMoment ?? 'TEMİZ SAYFA — kale kapalı!';

  const events = generateMatchEvents(rng, starters, goalsFor, goalsAgainst);

  return {
    outcome,
    goalsFor,
    goalsAgainst,
    cleanSheet,
    opponent,
    highlights,
    activeSynergies: activeIds,
    newlyDiscoveredSynergies: newlyDiscovered,
    roundPoints: 0,
    wowMoment,
    events,
  };
}

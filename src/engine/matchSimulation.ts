import { getActiveSynergies } from '@/data/synergies';
import { getStartingEleven } from '@/engine/lineupPreview';
import {
  effectivePlayerRating,
  lineupFillFactor,
  matchBonusMultiplier,
  matchRiskMultiplier,
  positionFitMultiplier,
  synergyRatingMultiplier,
  tacticAttackMultiplier,
  tacticDefenseMultiplier,
} from '@/engine/matchPower';
import { generateMatchEvents } from '@/engine/matchEvents';
import { getTacticScoreHighlights } from '@/engine/tacticRules';
import {
  attackTagMultiplier,
  defenseTagMultiplier,
  moraleStabilityBonus,
  riskTagStrengthPenalty,
} from '@/engine/tagMechanics';
import { createRng, generateOpponent } from '@/engine/seed';
import type { ActiveTactic, MatchHighlight, MatchResult, OpponentStyle, PlayerCard } from '@/types';

/**
 * Rakip stilinin maça HAFİF etkisi (±%5) — kim kazanır çok değişmez, maçın
 * karakteri değişir: saldırgan = açık maç (iki yönde de gol eğilimi hafif ↑),
 * savunmacı = kapalı maç (iki yönde de ↓), dengeli = nötr. rollGoals'a giden güç
 * argümanını çarptığı için rng akışı bozulmaz (aynı seed → aynı diziyi tüketir).
 */
function opponentStyleProfile(style: OpponentStyle): { attack: number; defense: number; tempo: number } {
  if (style === 'saldırgan') return { attack: 1.06, defense: 0.94, tempo: 1.12 };
  if (style === 'savunmacı') return { attack: 0.94, defense: 1.06, tempo: 0.88 };
  return { attack: 1, defense: 1, tempo: 1 };
}

function matchSquad(
  squad: PlayerCard[],
  activeTactics: ActiveTactic[],
  manualLineup: Record<number, string> = {},
): PlayerCard[] {
  const starters = getStartingEleven(squad, activeTactics, manualLineup);
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

type TeamStrength = {
  overall: number;
  attack: number;
  defense: number;
};

function synergyAttackMultiplier(synergies: ReturnType<typeof getActiveSynergies>): number {
  const bonus = synergies.reduce((sum, synergy) => sum + Math.max(0, (synergy.goalMultiplier ?? 1) - 1), 0);
  return Math.min(1.32, 1 + bonus);
}

function synergyDefenseMultiplier(synergies: ReturnType<typeof getActiveSynergies>): number {
  const bonus = synergies.reduce((sum, synergy) => sum + (synergy.cleanSheetDefenseBonus ?? 0) * 0.5, 0);
  return Math.min(1.22, 1 + bonus);
}

function teamStrength(
  squad: PlayerCard[],
  morale: number,
  round: number,
  tactics: ActiveTactic[],
  synergies: ReturnType<typeof getActiveSynergies>,
  matchBonus: number,
  manualLineup: Record<number, string> = {},
  behindInMatch = false,
): TeamStrength {
  const avg = squad.reduce((sum, p) => sum + effectivePlayerRating(p), 0) / Math.max(squad.length, 1);
  const fill = lineupFillFactor(squad.length, round);
  const moraleFactor = 0.75 + (morale / 100) * 0.4 + moraleStabilityBonus(squad, morale);
  const ratingMult = synergyRatingMultiplier(synergies);
  const positionFit = positionFitMultiplier(squad, tactics, manualLineup);
  const riskPenalty = riskTagStrengthPenalty(squad, morale);
  const earlyStability = round <= 3 ? 1 + (4 - round) * 0.025 : 1;
  const common = avg
    * fill
    * moraleFactor
    * ratingMult
    * positionFit
    * riskPenalty
    * matchBonusMultiplier(matchBonus)
    * earlyStability;

  return {
    overall: avg,
    attack: common
      * attackTagMultiplier(squad, behindInMatch)
      * tacticAttackMultiplier(tactics, squad)
      * synergyAttackMultiplier(synergies),
    defense: common
      * defenseTagMultiplier(squad)
      * tacticDefenseMultiplier(tactics, squad)
      * synergyDefenseMultiplier(synergies),
  };
}

const OUTCOME_NOISE_SCALE = 0.2;
const DRAW_BAND = 0.09;
const RANKED_ROUND_TWO_ROLL_FLOOR = 0.2;

function logistic(value: number): number {
  return 1 / (1 + Math.exp(-value));
}

function outcomeProbabilities(advantage: number) {
  const loss = logistic((-DRAW_BAND - advantage) / OUTCOME_NOISE_SCALE);
  const win = 1 - logistic((DRAW_BAND - advantage) / OUTCOME_NOISE_SCALE);
  return { loss, draw: Math.max(0, 1 - loss - win), win };
}

function rollOutcome(roll: number, probabilities: ReturnType<typeof outcomeProbabilities>): MatchResult['outcome'] {
  if (roll < probabilities.loss) return 'loss';
  if (roll < probabilities.loss + probabilities.draw) return 'draw';
  return 'win';
}

type OutcomeRollWindow = { min: number; max: number };

function outcomeRollWindow(round: number, lossesCount: number, isDailySeed: boolean): OutcomeRollWindow {
  // Ranked'in ilk gerçek karar maçı uç bir şans zarıyla bütün makul seçimleri
  // hükümsüz bırakamaz. Bu turda şansın yalnız alt kuyruğunu kesiyoruz; yetersiz
  // kurulan takım hâlâ kaybedebilir, iyi seçim ise seed'e karşı gerçek karşılık bulur.
  if (isDailySeed && round === 2 && lossesCount === 0) {
    return { min: RANKED_ROUND_TWO_ROLL_FLOOR, max: 1 };
  }
  return { min: 0, max: 1 };
}

function projectProbabilitiesToWindow(
  probabilities: ReturnType<typeof outcomeProbabilities>,
  window: OutcomeRollWindow,
) {
  const width = window.max - window.min;
  const cdf = (value: number) => Math.max(0, Math.min(1, (value - window.min) / width));
  const loss = cdf(probabilities.loss);
  const lossOrDraw = cdf(probabilities.loss + probabilities.draw);
  return { loss, draw: lossOrDraw - loss, win: 1 - lossOrDraw };
}

function scorelineForOutcome(
  seed: string,
  round: number,
  outcome: MatchResult['outcome'],
  ourGoalPower: number,
  theirGoalPower: number,
): { goalsFor: number; goalsAgainst: number } {
  let goalsFor = rollGoals(createRng(seed, 'match-score-for-v2', round), ourGoalPower);
  let goalsAgainst = rollGoals(createRng(seed, 'match-score-against-v2', round), theirGoalPower);

  if (outcome === 'win' && goalsFor <= goalsAgainst) goalsFor = goalsAgainst + 1;
  else if (outcome === 'loss' && goalsAgainst <= goalsFor) goalsAgainst = goalsFor + 1;
  else if (outcome === 'draw') {
    const level = Math.round((goalsFor + goalsAgainst) / 2);
    goalsFor = level;
    goalsAgainst = level;
  }

  return {
    goalsFor: Math.max(0, Math.min(6, goalsFor)),
    goalsAgainst: Math.max(0, Math.min(6, goalsAgainst)),
  };
}

function randomizeRoundOneWinScore(rng: () => number): { goalsFor: number; goalsAgainst: number } {
  const margin = 1 + Math.floor(rng() * 3);
  const ga = Math.floor(rng() * Math.min(3, margin));
  const gf = ga + margin;
  return { goalsFor: gf, goalsAgainst: ga };
}

export type MatchSimulationInput = {
  seed: string;
  round: number;
  squad: PlayerCard[];
  morale: number;
  discoveredSynergies?: string[];
  activeTactics?: ActiveTactic[];
  matchRisk?: number;
  matchBonus?: number;
  lossesCount?: number;
  isDailySeed?: boolean;
  manualLineup?: Record<number, string>;
  opponentNameOverride?: string | null;
};

export function simulateMatch({
  seed,
  round,
  squad,
  morale,
  discoveredSynergies = [],
  activeTactics = [],
  matchRisk = 0,
  matchBonus = 0,
  lossesCount = 0,
  isDailySeed = true,
  manualLineup = {},
  opponentNameOverride = null,
}: MatchSimulationInput): MatchResult {
  const opponentRng = createRng(seed, 'match-opponent-v2', round);
  const opponent = generateOpponent(opponentRng, round === 15 ? round + 2 : round, !isDailySeed);
  // Revanş kimliği yalnızca ismi değiştirir; rakibin gücü ve maç akışları sabit kalır.
  if (opponentNameOverride) opponent.name = opponentNameOverride;

  const starters = matchSquad(squad, activeTactics, manualLineup);
  const synergiesPreview = getActiveSynergies(starters, morale, { activeTactics, behindInMatch: false, manualLineup });
  let ourStrength = teamStrength(starters, morale, round, activeTactics, synergiesPreview, matchBonus, manualLineup);

  const style = opponentStyleProfile(opponent.style);
  const opponentBase = opponent.rating * matchRiskMultiplier(matchRisk);
  const opponentAttack = opponentBase * style.attack;
  const opponentDefense = opponentBase * style.defense;
  const opponentComposite = Math.sqrt(Math.max(1, opponentAttack * opponentDefense));
  const rollWindow = outcomeRollWindow(round, lossesCount, isDailySeed);
  const rawOutcomeRoll = createRng(seed, 'match-outcome-v2', round)();
  const outcomeRoll = rollWindow.min + rawOutcomeRoll * (rollWindow.max - rollWindow.min);
  const probabilitiesFor = (strength: TeamStrength) => {
    const ourComposite = Math.sqrt(Math.max(1, strength.attack * strength.defense));
    return outcomeProbabilities(Math.log(ourComposite / opponentComposite));
  };
  let probabilities = probabilitiesFor(ourStrength);
  let outcome = rollOutcome(outcomeRoll, probabilities);

  if (round === 1 && lossesCount === 0) outcome = 'win';
  const warriorResponse = outcome === 'loss' && starters.some((player) => player.tags.includes('SAVAŞÇI'));
  if (warriorResponse) {
    const responseSynergies = getActiveSynergies(starters, morale, {
      activeTactics,
      behindInMatch: true,
      manualLineup,
    });
    ourStrength = teamStrength(
      starters,
      morale,
      round,
      activeTactics,
      responseSynergies,
      matchBonus,
      manualLineup,
      true,
    );
    probabilities = probabilitiesFor(ourStrength);
    outcome = rollOutcome(outcomeRoll, probabilities);
  }
  const forecastProbabilities = round === 1 && lossesCount === 0
    ? { win: 1, draw: 0, loss: 0 }
    : projectProbabilitiesToWindow(probabilities, rollWindow);

  let { goalsFor, goalsAgainst } = scorelineForOutcome(
    seed,
    round,
    outcome,
    (ourStrength.attack / Math.max(opponentDefense, 1)) * style.tempo,
    (opponentAttack / Math.max(ourStrength.defense, 1)) * style.tempo,
  );

  // İlk karar maçında mağlubiyet mümkündür; ancak tek bir erken seed ağır farkı
  // bütün seçimlere dayatmasın. Sonuç korunur, yalnız skor farkı bire indirilir.
  if (isDailySeed && round === 2 && lossesCount === 0 && outcome === 'loss' && goalsAgainst - goalsFor > 1) {
    goalsAgainst = goalsFor + 1;
  }

  if (round === 1 && lossesCount === 0) {
    ({ goalsFor, goalsAgainst } = randomizeRoundOneWinScore(createRng(seed, 'match-round-one-score-v2', round)));
  }

  const synergies = getActiveSynergies(starters, morale, { activeTactics, behindInMatch: warriorResponse, manualLineup });

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
    if (synergy.perRoundBonus) {
      highlights.push({ text: `${synergy.icon} ${synergy.name} pasif`, points: synergy.perRoundBonus });
    }
  }
  highlights.push(...getTacticScoreHighlights({ outcome, goalsFor, goalsAgainst, cleanSheet }, starters, activeTactics));
  if (cleanSheet && outcome === 'win') highlights.push({ text: '🛡️ MÜKEMMEL SAVUNMA', points: 100 });
  // Savunma odaklı taktikler kazanamasa bile değer üretsin: gol yemeden biten
  // beraberlik/maç da puan verir (Catenaccio / Otobüsü Çek tuzak olmaktan çıkar).
  else if (cleanSheet) highlights.push({ text: '🛡️ Gol yemedi', points: 30 });
  if (synergies.length >= 3 && outcome !== 'loss') highlights.push({ text: '🌪️ SİNERJİ FIRTINASI', points: 150 });

  let wowMoment: string | undefined;
  if (opponentNameOverride && outcome === 'win') wowMoment = `REVANŞ ALINDI — ${opponent.name} finalde devrildi!`;
  if (opponent.rating >= 90 && outcome === 'win') wowMoment = wowMoment ?? 'ŞOKCU GALİBİYET — dev rakibi yendin!';
  if (cleanSheet && outcome === 'win') wowMoment = wowMoment ?? 'TEMİZ SAYFA — kale kapalı!';

  const events = generateMatchEvents(createRng(seed, 'match-events-v2', round), starters, goalsFor, goalsAgainst);

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
    forecast: {
      teamOverall: ourStrength.overall,
      opponentOverall: opponent.rating,
      teamAttack: ourStrength.attack,
      teamDefense: ourStrength.defense,
      opponentAttack,
      opponentDefense,
      winProbability: forecastProbabilities.win,
      drawProbability: forecastProbabilities.draw,
      lossProbability: forecastProbabilities.loss,
    },
    wowMoment,
    events,
  };
}

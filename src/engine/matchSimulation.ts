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
import { createRng, generateOpponent, seedVariation } from '@/engine/seed';
import type { ActiveTactic, MatchHighlight, MatchResult, OpponentStyle, PlayerCard } from '@/types';

/**
 * Rakip stilinin maça HAFİF etkisi (±%5) — kim kazanır çok değişmez, maçın
 * karakteri değişir: saldırgan = açık maç (iki yönde de gol eğilimi hafif ↑),
 * savunmacı = kapalı maç (iki yönde de ↓), dengeli = nötr. rollGoals'a giden güç
 * argümanını çarptığı için rng akışı bozulmaz (aynı seed → aynı diziyi tüketir).
 */
function opponentStyleGoalMods(style: OpponentStyle): { our: number; their: number } {
  if (style === 'saldırgan') return { our: 1.05, their: 1.05 };
  if (style === 'savunmacı') return { our: 0.95, their: 0.95 };
  return { our: 1, their: 1 };
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

function squadStrength(
  squad: PlayerCard[],
  morale: number,
  round: number,
  tactics: ActiveTactic[],
  synergies: ReturnType<typeof getActiveSynergies>,
  manualLineup: Record<number, string> = {},
): number {
  // Taktik-nötr takım gücü: taktik çarpanları attackPower/defensePower'da uygulanır
  // (aksi halde hücum taktiği hem burada hem attackPower'da uygulanıp karelenirdi).
  const avg = squad.reduce((sum, p) => sum + effectivePlayerRating(p), 0) / Math.max(squad.length, 1);
  const fill = lineupFillFactor(squad.length, round);
  const moraleFactor = 0.75 + (morale / 100) * 0.4 + moraleStabilityBonus(squad, morale);
  const ratingMult = synergyRatingMultiplier(synergies);
  const positionFit = positionFitMultiplier(squad, tactics, manualLineup);
  const riskPenalty = riskTagStrengthPenalty(squad, morale);
  return avg * fill * moraleFactor * ratingMult * positionFit * riskPenalty;
}

function attackPower(
  squad: PlayerCard[],
  tactics: ActiveTactic[],
  ourStrength: number,
  behindInMatch: boolean,
): number {
  const attackTactic = tacticAttackMultiplier(tactics, squad);
  return (ourStrength / 62)
    * attackTagMultiplier(squad, behindInMatch)
    * attackTactic;
}

function defensePower(
  squad: PlayerCard[],
  tactics: ActiveTactic[],
  synergies: ReturnType<typeof getActiveSynergies>,
): number {
  const defenseTactic = tacticDefenseMultiplier(tactics, squad);
  const cleanSheetBoost = synergies.reduce((s, syn) => s + (syn.cleanSheetDefenseBonus ?? 0), 0);
  return defenseTactic * defenseTagMultiplier(squad) * (1 + cleanSheetBoost * 0.5);
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

function randomizeRoundOneWinScore(rng: () => number): { goalsFor: number; goalsAgainst: number } {
  const margin = 1 + Math.floor(rng() * 3);
  const ga = Math.floor(rng() * Math.min(3, margin));
  const gf = ga + margin;
  return { goalsFor: gf, goalsAgainst: ga };
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
  isDailySeed = true,
  manualLineup: Record<number, string> = {},
  opponentNameOverride: string | null = null,
): MatchResult {
  const rng = createRng(seed, 'match', round);
  const opponent = generateOpponent(rng, round === 15 ? round + 2 : round, !isDailySeed);
  // Revanş kimliği: rng akışını BOZMADAN yalnızca isim değişir (rating aynı kalır)
  if (opponentNameOverride) opponent.name = opponentNameOverride;
  const variation = seedVariation(rng);

  const starters = matchSquad(squad, activeTactics, manualLineup);
  const behindPreview = false;
  const synergiesPreview = getActiveSynergies(starters, morale, { activeTactics, behindInMatch: behindPreview, manualLineup });

  let ourStrength = squadStrength(starters, morale, round, activeTactics, synergiesPreview, manualLineup) * variation;
  ourStrength *= matchBonusMultiplier(matchBonus);

  let theirStrength = opponent.rating * (0.9 + rng() * 0.2);
  theirStrength *= matchRiskMultiplier(matchRisk);

  const defense = defensePower(starters, activeTactics, synergiesPreview);
  const theirAttack = theirStrength / Math.max(defense, 0.5);

  const styleMod = opponentStyleGoalMods(opponent.style);
  let goalsFor = rollGoals(rng, attackPower(starters, activeTactics, ourStrength, false) * styleMod.our);
  let goalsAgainst = rollGoals(rng, (theirAttack / Math.max(ourStrength * 0.95, 1)) * styleMod.their);

  const behind = goalsAgainst > goalsFor;
  const synergies = getActiveSynergies(starters, morale, { activeTactics, behindInMatch: behind, manualLineup });
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

  const diff = ourStrength * synergyBoost - theirStrength + (round <= 3 ? (4 - round) * 3 : 0);
  ({ goalsFor, goalsAgainst } = applyStrengthNudges(rng, goalsFor, goalsAgainst, diff));

  let outcome: MatchResult['outcome'];
  if (goalsFor > goalsAgainst) outcome = 'win';
  else if (goalsFor === goalsAgainst) outcome = 'draw';
  else outcome = 'loss';

  if (round === 1 && lossesCount === 0) {
    ({ goalsFor, goalsAgainst } = randomizeRoundOneWinScore(rng));
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

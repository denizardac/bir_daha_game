import { getStartingSquad } from '@/data/players';
import { getTacticCategory, getTacticEffect } from '@/data/tactics';
import { isPlayerCard, isSkipCard, isTacticCard, type PlayerCard, type RoundResult, type TacticCard } from '@/types';
import { applyPlayerToSquad } from '@/engine/lineupPreview';
import { simulateMatch } from '@/engine/matchSimulation';
import { calculateRoundPoints } from '@/engine/scoring';
import { selectDepartingPlayer } from '@/engine/squadLogic';
import type { ActiveTactic } from '@/types';
import type { EgoBestDecision, EgoWorstMistake } from '@/types';

type EgoResult = {
  bestDecision: EgoBestDecision | null;
  worstMistake: EgoWorstMistake | null;
};

function applyTacticPick(active: ActiveTactic[], card: TacticCard): ActiveTactic[] {
  const fx = getTacticEffect(card.id);
  const next: ActiveTactic = { ...fx, id: card.id, name: card.name };
  const category = getTacticCategory(card.id);
  const filtered = active.filter((t) => getTacticCategory(t.id) !== category);
  return [...filtered, next];
}

/** Round geçmişini oynayarak alternatif kartları yeniden simüle eder */
export function analyzeEgoReplay(
  roundHistory: RoundResult[],
  seed: string,
  startingSquad: PlayerCard[] = getStartingSquad(),
): EgoResult {
  let squad = startingSquad.map((p) => ({ ...p, tags: [...p.tags] }));
  let morale = 50;
  let streak = 0;
  let lossesCount = 0;
  let flawless = true;
  const activeTactics: ActiveTactic[] = [];
  const discovered: string[] = [];

  let best: { round: number; cardName: string; diff: number; synergy?: string } | null = null;
  let worst: { round: number; desc: string; diff: number } | null = null;

  for (const r of roundHistory) {
    if (r.isEvent) {
      // Olay kararı için alternatif kart yok — en iyi/en kötü karar analizine dahil edilmez
      continue;
    }
    if (r.isTacticBonus) {
      if (isTacticCard(r.cardSelected)) {
        const updated = applyTacticPick(activeTactics, r.cardSelected);
        activeTactics.length = 0;
        activeTactics.push(...updated);
      }
      morale = Math.min(100, morale + 8);
      continue;
    }

    if (!r.matchResult) continue;

    const alts = r.cardsShown.filter((c) => c.id !== r.cardSelected.id);

    for (const alt of alts) {
      let altSquad = squad;
      let altTactics = [...activeTactics];

      if (isPlayerCard(alt)) {
        altSquad = applyPlayerToSquad(squad, alt, 11, morale, activeTactics);
      } else if (isTacticCard(alt)) {
        altTactics = applyTacticPick(activeTactics, alt);
      } else {
        continue;
      }

      const altMatch = simulateMatch(
        seed,
        r.round,
        altSquad,
        morale,
        11,
        discovered,
        altTactics,
        0,
        0,
        lossesCount,
      );
      const altPoints = calculateRoundPoints(
        altMatch,
        altSquad,
        morale,
        streak,
        r.round,
        lossesCount,
        altTactics,
        0,
        flawless,
      );
      const diff = r.pointsEarned - altPoints;

      if (!best || diff > best.diff) {
        best = {
          round: r.round,
          cardName: r.cardSelected.kind === 'player' ? r.cardSelected.name : r.cardSelected.name,
          diff,
          synergy: r.matchResult.newlyDiscoveredSynergies[0],
        };
      }
      if (diff < -80 && (!worst || diff < worst.diff)) {
        worst = {
          round: r.round,
          desc: `${alt.kind === 'player' ? alt.name : alt.name} seçseydin ~${Math.abs(diff)} puan fark olabilirdi`,
          diff,
        };
      }
    }

    if (isPlayerCard(r.cardSelected)) {
      squad = applyPlayerToSquad(squad, r.cardSelected, 11, morale, activeTactics);
    } else if (isSkipCard(r.cardSelected)) {
      // kadro değişmez
    } else if (isTacticCard(r.cardSelected)) {
      const updated = applyTacticPick(activeTactics, r.cardSelected);
      activeTactics.length = 0;
      activeTactics.push(...updated);
    }

    if (r.matchResult.outcome === 'win') {
      streak += 1;
      morale = Math.min(100, morale + 10);
    } else if (r.matchResult.outcome === 'draw') {
      streak = 0;
      morale = Math.max(0, morale - 5);
    } else {
      streak = 0;
      morale = Math.max(0, morale - 20);
      flawless = false;
      const departing = selectDepartingPlayer(squad, morale);
      squad = squad.filter((p) => p.id !== departing.id);
      lossesCount += 1;
    }

    for (const id of r.matchResult.newlyDiscoveredSynergies) {
      if (!discovered.includes(id)) discovered.push(id);
    }
  }

  const rarePercent = best ? Math.min(15, 3 + Math.floor((best.diff || 0) / 120)) : 50;

  return {
    bestDecision: best
      ? {
          round: best.round,
          cardName: best.cardName,
          rarePercent,
          pointsGained: Math.max(50, best.diff),
          synergyActivated: best.synergy,
        }
      : null,
    worstMistake: worst
      ? { round: worst.round, description: worst.desc, pointsLost: Math.abs(worst.diff) }
      : null,
  };
}

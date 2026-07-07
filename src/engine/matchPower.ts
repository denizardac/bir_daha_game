import { getSlotFitTier } from '@/data/positionFlexibility';
import { assignSquadToFormation, getActiveFormationKey } from '@/engine/lineupPreview';
import { conditionalAttackMod, conditionalDefenseMod } from '@/engine/tacticRules';
import type { ActiveTactic, PlayerCard, SynergyDefinition } from '@/types';

export function effectivePlayerRating(player: PlayerCard): number {
  return Math.max(50, player.currentRating + (player.tempRatingMod ?? 0));
}

export function tacticAttackMultiplier(tactics: ActiveTactic[], squad: PlayerCard[] = []): number {
  return tactics.reduce((m, t) => m + (t.attackMod ?? 0) / 100, 1) + conditionalAttackMod(tactics, squad) / 100;
}

export function tacticDefenseMultiplier(tactics: ActiveTactic[], squad: PlayerCard[] = []): number {
  return tactics.reduce((m, t) => m + (t.defenseMod ?? 0) / 100, 1) + conditionalDefenseMod(tactics, squad) / 100;
}

/** UI'daki güç bonusu → maç gücü çarpanı (ör. +175 ≈ +%27) */
export function matchBonusMultiplier(bonus: number): number {
  return 1 + bonus / 650;
}

export function matchRiskMultiplier(risk: number): number {
  return 1 + risk;
}

export function lineupFillFactor(starterCount: number, round: number): number {
  const raw = starterCount / 11;
  const earlyGrace = round <= 5 ? 0.82 : 0.75;
  return Math.max(earlyGrace, raw);
}

export function positionFitMultiplier(
  squad: PlayerCard[],
  activeTactics: ActiveTactic[],
  manualLineup: Record<number, string> = {},
): number {
  const formationKey = getActiveFormationKey(activeTactics);
  // Manuel pin'ler varsa ceza gerçek (pin'li) dizilişe göre hesaplanır —
  // aksi halde otomatik yerleşim farklı slot dağıtıp cezayı saptırabilir.
  const lineup = assignSquadToFormation(squad, formationKey, manualLineup);
  let penalty = 0;
  for (const slot of lineup) {
    if (!slot.player) continue;
    const tier = getSlotFitTier(slot.player, slot.slot.preferred);
    if (tier === 'forced') penalty += 0.06;
    else if (tier === 'flex') penalty += 0.03;
  }
  return Math.max(0.82, 1 - penalty);
}

export function synergyRatingMultiplier(synergies: SynergyDefinition[]): number {
  const mult = synergies.find((s) => s.ratingMultiplier)?.ratingMultiplier ?? 1;
  return mult;
}

export function formatMatchPowerBonusLabel(bonus: number): string {
  const pct = Math.round((matchBonusMultiplier(bonus) - 1) * 100);
  return `Sonraki maçta takım gücü +%${pct}`;
}

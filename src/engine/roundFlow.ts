/** Round 3, 6, 9, 12 — taktik/formasyon + antrenman, maç yok (15 = şampiyonluk maçı) */
export function isTacticBonusRound(round: number, maxRounds = 15): boolean {
  return round > 0 && round % 3 === 0 && round < maxRounds;
}

export function isFinaleRound(round: number, maxRounds = 15): boolean {
  return round === maxRounds;
}

export const TACTIC_BONUS_SCORE = 35;
export const TACTIC_BONUS_MORALE = 8;
export const FINALE_MATCH_BONUS = 2500;

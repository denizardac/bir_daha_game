import { isEventRound } from '@/data/events';
import type { RoundResult } from '@/types';

/** Round 3, 6, 9, 12 — taktik/formasyon + antrenman, maç yok (15 = şampiyonluk maçı; olay round'ları 4/8/11/14 hariç) */
export function isTacticBonusRound(round: number, maxRounds = 15): boolean {
  return round > 0 && round % 3 === 0 && round < maxRounds && !isEventRound(round);
}

export function isFinaleRound(round: number, maxRounds = 15): boolean {
  return round === maxRounds;
}

export const TACTIC_BONUS_SCORE = 35;
export const TACTIC_BONUS_MORALE = 8;
export const FINALE_MATCH_BONUS = 2500;

/**
 * Finale revanş rakibi: run içinde seni yenen İLK takımın adı — şampiyonluk
 * maçında karşına o çıkar (rakip gücü değişmez, yalnızca kimlik/anlatı).
 * Hiç kaybetmediysen null (normal üretilmiş rakip oynar).
 */
export function getFinaleRivalName(roundHistory: RoundResult[]): string | null {
  for (const r of roundHistory) {
    if (r.matchResult?.outcome === 'loss') return r.matchResult.opponent.name;
  }
  return null;
}

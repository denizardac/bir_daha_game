import { computeRunDigest, isLeaderboardEntryPlausible } from '@/engine/runIntegrity';
import type { LeaderboardEntry, PlayerCard, RoundResult } from '@/types';
import type { SynergyDefinition } from '@/types';

/** roundHistory'deki kazanılan puanların toplamı — client skoru ile karşılaştırılır */
export function sumRoundHistoryPoints(roundHistory: RoundResult[]): number {
  return roundHistory.reduce((sum, r) => sum + (r.pointsEarned ?? 0), 0);
}

export type RunValidationResult = {
  ok: boolean;
  reason?: string;
};

const SCORE_TOLERANCE = 30;
const MAX_HISTORY_ENTRIES = 32;
const MAX_MATCH_POINTS = 25_000;
const MAX_TACTIC_POINTS = 500;
const MAX_EVENT_ABS_POINTS = 1_000;

function selectedCardWasOffered(r: RoundResult): boolean {
  const kind = r.cardSelected?.kind;
  if (r.isEvent || r.isTacticBonus || kind === 'event' || kind === 'training' || kind === 'skip') return true;
  return r.cardsShown?.some((c) => c.id === r.cardSelected.id && c.kind === kind) ?? false;
}

export function validateRunSubmissionSync(
  entry: Omit<LeaderboardEntry, 'weekKey'>,
  roundHistory: RoundResult[],
  digest: string,
): RunValidationResult {
  if (!isLeaderboardEntryPlausible(entry)) {
    return { ok: false, reason: 'Skor aralığı geçersiz' };
  }

  if (!digest || digest.length < 8) {
    return { ok: false, reason: 'Bütünlük özeti eksik' };
  }

  if (!Array.isArray(roundHistory) || roundHistory.length === 0 || roundHistory.length > MAX_HISTORY_ENTRIES) {
    return { ok: false, reason: 'Round geçmişi geçersiz' };
  }

  if (entry.integrityDigest && entry.integrityDigest !== digest) {
    return { ok: false, reason: 'Bütünlük özeti uyuşmuyor' };
  }

  const playedRounds = roundHistory.filter((r) => !r.isEvent && (!r.isTacticBonus || r.pointsEarned > 0));
  if (playedRounds.length > entry.roundsCompleted + 2) {
    return { ok: false, reason: 'Round sayısı tutarsız' };
  }

  const summed = sumRoundHistoryPoints(roundHistory);
  if (Math.abs(summed - entry.totalScore) > SCORE_TOLERANCE) {
    return { ok: false, reason: `Puan toplamı uyuşmuyor (${summed} vs ${entry.totalScore})` };
  }

  const playedRoundNumbers = new Set<number>();
  for (const r of roundHistory) {
    if (!Number.isInteger(r.round) || r.round < 1 || r.round > 15) {
      return { ok: false, reason: 'Geçersiz round numarası' };
    }
    if (r.matchResult && r.matchResult.roundPoints > 0) {
      const diff = Math.abs(r.pointsEarned - r.matchResult.roundPoints);
      if (diff > 120) {
        return { ok: false, reason: `Round ${r.round} puanı şüpheli` };
      }
    }
    if (!r.cardSelected?.id) {
      return { ok: false, reason: 'Eksik kart seçimi' };
    }
    if (!selectedCardWasOffered(r)) {
      return { ok: false, reason: `Round ${r.round} seçimi tekliflerde yok` };
    }
    if (r.isEvent) {
      if (r.matchResult) return { ok: false, reason: `Round ${r.round} olayında maç sonucu var` };
      if (Math.abs(r.pointsEarned) > MAX_EVENT_ABS_POINTS) return { ok: false, reason: `Round ${r.round} olay puanı şüpheli` };
      continue;
    }
    if (r.isTacticBonus) {
      if (r.matchResult) return { ok: false, reason: `Round ${r.round} taktik turunda maç sonucu var` };
      if (r.pointsEarned < 0 || r.pointsEarned > MAX_TACTIC_POINTS) return { ok: false, reason: `Round ${r.round} taktik puanı şüpheli` };
      continue;
    }
    if (playedRoundNumbers.has(r.round)) {
      return { ok: false, reason: `Round ${r.round} tekrar edilmiş` };
    }
    playedRoundNumbers.add(r.round);
    if (!r.matchResult) return { ok: false, reason: `Round ${r.round} maç sonucu eksik` };
    if (r.pointsEarned < 0 || r.pointsEarned > MAX_MATCH_POINTS) return { ok: false, reason: `Round ${r.round} maç puanı şüpheli` };
  }

  return { ok: true };
}

export async function validateRunSubmission(
  entry: Omit<LeaderboardEntry, 'weekKey'>,
  roundHistory: RoundResult[],
  digest: string,
): Promise<RunValidationResult> {
  const sync = validateRunSubmissionSync(entry, roundHistory, digest);
  if (!sync.ok) return sync;

  const expectedDigest = await computeRunDigest(
    entry.seed,
    roundHistory,
    entry.totalScore,
    entry.roundsCompleted,
  );
  if (expectedDigest !== digest) {
    return { ok: false, reason: 'Digest doğrulanamadı' };
  }

  return { ok: true };
}

/** Teklifte hangi tag sinerji ilerlemesini tetikliyor */
export function getOfferProgressTag(
  squad: PlayerCard[],
  offer: PlayerCard,
  synergy: SynergyDefinition,
): string | null {
  const before = synergy.getProgress?.(squad);
  const after = synergy.getProgress?.(squad, offer);
  if (!before || !after || after.current <= before.current) return null;

  for (const tag of offer.tags) {
    const countBefore = squad.reduce((n, p) => n + (p.tags.includes(tag) ? 1 : 0), 0);
    const countAfter = [...squad, offer].reduce((n, p) => n + (p.tags.includes(tag) ? 1 : 0), 0);
    if (countAfter > countBefore) return tag;
  }

  return offer.tags[0] ?? null;
}

export function buildOfferSynergyHint(
  synergy: SynergyDefinition,
  squad: PlayerCard[],
  progress: { current: number; required: number },
  offers: PlayerCard[],
): string | null {
  if (progress.current > 0) return null;

  for (const offer of offers) {
    const after = synergy.getProgress?.(squad, offer);
    if (!after || after.current <= progress.current) continue;
    const tag = getOfferProgressTag(squad, offer, synergy);
    if (tag) {
      return `Tekliflerde ${tag} var — seçersen ${after.current}/${after.required}`;
    }
    return `Tekliflerde uygun kart var — seçersen ${after.current}/${after.required}`;
  }

  return null;
}

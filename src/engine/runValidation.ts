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

  if (entry.integrityDigest && entry.integrityDigest !== digest) {
    return { ok: false, reason: 'Bütünlük özeti uyuşmuyor' };
  }

  const playedRounds = roundHistory.filter((r) => !r.isTacticBonus || r.pointsEarned > 0);
  if (playedRounds.length > entry.roundsCompleted + 2) {
    return { ok: false, reason: 'Round sayısı tutarsız' };
  }

  const summed = sumRoundHistoryPoints(roundHistory);
  if (Math.abs(summed - entry.totalScore) > SCORE_TOLERANCE) {
    return { ok: false, reason: `Puan toplamı uyuşmuyor (${summed} vs ${entry.totalScore})` };
  }

  for (const r of roundHistory) {
    if (r.matchResult && r.matchResult.roundPoints > 0) {
      const diff = Math.abs(r.pointsEarned - r.matchResult.roundPoints);
      if (diff > 120) {
        return { ok: false, reason: `Round ${r.round} puanı şüpheli` };
      }
    }
    if (!r.cardSelected?.id) {
      return { ok: false, reason: 'Eksik kart seçimi' };
    }
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

import type { LeaderboardEntry, RoundResult } from '@/types';

/** İstemci tarafı skor özeti — sunucu doğrulaması olmadan %100 güvenli değil */
export async function computeRunDigest(
  seed: string,
  roundHistory: RoundResult[],
  totalScore: number,
  roundsCompleted: number,
): Promise<string> {
  const payload = JSON.stringify({
    seed,
    totalScore,
    roundsCompleted,
    picks: roundHistory.map((r) => ({
      round: r.round,
      cardId: r.cardSelected.id,
      points: r.pointsEarned,
      outcome: r.matchResult?.outcome ?? null,
    })),
  });
  const data = new TextEncoder().encode(payload);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export function isLeaderboardEntryPlausible(entry: LeaderboardEntry): boolean {
  if (entry.totalScore < 0 || entry.totalScore > 500_000) return false;
  if (entry.roundsCompleted < 1 || entry.roundsCompleted > 15) return false;
  if (!entry.seed || entry.seed.length < 4) return false;
  return true;
}

/** Gelecekte API'ye gönderilecek skor paketi */
export type SignedRunPayload = {
  entry: LeaderboardEntry;
  digest: string;
  clientVersion: string;
};

export async function buildSignedRunPayload(
  entry: Omit<LeaderboardEntry, 'weekKey'>,
  roundHistory: RoundResult[],
): Promise<SignedRunPayload> {
  const digest = await computeRunDigest(entry.seed, roundHistory, entry.totalScore, entry.roundsCompleted);
  return {
    entry: { ...entry, integrityDigest: digest },
    digest,
    clientVersion: '0.1.0',
  };
}

import { getDailySeed } from '@/engine/seed';

/** URL ile paylaşılan meydan okuma: "aynı seed'i oyna, skorumu geç" */
export type Challenge = {
  seed: string;
  score: number;
  by: string;
};

const MAX_NAME = 18;
const MAX_SEED = 80;
const MAX_SCORE = 500_000;

/** Meydan okuma linki — paylaşım metnine ve Web Share API'ye gider */
export function buildChallengeUrl(origin: string, challenge: Challenge): string {
  const url = new URL(origin);
  url.search = '';
  url.hash = '';
  url.searchParams.set('seed', challenge.seed);
  url.searchParams.set('score', String(Math.max(0, Math.round(challenge.score))));
  if (challenge.by) url.searchParams.set('by', challenge.by.slice(0, MAX_NAME));
  return url.toString();
}

/**
 * `?seed=...&score=...&by=...` çöz. Bozuk/eksik/sınır dışı değerlerde null döner —
 * kullanıcı elle URL kurcalarsa oyun normal açılır.
 */
export function parseChallengeFromSearch(search: string): Challenge | null {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return null;
  }

  const seed = params.get('seed')?.trim();
  if (!seed || seed.length < 4 || seed.length > MAX_SEED) return null;

  const rawScore = Number(params.get('score'));
  const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(MAX_SCORE, Math.round(rawScore))) : 0;

  const by = (params.get('by') ?? '').trim().slice(0, MAX_NAME) || 'Bir rakip';

  return { seed, score, by };
}

/**
 * Meydan okunan seed bugünün günlük seed'i mi? Öyleyse run günlük sayılır ve
 * günlük leaderboard'a yazılır; değilse serbest mod olarak oynanır (sunucu da
 * günlük skorlarda seed↔gün eşleşmesi arar).
 */
export function isChallengeSeedDaily(seed: string, today = getDailySeed()): boolean {
  return seed === today;
}

/** Adres çubuğunu temizle — yenilemede meydan okuma tekrar tetiklenmesin */
export function stripChallengeParams(url: string): string {
  try {
    const u = new URL(url);
    for (const key of ['seed', 'score', 'by']) u.searchParams.delete(key);
    return u.pathname + (u.searchParams.toString() ? `?${u.searchParams}` : '') + u.hash;
  } catch {
    return url;
  }
}

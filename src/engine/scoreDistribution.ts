import type { LeaderboardEntry } from '@/types';

export interface ScoreBucket {
  label: string;
  count: number;
  min: number;
}

const BUCKET_DEFS = [
  { label: '0', min: 0, max: 0 },
  { label: '1–2K', min: 1, max: 2000 },
  { label: '2–5K', min: 2001, max: 5000 },
  { label: '5–8K', min: 5001, max: 8000 },
  { label: '8K+', min: 8001, max: Infinity },
] as const;

export function buildDailyScoreBuckets(entries: LeaderboardEntry[]): ScoreBucket[] {
  const counts = BUCKET_DEFS.map(() => 0);
  for (const e of entries) {
    const score = e.totalScore;
    const idx = BUCKET_DEFS.findIndex((b) => score >= b.min && score <= b.max);
    if (idx >= 0) counts[idx]! += 1;
  }
  return BUCKET_DEFS.map((b, i) => ({
    label: b.label,
    count: counts[i]!,
    min: b.min,
  }));
}

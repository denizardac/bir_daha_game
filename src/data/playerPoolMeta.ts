import type { Tag } from '@/types';

/** Round 9'dan önce çekim havuzundan çıkarılır */
export const LATE_DRAW_TAGS: Tag[] = [
  'GERİLEYEN',
  'SAKATLIK RİSKİ',
  'PERFORMANS DÜŞÜŞÜ',
  'TARTIŞMALI',
  'KIRMIZI KART',
];

export const LATE_TAG_MIN_ROUND = 9;

export function hasLateDrawTag(tags: readonly Tag[]): boolean {
  return tags.some((t) => LATE_DRAW_TAGS.includes(t));
}

export function filterPoolByRound<T extends { tags: Tag[] }>(pool: T[], round: number): T[] {
  if (round >= LATE_TAG_MIN_ROUND) return pool;
  return pool.filter((p) => !hasLateDrawTag(p.tags));
}

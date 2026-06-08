import { describe, expect, it } from 'vitest';
import { TAG_EXCLUSION_GROUPS, sanitizeTags } from '@/data/tagConflicts';
import { pickTagsForPosition } from '@/data/positionTraitPools';
import type { Position } from '@/types';

function hasConflict(tags: readonly string[]): boolean {
  for (const group of TAG_EXCLUSION_GROUPS) {
    const hits = group.filter((t) => tags.includes(t));
    if (hits.length > 1) return true;
  }
  return false;
}

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('pickTagsForPosition', () => {
  it('never assigns mutually exclusive tags together', () => {
    const positions: Position[] = ['STP', 'SF', 'KL', 'OS', 'DOS'];
    for (let seed = 0; seed < 800; seed += 1) {
      const rng = mulberry32(seed);
      for (const position of positions) {
        for (const rating of [58, 70, 78, 85]) {
          const tags = pickTagsForPosition(position, rating, rng, 3);
          expect(hasConflict(tags), `${position} r${rating} seed${seed}: ${tags.join(', ')}`).toBe(false);
        }
      }
    }
  });
});

describe('sanitizeTags', () => {
  it('drops later conflicting tags', () => {
    expect(sanitizeTags(['KISA', 'UZUN', 'GÜÇLÜ'])).toEqual(['KISA', 'GÜÇLÜ']);
    expect(sanitizeTags(['PİK DÖNEM', 'GERİLEYEN'])).toEqual(['PİK DÖNEM']);
  });
});

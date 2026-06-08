import { describe, expect, it } from 'vitest';
import { getDailyDateKey, getDailySeed } from '@/engine/seed';

describe('getDailySeed', () => {
  it('uses June 9 override with deterministic slug', () => {
    expect(getDailyDateKey()).toBe('2026-06-09');
    expect(getDailySeed()).toBe('2026-06-09-kale-284-bir-daha-v1');
  });
});

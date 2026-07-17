import { describe, expect, it } from 'vitest';
import { getDailyDateKey, getDailySeed } from '@/engine/seed';
import { expectedDailySeed } from '../../supabase/functions/_shared/dailySeed';

describe('getDailySeed', () => {
  it('follows the Istanbul calendar with a deterministic slug', () => {
    const fixed = new Date('2026-06-09T12:00:00Z');
    expect(getDailyDateKey(fixed)).toBe('2026-06-09');
    expect(getDailySeed(fixed)).toBe('2026-06-09-kale-284-bir-daha-v2');
  });

  it('produces a calendar-based key for the current day (no frozen override)', () => {
    const key = getDailyDateKey();
    const seed = getDailySeed();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(seed.startsWith(`${key}-`)).toBe(true);
    expect(seed.endsWith('-bir-daha-v2')).toBe(true);
  });

  it('istemci ve Supabase aynı günlük Ranked seedini üretir', () => {
    for (const iso of ['2026-01-01', '2026-07-17', '2027-12-31']) {
      expect(expectedDailySeed(iso)).toBe(getDailySeed(new Date(`${iso}T09:00:00Z`)));
    }
  });
});

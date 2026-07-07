import { describe, expect, it } from 'vitest';
import { getWeeklyModifier, WEEKLY_MODIFIERS } from '@/engine/weeklyModifier';
import { calculateRoundPoints } from '@/engine/scoring';
import type { MatchResult, PlayerCard } from '@/types';

function p(id: string, rating: number): PlayerCard {
  return {
    kind: 'player', id, name: id, rating, currentRating: rating,
    position: 'OS', rarity: 'normal', tags: [],
  };
}

function winMatch(overrides: Partial<MatchResult> = {}): MatchResult {
  return {
    outcome: 'win', goalsFor: 2, goalsAgainst: 0, cleanSheet: true,
    opponent: { name: 'Test FK', rating: 70, style: 'dengeli' },
    highlights: [], activeSynergies: [], newlyDiscoveredSynergies: [],
    roundPoints: 0, events: [],
    ...overrides,
  };
}

describe('getWeeklyModifier', () => {
  it('aynı hafta anahtarı her zaman aynı modifikatörü verir', () => {
    expect(getWeeklyModifier('2026-W28')).toBe(getWeeklyModifier('2026-W28'));
  });

  it('tanımlı modifikatörlerden birini döner', () => {
    for (const wk of ['2026-W1', '2026-W2', '2026-W3', '2026-W4', '2026-W5']) {
      expect(WEEKLY_MODIFIERS).toContain(getWeeklyModifier(wk));
    }
  });
});

describe('haftalık modifikatör skor etkisi', () => {
  const squad = [p('a', 70), p('b', 72), p('c', 68)];

  it('winScoreMultiplier galibiyet puanını artırır', () => {
    const mod = WEEKLY_MODIFIERS.find((m) => m.winScoreMultiplier)!;
    const base = calculateRoundPoints(winMatch(), squad, 60, 0, 5, 0);
    const boosted = calculateRoundPoints(winMatch(), squad, 60, 0, 5, 0, [], 0, true, {}, mod);
    expect(boosted).toBeGreaterThan(base);
    expect(boosted).toBe(Math.floor(base * mod.winScoreMultiplier!));
  });

  it('cleanSheetBonusMultiplier gol yememe bonusunu büyütür', () => {
    const mod = WEEKLY_MODIFIERS.find((m) => m.cleanSheetBonusMultiplier)!;
    const base = calculateRoundPoints(winMatch(), squad, 60, 0, 5, 0);
    const boosted = calculateRoundPoints(winMatch(), squad, 60, 0, 5, 0, [], 0, true, {}, mod);
    // clean sheet 100 → 200: fark tam +100
    expect(boosted - base).toBe(100);
  });

  it('modifikatör verilmezse skor değişmez (varsayılan davranış korunur)', () => {
    const a = calculateRoundPoints(winMatch(), squad, 60, 0, 5, 0);
    const b = calculateRoundPoints(winMatch(), squad, 60, 0, 5, 0, [], 0, true, {}, undefined);
    expect(a).toBe(b);
  });

  it('mağlubiyette modifikatör puan yaratmaz', () => {
    const mod = WEEKLY_MODIFIERS.find((m) => m.winScoreMultiplier)!;
    const loss = winMatch({ outcome: 'loss', goalsFor: 0, goalsAgainst: 2, cleanSheet: false });
    expect(calculateRoundPoints(loss, squad, 60, 0, 5, 1, [], 0, false, {}, mod)).toBe(0);
  });
});

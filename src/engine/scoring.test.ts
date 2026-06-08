import { describe, expect, it } from 'vitest';
import { calculateRoundPoints } from '@/engine/scoring';
import type { MatchResult } from '@/types';

function mockMatch(overrides: Partial<MatchResult> = {}): MatchResult {
  return {
    outcome: 'win',
    goalsFor: 2,
    goalsAgainst: 1,
    cleanSheet: false,
    opponent: { name: 'Test', rating: 75, style: 'dengeli' },
    highlights: [],
    activeSynergies: [],
    newlyDiscoveredSynergies: [],
    roundPoints: 0,
    events: [],
    ...overrides,
  };
}

describe('calculateRoundPoints', () => {
  const squad = [
    { kind: 'player' as const, id: '1', name: 'A', rating: 70, currentRating: 70, position: 'OS' as const, rarity: 'normal' as const, tags: [] },
  ];

  it('returns 0 on loss', () => {
    expect(calculateRoundPoints(mockMatch({ outcome: 'loss' }), squad, 50, 0, 2, 0)).toBe(0);
  });

  it('awards win points from goals and opponent', () => {
    const pts = calculateRoundPoints(mockMatch(), squad, 50, 0, 2, 0);
    expect(pts).toBeGreaterThan(100);
  });

  it('adds timer bonus when seconds remain', () => {
    const base = calculateRoundPoints(mockMatch(), squad, 50, 0, 2, 0, [], 0);
    const withTimer = calculateRoundPoints(mockMatch(), squad, 50, 0, 2, 0, [], 10);
    expect(withTimer - base).toBe(50);
  });

  it('applies streak multiplier on win', () => {
    const noStreak = calculateRoundPoints(mockMatch(), squad, 50, 0, 3, 0);
    const streak = calculateRoundPoints(mockMatch(), squad, 50, 3, 3, 0);
    expect(streak).toBeGreaterThan(noStreak);
  });
});

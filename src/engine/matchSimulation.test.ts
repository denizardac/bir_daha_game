import { describe, expect, it } from 'vitest';
import { rollGoals, simulateMatch } from '@/engine/matchSimulation';
import { getStartingSquad } from '@/data/players';

describe('rollGoals', () => {
  it('returns non-negative integers', () => {
    let rng = 0.5;
    const next = () => { rng = (rng * 1.7 + 0.13) % 1; return rng; };
    for (let i = 0; i < 20; i++) {
      const g = rollGoals(next, 1 + i * 0.1);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(6);
    }
  });
});

describe('simulateMatch', () => {
  it('is deterministic for same seed and round', () => {
    const squad = getStartingSquad();
    const a = simulateMatch('test-seed-qa', 3, squad, 55, 11, [], [], 0, 0, 0);
    const b = simulateMatch('test-seed-qa', 3, squad, 55, 11, [], [], 0, 0, 0);
    expect(a.goalsFor).toBe(b.goalsFor);
    expect(a.goalsAgainst).toBe(b.goalsAgainst);
    expect(a.outcome).toBe(b.outcome);
  });

  it('protects round 1 from loss when no prior losses', () => {
    const squad = getStartingSquad();
    const m = simulateMatch('any-seed', 1, squad, 50, 11, [], [], 0, 0, 0);
    expect(m.outcome).toBe('win');
  });
});

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

  it('aggressive opponents yield higher-scoring matches than defensive (subtle style effect)', () => {
    const squad = getStartingSquad();
    const buckets: Record<string, { goals: number; n: number }> = {
      saldırgan: { goals: 0, n: 0 },
      dengeli: { goals: 0, n: 0 },
      savunmacı: { goals: 0, n: 0 },
    };
    // Round 1 galibiyet koruması dışında kal (round 5-10), deterministik sabit seed'ler
    for (let i = 0; i < 400; i++) {
      const round = 5 + (i % 6);
      const m = simulateMatch(`style-test-${i}`, round, squad, 60, 11, [], [], 0, 0, 0);
      const b = buckets[m.opponent.style];
      if (b) { b.goals += m.goalsFor + m.goalsAgainst; b.n += 1; }
    }
    const avg = (s: string) => buckets[s]!.goals / Math.max(buckets[s]!.n, 1);
    // Saldırgan açık maç → savunmacıdan daha çok toplam gol; dengeli ~ortada
    expect(avg('saldırgan')).toBeGreaterThan(avg('savunmacı'));
  });
});

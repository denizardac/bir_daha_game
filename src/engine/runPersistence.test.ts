import { describe, expect, it } from 'vitest';
import { getStartingSquad } from '@/data/players';
import { isResumableRun, mergeRunSnapshot } from '@/engine/runPersistence';

describe('runPersistence', () => {
  it('merges partial updates without dropping ephemeral fields', () => {
    const prev = mergeRunSnapshot(null, {
      seed: 'abc',
      round: 3,
      phase: 'cardSelect',
      squad: getStartingSquad(),
      currentOffers: [{ id: 'offer-1' } as never],
      usedEventIds: ['evt_a'],
      pendingSelected: null,
      pendingOffersShown: [],
      trainingFlow: null,
      lastLossBrokenSynergies: [],
      pendingSynergyReveal: [],
      nextMatchRisk: 0,
      nextMatchBonus: 0,
    } as never);

    const next = mergeRunSnapshot(prev, {
      seed: 'abc',
      score: 420,
      morale: 55,
    });

    expect(next.round).toBe(3);
    expect(next.score).toBe(420);
    expect(next.usedEventIds).toEqual(['evt_a']);
    expect(next.currentOffers).toHaveLength(1);
  });

  it('detects resumable runs', () => {
    expect(isResumableRun({ seed: 'x', phase: 'cardSelect' })).toBe(true);
    expect(isResumableRun({ seed: 'x', phase: 'loss' })).toBe(true);
    expect(isResumableRun({ seed: 'x', phase: 'runEnd' })).toBe(false);
    expect(isResumableRun(null)).toBe(false);
  });
});

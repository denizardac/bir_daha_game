import { describe, expect, it } from 'vitest';
import { getStartingSquad } from '@/data/players';
import { isResumableRun, mergeRunSnapshot, repairRunSnapshot } from '@/engine/runPersistence';
import { migratePersistedRecord } from '@/utils/storage';

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

  it('repairs duplicate ids, invalid pins and colliding offers in an old run', () => {
    const base = getStartingSquad('repair-seed', false);
    const duplicate = { ...base[0]!, currentRating: base[0]!.currentRating + 4 };
    const repaired = repairRunSnapshot({
      seed: 'repair',
      round: 99,
      maxSquadSize: 11,
      phase: 'unknown',
      squad: [...base, duplicate],
      activeTactics: [],
      manualLineup: { 0: 'missing', 99: base[0]!.id },
      currentOffers: [base[0], base[0], { kind: 'skip', id: 'skip', name: 'Pas' }],
    });

    expect(repaired?.round).toBe(15);
    expect(repaired?.phase).toBe('cardSelect');
    expect(new Set(repaired?.squad?.map((player) => player.id)).size).toBe(repaired?.squad?.length);
    expect(repaired?.manualLineup).toEqual({});
    expect(repaired?.currentOffers?.map((card) => card.id)).toEqual(['skip']);
  });

  it('migrates unversioned persisted data to the current schema', () => {
    const migrated = migratePersistedRecord({ displayName: 'Eski', currentRun: null });
    expect(migrated.saveVersion).toBe(2);
    expect(migrated.lastPlayerName).toBe('Eski');
  });
});

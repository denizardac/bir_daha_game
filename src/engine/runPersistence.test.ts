import { describe, expect, it } from 'vitest';
import { getStartingSquad } from '@/data/players';
import { isResumableRun, mergeRunSnapshot, repairRunSnapshot } from '@/engine/runPersistence';
import { CURRENT_SAVE_VERSION, migratePersistedRecord } from '@/utils/storage';

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

  it('abandons a corrupt saved Run that no longer has a playable squad', () => {
    const repaired = repairRunSnapshot({
      seed: 'corrupt-run',
      phase: 'cardSelect',
      round: 'not-a-round',
      score: 'NaN',
      squad: 'not-a-squad',
      currentOffers: 'not-offers',
    });

    expect(repaired).toBeNull();
  });

  it('repairs invalid numeric Run fields without exposing NaN to the UI', () => {
    const repaired = repairRunSnapshot({
      seed: 'corrupt-numbers',
      phase: 'cardSelect',
      squad: getStartingSquad('corrupt-numbers', false),
      score: 'NaN',
      morale: Number.NaN,
      streak: -3,
    });

    expect(repaired).toMatchObject({ score: 0, morale: 50, streak: 0 });
  });

  it('migrates unversioned persisted data to the current schema', () => {
    const migrated = migratePersistedRecord({ displayName: 'Eski', currentRun: null });
    expect(migrated.saveVersion).toBe(CURRENT_SAVE_VERSION);
    expect(migrated.monthlyLegend).toBeNull();
    expect(migrated.lastPlayerName).toBe('Eski');
    expect(migrated.unlocks).toMatchObject({
      catalogVersion: 1,
      unlockedIds: [],
      stats: { bestScore: 0, maxMorale: 0 },
      pendingGuarantees: [],
      pendingNotificationIds: [],
    });
  });

  it('v2 kariyer skorunu unlock ilerlemesine taşır', () => {
    const migrated = migratePersistedRecord({ saveVersion: 2, allTimeBest: 12_500 });
    expect(migrated.unlocks).toMatchObject({ stats: { bestScore: 12_500 } });
  });

  it('daha önce toplanmış efsaneyi Serbest Mod için yeniden kilitlemez', () => {
    const migrated = migratePersistedRecord({
      saveVersion: 3,
      collectedLegends: ['Gökhan Sazdağı'],
      unlocks: { unlockedIds: [], stats: {} },
    });
    expect(migrated.unlocks).toMatchObject({ unlockedIds: ['score_5k_gokhan'] });
  });

  it('v4 taslak unlock idlerini yeni kataloğa taşır', () => {
    const migrated = migratePersistedRecord({
      saveVersion: 4,
      unlocks: {
        unlockedIds: ['score_15k_burak', 'score_25k_etebo'],
        stats: { maxFinalMorale: 100 },
      },
    });
    expect(migrated.unlocks).toMatchObject({ stats: { maxMorale: 100 } });
    expect((migrated.unlocks as { unlockedIds: string[] }).unlockedIds).toEqual(expect.arrayContaining([
      'score_25k_burak',
      'score_10k_etebo',
    ]));
  });
});

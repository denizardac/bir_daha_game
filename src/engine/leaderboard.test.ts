import { describe, expect, it } from 'vitest';
import { addScoreToLeaderboards, mergeBestLeaderboardEntries } from '@/engine/leaderboard';
import { addToHallOfFame, listSeasonMonths } from '@/engine/hallOfFame';
import type { HallOfFameEntry, LeaderboardEntry, PersistedData } from '@/types';
import { createInitialUnlockState } from '@/engine/unlocks';

function baseData(): PersistedData {
  return {
    saveVersion: 5,
    anonymousId: 'anon',
    lastPlayerName: '',
    currentRun: null,
    todayScore: 0,
    todaySeed: 'daily-seed',
    discoveredSynergies: [],
    synergyFirstDiscovery: {},
    allTimeBest: 0,
    isFirstRun: false,
    dailyLeaderboard: [],
    weeklyLeaderboard: [],
    allTimeLeaderboard: [],
    flawlessLeaderboard: [],
    dailyStreak: 0,
    lastPlayedDate: '',
    soundEnabled: true,
    musicEnabled: false,
    cardTimerEnabled: false,
    tutorialCompleted: true,
    totalRuns: 0,
    todayRuns: 0,
    todayRunsDate: '',
    seasonKey: '2026-06',
    hallOfFame: [],
    seasonArchive: {},
    seenEvents: [],
    collectedLegends: [],
    unlocks: createInitialUnlockState(),
  };
}

function entry(overrides: Partial<LeaderboardEntry> = {}): Omit<LeaderboardEntry, 'weekKey'> {
  return {
    id: 'player-1',
    seed: 'seed-1',
    displayName: 'Test',
    totalScore: 1000,
    roundsCompleted: 10,
    timestamp: 1,
    flawless: false,
    ...overrides,
  };
}

function hallEntry(overrides: Partial<HallOfFameEntry> = {}): Omit<HallOfFameEntry, 'monthKey'> {
  return {
    id: 'player-1',
    displayName: 'Test',
    totalScore: 1000,
    roundsCompleted: 10,
    timestamp: 1,
    flawless: false,
    ...overrides,
  };
}

describe('addScoreToLeaderboards', () => {
  it('does not let free mode update daily streak, today score, or daily leaderboard', () => {
    const next = addScoreToLeaderboards(baseData(), entry({ seed: 'free-seed', totalScore: 2500 }), false);

    expect(next.todayScore).toBe(0);
    expect(next.dailyStreak).toBe(0);
    expect(next.lastPlayedDate).toBe('');
    expect(next.dailyLeaderboard).toHaveLength(0);
    expect(next.weeklyLeaderboard).toHaveLength(1);
    expect(next.allTimeLeaderboard).toHaveLength(1);
    expect(next.allTimeBest).toBe(2500);
  });

  it('updates daily streak and today score only for daily scores', () => {
    const next = addScoreToLeaderboards(baseData(), entry({ seed: 'daily-seed', totalScore: 1800 }), true);

    expect(next.todayScore).toBe(1800);
    expect(next.dailyStreak).toBe(1);
    expect(next.lastPlayedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(next.dailyLeaderboard).toHaveLength(1);
  });

  it('preserves other daily seeds and week entries when upserting the current score', () => {
    const data = baseData();
    data.dailyLeaderboard = [
      { ...entry({ id: 'other-seed-player', seed: 'old-seed', totalScore: 900 }), weekKey: '2026-W1' },
    ];
    data.weeklyLeaderboard = [
      { ...entry({ id: 'old-week-player', seed: 'old-seed', totalScore: 700 }), weekKey: '2026-W1' },
    ];

    const next = addScoreToLeaderboards(data, entry({ seed: 'daily-seed', totalScore: 1800 }), true);

    expect(next.dailyLeaderboard.some((e) => e.seed === 'old-seed')).toBe(true);
    expect(next.dailyLeaderboard.some((e) => e.seed === 'daily-seed')).toBe(true);
    expect(next.weeklyLeaderboard.some((e) => e.weekKey === '2026-W1')).toBe(true);
  });

  it('merges local and remote lists by keeping each player best score', () => {
    const local = [
      { ...entry({ id: 'me', totalScore: 1500, timestamp: 1 }), weekKey: '2026-W1' },
    ];
    const remote = [
      { ...entry({ id: 'me', totalScore: 1200, timestamp: 2 }), weekKey: '2026-W1' },
      { ...entry({ id: 'other', totalScore: 2000, timestamp: 3 }), weekKey: '2026-W1' },
    ];

    const merged = mergeBestLeaderboardEntries(local, remote);

    expect(merged.map((e) => e.id)).toEqual(['other', 'me']);
    expect(merged.find((e) => e.id === 'me')?.totalScore).toBe(1500);
  });
});

describe('addToHallOfFame', () => {
  it('keeps a player monthly best instead of replacing it with a lower score', () => {
    const first = addToHallOfFame(baseData(), hallEntry({ totalScore: 3000, timestamp: 1 }));
    const next = addToHallOfFame(first, hallEntry({ totalScore: 1200, timestamp: 2 }));

    expect(next.hallOfFame).toHaveLength(1);
    expect(next.hallOfFame[0]?.totalScore).toBe(3000);
  });

  it('lists the real current season even when local season key is stale', () => {
    const data = baseData();
    data.seasonKey = '2026-06';

    expect(listSeasonMonths(data, '2026-07')).toEqual(['2026-07', '2026-06']);
  });
});

import { describe, expect, it } from 'vitest';
import { addScoreToLeaderboards } from '@/engine/leaderboard';
import type { LeaderboardEntry, PersistedData } from '@/types';

function baseData(): PersistedData {
  return {
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
});

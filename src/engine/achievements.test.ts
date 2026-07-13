import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  countUnlockedAchievements,
  getAchievementState,
  getNewlyUnlocked,
  TOTAL_EVENTS,
  TOTAL_LEGENDS,
} from '@/engine/achievements';
import { getPlayerSeasonTitles, getPrimarySeasonTitle } from '@/engine/seasonTitles';
import type { HallOfFameEntry, PersistedData } from '@/types';

function baseData(overrides: Partial<PersistedData> = {}): PersistedData {
  return {
    anonymousId: 'me', lastPlayerName: '', currentRun: null, todayScore: 0, todaySeed: 's',
    discoveredSynergies: [], synergyFirstDiscovery: {}, allTimeBest: 0, isFirstRun: false,
    dailyLeaderboard: [], weeklyLeaderboard: [], allTimeLeaderboard: [], flawlessLeaderboard: [],
    dailyStreak: 0, lastPlayedDate: '', soundEnabled: true, musicEnabled: false,
    cardTimerEnabled: false, tutorialCompleted: true, totalRuns: 0, todayRuns: 0, todayRunsDate: '',
    seasonKey: '2026-07', hallOfFame: [], seasonArchive: {}, seenEvents: [], collectedLegends: [],
    ...overrides,
    saveVersion: overrides.saveVersion ?? 2,
  };
}

describe('başarımlar', () => {
  it('boş kayıtta hiçbiri açık değil', () => {
    expect(countUnlockedAchievements(baseData()).unlocked).toBe(0);
  });

  it('ilerleme hedefte kırpılır ve yüzde hesaplanır', () => {
    const state = getAchievementState(baseData({ collectedLegends: ['A', 'B', 'C'] }));
    const tenLegends = state.find((s) => s.achievement.id === 'legend_ten')!;
    expect(tenLegends.current).toBe(3);
    expect(tenLegends.percent).toBe(30);
    expect(tenLegends.unlocked).toBe(false);

    const firstLegend = state.find((s) => s.achievement.id === 'legend_first')!;
    expect(firstLegend.unlocked).toBe(true);
    expect(firstLegend.current).toBe(1); // hedefte kırpıldı
  });

  it('hedefi aşan değer açık sayılır', () => {
    const state = getAchievementState(baseData({ allTimeBest: 30_000 }));
    expect(state.find((s) => s.achievement.id === 'score_25k')!.unlocked).toBe(true);
  });

  it('run sonrası yeni açılanları tespit eder', () => {
    const before = baseData({ collectedLegends: [] });
    const after = baseData({ collectedLegends: ['Efsane 1'] });
    const fresh = getNewlyUnlocked(before, after);
    expect(fresh.map((a) => a.id)).toContain('legend_first');
  });

  it('zaten açık olan başarım tekrar "yeni" sayılmaz', () => {
    const before = baseData({ collectedLegends: ['Efsane 1'] });
    const after = baseData({ collectedLegends: ['Efsane 1', 'Efsane 2'] });
    expect(getNewlyUnlocked(before, after).map((a) => a.id)).not.toContain('legend_first');
  });

  it('koleksiyon hedefleri gerçek içerik sayılarıyla hizalı', () => {
    expect(ACHIEVEMENTS.find((a) => a.id === 'legend_all')!.target).toBe(TOTAL_LEGENDS);
    expect(ACHIEVEMENTS.find((a) => a.id === 'event_all')!.target).toBe(TOTAL_EVENTS);
    expect(TOTAL_LEGENDS).toBeGreaterThan(0);
    expect(TOTAL_EVENTS).toBeGreaterThan(0);
  });

  it('başarım id\'leri benzersiz', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

function hofEntry(id: string, score: number, monthKey: string): HallOfFameEntry {
  return { id, displayName: id, totalScore: score, roundsCompleted: 15, flawless: false, timestamp: 1, monthKey };
}

describe('sezon unvanları', () => {
  const data = baseData({
    seasonKey: '2026-07',
    seasonArchive: {
      '2026-06': [hofEntry('me', 9000, '2026-06'), hofEntry('other', 8000, '2026-06')],
      '2026-05': [hofEntry('other', 9000, '2026-05'), hofEntry('me', 7000, '2026-05')],
    },
  });

  it('arşivlenmiş sezonlarda kürsü unvanı verir', () => {
    const titles = getPlayerSeasonTitles(data, 'me', '2026-07');
    expect(titles.map((t) => t.label)).toEqual([
      'Haziran 2026 Şampiyonu',
      'Mayıs 2026 İkincisi',
    ]);
  });

  it('en prestijli unvan öncelikli (şampiyonluk > ikincilik)', () => {
    expect(getPrimarySeasonTitle(data, 'me', '2026-07')!.placement).toBe(1);
  });

  it('aktif sezon kalıcı unvan vermez', () => {
    const active = baseData({
      seasonKey: '2026-07',
      seasonArchive: { '2026-07': [hofEntry('me', 9000, '2026-07')] },
    });
    expect(getPlayerSeasonTitles(active, 'me', '2026-07')).toEqual([]);
  });

  it('kürsü dışında kalan oyuncuya unvan yok', () => {
    const crowded = baseData({
      seasonArchive: {
        '2026-06': [
          hofEntry('a', 9000, '2026-06'), hofEntry('b', 8000, '2026-06'),
          hofEntry('c', 7000, '2026-06'), hofEntry('me', 6000, '2026-06'),
        ],
      },
    });
    expect(getPlayerSeasonTitles(crowded, 'me', '2026-07')).toEqual([]);
  });

  it('oyuncu id yoksa boş', () => {
    expect(getPlayerSeasonTitles(data, '', '2026-07')).toEqual([]);
  });
});

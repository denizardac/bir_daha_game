import type { PersistedData } from '@/types';
import { ensureLeaderboardPopulation } from '@/engine/leaderboard';
import { getSeasonKey } from '@/engine/hallOfFame';
import { getDailySeed } from '@/engine/seed';
import { getTodayKey } from '@/engine/leaderboard';

const STORAGE_KEY = 'bir-daha-save';

export function getAnonymousId(): string {
  const data = loadPersisted();
  if (data.anonymousId) return data.anonymousId;
  const id = crypto.randomUUID();
  savePartial({ anonymousId: id });
  return id;
}

export function loadPersisted(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const base = defaultPersisted();
    if (!raw) return ensureLeaderboardPopulation(base);
    const merged = { ...base, ...JSON.parse(raw) };
    if (!merged.lastPlayerName && merged.displayName) {
      merged.lastPlayerName = merged.displayName;
    }
    delete merged.displayName;
    const currentDailySeed = getDailySeed();
    if (!merged.todaySeed || merged.todaySeed !== currentDailySeed) {
      merged.todaySeed = currentDailySeed;
    }
    if (merged.lastPlayedDate && merged.lastPlayedDate !== getTodayKey()) {
      merged.todayScore = 0;
    }
    if (!merged.seasonKey) merged.seasonKey = getSeasonKey();
    if (!merged.hallOfFame) merged.hallOfFame = [];
    if (!merged.seasonArchive) merged.seasonArchive = {};
    if (merged.cardTimerEnabled === undefined) merged.cardTimerEnabled = false;
    if (merged.tutorialCompleted === undefined) merged.tutorialCompleted = false;
    return ensureLeaderboardPopulation(merged);
  } catch {
    return ensureLeaderboardPopulation(defaultPersisted());
  }
}

export function savePersisted(data: PersistedData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function savePartial(partial: Partial<PersistedData>) {
  savePersisted({ ...loadPersisted(), ...partial });
}

function defaultPersisted(): PersistedData {
  return {
    anonymousId: '',
    lastPlayerName: '',
    currentRun: null,
    todayScore: 0,
    todaySeed: getDailySeed(),
    discoveredSynergies: [],
    synergyFirstDiscovery: {},
    allTimeBest: 0,
    isFirstRun: true,
    dailyLeaderboard: [],
    weeklyLeaderboard: [],
    allTimeLeaderboard: [],
    flawlessLeaderboard: [],
    dailyStreak: 0,
    lastPlayedDate: '',
    soundEnabled: true,
    musicEnabled: false,
    cardTimerEnabled: false,
    tutorialCompleted: false,
    totalRuns: 0,
    seasonKey: getSeasonKey(),
    hallOfFame: [],
    seasonArchive: {},
  };
}

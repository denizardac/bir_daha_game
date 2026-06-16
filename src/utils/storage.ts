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

/** Bozuk/yanlış tipli alanları varsayılana çekerek alan-bazlı kısmi kurtarma yapar */
function sanitizePersisted(base: PersistedData, parsed: Record<string, unknown>): PersistedData {
  const merged = { ...base, ...parsed } as Record<string, unknown>;
  const arrayKeys: (keyof PersistedData)[] = [
    'discoveredSynergies', 'dailyLeaderboard', 'weeklyLeaderboard',
    'allTimeLeaderboard', 'flawlessLeaderboard', 'hallOfFame',
    'seenEvents', 'collectedLegends',
  ];
  for (const key of arrayKeys) {
    if (!Array.isArray(merged[key])) merged[key] = base[key];
  }
  const objectKeys: (keyof PersistedData)[] = ['synergyFirstDiscovery', 'seasonArchive'];
  for (const key of objectKeys) {
    const v = merged[key];
    if (typeof v !== 'object' || v === null || Array.isArray(v)) merged[key] = base[key];
  }
  const numberKeys: (keyof PersistedData)[] = ['todayScore', 'allTimeBest', 'dailyStreak', 'totalRuns'];
  for (const key of numberKeys) {
    if (typeof merged[key] !== 'number' || Number.isNaN(merged[key])) merged[key] = base[key];
  }
  return merged as unknown as PersistedData;
}

export function loadPersisted(): PersistedData {
  const base = defaultPersisted();
  const raw = (() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  })();
  if (!raw) return ensureLeaderboardPopulation(base);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed !== 'object' || parsed === null) throw new Error('not an object');
  } catch {
    // Bozuk JSON: tamamen silme — yedekle ve varsayılana dön (manuel kurtarma şansı)
    try {
      localStorage.setItem(`${STORAGE_KEY}-corrupt-${Date.now()}`, raw);
    } catch {
      /* yedek yazılamadı, yine de devam */
    }
    console.warn('[storage] Bozuk kayıt yedeklendi, varsayılanlara dönüldü.');
    return ensureLeaderboardPopulation(base);
  }

  const merged = sanitizePersisted(base, parsed) as PersistedData & { displayName?: string };
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
  if (merged.tutorialCompleted === undefined) merged.tutorialCompleted = false;
  return ensureLeaderboardPopulation(merged);
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
    seenEvents: [],
    collectedLegends: [],
  };
}

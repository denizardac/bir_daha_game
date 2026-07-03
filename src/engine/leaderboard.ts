import { analyzeEgoReplay } from '@/engine/egoAnalysis';
import { getStartingSquad } from '@/data/players';
import type { LeaderboardEntry, PersistedData, PlayerCard, RoundResult } from '@/types';
import { getDailyDateKey, getDailySeed } from '@/engine/seed';

export function getWeekKey(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

export function getTodayKey(): string {
  return getDailyDateKey();
}

export function addScoreToLeaderboards(
  data: PersistedData,
  entry: Omit<LeaderboardEntry, 'weekKey'>,
  isDailyScore = true,
): PersistedData {
  const weekKey = getWeekKey();
  const fullEntry: LeaderboardEntry = { ...entry, weekKey };
  const today = getTodayKey();

  const upsertBest = (list: LeaderboardEntry[], e: LeaderboardEntry, filter?: (x: LeaderboardEntry) => boolean) => {
    const inScope = (x: LeaderboardEntry) => !filter || filter(x);
    const prev = list.find((x) => x.id === e.id && inScope(x));
    const rest = list.filter((x) => !(x.id === e.id && inScope(x)));
    if (prev && prev.totalScore >= e.totalScore) return list;
    return [...rest, e].sort((a, b) => b.totalScore - a.totalScore).slice(0, 100);
  };

  const seed = entry.seed;
  const dailyLeaderboard = isDailyScore
    ? upsertBest(data.dailyLeaderboard, fullEntry, (x) => x.seed === seed)
    : data.dailyLeaderboard;
  const weeklyLeaderboard = upsertBest(data.weeklyLeaderboard, fullEntry, (x) => x.weekKey === weekKey);
  const allTimeLeaderboard = upsertBest(data.allTimeLeaderboard, fullEntry);

  let flawlessLeaderboard = data.flawlessLeaderboard;
  if (entry.flawless) {
    flawlessLeaderboard = upsertBest(flawlessLeaderboard, fullEntry);
  }

  let dailyStreak = data.dailyStreak;
  let lastPlayedDate = data.lastPlayedDate;
  if (isDailyScore) {
    if (data.lastPlayedDate === today) {
      /* same day */
    } else if (isYesterday(data.lastPlayedDate, today)) {
      dailyStreak += 1;
    } else {
      dailyStreak = 1;
    }
    lastPlayedDate = today;
  }

  return {
    ...data,
    dailyLeaderboard,
    weeklyLeaderboard,
    allTimeLeaderboard,
    flawlessLeaderboard,
    todayScore: isDailyScore ? Math.max(data.todayScore, entry.totalScore) : data.todayScore,
    allTimeBest: Math.max(data.allTimeBest, entry.totalScore),
    dailyStreak,
    lastPlayedDate,
    totalRuns: data.totalRuns + 1,
  };
}

function isYesterday(last: string, today: string): boolean {
  // today/last zaten İstanbul takvim günü (YYYY-MM-DD); UTC midnight üzerinden
  // hesapla ki çalışma ortamının yerel saat dilimi off-by-one yaratmasın.
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return last === d.toISOString().slice(0, 10);
}

export function getRankPercent(score: number, list: LeaderboardEntry[]): number {
  if (list.length === 0) return 50;
  const better = list.filter((e) => e.totalScore > score).length;
  return Math.max(1, Math.round(((list.length - better) / list.length) * 100));
}

export function getRank(score: number, list: LeaderboardEntry[]): number {
  const sorted = [...list].sort((a, b) => b.totalScore - a.totalScore);
  const idx = sorted.findIndex((e) => e.totalScore <= score);
  return idx === -1 ? sorted.length + 1 : idx + 1;
}

export function getNearRivals(score: number, list: LeaderboardEntry[], displayName: string) {
  const sorted = [...list].sort((a, b) => b.totalScore - a.totalScore);
  const idx = sorted.findIndex((e) => e.totalScore <= score);
  const pos = idx === -1 ? sorted.length : idx;
  const before = sorted[pos - 1];
  const after = sorted[pos + 1] ?? sorted[pos];
  return {
    before: before
      ? { name: before.displayName, score: before.totalScore, gap: before.totalScore - score }
      : undefined,
    after: after && after.totalScore < score
      ? { name: after.displayName, score: after.totalScore, gap: score - after.totalScore }
      : undefined,
    selfName: displayName,
  };
}

export function getDailyList(data: PersistedData): LeaderboardEntry[] {
  const seed = getDailySeed();
  return data.dailyLeaderboard.filter((e) => e.seed === seed);
}

type ScoreRankEntry = {
  id: string;
  totalScore: number;
  timestamp: number;
};

export function mergeBestScoreEntries<T extends ScoreRankEntry>(...lists: Array<readonly T[]>): T[] {
  const bestByPlayer = new Map<string, T>();
  for (const entry of lists.flat()) {
    const prev = bestByPlayer.get(entry.id);
    if (
      !prev ||
      entry.totalScore > prev.totalScore ||
      (entry.totalScore === prev.totalScore && entry.timestamp > prev.timestamp)
    ) {
      bestByPlayer.set(entry.id, entry);
    }
  }
  return [...bestByPlayer.values()].sort((a, b) => b.totalScore - a.totalScore);
}

export function mergeBestLeaderboardEntries(...lists: LeaderboardEntry[][]): LeaderboardEntry[] {
  return mergeBestScoreEntries<LeaderboardEntry>(...lists);
}

export function generateFakeRivals(seed: string, count: number): LeaderboardEntry[] {
  const names = ['Murat B.', 'Zeynep A.', 'Can K.', 'Elif S.', 'Deniz T.', 'Ayşe M.', 'Burak Y.'];
  return Array.from({ length: count }, (_, i) => ({
    id: `bot_${i}`,
    seed,
    displayName: names[i % names.length]!,
    totalScore: 8000 + Math.floor((i + 1) * 420 + (seed.length * 17) % 500),
    roundsCompleted: 12 + (i % 4),
    timestamp: Date.now() - i * 3600000,
    flawless: i === 0,
  }));
}

export function ensureLeaderboardPopulation(data: PersistedData): PersistedData {
  if (import.meta.env?.VITE_SUPABASE_URL && import.meta.env?.VITE_SUPABASE_ANON_KEY) {
    return data;
  }
  const seed = getDailySeed();
  const daily = data.dailyLeaderboard.filter((e) => e.seed === seed);
  if (daily.length >= 8) return data;
  const bots = generateFakeRivals(seed, 12);
  return {
    ...data,
    dailyLeaderboard: [...data.dailyLeaderboard, ...bots.filter((b) => !daily.some((d) => d.id === b.id))],
  };
}

export function analyzeEgo(
  roundHistory: RoundResult[],
  seed: string,
  startingSquad?: PlayerCard[],
  isDailySeed = true,
) {
  const squad = startingSquad ?? getStartingSquad(seed, isDailySeed);
  return analyzeEgoReplay(roundHistory, seed, squad);
}

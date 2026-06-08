import { analyzeEgoReplay } from '@/engine/egoAnalysis';
import type { LeaderboardEntry, PersistedData, RoundResult } from '@/types';
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
): PersistedData {
  const weekKey = getWeekKey();
  const fullEntry: LeaderboardEntry = { ...entry, weekKey };
  const today = getTodayKey();

  const upsertBest = (list: LeaderboardEntry[], e: LeaderboardEntry, filter?: (x: LeaderboardEntry) => boolean) => {
    const scope = filter ? list.filter(filter) : list;
    const prev = scope.find((x) => x.id === e.id);
    const rest = list.filter((x) => x.id !== e.id && (!filter || filter(x)));
    if (prev && prev.totalScore >= e.totalScore) return list;
    return [...rest, e].sort((a, b) => b.totalScore - a.totalScore).slice(0, 100);
  };

  const seed = entry.seed;
  const dailyLeaderboard = upsertBest(data.dailyLeaderboard, fullEntry, (x) => x.seed === seed);
  const weeklyLeaderboard = upsertBest(data.weeklyLeaderboard, fullEntry, (x) => x.weekKey === weekKey);
  const allTimeLeaderboard = upsertBest(data.allTimeLeaderboard, fullEntry);

  let flawlessLeaderboard = data.flawlessLeaderboard;
  if (entry.flawless) {
    flawlessLeaderboard = upsertBest(flawlessLeaderboard, fullEntry);
  }

  let dailyStreak = data.dailyStreak;
  if (data.lastPlayedDate === today) {
    /* same day */
  } else if (isYesterday(data.lastPlayedDate, today)) {
    dailyStreak += 1;
  } else {
    dailyStreak = 1;
  }

  return {
    ...data,
    dailyLeaderboard,
    weeklyLeaderboard,
    allTimeLeaderboard,
    flawlessLeaderboard,
    todayScore: Math.max(data.todayScore, entry.totalScore),
    allTimeBest: Math.max(data.allTimeBest, entry.totalScore),
    dailyStreak,
    lastPlayedDate: today,
    totalRuns: data.totalRuns + 1,
  };
}

function isYesterday(last: string, today: string): boolean {
  const d = new Date(today);
  d.setDate(d.getDate() - 1);
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
  if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
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

/** @deprecated estimateAltPoints — analyzeEgoReplay kullan */
export function analyzeEgoLegacy(roundHistory: RoundResult[], seed: string) {
  let best: { round: number; cardName: string; diff: number; synergy?: string } | null = null;
  let worst: { round: number; desc: string; diff: number } | null = null;

  for (const r of roundHistory) {
    if (r.isTacticBonus || !r.matchResult) continue;
    const alts = r.cardsShown.filter((c) => c.id !== r.cardSelected.id);
    for (const alt of alts) {
      const diff = r.pointsEarned - estimateAltPoints(r, alt);
      if (!best || diff > best.diff) {
        best = {
          round: r.round,
          cardName: r.cardSelected.kind === 'player' ? r.cardSelected.name : r.cardSelected.name,
          diff,
          synergy: r.matchResult.newlyDiscoveredSynergies[0],
        };
      }
      if (diff < 0 && (!worst || diff < worst.diff)) {
        worst = {
          round: r.round,
          desc: `${alt.kind === 'player' ? alt.name : alt.name} seçseydin daha iyi olabilirdi`,
          diff,
        };
      }
    }
    if (r.eventChoice && r.pointsEarned < 100) {
      worst = {
        round: r.round,
        desc: 'Olay kartı kararı sonraki roundları zorlaştırdı',
        diff: -150,
      };
    }
  }

  const rarePercent = best ? 5 + (seed.charCodeAt(0) % 12) : 50;

  return {
    bestDecision: best
      ? {
          round: best.round,
          cardName: best.cardName,
          rarePercent,
          pointsGained: Math.max(100, best.diff + 500),
          synergyActivated: best.synergy,
        }
      : null,
    worstMistake: worst
      ? { round: worst.round, description: worst.desc, pointsLost: Math.abs(worst.diff) + 200 }
      : null,
  };
}

function estimateAltPoints(r: RoundResult, alt: RoundResult['cardsShown'][0]): number {
  if (alt.kind === 'tactic') return r.pointsEarned * 0.85;
  if (alt.kind === 'player') return r.pointsEarned - (alt.rating - (r.cardSelected.kind === 'player' ? r.cardSelected.rating : 70)) * 8;
  return r.pointsEarned * 0.9;
}

export function analyzeEgo(roundHistory: RoundResult[], seed: string) {
  if (roundHistory.some((r) => r.matchResult)) {
    return analyzeEgoReplay(roundHistory, seed);
  }
  return analyzeEgoLegacy(roundHistory, seed);
}

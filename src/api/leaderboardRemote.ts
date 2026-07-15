import type { SignedRunPayload } from '@/engine/runIntegrity';
import { getTodayKey, getWeekKey, mergeBestLeaderboardEntries } from '@/engine/leaderboard';
import { isRankedSeason } from '@/engine/hallOfFame';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import type { LeaderboardEntry, RoundResult } from '@/types';

export type RemoteLeaderboardRow = {
  id: string;
  player_id: string;
  display_name: string;
  seed: string;
  total_score: number;
  rounds_completed: number;
  flawless: boolean;
  day_key: string;
  week_key: string;
  is_daily: boolean;
  integrity_digest: string;
  submitted_at: string;
};

export type LeaderboardPeriod = 'daily' | 'weekly' | 'allTime' | 'flawless';

type RankRpcResult = {
  rank: number;
  total: number;
  percent: number;
};

export type RunStartPayload = {
  playerId: string;
  displayName: string;
  seed: string;
  isDaily: boolean;
};

function rowToEntry(row: RemoteLeaderboardRow): LeaderboardEntry {
  return {
    id: row.player_id,
    seed: row.seed,
    displayName: row.display_name,
    totalScore: row.total_score,
    roundsCompleted: row.rounds_completed,
    timestamp: new Date(row.submitted_at).getTime(),
    flawless: row.flawless,
    weekKey: row.week_key,
    integrityDigest: row.integrity_digest,
  };
}

export function isRemoteLeaderboardEnabled(): boolean {
  return isSupabaseConfigured;
}

export async function submitRunToLeaderboard(
  payload: SignedRunPayload,
  roundHistory: RoundResult[],
  isDaily: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getSupabaseClient();
  if (!supabase) return { ok: false, error: 'Supabase yapılandırılmamış' };

  const { data, error } = await supabase.functions.invoke('submit-score', {
    body: {
      entry: payload.entry,
      digest: payload.digest,
      clientVersion: payload.clientVersion,
      roundHistory,
      isDaily,
      dayKey: getTodayKey(),
      weekKey: getWeekKey(),
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const result = data as { ok?: boolean; error?: string };
  if (!result?.ok) {
    return { ok: false, error: result?.error ?? 'Gönderim reddedildi' };
  }

  return { ok: true };
}

export async function recordRunStart(payload: RunStartPayload): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getSupabaseClient();
  if (!supabase) return { ok: false, error: 'Supabase yapılandırılmamış' };

  const { data, error } = await supabase.functions.invoke('record-start', {
    body: {
      playerId: payload.playerId,
      displayName: payload.displayName,
      seed: payload.seed,
      isDaily: payload.isDaily,
      dayKey: getTodayKey(),
    },
  });

  if (error) return { ok: false, error: error.message };
  const result = data as { ok?: boolean; error?: string };
  if (!result?.ok) return { ok: false, error: result?.error ?? 'Başlangıç kaydedilemedi' };
  return { ok: true };
}

export async function fetchTodayRunStartCount(): Promise<number | null> {
  const supabase = await getSupabaseClient();
  if (!supabase) return null;

  const { count, error } = await supabase
    .from('run_starts')
    .select('id', { count: 'exact', head: true })
    .eq('day_key', getTodayKey())
    .eq('is_daily', true);

  if (error || count === null) return null;
  return count;
}

export async function fetchTotalRunStartCount(): Promise<number | null> {
  const supabase = await getSupabaseClient();
  if (!supabase) return null;

  const { count, error } = await supabase
    .from('run_starts')
    .select('id', { count: 'exact', head: true });

  if (error || count === null) return null;
  return count;
}

export async function fetchRemoteLeaderboard(
  period: LeaderboardPeriod,
  dailySeed?: string,
): Promise<LeaderboardEntry[]> {
  const supabase = await getSupabaseClient();
  if (!supabase) return [];

  const today = getTodayKey();
  const weekKey = getWeekKey();
  let query = supabase
    .from('leaderboard_scores')
    .select('*')
    .eq('is_daily', true)
    .order('total_score', { ascending: false })
    .limit(500);

  switch (period) {
    case 'daily':
      query = query.eq('day_key', today);
      if (dailySeed) query = query.eq('seed', dailySeed);
      break;
    case 'weekly':
      query = query.eq('week_key', weekKey);
      break;
    case 'flawless':
      query = query.eq('flawless', true);
      break;
    case 'allTime':
      break;
    default:
      break;
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const seen = new Set<string>();
  const entries: LeaderboardEntry[] = [];

  for (const row of data as RemoteLeaderboardRow[]) {
    const key = `${row.player_id}:${period}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push(rowToEntry(row));
  }

  return entries.slice(0, 100);
}

function nextMonthKey(monthKey: string): string {
  const [rawYear, rawMonth] = monthKey.split('-').map(Number);
  const year = rawYear ?? new Date().getFullYear();
  const month = rawMonth ?? 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
}

export async function fetchRemoteHallOfFame(monthKey: string): Promise<LeaderboardEntry[]> {
  const supabase = await getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('leaderboard_scores')
    .select('*')
    .gte('day_key', `${monthKey}-01`)
    .lt('day_key', `${nextMonthKey(monthKey)}-01`)
    .order('total_score', { ascending: false })
    .limit(500);

  if (isRankedSeason(monthKey)) query = query.eq('is_daily', true);

  const { data, error } = await query;

  if (error || !data) return [];
  return mergeBestLeaderboardEntries((data as RemoteLeaderboardRow[]).map(rowToEntry)).slice(0, 50);
}

export async function fetchRemoteRank(
  period: LeaderboardPeriod,
  score: number,
  dailySeed?: string,
): Promise<{ rank: number; total: number; percent: number } | null> {
  const supabase = await getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_leaderboard_rank', {
    p_period: period,
    p_score: score,
    p_day_key: getTodayKey(),
    p_week_key: getWeekKey(),
    p_seed: dailySeed ?? null,
  });
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  const rank = Number((row as RankRpcResult).rank);
  const total = Number((row as RankRpcResult).total);
  const percent = Number((row as RankRpcResult).percent);
  if (!Number.isFinite(rank) || !Number.isFinite(total) || !Number.isFinite(percent)) return null;
  return { rank, total, percent };
}

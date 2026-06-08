import type { SignedRunPayload } from '@/engine/runIntegrity';
import { getTodayKey, getWeekKey } from '@/engine/leaderboard';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
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

export async function fetchRemoteLeaderboard(
  period: LeaderboardPeriod,
  dailySeed?: string,
): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];

  let query = supabase
    .from('leaderboard_scores')
    .select('*')
    .order('total_score', { ascending: false })
    .limit(100);

  const today = getTodayKey();
  const weekKey = getWeekKey();

  switch (period) {
    case 'daily':
      query = query.eq('day_key', today).eq('is_daily', true);
      if (dailySeed) query = query.eq('seed', dailySeed);
      break;
    case 'weekly':
      query = query.eq('week_key', weekKey).eq('is_daily', true);
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

  return entries;
}

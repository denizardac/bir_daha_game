import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const SCORE_TOLERANCE = 30;
const MAX_SCORE = 500_000;

type RoundPick = {
  round: number;
  cardId: string;
  cardKind: string;
  points: number;
  outcome: string | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  isTacticBonus: boolean;
  eventChoice: string | null;
};

type SubmitBody = {
  entry: {
    id: string;
    seed: string;
    displayName: string;
    totalScore: number;
    roundsCompleted: number;
    timestamp: number;
    flawless?: boolean;
    integrityDigest?: string;
  };
  digest: string;
  clientVersion?: string;
  roundHistory: Array<{
    round: number;
    pointsEarned: number;
    cardSelected: { id: string; kind?: string };
    matchResult?: { roundPoints: number; outcome: string; goalsFor?: number; goalsAgainst?: number } | null;
    isTacticBonus?: boolean;
    eventChoice?: 'A' | 'B';
  }>;
  isDaily: boolean;
  dayKey: string;
  weekKey: string;
};

async function computeDigest(
  seed: string,
  roundHistory: SubmitBody['roundHistory'],
  totalScore: number,
  roundsCompleted: number,
): Promise<string> {
  const picks: RoundPick[] = roundHistory.map((r) => ({
    round: r.round,
    cardId: r.cardSelected?.id ?? '',
    cardKind: r.cardSelected?.kind ?? 'player',
    points: r.pointsEarned ?? 0,
    outcome: r.matchResult?.outcome ?? null,
    goalsFor: r.matchResult?.goalsFor ?? null,
    goalsAgainst: r.matchResult?.goalsAgainst ?? null,
    isTacticBonus: r.isTacticBonus ?? false,
    eventChoice: r.eventChoice ?? null,
  }));

  const payload = JSON.stringify({ seed, totalScore, roundsCompleted, picks });
  const data = new TextEncoder().encode(payload);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

function validate(body: SubmitBody): string | null {
  const { entry, digest, roundHistory } = body;

  if (!entry?.id || !entry.seed || !entry.displayName) return 'Eksik oyuncu bilgisi';
  if (entry.totalScore < 0 || entry.totalScore > MAX_SCORE) return 'Skor aralığı geçersiz';
  if (entry.roundsCompleted < 1 || entry.roundsCompleted > 15) return 'Round sayısı geçersiz';
  if (!Array.isArray(roundHistory) || roundHistory.length === 0) return 'Round geçmişi eksik';

  const summed = roundHistory.reduce((s, r) => s + (r.pointsEarned ?? 0), 0);
  if (Math.abs(summed - entry.totalScore) > SCORE_TOLERANCE) {
    return `Puan toplamı uyuşmuyor (${summed} vs ${entry.totalScore})`;
  }

  for (const r of roundHistory) {
    if (!r.cardSelected?.id) return 'Geçersiz kart seçimi';
    if (r.matchResult?.roundPoints && Math.abs(r.pointsEarned - r.matchResult.roundPoints) > 120) {
      return `Round ${r.round} puanı şüpheli`;
    }
  }

  if (!digest || digest.length < 8) return 'Digest eksik';

  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const body = (await req.json()) as SubmitBody;
    const err = validate(body);
    if (err) {
      return new Response(JSON.stringify({ ok: false, error: err }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const expectedDigest = await computeDigest(
      body.entry.seed,
      body.roundHistory,
      body.entry.totalScore,
      body.entry.roundsCompleted,
    );

    if (expectedDigest !== body.digest) {
      return new Response(JSON.stringify({ ok: false, error: 'Digest doğrulanamadı' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: existing } = await supabase
      .from('leaderboard_scores')
      .select('total_score')
      .eq('player_id', body.entry.id)
      .eq('seed', body.entry.seed)
      .eq('day_key', body.dayKey)
      .maybeSingle();

    if (existing && existing.total_score >= body.entry.totalScore) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'Mevcut skor daha yüksek' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const { error: upsertError } = await supabase.from('leaderboard_scores').upsert(
      {
        player_id: body.entry.id,
        display_name: body.entry.displayName.slice(0, 32),
        seed: body.entry.seed,
        total_score: body.entry.totalScore,
        rounds_completed: body.entry.roundsCompleted,
        flawless: Boolean(body.entry.flawless),
        is_daily: Boolean(body.isDaily),
        day_key: body.dayKey,
        week_key: body.weekKey,
        integrity_digest: body.digest,
        round_count: body.roundHistory.length,
        client_version: body.clientVersion ?? 'unknown',
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'player_id,seed,day_key' },
    );

    if (upsertError) {
      return new Response(JSON.stringify({ ok: false, error: upsertError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Bilinmeyen hata';
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});

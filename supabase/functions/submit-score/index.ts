import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { expectedDailySeed } from '../_shared/dailySeed.ts';

const SCORE_TOLERANCE = 30;
const MAX_SCORE = 500_000;
const MAX_HISTORY_ENTRIES = 32;
const MAX_MATCH_POINTS = 25_000;
const MAX_TACTIC_POINTS = 500;
const MAX_EVENT_ABS_POINTS = 1_000;
/** Oyuncu başına gün içinde en fazla kaç leaderboard satırı (free mode seed'leri benzersiz → flood koruması) */
const MAX_ROWS_PER_PLAYER_DAY = 30;
/** dayKey sunucu saatinden en fazla kaç gün sapabilir (saat dilimi + gün sınırı toleransı) */
const MAX_DAYKEY_SKEW_DAYS = 2;

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
    cardsShown?: Array<{ id: string; kind?: string }>;
    cardSelected: { id: string; kind?: string };
    matchResult?: { roundPoints: number; outcome: string; goalsFor?: number; goalsAgainst?: number } | null;
    isTacticBonus?: boolean;
    isEvent?: boolean;
    eventChoice?: 'A' | 'B';
  }>;
  isDaily: boolean;
  dayKey: string;
  weekKey: string;
};

function canonicalPayload(
  seed: string,
  roundHistory: SubmitBody['roundHistory'],
  totalScore: number,
  roundsCompleted: number,
): string {
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
  return JSON.stringify({ seed, totalScore, roundsCompleted, picks });
}

/** İstemciyle aynı algoritma — yalnızca taşıma bütünlüğü kontrolü (gizli anahtar yok) */
async function computeDigest(
  seed: string,
  roundHistory: SubmitBody['roundHistory'],
  totalScore: number,
  roundsCompleted: number,
): Promise<string> {
  const data = new TextEncoder().encode(canonicalPayload(seed, roundHistory, totalScore, roundsCompleted));
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

/**
 * Sunucuya özel gizli anahtarla HMAC-SHA256 imzası. Anahtar yalnızca sunucuda (env)
 * bulunduğu için istemci bu imzayı üretemez → depolanan kayıt sahteci tarafından
 * taklit edilemez ve sunucu kendi kayıtlarını sonradan doğrulayabilir.
 * Not: Tam hile koruması için sunucunun run'ı seed'den yeniden simüle etmesi gerekir (kapsam dışı).
 */
async function computeHmacSignature(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function validate(body: SubmitBody): string | null {
  const { entry, digest, roundHistory } = body;

  if (!entry?.id || !entry.seed || !entry.displayName) return 'Eksik oyuncu bilgisi';
  if (entry.id.length > 80 || entry.seed.length > 80) return 'Oyuncu veya seed cok uzun';
  const displayName = entry.displayName.trim();
  if (displayName.length < 1 || displayName.length > 32) return 'Isim uzunlugu gecersiz';
  if (typeof body.isDaily !== 'boolean') return 'Mod bilgisi gecersiz';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.dayKey)) return 'Gun anahtari gecersiz';
  if (!/^\d{4}-W\d{1,2}$/.test(body.weekKey)) return 'Hafta anahtari gecersiz';
  if (entry.totalScore < 0 || entry.totalScore > MAX_SCORE) return 'Skor aralığı geçersiz';
  if (entry.roundsCompleted < 1 || entry.roundsCompleted > 15) return 'Round sayısı geçersiz';
  if (!Array.isArray(roundHistory) || roundHistory.length === 0 || roundHistory.length > MAX_HISTORY_ENTRIES) {
    return 'Round geçmişi geçersiz';
  }

  const summed = roundHistory.reduce((s, r) => s + (r.pointsEarned ?? 0), 0);
  if (Math.abs(summed - entry.totalScore) > SCORE_TOLERANCE) {
    return `Puan toplamı uyuşmuyor (${summed} vs ${entry.totalScore})`;
  }

  const playedRoundNumbers = new Set<number>();
  for (const r of roundHistory) {
    if (!Number.isInteger(r.round) || r.round < 1 || r.round > 15) return 'Geçersiz round numarası';
    if (!r.cardSelected?.id) return 'Geçersiz kart seçimi';
    const selectedKind = r.cardSelected.kind ?? 'player';
    const offerRequired = !r.isEvent && !r.isTacticBonus && selectedKind !== 'event' && selectedKind !== 'training' && selectedKind !== 'skip';
    if (offerRequired) {
      const shown = Array.isArray(r.cardsShown) ? r.cardsShown : [];
      const selectedWasShown = shown.some((c) => c.id === r.cardSelected.id && (c.kind ?? 'player') === selectedKind);
      if (!selectedWasShown) return `Round ${r.round} seçimi tekliflerde yok`;
    }
    if (r.matchResult?.roundPoints && Math.abs(r.pointsEarned - r.matchResult.roundPoints) > 120) {
      return `Round ${r.round} puanı şüpheli`;
    }
    if (r.isEvent || selectedKind === 'event') {
      if (r.matchResult) return `Round ${r.round} olayında maç sonucu var`;
      if (Math.abs(r.pointsEarned ?? 0) > MAX_EVENT_ABS_POINTS) return `Round ${r.round} olay puanı şüpheli`;
      continue;
    }
    if (r.isTacticBonus) {
      if (r.matchResult) return `Round ${r.round} taktik turunda maç sonucu var`;
      if ((r.pointsEarned ?? 0) < 0 || (r.pointsEarned ?? 0) > MAX_TACTIC_POINTS) return `Round ${r.round} taktik puanı şüpheli`;
      continue;
    }
    if (playedRoundNumbers.has(r.round)) return `Round ${r.round} tekrar edilmiş`;
    playedRoundNumbers.add(r.round);
    if (!r.matchResult) return `Round ${r.round} maç sonucu eksik`;
    if ((r.pointsEarned ?? 0) < 0 || (r.pointsEarned ?? 0) > MAX_MATCH_POINTS) return `Round ${r.round} maç puanı şüpheli`;
  }

  if (!digest || digest.length < 8) return 'Digest eksik';

  // Günlük leaderboard yalnız o günün tam v2 seed'ini kabul eder. Böylece eski
  // istemci veya tarih önekli uydurma seed, farklı RNG ile aynı tabloya giremez.
  if (body.isDaily && entry.seed !== expectedDailySeed(body.dayKey)) {
    return 'Seed günün güncel Ranked seed’iyle uyuşmuyor';
  }

  // dayKey sunucu saatine makul yakın olmalı (geçmiş güne skor basılamaz)
  const dayMs = Date.parse(`${body.dayKey}T00:00:00Z`);
  if (Number.isNaN(dayMs)) return 'Gun anahtari cozulemedi';
  const skewDays = Math.abs(Date.now() - dayMs) / 86_400_000;
  if (skewDays > MAX_DAYKEY_SKEW_DAYS) return 'Gun anahtari guncel degil';

  return null;
}

const DEFAULT_ALLOWED_ORIGINS = [
  'https://birdaha.tech',
  'https://www.birdaha.tech',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

function allowedOrigins(): string[] {
  const raw = Deno.env.get('ALLOWED_ORIGIN') ?? Deno.env.get('ALLOWED_ORIGINS');
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;
  return raw.split(',').map((x) => x.trim()).filter(Boolean);
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = allowedOrigins();
  const allowOrigin = allowed.includes('*')
    ? '*'
    : allowed.includes(origin)
      ? origin
      : allowed[0]!;
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function isOriginAllowed(req: Request): boolean {
  const origin = req.headers.get('Origin');
  if (!origin) return true;
  const allowed = allowedOrigins();
  return allowed.includes('*') || allowed.includes(origin);
}

Deno.serve(async (req) => {
  const CORS_HEADERS = corsHeaders(req);
  const JSON_HEADERS = { 'Content-Type': 'application/json', ...CORS_HEADERS };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (!isOriginAllowed(req)) {
    return new Response(JSON.stringify({ ok: false, error: 'Origin reddedildi' }), {
      status: 403,
      headers: JSON_HEADERS,
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Yalnızca POST' }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  try {
    const body = (await req.json()) as SubmitBody;
    const err = validate(body);
    if (err) {
      return new Response(JSON.stringify({ ok: false, error: err }), {
        status: 400,
        headers: JSON_HEADERS,
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
        headers: JSON_HEADERS,
      });
    }

    // Sunucuya özel HMAC imzası — depolanan kaydı istemci taklit edemez.
    const hmacSecret = Deno.env.get('LEADERBOARD_HMAC_SECRET');
    const storedSignature = hmacSecret
      ? await computeHmacSignature(
          canonicalPayload(body.entry.seed, body.roundHistory, body.entry.totalScore, body.entry.roundsCompleted),
          hmacSecret,
        )
      : body.digest;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Skor, AYNI SEED için kayıtlı bir run başlangıcına bağlı olmalı (record-start) —
    // free mode seed'leri benzersiz olduğundan bu, skoru gerçek bir run'a bağlar.
    // Gece yarısı biten run'lar için gün değil seed eşleşmesi kullanılır.
    const { count: startCount, error: startErr } = await supabase
      .from('run_starts')
      .select('id', { count: 'exact', head: true })
      .eq('player_id', body.entry.id)
      .eq('seed', body.entry.seed);
    if (!startErr && (startCount ?? 0) === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'Run başlangıcı kayıtlı değil' }), {
        status: 403,
        headers: JSON_HEADERS,
      });
    }

    // Flood koruması: free mode her run'da yeni seed üretir → oyuncu başına günlük satır limiti
    const { count: rowCount, error: rowErr } = await supabase
      .from('leaderboard_scores')
      .select('id', { count: 'exact', head: true })
      .eq('player_id', body.entry.id)
      .eq('day_key', body.dayKey);
    if (!rowErr && (rowCount ?? 0) >= MAX_ROWS_PER_PLAYER_DAY) {
      return new Response(JSON.stringify({ ok: false, error: 'Günlük skor gönderim limiti aşıldı' }), {
        status: 429,
        headers: JSON_HEADERS,
      });
    }

    const { data: existing } = await supabase
      .from('leaderboard_scores')
      .select('total_score')
      .eq('player_id', body.entry.id)
      .eq('seed', body.entry.seed)
      .eq('day_key', body.dayKey)
      .maybeSingle();

    if (existing && existing.total_score >= body.entry.totalScore) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'Mevcut skor daha yüksek' }), {
        headers: JSON_HEADERS,
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
        integrity_digest: storedSignature,
        round_count: body.roundHistory.length,
        client_version: body.clientVersion ?? 'unknown',
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'player_id,seed,day_key' },
    );

    if (upsertError) {
      return new Response(JSON.stringify({ ok: false, error: upsertError.message }), {
        status: 500,
        headers: JSON_HEADERS,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: JSON_HEADERS,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Bilinmeyen hata';
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
});

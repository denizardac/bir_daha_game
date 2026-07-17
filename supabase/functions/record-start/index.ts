import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { expectedDailySeed } from '../_shared/dailySeed.ts';

type Body = {
  playerId: string;
  displayName: string;
  seed: string;
  isDaily: boolean;
  dayKey: string;
};

const MAX_STARTS_PER_PLAYER_DAY = 200;

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

function validate(body: Body): string | null {
  if (!body.playerId || body.playerId.length > 80) return 'Geçersiz oyuncu';
  const name = body.displayName?.trim() ?? '';
  if (name.length < 1 || name.length > 32) return 'Geçersiz isim';
  if (!body.seed || body.seed.length > 80) return 'Geçersiz seed';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.dayKey)) return 'Geçersiz gün';
  if (typeof body.isDaily !== 'boolean') return 'Geçersiz mod';
  if (body.isDaily && body.seed !== expectedDailySeed(body.dayKey)) return 'Geçersiz Günlük Ranked seed';
  return null;
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  const jsonHeaders = { 'Content-Type': 'application/json', ...cors };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }
  if (!isOriginAllowed(req)) {
    return new Response(JSON.stringify({ ok: false, error: 'Origin reddedildi' }), {
      status: 403,
      headers: jsonHeaders,
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Yalnızca POST' }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    const body = (await req.json()) as Body;
    const err = validate(body);
    if (err) {
      return new Response(JSON.stringify({ ok: false, error: err }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { count, error: countError } = await supabase
      .from('run_starts')
      .select('id', { count: 'exact', head: true })
      .eq('player_id', body.playerId)
      .eq('day_key', body.dayKey);

    if (countError) {
      return new Response(JSON.stringify({ ok: false, error: countError.message }), {
        status: 500,
        headers: jsonHeaders,
      });
    }
    if ((count ?? 0) >= MAX_STARTS_PER_PLAYER_DAY) {
      return new Response(JSON.stringify({ ok: false, error: 'Gunluk baslangic limiti asildi' }), {
        status: 429,
        headers: jsonHeaders,
      });
    }

    const { error } = await supabase.from('run_starts').insert({
      player_id: body.playerId,
      display_name: body.displayName.trim().slice(0, 32),
      seed: body.seed,
      is_daily: body.isDaily,
      day_key: body.dayKey,
    });

    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: jsonHeaders });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Bilinmeyen hata';
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});

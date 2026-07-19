import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type FeedbackCategory = 'bug' | 'balance' | 'suggestion' | 'other';

type Body = {
  playerId: string;
  category: FeedbackCategory;
  message: string;
  contact?: string;
  screen: string;
  phase?: string;
  round?: number;
  seed?: string;
  clientVersion?: string;
  platform?: string;
  website?: string;
};

const CATEGORIES = new Set<FeedbackCategory>(['bug', 'balance', 'suggestion', 'other']);
const MAX_SUBMISSIONS_PER_HOUR = 5;
const MAX_BODY_BYTES = 8_000;

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
  return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = allowedOrigins();
  const allowOrigin = allowed.includes('*') ? '*' : allowed.includes(origin) ? origin : allowed[0]!;
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

const INVALID_TEXT = Symbol('invalid-text');

function optionalText(value: unknown, max: number): string | null | typeof INVALID_TEXT {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return INVALID_TEXT;
  const normalized = value.trim();
  if (!normalized || normalized.length > max) return normalized ? INVALID_TEXT : null;
  return normalized;
}

function validate(body: Body): string | null {
  if (body.website) return 'spam';
  if (typeof body.playerId !== 'string' || body.playerId.length < 1 || body.playerId.length > 80) return 'invalid_player';
  if (!CATEGORIES.has(body.category)) return 'invalid_category';
  if (typeof body.message !== 'string' || body.message.trim().length < 10 || body.message.trim().length > 2_000) return 'invalid_message';
  if (optionalText(body.contact, 160) === INVALID_TEXT) return 'invalid_contact';
  if (typeof body.screen !== 'string' || body.screen.length < 1 || body.screen.length > 40) return 'invalid_screen';
  if (optionalText(body.phase, 40) === INVALID_TEXT) return 'invalid_phase';
  if (body.round !== undefined && (!Number.isInteger(body.round) || body.round < 1 || body.round > 15)) return 'invalid_round';
  if (optionalText(body.seed, 80) === INVALID_TEXT) return 'invalid_seed';
  if (optionalText(body.clientVersion, 40) === INVALID_TEXT) return 'invalid_version';
  if (optionalText(body.platform, 200) === INVALID_TEXT) return 'invalid_platform';
  return null;
}

function json(req: Request, body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req) },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(req) });
  if (!isOriginAllowed(req)) return json(req, { ok: false, error: 'origin_denied' }, 403);
  if (req.method !== 'POST') return json(req, { ok: false, error: 'method_not_allowed' }, 405);

  try {
    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return json(req, { ok: false, error: 'payload_too_large' }, 413);
    }

    const body = JSON.parse(rawBody) as Body;
    const validationError = validate(body);
    if (validationError === 'spam') return json(req, { ok: true });
    if (validationError) return json(req, { ok: false, error: validationError }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1_000).toISOString();
    const { count, error: countError } = await supabase
      .from('feedback_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('player_id', body.playerId)
      .gte('created_at', oneHourAgo);

    if (countError) {
      console.error('feedback rate-limit query failed', countError);
      return json(req, { ok: false, error: 'server_error' }, 500);
    }
    if ((count ?? 0) >= MAX_SUBMISSIONS_PER_HOUR) {
      return json(req, { ok: false, error: 'rate_limited' }, 429);
    }

    const contact = optionalText(body.contact, 160);
    const phase = optionalText(body.phase, 40);
    const seed = optionalText(body.seed, 80);
    const clientVersion = optionalText(body.clientVersion, 40);
    const platform = optionalText(body.platform, 200);
    const { error } = await supabase.from('feedback_submissions').insert({
      player_id: body.playerId,
      category: body.category,
      message: body.message.trim(),
      contact,
      screen: body.screen.trim(),
      phase,
      round: body.round ?? null,
      seed,
      client_version: clientVersion,
      platform,
    });

    if (error) {
      console.error('feedback insert failed', error);
      return json(req, { ok: false, error: 'server_error' }, 500);
    }

    return json(req, { ok: true });
  } catch (error) {
    console.error('feedback request failed', error);
    return json(req, { ok: false, error: 'invalid_request' }, 400);
  }
});

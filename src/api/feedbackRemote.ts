import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export const FEEDBACK_CATEGORIES = ['bug', 'balance', 'suggestion', 'other'] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export type FeedbackPayload = {
  category: FeedbackCategory;
  message: string;
  contact?: string;
  playerId: string;
  screen: string;
  phase?: string;
  round?: number;
  seed?: string;
  clientVersion?: string;
  platform?: string;
  website?: string;
};

export type FeedbackResult = { ok: true } | { ok: false; error: string };

export function validateFeedback(payload: Pick<FeedbackPayload, 'category' | 'message' | 'contact'>): string | null {
  if (!FEEDBACK_CATEGORIES.includes(payload.category)) return 'Bir sorun tipi seç.';

  const message = payload.message.trim();
  if (message.length < 10) return 'Biraz daha ayrıntı ekle (en az 10 karakter).';
  if (message.length > 2_000) return 'Mesaj 2.000 karakterden kısa olmalı.';
  if ((payload.contact?.trim().length ?? 0) > 160) return 'İletişim bilgisi 160 karakterden kısa olmalı.';
  return null;
}

export async function submitFeedback(payload: FeedbackPayload): Promise<FeedbackResult> {
  const validationError = validateFeedback(payload);
  if (validationError) return { ok: false, error: validationError };
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Geri bildirim hattı şu an bağlı değil. Daha sonra yeniden dene.' };
  }

  const supabase = await getSupabaseClient();
  if (!supabase) return { ok: false, error: 'Bağlantı kurulamadı. İnternetini kontrol edip yeniden dene.' };

  const { data, error } = await supabase.functions.invoke('submit-feedback', {
    body: {
      ...payload,
      message: payload.message.trim(),
      contact: payload.contact?.trim() || undefined,
    },
  });

  if (error || !data?.ok) {
    const message = typeof data?.error === 'string' ? data.error : error?.message;
    return {
      ok: false,
      error: message === 'rate_limited'
        ? 'Kısa sürede çok fazla not gönderdin. Bir saat sonra yeniden deneyebilirsin.'
        : 'Not gönderilemedi. Bağlantını kontrol edip yeniden dene.',
    };
  }

  return { ok: true };
}

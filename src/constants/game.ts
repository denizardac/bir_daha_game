/** Tehlike modunda moral bu değerin altına düşmez */
export const DANGER_MORALE_FLOOR = 50;

/** Run başına kart teklifi yenileme hakkı */
export const REROLLS_PER_RUN = 3;

/** GDD §5: kart seçim süresi (saniye) */
export const CARD_TIMER_SECONDS = 20;

/** Kalan her saniye için bonus puan (scoring.ts ile uyumlu) */
export const CARD_TIMER_BONUS_PER_SECOND = 5;

/**
 * Kart zamanlayıcısı — GDD'de 20 sn var; varsayılan KAPALI (casual).
 * Ayarlar ekranından veya VITE_CARD_TIMER=true ile açılabilir.
 */
export const CARD_TIMER_DEFAULT_ENABLED =
  import.meta.env.VITE_CARD_TIMER === 'true';

/** Maç animasyonu hedef süre (~8–10 sn hissi) */
export const MATCH_ANIM_MS_PER_MINUTE = 58;
export const MATCH_ANIM_MIN_EVENT_GAP = 380;
export const MATCH_ANIM_MAX_SEGMENT_MS = 720;

/** Günlük giriş serisi ödülleri */
export const DAILY_STREAK_REWARDS = [
  { minDays: 3, extraRerolls: 1, startMoraleBonus: 2, label: '3 gün serisi: +1 yenileme hakkı, moral +2' },
  { minDays: 7, extraRerolls: 2, startMoraleBonus: 5, label: '7 gün serisi: +2 yenileme, moral +5' },
] as const;

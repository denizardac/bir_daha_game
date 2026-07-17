/** Tehlike modunda moral bu değerin altına düşmez */
export const DANGER_MORALE_FLOOR = 50;

/** Run başına kart teklifi yenileme hakkı */
export const REROLLS_PER_RUN = 3;

/** Maç animasyonu hedef süre (~8–10 sn hissi) */
export const MATCH_ANIM_MS_PER_MINUTE = 58;
export const MATCH_ANIM_MIN_EVENT_GAP = 380;
export const MATCH_ANIM_MAX_SEGMENT_MS = 720;

/** Günlük giriş serisi ödülleri */
export const DAILY_STREAK_REWARDS = [
  { minDays: 3, extraRerolls: 1, startMoraleBonus: 0, label: '3 gün serisi: +1 yenileme hakkı' },
  { minDays: 7, extraRerolls: 1, startMoraleBonus: 2, label: '7 gün serisi: +1 yenileme, moral +2' },
] as const;

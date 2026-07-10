import type { UiIconName } from '@/components/UiIcon';
import { getWeekKey } from '@/engine/leaderboard';

/**
 * Haftalık meydan okuma modifikatörü — hafta anahtarından (İstanbul takvimi)
 * deterministik seçilir; aynı hafta herkese aynı kural uygulanır. Günlük seed
 * adaletini bozmaz: kural haftanın tüm günlerinde ve tüm oyuncularda aynıdır.
 */
export type WeeklyModifier = {
  id: string;
  name: string;
  /** Emoji değil — ortak SVG ikon setinden ad */
  icon: UiIconName;
  description: string;
  /** Galibiyet round puanı çarpanı (scoring) */
  winScoreMultiplier?: number;
  /** Gol yememe (clean sheet) bonus çarpanı (scoring) */
  cleanSheetBonusMultiplier?: number;
  /** Run başı moral bonusu (initialRun) */
  startMoraleBonus?: number;
  /** Run başı ekstra yenileme hakkı (initialRun) */
  extraRerolls?: number;
};

export const WEEKLY_MODIFIERS: WeeklyModifier[] = [
  {
    id: 'mod_seri_haftasi',
    name: 'Seri Haftası',
    icon: 'flame',
    description: 'Bu hafta galibiyetler %10 daha çok puan verir.',
    winScoreMultiplier: 1.1,
  },
  {
    id: 'mod_kale_haftasi',
    name: 'Kale Haftası',
    icon: 'shield',
    description: 'Bu hafta gol yemeden biten maçların bonusu iki katı.',
    cleanSheetBonusMultiplier: 2,
  },
  {
    id: 'mod_moral_haftasi',
    name: 'Moral Haftası',
    icon: 'heart',
    description: 'Bu hafta her run +8 moralle başlar.',
    startMoraleBonus: 8,
  },
  {
    id: 'mod_transfer_haftasi',
    name: 'Transfer Haftası',
    icon: 'refresh',
    description: 'Bu hafta her run +1 yenileme hakkıyla başlar.',
    extraRerolls: 1,
  },
];

function hashWeekKey(weekKey: string): number {
  let h = 2166136261;
  for (let i = 0; i < weekKey.length; i++) {
    h ^= weekKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function getWeeklyModifier(weekKey = getWeekKey()): WeeklyModifier {
  return WEEKLY_MODIFIERS[hashWeekKey(weekKey) % WEEKLY_MODIFIERS.length]!;
}

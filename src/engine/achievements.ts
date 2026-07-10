import type { UiIconName } from '@/components/UiIcon';
import { EVENT_CARDS } from '@/data/events';
import { PLAYER_POOL } from '@/data/players';
import { TOTAL_SYNERGIES } from '@/data/synergies';
import type { PersistedData } from '@/types';

export type AchievementTier = 'bronz' | 'gümüş' | 'altın';

export type Achievement = {
  id: string;
  name: string;
  /** Emoji değil — ortak SVG ikon setinden ad */
  icon: UiIconName;
  description: string;
  tier: AchievementTier;
  target: number;
  /** Kalıcı veriden mevcut ilerleme */
  progress: (data: PersistedData) => number;
};

/** Koleksiyonda gösterilen benzersiz efsane kart sayısı (isim bazlı) */
export const TOTAL_LEGENDS = new Set(
  PLAYER_POOL.filter((p) => p.rarity === 'efsane').map((p) => p.name),
).size;

export const TOTAL_EVENTS = EVENT_CARDS.length;

const count = (list: unknown): number => (Array.isArray(list) ? list.length : 0);

export const ACHIEVEMENTS: Achievement[] = [
  // Efsane kart koleksiyonu
  {
    id: 'legend_first', name: 'İlk Efsane', icon: 'trophy', tier: 'bronz',
    description: 'Kadrona ilk efsane kartı kat.',
    target: 1, progress: (d) => count(d.collectedLegends),
  },
  {
    id: 'legend_ten', name: 'Efsane Avcısı', icon: 'medal', tier: 'gümüş',
    description: '10 farklı efsane kart topla.',
    target: 10, progress: (d) => count(d.collectedLegends),
  },
  {
    id: 'legend_all', name: 'Panteon', icon: 'sparkles', tier: 'altın',
    description: 'Tüm efsane kartları koleksiyonuna ekle.',
    target: TOTAL_LEGENDS, progress: (d) => count(d.collectedLegends),
  },

  // Olay koleksiyonu
  {
    id: 'event_ten', name: 'Hikâye Avcısı', icon: 'book-open', tier: 'bronz',
    description: '10 farklı olay kartı gör.',
    target: 10, progress: (d) => count(d.seenEvents),
  },
  {
    id: 'event_half', name: 'Soyunma Odası Kurdu', icon: 'clipboard', tier: 'gümüş',
    description: `${Math.ceil(TOTAL_EVENTS / 2)} farklı olay kartı gör.`,
    target: Math.ceil(TOTAL_EVENTS / 2), progress: (d) => count(d.seenEvents),
  },
  {
    id: 'event_all', name: 'Her Şeyi Gördüm', icon: 'archive', tier: 'altın',
    description: 'Tüm olay kartlarını gör.',
    target: TOTAL_EVENTS, progress: (d) => count(d.seenEvents),
  },

  // Sinerji keşfi
  {
    id: 'synergy_ten', name: 'Kimyager', icon: 'zap', tier: 'bronz',
    description: '10 sinerji keşfet.',
    target: 10, progress: (d) => count(d.discoveredSynergies),
  },
  {
    id: 'synergy_all', name: 'Sinerji Ustası', icon: 'graduation-cap', tier: 'altın',
    description: 'Tüm sinerjileri keşfet.',
    target: TOTAL_SYNERGIES, progress: (d) => count(d.discoveredSynergies),
  },

  // Skor
  {
    id: 'score_5k', name: 'Formda', icon: 'chart', tier: 'bronz',
    description: 'Tek run\'da 5.000 puan yap.',
    target: 5000, progress: (d) => d.allTimeBest,
  },
  {
    id: 'score_15k', name: 'Elit Teknik Direktör', icon: 'medal', tier: 'gümüş',
    description: 'Tek run\'da 15.000 puan yap.',
    target: 15000, progress: (d) => d.allTimeBest,
  },
  {
    id: 'score_25k', name: 'Rekortmen', icon: 'trophy', tier: 'altın',
    description: 'Tek run\'da 25.000 puan yap.',
    target: 25000, progress: (d) => d.allTimeBest,
  },

  // Namağlup
  {
    id: 'flawless_one', name: 'Namağlup', icon: 'shield', tier: 'altın',
    description: 'Hiç oyuncu kaybetmeden bir run bitir.',
    target: 1, progress: (d) => count(d.flawlessLeaderboard),
  },

  // Seri / sadakat
  {
    id: 'streak_3', name: 'Alışkanlık', icon: 'flame', tier: 'bronz',
    description: '3 gün üst üste günlük seed oyna.',
    target: 3, progress: (d) => d.dailyStreak,
  },
  {
    id: 'streak_7', name: 'Sadık Taraftar', icon: 'flame', tier: 'gümüş',
    description: '7 gün üst üste günlük seed oyna.',
    target: 7, progress: (d) => d.dailyStreak,
  },
  {
    id: 'runs_25', name: 'Tecrübe', icon: 'calendar', tier: 'gümüş',
    description: '25 run tamamla.',
    target: 25, progress: (d) => d.totalRuns,
  },
];

export type AchievementState = {
  achievement: Achievement;
  current: number;
  unlocked: boolean;
  /** 0–100 */
  percent: number;
};

export function getAchievementState(data: PersistedData): AchievementState[] {
  return ACHIEVEMENTS.map((achievement) => {
    const raw = achievement.progress(data);
    const current = Math.max(0, Math.min(raw, achievement.target));
    return {
      achievement,
      current,
      unlocked: raw >= achievement.target,
      percent: achievement.target > 0 ? Math.round((current / achievement.target) * 100) : 0,
    };
  });
}

export function getUnlockedAchievementIds(data: PersistedData): string[] {
  return getAchievementState(data).filter((s) => s.unlocked).map((s) => s.achievement.id);
}

export function countUnlockedAchievements(data: PersistedData): { unlocked: number; total: number } {
  return {
    unlocked: getUnlockedAchievementIds(data).length,
    total: ACHIEVEMENTS.length,
  };
}

/** Run sonrası yeni açılan başarımlar (öncesi/sonrası kıyası) */
export function getNewlyUnlocked(before: PersistedData, after: PersistedData): Achievement[] {
  const beforeIds = new Set(getUnlockedAchievementIds(before));
  return getAchievementState(after)
    .filter((s) => s.unlocked && !beforeIds.has(s.achievement.id))
    .map((s) => s.achievement);
}

import { DAILY_STREAK_REWARDS } from '@/constants/game';

export type DailyStreakBonus = {
  extraRerolls: number;
  startMoraleBonus: number;
  label: string | null;
};

export function getDailyStreakBonus(streak: number): DailyStreakBonus {
  let bonus: DailyStreakBonus = { extraRerolls: 0, startMoraleBonus: 0, label: null };
  for (const tier of DAILY_STREAK_REWARDS) {
    if (streak >= tier.minDays) {
      bonus = {
        extraRerolls: tier.extraRerolls,
        startMoraleBonus: tier.startMoraleBonus,
        label: tier.label,
      };
    }
  }
  return bonus;
}

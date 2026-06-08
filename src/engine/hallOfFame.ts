import type { HallOfFameEntry, PersistedData } from '@/types';

export function getSeasonKey(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

export function getSeasonLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-');
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  return `${months[parseInt(m!, 10) - 1]} ${y}`;
}

export function addToHallOfFame(
  data: PersistedData,
  entry: Omit<HallOfFameEntry, 'monthKey'>,
): PersistedData {
  const monthKey = getSeasonKey();
  let hallOfFame = [...(data.hallOfFame ?? [])];
  let seasonArchive = { ...(data.seasonArchive ?? {}) };

  if (data.seasonKey && data.seasonKey !== monthKey) {
    seasonArchive[data.seasonKey] = hallOfFame;
    hallOfFame = [];
  }

  const full: HallOfFameEntry = { ...entry, monthKey };
  const without = hallOfFame.filter((e) => e.id !== full.id);
  hallOfFame = [...without, full]
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 50);

  return { ...data, seasonKey: monthKey, hallOfFame, seasonArchive };
}

export function getHallOfFameForMonth(data: PersistedData, monthKey: string): HallOfFameEntry[] {
  if (monthKey === data.seasonKey) return data.hallOfFame ?? [];
  return data.seasonArchive?.[monthKey] ?? [];
}

export function listSeasonMonths(data: PersistedData): string[] {
  const keys = new Set<string>([data.seasonKey || getSeasonKey(), ...Object.keys(data.seasonArchive ?? {})]);
  return [...keys].filter(Boolean).sort().reverse();
}

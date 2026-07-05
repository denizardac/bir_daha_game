import type { HallOfFameEntry, PersistedData } from '@/types';

const ISTANBUL_TZ = 'Europe/Istanbul';

/** Sezon anahtarı (YYYY-MM, İstanbul takvimi) — günlük seed ile aynı saat diliminde kalır */
export function getSeasonKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ISTANBUL_TZ,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  return `${y}-${m}`;
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
  const previous = hallOfFame.find((e) => e.id === full.id);
  if (
    previous &&
    (previous.totalScore > full.totalScore ||
      (previous.totalScore === full.totalScore && previous.timestamp >= full.timestamp))
  ) {
    return { ...data, seasonKey: monthKey, hallOfFame, seasonArchive };
  }
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

export function listSeasonMonths(data: PersistedData, currentKey = getSeasonKey()): string[] {
  const keys = new Set<string>([currentKey, data.seasonKey || currentKey, ...Object.keys(data.seasonArchive ?? {})]);
  return [...keys].filter(Boolean).sort().reverse();
}

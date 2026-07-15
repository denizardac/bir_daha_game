import type { UiIconName } from '@/components/UiIcon';
import { getSeasonKey, getSeasonLabel } from '@/engine/hallOfFame';
import { normalizeMonthlyLegendRecord } from '@/engine/monthlyLegend';
import type { HallOfFameEntry, MonthlyLegendRecord, PersistedData } from '@/types';

export type SeasonPlacement = 1 | 2 | 3;

export type SeasonTitle = {
  monthKey: string;
  /** "Temmuz 2026 Şampiyonu" */
  label: string;
  placement: SeasonPlacement;
  score: number;
  /** Emoji değil — ortak SVG ikon setinden ad */
  icon: UiIconName;
};

const PLACEMENT_META: Record<SeasonPlacement, { suffix: string; icon: UiIconName }> = {
  1: { suffix: 'Şampiyonu', icon: 'trophy' },
  2: { suffix: 'İkincisi', icon: 'medal' },
  3: { suffix: 'Üçüncüsü', icon: 'medal' },
};

/**
 * Yalnızca ARŞİVLENMİŞ (bitmiş) sezonlar kalıcı unvan verir — aktif sezon devam
 * ettiği için sıralaması henüz kesin değildir.
 */
export function getArchivedSeasonKeys(data: PersistedData, currentKey = getSeasonKey()): string[] {
  return Object.keys(data.seasonArchive ?? {})
    .filter((key) => key && key !== currentKey)
    .sort()
    .reverse();
}

export function getSeasonChampion(data: PersistedData, monthKey: string): HallOfFameEntry | null {
  const list = data.seasonArchive?.[monthKey];
  return list && list.length ? list[0]! : null;
}

/** Bir oyuncunun bitmiş sezonlardan kazandığı kalıcı unvanlar (en yeni önce) */
export function getPlayerSeasonTitles(
  data: PersistedData,
  playerId: string,
  currentKey = getSeasonKey(),
): SeasonTitle[] {
  if (!playerId) return [];
  const titles: SeasonTitle[] = [];

  for (const monthKey of getArchivedSeasonKeys(data, currentKey)) {
    const list = data.seasonArchive?.[monthKey] ?? [];
    const index = list.findIndex((e) => e.id === playerId);
    if (index < 0 || index > 2) continue;

    const placement = (index + 1) as SeasonPlacement;
    const meta = PLACEMENT_META[placement];
    titles.push({
      monthKey,
      placement,
      icon: meta.icon,
      score: list[index]!.totalScore,
      label: `${getSeasonLabel(monthKey)} ${meta.suffix}`,
    });
  }

  return titles;
}

/** Menü/run sonu için tek satırlık en prestijli unvan */
export function getPrimarySeasonTitle(
  data: PersistedData,
  playerId: string,
  currentKey = getSeasonKey(),
): SeasonTitle | null {
  const titles = getPlayerSeasonTitles(data, playerId, currentKey);
  if (!titles.length) return null;
  return [...titles].sort((a, b) => a.placement - b.placement || b.monthKey.localeCompare(a.monthKey))[0]!;
}

/** Yalnızca global olarak doğrulanmış, kapanmış sezon şampiyonuna unvan verir. */
export function getVerifiedChampionTitle(
  record: MonthlyLegendRecord | null,
  playerId: string,
  currentKey = getSeasonKey(),
): SeasonTitle | null {
  const verified = normalizeMonthlyLegendRecord(record);
  if (!verified || !playerId) return null;
  if (verified.awardMonthKey !== currentKey || verified.championId !== playerId) return null;
  return {
    monthKey: verified.sourceMonthKey,
    label: `${getSeasonLabel(verified.sourceMonthKey)} Şampiyonu`,
    placement: 1,
    score: verified.totalScore,
    icon: 'trophy',
  };
}

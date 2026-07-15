import { fetchRemoteHallOfFame, isRemoteLeaderboardEnabled } from '@/api/leaderboardRemote';
import { getSeasonKey } from '@/engine/hallOfFame';
import { isLeaderboardEntryPlausible } from '@/engine/runIntegrity';
import { createRng } from '@/engine/seed';
import type { LeaderboardEntry, MonthlyLegendRecord, PlayerCard, Position, Tag } from '@/types';

const FALLBACK_NAME = 'Ayın Şampiyonu';
const BANNED_NAME_PARTS = [
  'amk', 'aq', 'orospu', 'sik', 'yarrak', 'piç', 'pic', 'fuck', 'nigger', 'nazi',
];

const PROFILES: readonly { position: Position; tags: Tag[] }[] = [
  { position: 'KL', tags: ['DAYANIKLI', 'LİDER', 'SOĞUKKANLI'] },
  { position: 'STP', tags: ['GÜÇLÜ', 'LİDER', 'DAYANIKLI'] },
  { position: 'SLB', tags: ['HIZLI', 'DAYANIKLI', 'YERLİ'] },
  { position: 'SÖB', tags: ['HIZLI', 'ASİSTÇİ', 'DAYANIKLI'] },
  { position: 'DOS', tags: ['SAVAŞÇI', 'LİDER', 'SOĞUKKANLI'] },
  { position: 'OS', tags: ['TEKNİK', 'ASİSTÇİ', 'LİDER'] },
  { position: 'OOS', tags: ['TEKNİK', 'ASİSTÇİ', 'SERBEST VURUŞ'] },
  { position: 'SLK', tags: ['HIZLI', 'TEKNİK', 'FİNİŞÖR'] },
  { position: 'SÖK', tags: ['HIZLI', 'ASİSTÇİ', 'SOĞUKKANLI'] },
  { position: 'SF', tags: ['FİNİŞÖR', 'PENALTI', 'SOĞUKKANLI'] },
];

function previousMonthKey(monthKey: string): string {
  const [year = 1970, month = 1] = monthKey.split('-').map(Number);
  return month === 1
    ? `${year - 1}-12`
    : `${year}-${String(month - 1).padStart(2, '0')}`;
}

export function sanitizeChampionName(input: string): string {
  const cleaned = input
    .normalize('NFKC')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>\u0000-\u001f\u007f]/g, '')
    .replace(/[^\p{L}\p{N} ._'’\-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  const shortened = [...cleaned].slice(0, 18).join('').trim();
  const comparison = shortened.toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N}]/gu, '');
  if (shortened.length < 2 || BANNED_NAME_PARTS.some((part) => comparison.includes(part))) return FALLBACK_NAME;
  return shortened;
}

function isVerifiedCandidate(entry: LeaderboardEntry): boolean {
  return isLeaderboardEntryPlausible(entry)
    && typeof entry.integrityDigest === 'string'
    && /^[a-f0-9]{16,64}$/i.test(entry.integrityDigest);
}

export function selectMonthlyChampion(entries: readonly LeaderboardEntry[]): LeaderboardEntry | null {
  return [...entries]
    .filter(isVerifiedCandidate)
    .sort((a, b) =>
      b.totalScore - a.totalScore
      || b.roundsCompleted - a.roundsCompleted
      || Number(Boolean(b.flawless)) - Number(Boolean(a.flawless))
      || a.timestamp - b.timestamp
      || a.id.localeCompare(b.id),
    )[0] ?? null;
}

export function createMonthlyLegendRecord(
  champion: LeaderboardEntry,
  awardMonthKey: string,
  verifiedAt = Date.now(),
): MonthlyLegendRecord {
  return {
    awardMonthKey,
    sourceMonthKey: previousMonthKey(awardMonthKey),
    championId: champion.id,
    displayName: sanitizeChampionName(champion.displayName),
    totalScore: Math.max(0, Math.round(champion.totalScore)),
    verifiedAt,
  };
}

export function normalizeMonthlyLegendRecord(value: unknown): MonthlyLegendRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.awardMonthKey !== 'string'
    || !/^\d{4}-\d{2}$/.test(record.awardMonthKey)
    || typeof record.sourceMonthKey !== 'string'
    || !/^\d{4}-\d{2}$/.test(record.sourceMonthKey)
    || previousMonthKey(record.awardMonthKey) !== record.sourceMonthKey
    || typeof record.championId !== 'string'
    || record.championId.length === 0
    || typeof record.displayName !== 'string'
    || typeof record.totalScore !== 'number'
    || !Number.isFinite(record.totalScore)
  ) return null;
  return {
    awardMonthKey: record.awardMonthKey,
    sourceMonthKey: record.sourceMonthKey,
    championId: record.championId.slice(0, 120),
    displayName: sanitizeChampionName(record.displayName),
    totalScore: Math.max(0, Math.round(record.totalScore)),
    verifiedAt: typeof record.verifiedAt === 'number' && Number.isFinite(record.verifiedAt)
      ? Math.max(0, Math.round(record.verifiedAt))
      : 0,
  };
}

export function buildMonthlyLegendCard(record: MonthlyLegendRecord | null, currentMonthKey = getSeasonKey()): PlayerCard | null {
  const normalized = normalizeMonthlyLegendRecord(record);
  if (!normalized || normalized.awardMonthKey !== currentMonthKey) return null;
  const rng = createRng(
    `monthly-legend-${normalized.awardMonthKey}-${normalized.championId}-${normalized.totalScore}`,
    'profile',
  );
  const profile = PROFILES[Math.floor(rng() * PROFILES.length)]!;
  const rating = Math.min(91, 88 + Math.floor(normalized.totalScore / 8_000));
  return {
    kind: 'player',
    id: `monthly_legend_${normalized.awardMonthKey}`,
    name: `${normalized.displayName} — Ayın Efsanesi`,
    rating,
    currentRating: rating,
    position: profile.position,
    rarity: 'efsane',
    tags: [...profile.tags],
    potentialCeiling: rating,
    signature: true,
    signatureColor: '#a78bfa',
    signatureQuote: `${normalized.sourceMonthKey} şampiyonu · ${normalized.totalScore.toLocaleString('tr-TR')} skor`,
  };
}

/** Başarısız ağ isteği geçerli cache'i silmez; eski aya ait cache yeni aya taşınmaz. */
export async function fetchMonthlyLegendRecord(
  currentMonthKey = getSeasonKey(),
): Promise<MonthlyLegendRecord | null> {
  if (!isRemoteLeaderboardEnabled()) return null;
  const sourceMonthKey = previousMonthKey(currentMonthKey);
  const champion = selectMonthlyChampion(await fetchRemoteHallOfFame(sourceMonthKey));
  return champion ? createMonthlyLegendRecord(champion, currentMonthKey) : null;
}

export function getPreviousMonthKey(monthKey = getSeasonKey()): string {
  return previousMonthKey(monthKey);
}

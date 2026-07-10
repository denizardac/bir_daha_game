import seedrandom from 'seedrandom';
import type { Rarity } from '@/types';

const ISTANBUL_TZ = 'Europe/Istanbul';

/** null = İstanbul takvimi (production); manuel günlük rotasyon için YYYY-MM-DD ata */
export const DAILY_DAY_OVERRIDE: string | null = null;

const DAILY_SLUG_WORDS = [
  'ruzgar', 'yildiz', 'simsek', 'kanat', 'kale', 'pas', 'gol', 'altin', 'demir', 'volkan', 'deniz', 'kuzgun',
];

function istanbulDayKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ISTANBUL_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const d = parts.find((p) => p.type === 'day')!.value;
  return `${y}-${m}-${d}`;
}

/** Günlük challenge takvim günü (YYYY-MM-DD, İstanbul) */
export function getDailyDateKey(now = new Date()): string {
  return DAILY_DAY_OVERRIDE ?? istanbulDayKey(now);
}

function slugForDay(dayKey: string): string {
  let h = 2166136261;
  for (let i = 0; i < dayKey.length; i++) {
    h ^= dayKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const word = DAILY_SLUG_WORDS[Math.abs(h) % DAILY_SLUG_WORDS.length]!;
  const num = (Math.abs(h) >>> 0) % 900 + 100;
  return `${word}-${num}`;
}

export function getDailySeed(now = new Date()): string {
  const day = getDailyDateKey(now);
  return `${day}-${slugForDay(day)}-bir-daha-v1`;
}

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export function formatDailyDate(now = new Date()): string {
  const dateKey = getDailyDateKey(now);
  const [y, m, d] = dateKey.split('-').map(Number);
  return `${d} ${TR_MONTHS[m! - 1]} ${y}`;
}

/** Yıl olmadan — dar kartlarda yıl ayrı satırda gösterilir ("10 Temmuz") */
export function formatDailyDayMonth(now = new Date()): string {
  const [, m, d] = getDailyDateKey(now).split('-').map(Number);
  return `${d} ${TR_MONTHS[m! - 1]}`;
}

export function getRandomSeed(): string {
  return `free-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createRng(seed: string, ...parts: (string | number)[]): () => number {
  const combined = [seed, ...parts].join('-');
  const rng = seedrandom(combined);
  return () => rng();
}

export function pickOne<T>(rng: () => number, items: T[]): T {
  const index = Math.floor(rng() * items.length);
  return items[index]!;
}

export function weightedPick(rng: () => number, weights: Record<Rarity, number>): Rarity {
  const entries = Object.entries(weights) as [Rarity, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [rarity, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return entries[entries.length - 1]![0];
}

export function getRarityWeights(round: number): Record<Rarity, number> {
  if (round <= 4) return { normal: 70, iyi: 28, güçlü: 2, efsane: 0 };
  if (round <= 8) return { normal: 30, iyi: 45, güçlü: 22, efsane: 3 };
  if (round <= 12) return { normal: 10, iyi: 30, güçlü: 40, efsane: 20 };
  return { normal: 0, iyi: 15, güçlü: 45, efsane: 40 };
}

/** Efsane çekme şansının yüzdesi (UI feedback'i için) */
export function getLegendaryChance(round: number): number {
  return getRarityWeights(round).efsane;
}

/**
 * Bu round'da "efsane şansı arttı" rozetinin gösterilip gösterilmeyeceği + etiket.
 * Eşik geçişlerinde (round 9 → %20, round 13 → %40) güçlü vurgu yapılır.
 */
export function getLegendaryChanceTier(round: number): { boosted: boolean; chance: number; label: string } {
  const chance = getLegendaryChance(round);
  if (round >= 13) return { boosted: true, chance, label: 'EFSANE ŞANSI ZİRVEDE' };
  if (round >= 9) return { boosted: true, chance, label: 'EFSANE ŞANSI ARTTI' };
  if (round >= 5) return { boosted: false, chance, label: 'Efsane şansı düşük' };
  return { boosted: false, chance, label: 'Efsane çıkmaz' };
}

export function getOpponentRatingRange(round: number): [number, number] {
  if (round <= 3) return [55, 62];
  if (round <= 6) return [63, 70];
  if (round <= 9) return [71, 78];
  if (round <= 12) return [79, 85];
  return [83, 90];
}

const OPPONENT_NAMES = [
  'FC Demir',
  'Galaksi Spor',
  'Kuzey Birliği',
  'Altın Kartal',
  'Vadi SK',
  'Şehir FK',
  'Rüzgar Gençlik',
  'Kırmızı Yıldız',
  'Boğaziçi SK',
  'Anadolu Spor',
  'Karadeniz FK',
  'Ege Birliği',
];

const OPPONENT_STYLES = ['saldırgan', 'dengeli', 'savunmacı'] as const;

const OPPONENT_PREFIX = ['FC', 'SK', 'FK', 'Gençlik', 'Birliği', 'Spor', 'United', 'Athletic'];
const OPPONENT_CITIES = ['Demir', 'Kuzey', 'Vadi', 'Ege', 'Karadeniz', 'Boğaziçi', 'Anadolu', 'Rüzgar', 'Altın', 'Şehir'];

export function generateOpponent(rng: () => number, round: number, preferProcedural = false) {
  const [min, max] = getOpponentRatingRange(round);
  const rating = Math.floor(min + rng() * (max - min + 1));
  const procedural = preferProcedural || rng() < 0.72;
  const name = procedural
    ? `${pickOne(rng, OPPONENT_CITIES)} ${pickOne(rng, OPPONENT_PREFIX)}`
    : pickOne(rng, OPPONENT_NAMES);
  return {
    name,
    rating,
    style: pickOne(rng, [...OPPONENT_STYLES]),
  };
}

export function seedVariation(rng: () => number): number {
  return 0.85 + rng() * 0.3;
}

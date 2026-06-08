import seedrandom from 'seedrandom';
import type { Rarity } from '@/types';

export function getDailySeed(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  return `${date}-bir-daha-v1`;
}

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export function formatDailyDate(date = new Date()): string {
  return `${date.getDate()} ${TR_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
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

export function pickN<T>(rng: () => number, items: T[], count: number): T[] {
  const copy = [...items];
  const result: T[] = [];
  for (let i = 0; i < count && copy.length > 0; i++) {
    const index = Math.floor(rng() * copy.length);
    result.push(copy.splice(index, 1)[0]!);
  }
  return result;
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

export function generateOpponent(rng: () => number, round: number) {
  const [min, max] = getOpponentRatingRange(round);
  const rating = Math.floor(min + rng() * (max - min + 1));
  const procedural = rng() < 0.55;
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

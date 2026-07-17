export const DAILY_SEED_VERSION = 'v2';

const DAILY_SLUG_WORDS = [
  'ruzgar', 'yildiz', 'simsek', 'kanat', 'kale', 'pas', 'gol', 'altin', 'demir', 'volkan', 'deniz', 'kuzgun',
] as const;

/** İstemcideki getDailySeed ile birebir aynı, sunucu tarafı günlük seed hesabı. */
export function expectedDailySeed(dayKey: string): string {
  let hash = 2166136261;
  for (let index = 0; index < dayKey.length; index++) {
    hash ^= dayKey.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const word = DAILY_SLUG_WORDS[Math.abs(hash) % DAILY_SLUG_WORDS.length]!;
  const number = (Math.abs(hash) >>> 0) % 900 + 100;
  return `${dayKey}-${word}-${number}-bir-daha-${DAILY_SEED_VERSION}`;
}

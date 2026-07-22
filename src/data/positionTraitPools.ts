import type { Position, Tag } from '@/types';
import { canAddTag, filterCompatibleTags, sanitizeTags } from '@/data/tagConflicts';

/** Mevkiye uygun pozitif trait havuzları */
export const POSITION_POSITIVE_TAGS: Record<Position, Tag[]> = {
  KL: ['DAYANIKLI', 'SOĞUKKANLI', 'PENALTI', 'UZUN', 'PİK DÖNEM', 'SERBEST VURUŞ'],
  STP: ['GÜÇLÜ', 'DAYANIKLI', 'UZUN', 'KISA', 'YERLİ', 'SAVAŞÇI', 'LİDER'],
  SLB: ['HIZLI', 'TEKNİK', 'GÜÇLÜ', 'YERLİ', 'DAYANIKLI', 'ASİSTÇİ'],
  SÖB: ['HIZLI', 'TEKNİK', 'ASİSTÇİ', 'GÜÇLÜ', 'YERLİ', 'DAYANIKLI'],
  DOS: ['GÜÇLÜ', 'TEKNİK', 'SAVAŞÇI', 'DAYANIKLI', 'SOĞUKKANLI', 'YERLİ'],
  OS: ['TEKNİK', 'ASİSTÇİ', 'MENTOR', 'YERLİ', 'POTANSİYEL', 'LİDER', 'DAYANIKLI'],
  OOS: ['TEKNİK', 'HIZLI', 'ASİSTÇİ', 'FİNİŞÖR', 'YERLİ', 'POTANSİYEL'],
  SLK: ['HIZLI', 'FİNİŞÖR', 'ASİSTÇİ', 'YERLİ', 'YENİ SEZON', 'TEKNİK'],
  SÖK: ['HIZLI', 'FİNİŞÖR', 'TEKNİK', 'PENALTI', 'YABANCI YILDIZ', 'ASİSTÇİ'],
  SF: ['FİNİŞÖR', 'HIZLI', 'GÜÇLÜ', 'KISA', 'UZUN', 'POTANSİYEL', 'YABANCI YILDIZ'],
};

/** Yüksek rating / agresif profiller */
export const POSITION_RISK_TAGS: Partial<Record<Position, Tag[]>> = {
  STP: ['TARTIŞMALI', 'KIRMIZI KART', 'SAKATLIK RİSKİ'],
  DOS: ['TARTIŞMALI', 'PERFORMANS DÜŞÜŞÜ', 'SAKATLIK RİSKİ'],
  OS: ['PERFORMANS DÜŞÜŞÜ', 'TARTIŞMALI'],
  SF: ['KIRMIZI KART', 'TARTIŞMALI', 'SAKATLIK RİSKİ'],
  SÖK: ['KIRMIZI KART', 'PERFORMANS DÜŞÜŞÜ'],
  SLK: ['PERFORMANS DÜŞÜŞÜ'],
};

export const VETERAN_TAGS: Tag[] = ['GERİLEYEN', 'PİK DÖNEM'];
export const YOUTH_TAGS: Tag[] = ['YENİ SEZON', 'POTANSİYEL'];

function pickFromPool(pool: Tag[], tags: Tag[], rng: () => number): boolean {
  const compatible = filterCompatibleTags(pool, tags);
  if (!compatible.length) return false;
  const pick = compatible[Math.floor(rng() * compatible.length)]!;
  tags.push(pick);
  return true;
}

function tryPushTag(tags: Tag[], tag: Tag): boolean {
  if (!canAddTag(tag, tags)) return false;
  tags.push(tag);
  return true;
}

export function pickTagsForPosition(
  position: Position,
  rating: number,
  rng: () => number,
  maxTags = 2,
): Tag[] {
  const pool = [...POSITION_POSITIVE_TAGS[position]];
  const tags: Tag[] = [];

  if (rating >= 82 && rng() < 0.35) {
    const peak: Tag = pool.includes('PİK DÖNEM') ? 'PİK DÖNEM' : pool[Math.floor(rng() * pool.length)]!;
    tryPushTag(tags, peak);
  } else if (rating <= 66 && rng() < 0.28) {
    const youth = YOUTH_TAGS[Math.floor(rng() * YOUTH_TAGS.length)]!;
    tryPushTag(tags, youth);
  } else if (rating >= 72 && rng() < 0.22) {
    const veteran = VETERAN_TAGS[Math.floor(rng() * VETERAN_TAGS.length)]!;
    tryPushTag(tags, veteran);
  }

  let attempts = 0;
  while (tags.length < maxTags && pool.length && attempts < 40) {
    attempts += 1;
    if (!pickFromPool(pool, tags, rng)) break;
  }

  if (rating >= 74 && rng() < 0.14) {
    const risks = POSITION_RISK_TAGS[position] ?? ['PERFORMANS DÜŞÜŞÜ'];
    const risk = risks[Math.floor(rng() * risks.length)]!;
    if (tags.length < 3) tryPushTag(tags, risk);
  }

  if (position === 'DOS' || position === 'STP') {
    if (rng() < 0.12 && tags.length < 3) tryPushTag(tags, 'SAVAŞÇI');
  }
  if ((position === 'SF' || position === 'STP') && rating >= 70) {
    if (rng() < 0.1 && tags.length < 3) {
      const height: Tag = rng() < 0.5 ? 'KISA' : 'UZUN';
      tryPushTag(tags, height);
    }
  }

  return sanitizeTags(tags).slice(0, 3);
}

export function pickFreeStartTraitForPosition(
  position: Position,
  rng: () => number,
): Tag[] {
  if (rng() > 0.38) return [];
  const pool = POSITION_POSITIVE_TAGS[position].filter(
    (t) => !['PİK DÖNEM', 'YABANCI YILDIZ', 'KAPİTAN', 'MENTOR'].includes(t),
  );
  if (!pool.length) return [];
  return [pool[Math.floor(rng() * pool.length)]!];
}

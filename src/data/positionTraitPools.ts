import type { Position, Tag } from '@/types';

/** Mevkiye uygun pozitif trait havuzları */
export const POSITION_POSITIVE_TAGS: Record<Position, Tag[]> = {
  KL: ['DAYANIKLI', 'SOĞUKKANLI', 'PENALTI', 'UZUN', 'PİK DÖNEM', 'SERBEST VURUŞ'],
  STP: ['GÜÇLÜ', 'DAYANIKLI', 'UZUN', 'KISA', 'YERLİ', 'SAVAŞÇI', 'GERİLEYEN', 'LİDER'],
  SLB: ['HIZLI', 'TEKNİK', 'GÜÇLÜ', 'YERLİ', 'DAYANIKLI', 'ASİSTÇİ'],
  SÖB: ['HIZLI', 'TEKNİK', 'ASİSTÇİ', 'GÜÇLÜ', 'YERLİ', 'DAYANIKLI'],
  DOS: ['GÜÇLÜ', 'TEKNİK', 'SAVAŞÇI', 'DAYANIKLI', 'SOĞUKKANLI', 'YERLİ', 'GERİLEYEN'],
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

export function pickTagsForPosition(
  position: Position,
  rating: number,
  rng: () => number,
  maxTags = 2,
): Tag[] {
  const pool = [...POSITION_POSITIVE_TAGS[position]];
  const tags: Tag[] = [];

  if (rating >= 82 && rng() < 0.35) {
    const peak = pool.includes('PİK DÖNEM') ? 'PİK DÖNEM' : pool[Math.floor(rng() * pool.length)]!;
    tags.push(peak);
  } else if (rating <= 66 && rng() < 0.28) {
    tags.push(YOUTH_TAGS[Math.floor(rng() * YOUTH_TAGS.length)]!);
  } else if (rating >= 72 && rng() < 0.22) {
    tags.push(VETERAN_TAGS[Math.floor(rng() * VETERAN_TAGS.length)]!);
  }

  while (tags.length < maxTags && pool.length) {
    const pick = pool[Math.floor(rng() * pool.length)]!;
    if (!tags.includes(pick)) tags.push(pick);
  }

  if (rating >= 74 && rng() < 0.14) {
    const risks = POSITION_RISK_TAGS[position] ?? ['PERFORMANS DÜŞÜŞÜ'];
    const risk = risks[Math.floor(rng() * risks.length)]!;
    if (!tags.includes(risk) && tags.length < 3) tags.push(risk);
  }

  if (position === 'DOS' || position === 'STP') {
    if (rng() < 0.12 && !tags.includes('SAVAŞÇI') && tags.length < 3) tags.push('SAVAŞÇI');
  }
  if ((position === 'SF' || position === 'STP') && rating >= 70) {
    if (rng() < 0.1 && !tags.includes('KISA') && !tags.includes('UZUN') && tags.length < 3) {
      tags.push(rng() < 0.5 ? 'KISA' : 'UZUN');
    }
  }

  return tags.slice(0, 3);
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

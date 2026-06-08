import type { PlayerCard, Position, Tag } from '@/types';

/** Oyuncu başına maç gücü katkıları — tooltip ile birebir */
export const TAG_ATTACK_BONUS: Partial<Record<Tag, number>> = {
  HIZLI: 0.03,
  TEKNİK: 0.05,
  FİNİŞÖR: 0.07,
  ASİSTÇİ: 0.02,
  GÜÇLÜ: 0.04,
  SAVAŞÇI: 0.03,
  'SERBEST VURUŞ': 0.03,
  PENALTI: 0.02,
  KISA: 0.02,
  UZUN: 0.03,
  'PİK DÖNEM': 0.02,
  'YABANCI YILDIZ': 0.02,
};

export const TAG_DEFENSE_BONUS: Partial<Record<Tag, number>> = {
  GÜÇLÜ: 0.04,
  DAYANIKLI: 0.03,
  UZUN: 0.03,
  SOĞUKKANLI: 0.02,
};

/** Maç sonu puan — scoring.ts */
export const TAG_PASSIVE_POINTS: Partial<Record<Tag, number>> = {
  'YABANCI YILDIZ': 5,
  'SOYUNMA ODASI': 2,
};

/** UI açıklamaları — kod değerleriyle senkron */
export const TAG_MECHANIC_DESCRIPTIONS: Record<Tag, string> = {
  HIZLI: 'Maç gücü +%3 — sprint gol şansı artar',
  GÜÇLÜ: 'Maç gücü +%4 — ikili mücadele ve savunma güçlenir',
  DAYANIKLI: 'Form düşmez — GERİLEYEN / PERFORMANS DÜŞÜŞÜ cezasından muaf',
  KISA: 'Maç gücü +%2 — düşük top kontrolü, kompakt forvetlerde',
  UZUN: 'Maç gücü +%3 — hava topları ve stoperlerde güçlü',
  TEKNİK: 'Maç gücü +%5 — pas ve taktik bonuslarından daha çok yararlanır',
  FİNİŞÖR: 'Maç gücü +%7 — gol seçiminde öncelik',
  ASİSTÇİ: 'Maç gücü +%2 — asist şansı yüksek',
  'SERBEST VURUŞ': 'Maç gücü +%3 — SET PİECE sinerjisi için',
  PENALTI: 'Maç gücü +%2 — SET PİECE sinerjisi için',
  LİDER: 'Pasif moral +10',
  MENTOR: 'POTANSİYEL oyuncular maç sonu +1/+2 rating',
  KAPİTAN: 'Pasif moral +15',
  SAVAŞÇI: 'Maç gücü +%3 — gerideyken GERİDEN GEL sinerjisi',
  SOĞUKKANLI: 'Savunma +%2 — düşük moralde performans daha az düşer',
  YERLİ: '5+ yerli → YERLİ KADRO sinerjisi',
  'YABANCI YILDIZ': 'Maç gücü +%2, maç sonu +5 puan',
  'SOYUNMA ODASI': 'Pasif moral +5, maç sonu +2 puan',
  TARTIŞMALI: 'Güçlü kart — olaylarda ek risk; TARTIŞMALI GÜÇ sinerjisi',
  POTANSİYEL: 'Maç sonu rating +1 (tavan: başlangıç +15)',
  'PİK DÖNEM': 'Gelişmez — maç gücü +%2, zirve formda',
  GERİLEYEN: 'Her 3 maç −1 rating — UCUZ KADRO sinerjisi ile telafi',
  'YENİ SEZON': 'İlk 3 round gelişmez, sonra POTANSİYEL gibi +1/maç',
  'SAKATLIK RİSKİ': '%20 şans maç sonu −6 rating (1 maç)',
  'KIRMIZI KART': 'Kırmızı kart şansı ×2 — agresif oyun',
  'PERFORMANS DÜŞÜŞÜ': 'Her 3 maç −2 rating — ROTASYON USTASI sinerjisi ile korunur',
};

export function countTagInSquad(squad: PlayerCard[], tag: Tag): number {
  return squad.reduce((n, p) => n + (p.tags.includes(tag) ? 1 : 0), 0);
}

export function attackTagMultiplier(squad: PlayerCard[], behindInMatch = false): number {
  let mult = 1;
  for (const p of squad) {
    for (const tag of p.tags) {
      const bonus = TAG_ATTACK_BONUS[tag];
      if (bonus) mult += bonus;
    }
    if (behindInMatch && p.tags.includes('SAVAŞÇI')) mult += 0.04;
  }
  return Math.min(1.45, mult);
}

export function defenseTagMultiplier(squad: PlayerCard[]): number {
  let mult = 1;
  for (const p of squad) {
    for (const tag of p.tags) {
      const bonus = TAG_DEFENSE_BONUS[tag];
      if (bonus) mult += bonus;
    }
  }
  return Math.min(1.35, mult);
}

export function passiveTagRoundPoints(squad: PlayerCard[]): number {
  let pts = 0;
  for (const p of squad) {
    for (const tag of p.tags) {
      pts += TAG_PASSIVE_POINTS[tag] ?? 0;
    }
  }
  return pts;
}

export function moraleStabilityBonus(squad: PlayerCard[], morale: number): number {
  const cold = countTagInSquad(squad, 'SOĞUKKANLI');
  if (morale >= 50 || cold === 0) return 0;
  return cold * 0.02;
}

export function injuryRiskChance(): number {
  return 0.2;
}

export function injuryRatingPenalty(): number {
  return -6;
}

export function redCardChanceMultiplier(hasTag: boolean): number {
  return hasTag ? 2 : 1;
}

const WING_CAPABLE = new Set<Position>(['OOS', 'SLK', 'SÖK']);

export function prefersWingOverCentralMid(player: PlayerCard, slotLabel: string, zone: string): boolean {
  if (!WING_CAPABLE.has(player.position)) return false;
  if (zone !== 'orta') return false;
  return slotLabel === 'DOS' || slotLabel === 'OS';
}

export function isWingSlotLabel(label: string): boolean {
  return label === 'SLK' || label === 'SĞK';
}

import type { PlayerCard, Tag } from '@/types';

/** Oyuncu başına maç gücü katkıları — tooltip ile birebir */
export const TAG_ATTACK_BONUS: Partial<Record<Tag, number>> = {
  HIZLI: 0.025,
  TEKNİK: 0.035,
  FİNİŞÖR: 0.055,
  ASİSTÇİ: 0.02,
  GÜÇLÜ: 0.025,
  SAVAŞÇI: 0.02,
  'SERBEST VURUŞ': 0.02,
  PENALTI: 0.015,
  KISA: 0.015,
  UZUN: 0.015,
  'PİK DÖNEM': 0.02,
  'YABANCI YILDIZ': 0.015,
};

export const TAG_DEFENSE_BONUS: Partial<Record<Tag, number>> = {
  GÜÇLÜ: 0.035,
  DAYANIKLI: 0.025,
  UZUN: 0.025,
  SOĞUKKANLI: 0.025,
};

/** Maç sonu puan — scoring.ts */
export const TAG_PASSIVE_POINTS: Partial<Record<Tag, number>> = {
  'YABANCI YILDIZ': 4,
  'SOYUNMA ODASI': 2,
};

/** UI açıklamaları — kod değerleriyle senkron */
export const TAG_MECHANIC_DESCRIPTIONS: Record<Tag, string> = {
  HIZLI: 'Geçiş oyununda değerli. HIZLI biriktirirsen kontra ve kanat sinerjileri açılır.',
  GÜÇLÜ: 'İkili mücadelede güven verir. Stoper ve orta saha sinerjilerinde özellikle değerlidir.',
  DAYANIKLI: 'Uzun run oyuncusu. Form düşüşlerinden etkilenmez ve rotasyon planlarını güçlendirir.',
  KISA: 'Dar alanda çevik oyuncu profili. Özellikle hücumda tamamlayıcı rol oynar.',
  UZUN: 'Hava toplarında ve savunma hattında güven verir. Fiziksel kadrolara iyi oturur.',
  TEKNİK: 'Pas kalitesini yükseltir. Pas oyunu, merkez kontrolü ve teknik sinerjilerin ana tagidir.',
  FİNİŞÖR: 'Pozisyonu gole çeviren oyuncu. Gol ve hücum hattı sinerjilerinde kilit rol oynar.',
  ASİSTÇİ: 'Son pası hazırlayan oyuncu. Gol başına puan veren sinerjiler için değerlidir.',
  'SERBEST VURUŞ': 'Duran top tehdidi. PENALTI ile birleşirse SET PIECE planı açılır.',
  PENALTI: 'Soğukkanlı bitirici rolü. SERBEST VURUŞ ile birlikte duran top planını tamamlar.',
  LİDER: 'Takımın moral omurgası. Yüksek moralde galibiyetleri daha değerli hale getirir.',
  MENTOR: 'Genç oyuncuları büyütür. POTANSİYEL ve YENİ SEZON planlarının merkezidir.',
  KAPİTAN: 'Soyunma odasını ayakta tutar. Moral ve özel takım ruhu sinerjilerinde önemlidir.',
  SAVAŞÇI: 'Geriye düşülen maçlarda reaksiyon verir. Kriz anı sinerjilerini tetikler.',
  SOĞUKKANLI: 'Baskıda paniklemez. Düşük moralde takımın daha az dağılmasına yardım eder.',
  YERLİ: 'Kadro kimyası tagi. Yeterince YERLİ oyuncu toplarsan takım bağı güçlenir.',
  'YABANCI YILDIZ': 'Bireysel kalite tagi. Skora küçük katkı verir ve yıldız kadro planlarını açar.',
  'SOYUNMA ODASI': 'Takım içi uyum sağlar. Moral planlarında ve TAKIM RUHU sinerjisinde değerlidir.',
  TARTIŞMALI: 'Soyunma odasını zorlayabilir. LİDER yanında olursa bu risk avantaja dönebilir.',
  POTANSİYEL: 'Gelişim oyuncusu. Maçlardan sonra rating kazanır ve doğru destekle yıldızlaşır.',
  'PİK DÖNEM': 'Hazır kalite. Gelişmez ama bugünün maçında güvenilir katkı verir.',
  GERİLEYEN: 'Veteran riski. Zamanla rating kaybeder ama UCUZ KADRO planında değer kazanır.',
  'YENİ SEZON': 'Uyum süreci ister. İlk haftaları sakin geçer, sonra gelişim yoluna girer.',
  'SAKATLIK RİSKİ': 'Kısa vadede güçlü olabilir ama maç sonrası geçici rating kaybı yaşayabilir.',
  'KIRMIZI KART': 'Disiplin riski taşır. Sert maçlarda takımı zor durumda bırakabilir.',
  'PERFORMANS DÜŞÜŞÜ': 'Ritmi bozulmaya yatkın oyuncu. ROTASYON USTASI planıyla telafi edilebilir.',
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
    if (behindInMatch && p.tags.includes('SAVAŞÇI')) mult += 0.035;
  }
  return Math.min(1.35, mult);
}

export function defenseTagMultiplier(squad: PlayerCard[]): number {
  let mult = 1;
  for (const p of squad) {
    for (const tag of p.tags) {
      const bonus = TAG_DEFENSE_BONUS[tag];
      if (bonus) mult += bonus;
    }
  }
  return Math.min(1.28, mult);
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

export function riskTagStrengthPenalty(squad: PlayerCard[], morale: number): number {
  let penalty = 0;
  for (const p of squad) {
    if (p.tags.includes('KIRMIZI KART')) penalty += 0.015;
    if (p.tags.includes('TARTIŞMALI') && morale < 70) penalty += 0.02;
  }
  return Math.max(0.88, 1 - penalty);
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

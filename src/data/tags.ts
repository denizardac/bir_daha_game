import type { Tag } from '@/types';

export const ALL_TAGS: Tag[] = [
  'HIZLI', 'GÜÇLÜ', 'DAYANIKLI', 'KISA', 'UZUN', 'TEKNİK', 'FİNİŞÖR', 'ASİSTÇİ',
  'SERBEST VURUŞ', 'PENALTI', 'LİDER', 'MENTOR', 'KAPİTAN', 'SAVAŞÇI', 'SOĞUKKANLI',
  'YERLİ', 'YABANCI YILDIZ', 'SOYUNMA ODASI', 'TARTIŞMALI', 'POTANSİYEL', 'PİK DÖNEM',
  'GERİLEYEN', 'YENİ SEZON', 'SAKATLIK RİSKİ', 'KIRMIZI KART', 'PERFORMANS DÜŞÜŞÜ',
];

export const TAG_ICONS: Record<Tag, string> = {
  HIZLI: '⚡', GÜÇLÜ: '💪', DAYANIKLI: '🛡️', KISA: '↕️', UZUN: '↕️',
  TEKNİK: '🎯', FİNİŞÖR: '⚽', ASİSTÇİ: '🤝', 'SERBEST VURUŞ': '🥅', PENALTI: '🎯',
  LİDER: '👑', MENTOR: '📚', KAPİTAN: '🎖️', SAVAŞÇI: '⚔️', SOĞUKKANLI: '🧊',
  YERLİ: '🏠', 'YABANCI YILDIZ': '🌍', 'SOYUNMA ODASI': '🎤', TARTIŞMALI: '💥',
  POTANSİYEL: '📈', 'PİK DÖNEM': '⭐', GERİLEYEN: '📉', 'YENİ SEZON': '🌱',
  'SAKATLIK RİSKİ': '🤕', 'KIRMIZI KART': '🟥', 'PERFORMANS DÜŞÜŞÜ': '📊',
};

export const TAG_DESCRIPTIONS: Record<Tag, string> = {
  HIZLI: 'Sprint durumunda gol ihtimali +15%',
  GÜÇLÜ: 'İkili mücadele kazanma +20%',
  DAYANIKLI: '15. rounddan önce yorgunluk yok',
  KISA: 'Kafa golü -20%, top kontrolü +10%',
  UZUN: 'Kafa golü +25%, sprint -5%',
  TEKNİK: 'Pas isabeti +15%',
  FİNİŞÖR: 'Gol dönüşüm oranı +20%',
  ASİSTÇİ: 'Takım arkadaşlarının gol ihtimali +10%',
  'SERBEST VURUŞ': 'Serbest vuruşlarda +30%',
  PENALTI: 'Penaltı dönüşümü %85',
  LİDER: 'Takım morali +10 pasif',
  MENTOR: 'POTANSİYEL oyuncuları geliştirir',
  KAPİTAN: 'Moral +15, geriden gol yeme -10%',
  SAVAŞÇI: 'Geride olunca performans artar',
  SOĞUKKANLI: 'Baskı altında isabet düşmez',
  YERLİ: '7+ yerli → EV SAHİBİ sinerjisi',
  'YABANCI YILDIZ': 'Pasif +5 puan/maç',
  'SOYUNMA ODASI': 'Tüm takım moralini +5 pasif',
  TARTIŞMALI: 'Güçlü ama olay kartlarında risk',
  POTANSİYEL: 'Her maç rating +1',
  'PİK DÖNEM': 'Rating sabit, şu an mükemmel',
  GERİLEYEN: 'Her 3 maç rating -1',
  'YENİ SEZON': 'İlk 3 round zayıf, sonra gelişir',
  'SAKATLIK RİSKİ': '%25 ihtimalle 2 maç oynamaz',
  'KIRMIZI KART': '%15 ihtimalle maçtan atılır',
  'PERFORMANS DÜŞÜŞÜ': '3 maç üst üste oynayınca -5 rating',
};

export const TAG_VALUE: Partial<Record<Tag, number>> = {
  MENTOR: 1.3, LİDER: 1.2, KAPİTAN: 1.25, POTANSİYEL: 1.15,
  FİNİŞÖR: 1.1, HIZLI: 1.05, GERİLEYEN: 0.85,
};

export const TAG_ICONS_ONLY = TAG_ICONS;

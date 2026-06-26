import { TAG_MECHANIC_DESCRIPTIONS } from '@/engine/tagMechanics';
import type { Tag } from '@/types';

export const ALL_TAGS: Tag[] = [
  'HIZLI', 'GÜÇLÜ', 'DAYANIKLI', 'KISA', 'UZUN', 'TEKNİK', 'FİNİŞÖR', 'ASİSTÇİ',
  'SERBEST VURUŞ', 'PENALTI', 'LİDER', 'MENTOR', 'KAPİTAN', 'SAVAŞÇI', 'SOĞUKKANLI',
  'YERLİ', 'YABANCI YILDIZ', 'SOYUNMA ODASI', 'TARTIŞMALI', 'POTANSİYEL', 'PİK DÖNEM',
  'GERİLEYEN', 'YENİ SEZON', 'SAKATLIK RİSKİ', 'KIRMIZI KART', 'PERFORMANS DÜŞÜŞÜ',
];

export const TAG_GROUPS = {
  matchPower: ['HIZLI', 'GÜÇLÜ', 'DAYANIKLI', 'KISA', 'UZUN', 'TEKNİK', 'FİNİŞÖR', 'ASİSTÇİ', 'SERBEST VURUŞ', 'PENALTI', 'SAVAŞÇI', 'SOĞUKKANLI', 'PİK DÖNEM'] as Tag[],
  morale: ['LİDER', 'KAPİTAN', 'SOYUNMA ODASI'] as Tag[],
  growth: ['MENTOR', 'POTANSİYEL', 'YENİ SEZON'] as Tag[],
  risk: ['TARTIŞMALI', 'GERİLEYEN', 'SAKATLIK RİSKİ', 'KIRMIZI KART', 'PERFORMANS DÜŞÜŞÜ'] as Tag[],
  identity: ['YERLİ', 'YABANCI YILDIZ'] as Tag[],
};

export const TAG_GROUP_LABELS: Record<keyof typeof TAG_GROUPS, string> = {
  matchPower: 'Maç gücü',
  morale: 'Moral / liderlik',
  growth: 'Gelişim',
  risk: 'Risk',
  identity: 'Kimlik / kadro kurma',
};

export const TAG_ICONS: Record<Tag, string> = {
  HIZLI: '⚡', GÜÇLÜ: '💪', DAYANIKLI: '🛡️', KISA: '↕️', UZUN: '↕️',
  TEKNİK: '🎯', FİNİŞÖR: '⚽', ASİSTÇİ: '🤝', 'SERBEST VURUŞ': '🥅', PENALTI: '🎯',
  LİDER: '👑', MENTOR: '📚', KAPİTAN: '🎖️', SAVAŞÇI: '⚔️', SOĞUKKANLI: '🧊',
  YERLİ: '🏠', 'YABANCI YILDIZ': '🌍', 'SOYUNMA ODASI': '🎤', TARTIŞMALI: '💥',
  POTANSİYEL: '📈', 'PİK DÖNEM': '⭐', GERİLEYEN: '📉', 'YENİ SEZON': '🌱',
  'SAKATLIK RİSKİ': '🤕', 'KIRMIZI KART': '🟥', 'PERFORMANS DÜŞÜŞÜ': '📊',
};

export const TAG_DESCRIPTIONS: Record<Tag, string> = TAG_MECHANIC_DESCRIPTIONS;

export const TAG_VALUE: Partial<Record<Tag, number>> = {
  MENTOR: 1.3, LİDER: 1.2, KAPİTAN: 1.25, POTANSİYEL: 1.15,
  FİNİŞÖR: 1.1, HIZLI: 1.05, GERİLEYEN: 0.85,
};

export const TAG_ICONS_ONLY = TAG_ICONS;

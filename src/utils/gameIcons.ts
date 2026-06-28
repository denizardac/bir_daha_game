import type { UiIconName } from '@/components/UiIcon';
import type { Tag } from '@/types';

const TAG_ICON_NAMES: Record<Tag, UiIconName> = {
  HIZLI: 'zap',
  GÜÇLÜ: 'flame',
  DAYANIKLI: 'shield',
  KISA: 'circle-dot',
  UZUN: 'circle-dot',
  TEKNİK: 'circle-dot',
  FİNİŞÖR: 'trophy',
  ASİSTÇİ: 'arrow-right',
  'SERBEST VURUŞ': 'clipboard',
  PENALTI: 'circle-dot',
  LİDER: 'medal',
  MENTOR: 'book-open',
  KAPİTAN: 'medal',
  SAVAŞÇI: 'shield',
  SOĞUKKANLI: 'shield',
  YERLİ: 'circle-dot',
  'YABANCI YILDIZ': 'globe',
  'SOYUNMA ODASI': 'info',
  TARTIŞMALI: 'info',
  POTANSİYEL: 'sparkles',
  'PİK DÖNEM': 'medal',
  GERİLEYEN: 'trending-down',
  'YENİ SEZON': 'sparkles',
  'SAKATLIK RİSKİ': 'info',
  'KIRMIZI KART': 'info',
  'PERFORMANS DÜŞÜŞÜ': 'chart',
};

const SYNERGY_ICON_NAMES: Record<string, UiIconName> = {
  '⚡': 'zap',
  '🏃': 'zap',
  '🦅': 'zap',
  '🎯': 'circle-dot',
  '🤝': 'arrow-right',
  '🥅': 'clipboard',
  '📚': 'book-open',
  '👑': 'medal',
  '🎤': 'info',
  '🏠': 'circle-dot',
  '🌍': 'globe',
  '⚖️': 'circle-dot',
  '🧱': 'shield',
  '🔺': 'zap',
  '✨': 'sparkles',
  '🌪️': 'zap',
  '🏆': 'trophy',
  '⚔️': 'shield',
  '🔒': 'shield',
  '⭐': 'medal',
  '🔗': 'tag',
  '🛡️': 'shield',
  '📉': 'trending-down',
  '🔄': 'refresh',
  '💥': 'zap',
  '🧊': 'shield',
  '🌱': 'sparkles',
  '✒️': 'clipboard',
};

export function iconForTag(tag: Tag): UiIconName {
  return TAG_ICON_NAMES[tag] ?? 'tag';
}

export function iconForSynergy(rawIcon?: string): UiIconName {
  if (!rawIcon) return 'zap';
  return SYNERGY_ICON_NAMES[rawIcon] ?? 'zap';
}

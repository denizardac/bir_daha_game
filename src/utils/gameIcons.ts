import type { UiIconName } from '@/components/UiIcon';
import type { Tag } from '@/types';

/** U+FE0F / U+FE0E (variation selector) — "🛡️" ile "🛡" aynı ikona düşsün */
function stripVariationSelectors(raw: string): string {
  return raw.replace(/[︎️]/g, '');
}

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

/**
 * Veri katmanındaki her emoji için SVG ikon karşılığı. Emoji artık hiçbir zaman
 * DOM'a basılmaz; render noktaları bu çözücüden geçer. Yeni bir emoji eklenirse
 * `gameIcons.test.ts` "haritada olmayan emoji" testi kırılır.
 *
 * Not: Anahtarlar variation selector (U+FE0F) içerebilir; `iconForEmoji` hem
 * ham hem de sadeleştirilmiş biçimi dener.
 */
const EMOJI_ICON_NAMES: Record<string, UiIconName> = {
  // --- Futbol / mevki
  '⚽': 'circle-dot', '🥅': 'target', '🧤': 'lock', '👟': 'shirt', '👕': 'shirt',
  '🏟️': 'building', '🏠': 'home', '🚩': 'flag', '📍': 'flag', '🎽': 'shirt',
  '🔟': 'star', '🥇': 'trophy', '🥈': 'medal', '🥉': 'medal',

  // --- Performans / güç
  '⚡': 'zap', '💨': 'wind', '🏃': 'wind', '🚀': 'zap', '🐢': 'clock',
  '💪': 'flame', '🛡️': 'shield', '🧱': 'shield', '⚔️': 'shield', '🔒': 'lock',
  '🎯': 'target', '🔺': 'target', '⭐': 'star', '🌟': 'star', '✨': 'sparkles',
  '🌪️': 'wind', '🦅': 'wind', '🔗': 'tag', '🏆': 'trophy', '👑': 'trophy',
  '🎖️': 'medal', '💎': 'trophy', '📈': 'chart', '📉': 'trending-down', '📊': 'chart',
  '⚙️': 'settings', '🔄': 'refresh', '🔁': 'refresh', '⚖️': 'scale',

  // --- Moral / duygu
  '❤️': 'heart', '💔': 'heart-crack', '🫶': 'heart', '🫂': 'users', '😌': 'heart',
  '😔': 'heart-crack', '😞': 'heart-crack', '😢': 'heart-crack', '😤': 'flame',
  '😬': 'alert-triangle', '😰': 'alert-triangle', '😐': 'minus', '😶': 'minus',
  '🧊': 'snowflake', '🧠': 'lightbulb', '🧘': 'heart', '💭': 'message', '💬': 'message',
  '🗣️': 'megaphone', '📢': 'megaphone', '📣': 'megaphone', '🎤': 'megaphone',
  '🎙️': 'megaphone', '🤐': 'ban', '🔇': 'ban', '📵': 'ban', '🔔': 'bell',
  '👏': 'check', '👍': 'check', '👎': 'x', '👌': 'check', '🙌': 'sparkles',
  '🎉': 'sparkles', '🎊': 'sparkles', '🥳': 'sparkles', '🎈': 'sparkles', '🎂': 'sparkles',
  '🎁': 'archive', '💥': 'zap', '💢': 'flame', '😮': 'info', '😓': 'droplet',
  '💦': 'droplet', '💤': 'moon', '😴': 'moon',

  // --- Sağlık / fiziksel
  '🤕': 'plus', '🩹': 'plus', '🩼': 'plus', '🏥': 'plus', '🩺': 'plus',
  '💊': 'plus', '🤢': 'alert-triangle', '💆': 'heart', '🏋️': 'flame', '⛺': 'home',
  '🛏️': 'moon', '🛋️': 'home', '🏨': 'building',

  // --- Medya / kurum
  '📺': 'tv', '📸': 'camera', '🎬': 'camera', '🎥': 'camera', '📱': 'card',
  '📞': 'card', '📰': 'clipboard', '📝': 'pen', '✍️': 'pen', '✒️': 'pen',
  '📄': 'clipboard', '📓': 'book-open', '📖': 'book-open', '📚': 'book-open',
  '📜': 'clipboard', '📋': 'clipboard', '📁': 'archive', '📦': 'archive',
  '📤': 'arrow-right', '📥': 'arrow-left', '🏦': 'building', '🏙️': 'building',
  '💼': 'briefcase', '💰': 'money', '💵': 'money', '💸': 'money', '💳': 'card',
  '🤵': 'user', '👤': 'user', '👥': 'users', '👨': 'user', '👩': 'user', '👧': 'user',
  '🕵️': 'search', '🔍': 'search', '👀': 'eye', '👁️': 'eye', '🙈': 'ban',
  '👂': 'info', '✋': 'ban', '🚶': 'user', '🤳': 'camera',

  // --- Ulaşım / hava / mekân
  '✈️': 'plane', '🛫': 'plane', '🛩️': 'plane', '🛄': 'briefcase', '🚌': 'bus',
  '🗺️': 'map', '🚪': 'door', '⛔': 'ban', '🚫': 'ban', '❌': 'x', '✅': 'check',
  '🌧️': 'cloud-rain', '☔': 'cloud-rain', '☀️': 'sun', '❄️': 'snowflake',
  '🥶': 'snowflake', '🌡️': 'thermometer', '💧': 'droplet', '🌊': 'droplet',
  '🌿': 'sparkles', '🌱': 'sparkles', '☕': 'coffee',

  // --- Kart / hakem / ölçü
  '🟥': 'square', '🟨': 'square', '🎲': 'dice', '🎱': 'circle-dot',
  '📐': 'ruler', '📏': 'ruler', '📅': 'calendar', '🏷️': 'tag',
  '🎓': 'graduation-cap', '🎭': 'users', '🧣': 'shirt', '🧪': 'sparkles',
  '🍽️': 'coffee', '🔥': 'flame', '⚠️': 'alert-triangle', '⚠': 'alert-triangle',
  '❓': 'info', '➡️': 'arrow-right', '⬅️': 'arrow-left', '↕️': 'refresh',
  '✓': 'check', '✗': 'x', '✕': 'x', '★': 'star', '✦': 'sparkles',
  '🤝': 'users', '🌍': 'globe', '🏡': 'home',

  // --- Zaman / durum
  '⏱️': 'clock', '⏰': 'clock', '⏳': 'clock', '⏭️': 'arrow-right', '⏩': 'arrow-right',
  '🆕': 'sparkles', '❤️‍🔥': 'flame', '👨‍👩‍👧': 'users',
};

/** Variation selector'sız arama için önceden hesaplanmış ikinci harita */
const NORMALIZED_EMOJI_ICON_NAMES: Record<string, UiIconName> = Object.fromEntries(
  Object.entries(EMOJI_ICON_NAMES).map(([key, value]) => [stripVariationSelectors(key), value]),
);

export function iconForTag(tag: Tag): UiIconName {
  return TAG_ICON_NAMES[tag] ?? 'tag';
}

export function iconForSynergy(rawIcon?: string): UiIconName {
  if (!rawIcon) return 'zap';
  return SYNERGY_ICON_NAMES[rawIcon] ?? iconForEmoji(rawIcon, 'zap');
}

/**
 * Herhangi bir veri emojisini SVG ikon adına çevirir. Bilinmeyen emoji için
 * `fallback` döner — testte bilinmeyenler yakalanır.
 */
export function iconForEmoji(raw?: string, fallback: UiIconName = 'circle-dot'): UiIconName {
  if (!raw) return fallback;
  return EMOJI_ICON_NAMES[raw]
    ?? NORMALIZED_EMOJI_ICON_NAMES[stripVariationSelectors(raw)]
    ?? fallback;
}

/** Test yardımcısı: bir emoji haritada tanımlı mı */
export function hasIconForEmoji(raw: string): boolean {
  return Boolean(EMOJI_ICON_NAMES[raw] ?? NORMALIZED_EMOJI_ICON_NAMES[stripVariationSelectors(raw)]);
}

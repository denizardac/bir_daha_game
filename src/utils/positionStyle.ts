import type { PlayerCard, Position, Tag } from '@/types';

/** Oyuncu kartındaki Position kodu → tam Türkçe isim */
export const POSITION_LABELS: Record<Position, string> = {
  KL: 'Kaleci',
  STP: 'Stoper',
  SLB: 'Sol Bek',
  SÖB: 'Sağ Bek',
  DOS: 'Defansif Orta Saha',
  OS: 'Orta Saha',
  SLK: 'Sol Kanat',
  SÖK: 'Sağ Kanat',
  OOS: 'Ofansif Orta Saha',
  SF: 'Santrafor',
};

/** Dizilişteki slot kısaltması → tam isim (SĞB / SĞK saha etiketleri) */
export const FORMATION_SLOT_LABELS: Record<string, string> = {
  KL: 'Kaleci',
  STP: 'Stoper',
  SLB: 'Sol Bek',
  SĞB: 'Sağ Bek',
  DOS: 'Defansif Orta Saha',
  OS: 'Orta Saha',
  SLK: 'Sol Kanat',
  SĞK: 'Sağ Kanat',
  OOS: 'Ofansif Orta Saha',
  SF: 'Santrafor',
};

export function formationSlotLabel(slotCode: string): string {
  return FORMATION_SLOT_LABELS[slotCode] ?? slotCode;
}

/** Oyuncu ana mevki ≠ slot — tek satır uyarı (tekrarlayan “DOS — OOS” birleşimi yok) */
export function formatSlotMismatchWarn(
  card: Pick<PlayerCard, 'position'>,
  slotCode: string,
  tier: 'flex' | 'forced',
): string {
  const player = `${POSITION_LABELS[card.position]} (${POSITION_BADGE[card.position]})`;
  const slot = `${slotCode} (${formationSlotLabel(slotCode)})`;
  if (tier === 'forced') {
    return `⚠ ${player} bu slota uyumsuz — ${slot} slotunda ciddi performans riski`;
  }
  return `⚠ ${player}, ${slot} slotunda oynar — mevki uyumu zayıf`;
}

/** Kısa rozet metni — SÖK gibi kafa karıştıran kodlar yok */
export const POSITION_BADGE: Record<Position, string> = {
  KL: 'KL',
  STP: 'STP',
  SLB: 'SLB',
  SÖB: 'SĞB',
  DOS: 'DOS',
  OS: 'OS',
  SLK: 'SLK',
  SÖK: 'SĞK',
  OOS: 'OOS',
  SF: 'SF',
};

export const POSITION_ICONS: Record<Position, string> = {
  KL: '🧤',
  STP: '🛡️',
  SLB: '⬅️',
  SÖB: '➡️',
  DOS: '⚙️',
  OS: '🎯',
  SLK: '💨',
  SÖK: '💨',
  OOS: '✨',
  SF: '⚽',
};

export const POSITION_COLORS: Record<Position, string> = {
  KL: '#eab308',
  STP: '#3b82f6',
  SLB: '#6366f1',
  SÖB: '#6366f1',
  DOS: '#22c55e',
  OS: '#14b8a6',
  SLK: '#ef4444',
  SÖK: '#f97316',
  OOS: '#ec4899',
  SF: '#e11d48',
};

/** Tag varsa avatar arka planı — yoksa mevki rengi */
export const TAG_AVATAR_BG: Record<Tag, string> = {
  HIZLI: 'linear-gradient(145deg, #c2410c 0%, #f97316 55%, #fdba74 100%)',
  GÜÇLÜ: 'linear-gradient(145deg, #991b1b 0%, #dc2626 55%, #f87171 100%)',
  DAYANIKLI: 'linear-gradient(145deg, #1e40af 0%, #3b82f6 55%, #93c5fd 100%)',
  KISA: 'linear-gradient(145deg, #4b5563 0%, #6b7280 55%, #9ca3af 100%)',
  UZUN: 'linear-gradient(145deg, #374151 0%, #57534e 55%, #78716c 100%)',
  TEKNİK: 'linear-gradient(145deg, #0e7490 0%, #0891b2 55%, #67e8f9 100%)',
  FİNİŞÖR: 'linear-gradient(145deg, #9f1239 0%, #e11d48 55%, #fb7185 100%)',
  ASİSTÇİ: 'linear-gradient(145deg, #047857 0%, #10b981 55%, #6ee7b7 100%)',
  'SERBEST VURUŞ': 'linear-gradient(145deg, #4338ca 0%, #6366f1 55%, #a5b4fc 100%)',
  PENALTI: 'linear-gradient(145deg, #7c2d12 0%, #ea580c 55%, #fdba74 100%)',
  LİDER: 'linear-gradient(145deg, #854d0e 0%, #ca8a04 55%, #fde047 100%)',
  MENTOR: 'linear-gradient(145deg, #581c87 0%, #9333ea 55%, #d8b4fe 100%)',
  KAPİTAN: 'linear-gradient(145deg, #713f12 0%, #b45309 55%, #fcd34d 100%)',
  SAVAŞÇI: 'linear-gradient(145deg, #7f1d1d 0%, #b91c1c 55%, #fca5a5 100%)',
  SOĞUKKANLI: 'linear-gradient(145deg, #155e75 0%, #0891b2 55%, #bae6fd 100%)',
  YERLİ: 'linear-gradient(145deg, #166534 0%, #22c55e 55%, #86efac 100%)',
  'YABANCI YILDIZ': 'linear-gradient(145deg, #312e81 0%, #4f46e5 55%, #a5b4fc 100%)',
  'SOYUNMA ODASI': 'linear-gradient(145deg, #701a75 0%, #c026d3 55%, #f0abfc 100%)',
  TARTIŞMALI: 'linear-gradient(145deg, #831843 0%, #db2777 55%, #f9a8d4 100%)',
  POTANSİYEL: 'linear-gradient(145deg, #065f46 0%, #059669 55%, #34d399 100%)',
  'PİK DÖNEM': 'linear-gradient(145deg, #92400e 0%, #f59e0b 55%, #fde68a 100%)',
  GERİLEYEN: 'linear-gradient(145deg, #44403c 0%, #78716c 55%, #a8a29e 100%)',
  'YENİ SEZON': 'linear-gradient(145deg, #14532d 0%, #16a34a 55%, #4ade80 100%)',
  'SAKATLIK RİSKİ': 'linear-gradient(145deg, #9a3412 0%, #ea580c 55%, #fdba74 100%)',
  'KIRMIZI KART': 'linear-gradient(145deg, #7f1d1d 0%, #ef4444 55%, #fecaca 100%)',
  'PERFORMANS DÜŞÜŞÜ': 'linear-gradient(145deg, #374151 0%, #64748b 55%, #94a3b8 100%)',
};

export function getPlayerInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function getPlayerAvatarBackground(player: Pick<PlayerCard, 'position' | 'tags'>): string {
  const tag = player.tags[0];
  if (tag && TAG_AVATAR_BG[tag]) return TAG_AVATAR_BG[tag];
  const c = POSITION_COLORS[player.position];
  return `linear-gradient(145deg, ${c} 0%, ${c}cc 100%)`;
}

export function formatPosition(position: Position, mode: 'label' | 'badge' = 'label'): string {
  return mode === 'badge' ? POSITION_BADGE[position] : POSITION_LABELS[position];
}

/** Diziliş hover — ana mevki ile slot rolünü karıştırmaz */
export function formatLineupPlayerTip(
  player: Pick<PlayerCard, 'name' | 'currentRating' | 'position'>,
  slotCode: string,
  options: { playableBadges: string; tagLine: string; outOfPosition: boolean },
): string {
  const { playableBadges, tagLine, outOfPosition } = options;
  const lines = [
    `${player.name} · ${player.currentRating}`,
    `Ana mevki: ${POSITION_LABELS[player.position]} (${POSITION_BADGE[player.position]})`,
    `Bu slotta: ${formationSlotLabel(slotCode)} (${slotCode})`,
    `Oynayabildiği: ${playableBadges}`,
    tagLine,
  ];
  if (outOfPosition) {
    lines.push('⚠ Bu slotta uyumsuz oynuyor');
  } else if (POSITION_BADGE[player.position] !== slotCode) {
    lines.push(`Rol: ${formationSlotLabel(slotCode)} slotunda oynuyor`);
  }
  return lines.filter(Boolean).join('\n');
}

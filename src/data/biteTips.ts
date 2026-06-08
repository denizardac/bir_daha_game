import type { EventCard, Tag } from '@/types';
import { TAG_DESCRIPTIONS } from '@/data/tags';

/** Rehberle aynı kaynak — oyun içi hap bilgiler */
export const BITE = {
  tagsIntro:
    'Tag\'ler kartlarda görünür. Aynı tag\'ler bir araya gelince sinerji açılır; taktikler de belirli tag\'lerden bonus alır.',
  tacticIntro:
    'Taktik kartı oyuncu eklemez — formasyon veya oyun sistemi slotuna yerleşir, sonraki maçlarda aktif kalır.',
  tacticBonusIntro:
    'Round 3, 6, 9, 12, 15: taktik bonusu — 2 taktik + 1 antrenman, maç yok, +35 puan.',
  synergyIntro:
    'Sinerji = kadrodaki tag/mevki kombinasyonu. Açılınca gol, galibiyet veya pasif puan bonusu verir.',
  eventIntro:
    'Olay round\'ları: 4, 8, 12. İki seçenek sunulur; ikisi de geçerli — doğru/yanlış yok.',
  eventNoMatch:
    'Olay seçimleri maç sonucunu etkilemez — kadro, moral ve skorunu şekillendirir.',
  playerPick:
    'Rating maç gücünü belirler; tag\'ler sinerji ve taktik bonusu için birikir.',
  positionIntro:
    'Mevki rol etiketidir — kadroya eklersin. Aynı mevkiden birden fazla oyuncu olabilir.',
} as const;

/** Ana menü bilgi paneli — kısa özet (kaydırma yok) */
export const MENU_BITE_TIPS: { icon: string; title: string; text: string; menuText: string }[] = [
  { icon: '🏷️', title: 'Tag\'ler', text: BITE.tagsIntro, menuText: 'Kartlarda görünür — aynı tag\'ler sinerji açar.' },
  { icon: '⚡', title: 'Sinerjiler', text: BITE.synergyIntro, menuText: 'Tag/mevki kombinasyonu — maç ve puan bonusu.' },
  { icon: '📋', title: 'Taktikler', text: BITE.tacticIntro, menuText: 'Slota yerleşir, sonraki maçlarda bonus verir.' },
  { icon: '🎭', title: 'Olaylar', text: BITE.eventIntro, menuText: 'Round 4, 8, 12 — iki seçenek, ikisi geçerli.' },
  { icon: '📍', title: 'Mevkiler', text: BITE.positionIntro, menuText: 'Rol etiketi — aynı mevkiden birden fazla olabilir.' },
];

export const EVENT_CATEGORY_BITE: Record<EventCard['category'], { label: string; desc: string }> = {
  transfer: { label: 'Transfer', desc: 'Oyuncu al/sat, genç yetenek, kadro değişimi' },
  taktik: { label: 'Taktik', desc: 'Formasyon baskısı, saha koşulları, sistem değişikliği' },
  moral: { label: 'Moral', desc: 'Kaptan, soyunma odası, takım ruhu kararları' },
  fiziksel: { label: 'Fiziksel', desc: 'Sakatlık ve yorgunluk — kadro gücünü etkiler' },
  ozel: { label: 'Özel', desc: 'Sürpriz bonuslar, efsane ziyaretleri, sezon olayları' },
};

export function getTagBite(tag: Tag): string {
  return TAG_DESCRIPTIONS[tag];
}

/** Kart seçim ekranı alt başlığı */
export function getCardPickHeaderSubtitle(_offers: unknown[], emptySlots: number, round?: number): string {
  if (round && round > 0 && round % 3 === 0) {
    return 'Taktik bonusu — bu tur maç yok · 2 taktik + antrenman · +35 puan';
  }

  const playerPart =
    emptySlots > 0
      ? `Kadroya eklenir (${emptySlots} boş slot)`
      : 'En zayıfın yerine geçer';

  return `3 oyuncu teklifi · ${playerPart}`;
}

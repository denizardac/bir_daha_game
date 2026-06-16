export type HowToStep = { icon: string; title: string; text: string };

export const HOW_TO_STEPS: HowToStep[] = [
  {
    icon: '⚽',
    title: 'Başla',
    text: '7 oyuncuyla başlarsın. 15 round boyunca kadroyu 11\'e tamamlamaya çalışırsın.',
  },
  {
    icon: '🃏',
    title: 'Kart Seç',
    text: 'Her round 3 karttan birini al: yeni oyuncu, taktik veya özel antrenman.',
  },
  {
    icon: '⚡',
    title: 'Maç & Puan',
    text: 'Seçimden sonra maç oynanır. Gol, sinerji ve seri skoru yükseltir.',
  },
  {
    icon: '💔',
    title: 'Kayıp',
    text: 'Mağlubiyette en zayıf oyuncu gider. Kadro 4\'e düşerse run biter.',
  },
  {
    icon: '📋',
    title: 'Taktik',
    text: 'Round 3/6/9/12\'de formasyon + oyun sistemi seç. İkisi birlikte bonus verir.',
  },
  {
    icon: '🏆',
    title: 'Sinerji & Olay',
    text: 'Aynı tag\'leri topla, sinerji aç. Round 4/8/11/14\'te olay kartı gelir.',
  },
];

export const HOW_TO_LEFT = HOW_TO_STEPS.slice(0, 3);
export const HOW_TO_RIGHT = HOW_TO_STEPS.slice(3, 6);

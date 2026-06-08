export type HowToStep = { icon: string; title: string; text: string };

export const HOW_TO_STEPS: HowToStep[] = [
  {
    icon: '⚽',
    title: 'Başla',
    text: '7 oyuncuyla başla. 15 round boyunca kadroyu 11\'e tamamla — her round bir karar.',
  },
  {
    icon: '🃏',
    title: 'Kart Seç',
    text: 'Her round 3 karttan birini seç: oyuncu, taktik veya antrenman (bonus round).',
  },
  {
    icon: '⚡',
    title: 'Maç & Puan',
    text: 'Seçimden sonra maç oynanır. Gol, galibiyet ve sinerji bonusları skoru artırır.',
  },
  {
    icon: '💔',
    title: 'Kayıp',
    text: 'Mağlubiyette en düşük ayrılma skorlu oyuncu gider. 4 oyuncu kalırsa run sona erer.',
  },
  {
    icon: '📋',
    title: 'Taktik Slotları',
    text: 'Formasyon + oyun sistemi ayrı slot. İkisi birlikte aktif kalır, maç bonusu verir.',
  },
  {
    icon: '🏆',
    title: 'Sinerji & Olay',
    text: 'Tag\'ler sinerji açar. Round 4, 8 ve 12\'de olay kartı — iki seçenek, ikisi geçerli.',
  },
];

export const HOW_TO_LEFT = HOW_TO_STEPS.slice(0, 3);
export const HOW_TO_RIGHT = HOW_TO_STEPS.slice(3, 6);

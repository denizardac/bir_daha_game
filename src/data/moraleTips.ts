/** Moral nasıl değişir — maç öncesi ipuçları */
export const MORALE_CHANGE_TIPS = [
  { theme: 'win', icon: '🏆', label: 'Galibiyet', delta: '+10', tip: 'Maçı kazanınca moral yükselir' },
  { theme: 'draw', icon: '🤝', label: 'Beraberlik', delta: '-5', tip: 'Puan alırsın ama moral hafif düşer' },
  { theme: 'loss', icon: '💔', label: 'Mağlubiyet', delta: '-20', tip: 'Kaybedince moral ciddi düşer — oyuncu da gidebilir' },
  { theme: 'tactic', icon: '📋', label: 'Taktik bonusu', delta: '+8', tip: 'Round 3,6,9,12,15 — maç yok, moral artışı' },
  { theme: 'event', icon: '🎭', label: 'Olay seçimi', delta: '±', tip: 'Round 4,8,11,14 olayları moralini etkiler' },
] as const;

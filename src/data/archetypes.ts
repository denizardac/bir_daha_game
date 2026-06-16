import type { PlayerCard, Position, Tag } from '@/types';

export type Archetype = { label: string; icon: string };

function has(tags: Tag[], t: Tag): boolean {
  return tags.includes(t);
}

/**
 * Oyuncunun mevki + tag'lerinden okunabilir bir "arketip" etiketi türetir.
 * Seçim ekranında hızlı kimlik / karar netliği sağlar (ör. "Yıkıcı Stoper", "Poacher").
 * Tamamen türetilmiştir — veride saklanmaz, böylece her zaman tutarlı kalır.
 */
export function getPlayerArchetype(card: { position: Position; tags: Tag[] }): Archetype {
  const t = card.tags;
  switch (card.position) {
    case 'KL':
      if (has(t, 'PENALTI') || has(t, 'SERBEST VURUŞ')) return { label: 'Sweeper-Keeper', icon: '🧤' };
      if (has(t, 'SOĞUKKANLI')) return { label: 'Soğukkanlı Kaleci', icon: '🧤' };
      if (has(t, 'LİDER')) return { label: 'Lider Kaleci', icon: '🧤' };
      return { label: 'Kale Bekçisi', icon: '🧤' };

    case 'STP':
      if (has(t, 'KAPİTAN') || has(t, 'LİDER')) return { label: 'Lider Stoper', icon: '🛡️' };
      if (has(t, 'UZUN')) return { label: 'Hava Hâkimi', icon: '🛡️' };
      if (has(t, 'GÜÇLÜ') || has(t, 'SAVAŞÇI')) return { label: 'Yıkıcı Stoper', icon: '🛡️' };
      if (has(t, 'TEKNİK')) return { label: 'Top Çıkaran Stoper', icon: '🛡️' };
      return { label: 'Klasik Stoper', icon: '🛡️' };

    case 'SLB':
    case 'SÖB':
      if (has(t, 'ASİSTÇİ')) return { label: 'Ortacı Bek', icon: '🏃' };
      if (has(t, 'HIZLI')) return { label: 'Akıncı Bek', icon: '🏃' };
      if (has(t, 'GÜÇLÜ')) return { label: 'Savunmacı Bek', icon: '🏃' };
      return { label: 'Modern Bek', icon: '🏃' };

    case 'DOS':
      if (has(t, 'TEKNİK')) return { label: 'Derin Playmaker', icon: '⚙️' };
      if (has(t, 'GÜÇLÜ') || has(t, 'SAVAŞÇI')) return { label: 'Yıkıcı 6 Numara', icon: '⚙️' };
      return { label: 'Saha Süpürgesi', icon: '⚙️' };

    case 'OS':
      if (has(t, 'KAPİTAN') || has(t, 'LİDER')) return { label: 'Saha Generali', icon: '🎯' };
      if (has(t, 'ASİSTÇİ') && has(t, 'TEKNİK')) return { label: 'Maestro', icon: '🎯' };
      if (has(t, 'TEKNİK')) return { label: 'Playmaker', icon: '🎯' };
      if (has(t, 'ASİSTÇİ')) return { label: 'Pas Ustası', icon: '🎯' };
      return { label: 'Box-to-Box', icon: '🎯' };

    case 'OOS':
      if (has(t, 'FİNİŞÖR')) return { label: 'Gölge Forvet', icon: '🔟' };
      if (has(t, 'ASİSTÇİ')) return { label: 'Pas Ustası', icon: '🔟' };
      if (has(t, 'HIZLI')) return { label: 'Dinamo 10', icon: '🔟' };
      return { label: '10 Numara', icon: '🔟' };

    case 'SLK':
    case 'SÖK':
      if (has(t, 'FİNİŞÖR')) return { label: 'Golcü Kanat', icon: '⚡' };
      if (has(t, 'ASİSTÇİ')) return { label: 'Ortacı Kanat', icon: '⚡' };
      if (has(t, 'HIZLI')) return { label: 'Hız Kanadı', icon: '⚡' };
      if (has(t, 'TEKNİK')) return { label: 'Çalımcı Kanat', icon: '⚡' };
      return { label: 'Kanat Oyuncusu', icon: '⚡' };

    case 'SF':
      if (has(t, 'SOĞUKKANLI') || (has(t, 'FİNİŞÖR') && !has(t, 'GÜÇLÜ') && !has(t, 'HIZLI')))
        return { label: 'Poacher', icon: '🎯' };
      if (has(t, 'GÜÇLÜ') || has(t, 'UZUN')) return { label: 'Hedef Forvet', icon: '🎯' };
      if (has(t, 'HIZLI')) return { label: 'Kontra Forveti', icon: '🎯' };
      if (has(t, 'TEKNİK')) return { label: 'Yaratıcı Forvet', icon: '🎯' };
      return { label: 'Santrafor', icon: '🎯' };

    default:
      return { label: 'Oyuncu', icon: '⚽' };
  }
}

export function getPlayerArchetypeLabel(card: PlayerCard): string {
  return getPlayerArchetype(card).label;
}

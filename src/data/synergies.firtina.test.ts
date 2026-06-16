import { describe, expect, it } from 'vitest';
import { getKarmaFirtinaProgress, getSynergyById } from '@/data/synergies';
import type { PlayerCard } from '@/types';

function player(tags: string[], id = 'p'): PlayerCard {
  return {
    kind: 'player',
    id,
    name: `Oyuncu ${id}`,
    rating: 70,
    currentRating: 70,
    position: 'OS',
    rarity: 'normal',
    tags: tags as PlayerCard['tags'],
  };
}

describe('KARMA FIRTINA ilerleme', () => {
  it('tag sayılarını parça parça sayar (7 puan)', () => {
    const squad = [
      player(['HIZLI'], '1'),
      player(['HIZLI'], '2'),
      player(['HIZLI'], '3'),
      player(['TEKNİK'], '4'),
    ];
    const p = getKarmaFirtinaProgress(squad);
    expect(p).toMatchObject({ current: 4, required: 7 });
    expect(p?.note).toContain('3/4');
    expect(p?.note).toContain('1/2');
  });

  it('tüm koşullar sağlanınca null döner', () => {
    const squad = [
      ...Array.from({ length: 4 }, (_, i) => player(['HIZLI'], `h${i}`)),
      player(['TEKNİK'], 't1'),
      player(['TEKNİK'], 't2'),
      player(['ASİSTÇİ'], 'a1'),
    ];
    expect(getKarmaFirtinaProgress(squad)).toBeNull();
    expect(getSynergyById('synergy_firtina')!.check(squad)).toBe(true);
  });

  it('kart eklenince ilerleme artar', () => {
    const squad = [
      ...Array.from({ length: 3 }, (_, i) => player(['HIZLI'], `h${i}`)),
      player(['TEKNİK'], 't1'),
    ];
    const before = getSynergyById('synergy_firtina')!.getProgress!(squad);
    const after = getSynergyById('synergy_firtina')!.getProgress!(squad, player(['HIZLI'], 'h4'));
    expect(before?.current).toBe(4);
    expect(after?.current).toBe(5);
  });
});

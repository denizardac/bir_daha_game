import { describe, expect, it } from 'vitest';
import { SYNERGIES } from '@/data/synergies';
import type { PlayerCard, Tag } from '@/types';

function player(id: string, tags: Tag[]): PlayerCard {
  return {
    kind: 'player',
    id,
    name: id,
    rating: 70,
    currentRating: 70,
    position: 'OS',
    rarity: 'iyi',
    tags,
  };
}

describe('nadir sinerji erişilebilirliği', () => {
  it('bir yeni sezon oyuncusu ile bir mentor YENİ SEZON PATLAMASI açar', () => {
    const synergy = SYNERGIES.find((candidate) => candidate.id === 'synergy_yenisezon_patlama')!;
    const squad = [player('newcomer', ['YENİ SEZON']), player('mentor', ['MENTOR'])];

    expect(synergy.check(squad, 50)).toBe(true);
    expect(synergy.getProgress?.([player('newcomer', ['YENİ SEZON'])])).toMatchObject({
      current: 1,
      required: 2,
    });
  });
});

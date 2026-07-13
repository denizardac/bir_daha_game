import { describe, expect, it } from 'vitest';
import { SYNERGIES } from '@/data/synergies';
import type { PlayerCard, Tag } from '@/types';

function p(id: string, tags: Tag[]): PlayerCard {
  return { kind: 'player', id, name: id, rating: 70, currentRating: 70, position: 'OS', rarity: 'iyi', tags };
}

describe('KARMA DENGE erişilebilirliği', () => {
  const synergy = SYNERGIES.find((candidate) => candidate.id === 'synergy_karma_guc')!;

  it('3 YERLİ ve 2 YABANCI YILDIZ ile açılır', () => {
    const squad = [
      p('l1', ['YERLİ']), p('l2', ['YERLİ']), p('l3', ['YERLİ']),
      p('s1', ['YABANCI YILDIZ']), p('s2', ['YABANCI YILDIZ']),
    ];
    expect(synergy.check(squad, 50)).toBe(true);
  });

  it('bileşik ilerlemeyi 5 parçalı hedef olarak gösterir', () => {
    const progress = synergy.getProgress?.([
      p('l1', ['YERLİ']), p('l2', ['YERLİ']), p('s1', ['YABANCI YILDIZ']),
    ]);
    expect(progress).toMatchObject({ current: 3, required: 5 });
    expect(progress?.note).toContain('YERLİ 2/3');
    expect(progress?.note).toContain('YABANCI YILDIZ 1/2');
  });
});

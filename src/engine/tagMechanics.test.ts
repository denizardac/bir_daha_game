import { describe, expect, it } from 'vitest';
import type { PlayerCard } from '@/types';
import {
  attackTagMultiplier,
  TAG_MECHANIC_DESCRIPTIONS,
  passiveTagRoundPoints,
  riskTagStrengthPenalty,
} from './tagMechanics';
import { TAG_DESCRIPTIONS } from '@/data/tags';

function p(tags: string[]): PlayerCard {
  return {
    kind: 'player',
    id: 'x',
    name: 'X',
    rating: 70,
    currentRating: 70,
    position: 'OS',
    rarity: 'normal',
    tags: tags as never[],
    potentialCeiling: 85,
    isStarter: false,
  };
}

describe('tagMechanics', () => {
  it('tooltip açıklamaları kodla senkron', () => {
    for (const [tag, desc] of Object.entries(TAG_DESCRIPTIONS)) {
      expect(TAG_MECHANIC_DESCRIPTIONS[tag as keyof typeof TAG_MECHANIC_DESCRIPTIONS]).toBe(desc);
    }
  });

  it('HIZLI tek başına TEKNİKten zayıf katkı verir', () => {
    const fast = attackTagMultiplier([p(['HIZLI'])]);
    const tech = attackTagMultiplier([p(['TEKNİK'])]);
    expect(tech).toBeGreaterThan(fast);
  });

  it('YABANCI YILDIZ maç sonu pasif puan verir', () => {
    expect(passiveTagRoundPoints([p(['YABANCI YILDIZ'])])).toBe(4);
  });

  it('risk tagleri gerçek güç bedeli uygular', () => {
    expect(riskTagStrengthPenalty([p(['KIRMIZI KART'])], 80)).toBeLessThan(1);
    expect(riskTagStrengthPenalty([p(['TARTIŞMALI'])], 50)).toBeLessThan(1);
    expect(riskTagStrengthPenalty([p(['TARTIŞMALI'])], 80)).toBe(1);
  });
});

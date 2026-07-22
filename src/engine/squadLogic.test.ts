import { describe, expect, it } from 'vitest';
import { SYNERGIES } from '@/data/synergies';
import type { PlayerCard } from '@/types';
import { applyGerileyen, applyPostMatchPlayerUpdates } from './squadLogic';

function player(overrides: Partial<PlayerCard> & Pick<PlayerCard, 'id'>): PlayerCard {
  return {
    kind: 'player',
    name: overrides.name ?? overrides.id,
    rating: overrides.rating ?? 70,
    currentRating: overrides.currentRating ?? overrides.rating ?? 70,
    position: overrides.position ?? 'OS',
    rarity: overrides.rarity ?? 'normal',
    tags: overrides.tags ?? [],
    potentialCeiling: overrides.potentialCeiling ?? 85,
    isStarter: overrides.isStarter ?? false,
    ...overrides,
  };
}

describe('applyGerileyen', () => {
  it('DAYANIKLI oyuncu gerileme ve performans düşüşünden etkilenmez', () => {
    const durable = player({
      id: 'd1',
      tags: ['DAYANIKLI', 'GERİLEYEN', 'PERFORMANS DÜŞÜŞÜ'],
      currentRating: 70,
      matchesPlayed: 2,
    });
    const [after] = applyGerileyen([durable]);
    expect(after?.currentRating).toBe(70);
    expect(after?.matchesPlayed).toBe(2);
  });

  it('PERFORMANS DÜŞÜŞÜ her 3 maçta −2 uygular', () => {
    const tired = player({
      id: 'p1',
      tags: ['PERFORMANS DÜŞÜŞÜ'],
      currentRating: 70,
      matchesPlayed: 2,
    });
    const [after] = applyGerileyen([tired]);
    expect(after?.currentRating).toBe(68);
    expect(after?.matchesPlayed).toBe(3);
  });
});

describe('applyPostMatchPlayerUpdates', () => {
  it('önce önceki geçici cezayı temizler, sonra yeni sakatlığı sonraki maça taşır', () => {
    const risky = player({
      id: 'risk',
      tags: ['SAKATLIK RİSKİ'],
      currentRating: 80,
      tempRatingMod: -5,
    });

    const [after] = applyPostMatchPlayerUpdates([risky], 5, [], () => 0);

    expect(after?.tempRatingMod).toBe(-6);
  });
});

describe('YERLİ KADRO sinerjisi', () => {
  const evSahibi = SYNERGIES.find((s) => s.id === 'synergy_ev_sahibi')!;

  it('5 yerli ile aktif olur, 4 ile olmaz', () => {
    const four = Array.from({ length: 4 }, (_, i) => player({ id: `y${i}`, tags: ['YERLİ'] }));
    const five = [...four, player({ id: 'y4', tags: ['YERLİ'] })];

    expect(evSahibi.check(four, 50)).toBe(false);
    expect(evSahibi.check(five, 50)).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { canPassCardPick } from '@/engine/cardPass';
import type { PlayerCard } from '@/types';

const playerOffer = (id: string): PlayerCard => ({
  kind: 'player',
  id,
  name: 'Test',
  rating: 70,
  currentRating: 70,
  position: 'OS',
  rarity: 'normal',
  tags: [],
});

describe('canPassCardPick', () => {
  it('allows pass when squad is full on normal player rounds', () => {
    expect(canPassCardPick({
      phase: 'cardSelect',
      round: 2,
      maxRounds: 15,
      squadLength: 11,
      maxSquadSize: 11,
      currentOffers: [playerOffer('a'), playerOffer('b'), playerOffer('c')],
    })).toBe(true);
  });

  it('blocks pass when squad has empty slots', () => {
    expect(canPassCardPick({
      phase: 'cardSelect',
      round: 2,
      maxRounds: 15,
      squadLength: 8,
      maxSquadSize: 11,
      currentOffers: [playerOffer('a'), playerOffer('b'), playerOffer('c')],
    })).toBe(false);
  });

  it('blocks pass on tactic bonus and finale rounds', () => {
    const base = {
      phase: 'cardSelect' as const,
      maxRounds: 15,
      squadLength: 11,
      maxSquadSize: 11,
      currentOffers: [playerOffer('a'), playerOffer('b'), playerOffer('c')],
    };
    expect(canPassCardPick({ ...base, round: 3 })).toBe(false);
    expect(canPassCardPick({ ...base, round: 15 })).toBe(false);
  });
});

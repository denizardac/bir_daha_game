import { describe, expect, it } from 'vitest';
import { drawOffers } from '@/engine/cardDraw';
import { isPlayerCard } from '@/types';

describe('drawOffers', () => {
  it('returns 3 offers for normal round', () => {
    const offers = drawOffers('test-seed-1', 2, 0, [], [], false, 0);
    expect(offers).toHaveLength(3);
    expect(offers.every((c) => c.kind === 'player' || c.kind === 'tactic' || c.kind === 'training')).toBe(true);
  });

  it('is deterministic for same seed and round', () => {
    const a = drawOffers('stable-seed', 5, 1, ['p1'], [], false, 0);
    const b = drawOffers('stable-seed', 5, 1, ['p1'], [], false, 0);
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
  });

  it('boosts rarity on reroll index', () => {
    const base = drawOffers('reroll-seed', 6, 0, [], [], false, 0).filter(isPlayerCard);
    const boosted = drawOffers('reroll-seed', 6, 0, [], [], false, 2).filter(isPlayerCard);
    const avg = (cards: typeof base) =>
      cards.reduce((s, c) => s + c.rating, 0) / Math.max(cards.length, 1);
    expect(avg(boosted)).toBeGreaterThanOrEqual(avg(base) - 5);
  });
});

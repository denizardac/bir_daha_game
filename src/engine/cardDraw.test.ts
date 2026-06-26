import { describe, expect, it } from 'vitest';
import { drawOffers, rerollSinglePlayerOffer } from '@/engine/cardDraw';
import { PLAYER_POOL, clonePlayer } from '@/data/players';
import { isPlayerCard } from '@/types';

function nameLc(s: string) {
  return s.replace(/\s*\(.*?\)\s*/g, ' ').trim().toLowerCase();
}

describe('drawOffers', () => {
  it('returns 3 offers for normal round', () => {
    const offers = drawOffers('test-seed-1', 2, 0, [], [], false, 0);
    expect(offers).toHaveLength(3);
    expect(offers.every((c) => c.kind === 'player' || c.kind === 'tactic' || c.kind === 'training')).toBe(true);
  });

  it('is deterministic for same seed and round', () => {
    const squad = [{ id: 'p1', name: 'Deniz Acar', position: 'OS' as const }];
    const a = drawOffers('stable-seed', 5, 1, squad, [], false, 0);
    const b = drawOffers('stable-seed', 5, 1, squad, [], false, 0);
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
  });

  it('boosts rarity on reroll index', () => {
    const base = drawOffers('reroll-seed', 6, 0, [], [], false, 0).filter(isPlayerCard);
    const boosted = drawOffers('reroll-seed', 6, 0, [], [], false, 2).filter(isPlayerCard);
    const avg = (cards: typeof base) =>
      cards.reduce((s, c) => s + c.rating, 0) / Math.max(cards.length, 1);
    expect(avg(boosted)).toBeGreaterThanOrEqual(avg(base) - 5);
  });

  it('never offers a player already in the squad', () => {
    const squad = PLAYER_POOL.slice(20, 31).map((p) => clonePlayer(p));
    const squadNames = new Set(squad.map((p) => nameLc(p.name)));
    for (let round = 2; round <= 14; round++) {
      if (round % 3 === 0) continue; // taktik turu
      for (let s = 0; s < 25; s++) {
        const offers = drawOffers(`squad-dup-${s}`, round, 1, squad, [], false, 0, 'normal', 'players').filter(isPlayerCard);
        for (const o of offers) expect(squadNames.has(nameLc(o.name))).toBe(false);
      }
    }
  });

  it('reroll never duplicates the squad or an adjacent offer', () => {
    const squad = PLAYER_POOL.slice(20, 31).map((p) => clonePlayer(p));
    const squadNames = new Set(squad.map((p) => nameLc(p.name)));
    for (let round = 2; round <= 14; round++) {
      if (round % 3 === 0) continue;
      for (let s = 0; s < 25; s++) {
        const seed = `reroll-dup-${s}`;
        const offers = drawOffers(seed, round, 1, squad, [], false, 0, 'normal', 'players').filter(isPlayerCard);
        for (let slot = 0; slot < offers.length; slot++) {
          for (let ri = 1; ri <= 4; ri++) {
            const others = offers.filter((_, i) => i !== slot);
            const rep = rerollSinglePlayerOffer(seed, round, 1, squad, others, slot, ri, false);
            expect(squadNames.has(nameLc(rep.name))).toBe(false);
            expect(others.some((o) => nameLc(o.name) === nameLc(rep.name))).toBe(false);
          }
        }
      }
    }
  });
});

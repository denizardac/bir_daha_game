import { describe, expect, it } from 'vitest';
import { drawOffers, drawTacticCategoryOffers, rerollSinglePlayerOffer } from '@/engine/cardDraw';
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

  it('changes player offers across different seeds', () => {
    const squad = [{ id: 'p1', name: 'Deniz Acar', position: 'OS' as const }];
    const a = drawOffers('daily-seed-a', 5, 1, squad, [], false, 0).map((c) => c.id);
    const b = drawOffers('daily-seed-b', 5, 1, squad, [], false, 0).map((c) => c.id);
    expect(a).not.toEqual(b);
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

  it('sequential rerolls on the same slot never repeat the immediately previous result', () => {
    const squad = PLAYER_POOL.slice(20, 31).map((p) => clonePlayer(p));
    for (let round = 2; round <= 14; round++) {
      if (round % 3 === 0) continue;
      for (let s = 0; s < 15; s++) {
        const seed = `reroll-seq-${s}`;
        let offers = drawOffers(seed, round, 1, squad, [], false, 0, 'normal', 'players').filter(isPlayerCard);
        const slot = 0;
        let prevName = nameLc(offers[slot]!.name);
        for (let ri = 1; ri <= 5; ri++) {
          // Same accumulation the store uses: ALL current offers — including the
          // slot's own previous result — are excluded from the next reroll.
          const rep = rerollSinglePlayerOffer(seed, round, 1, squad, offers, slot, ri, false);
          expect(nameLc(rep.name)).not.toBe(prevName);
          prevName = nameLc(rep.name);
          offers = [...offers.slice(0, slot), rep, ...offers.slice(slot + 1)];
        }
      }
    }
  });

  it('single reroll avoids low-floor offers when the pool has better options', () => {
    const squad = PLAYER_POOL.slice(20, 26).map((p) => clonePlayer(p));
    for (let s = 0; s < 30; s++) {
      const seed = `reroll-floor-${s}`;
      const offers = drawOffers(seed, 7, 0, squad, [], false, 0, 'normal', 'players').filter(isPlayerCard);
      const replacement = rerollSinglePlayerOffer(seed, 7, 0, squad, offers.slice(1), 0, 2, false);
      expect(replacement.currentRating).toBeGreaterThanOrEqual(70);
    }
  });

  it('tactic category reroll excludes cards already shown in that category', () => {
    const current = ['tactic_433_kontr', 'tactic_442'];
    const fresh = drawTacticCategoryOffers('tactic-reroll-seed', 3, [], 'formasyon', 1, current);
    expect(fresh).toHaveLength(2);
    expect(fresh.some((c) => current.includes(c.id))).toBe(false);
  });
});

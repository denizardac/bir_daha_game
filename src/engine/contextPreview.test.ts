import { describe, expect, it } from 'vitest';
import { getPlayerPickSummary } from '@/engine/contextPreview';
import type { PlayerCard } from '@/types';

function p(
  overrides: Partial<PlayerCard> & Pick<PlayerCard, 'id' | 'name' | 'position'>,
): PlayerCard {
  return {
    kind: 'player',
    rating: 70,
    currentRating: 70,
    rarity: 'iyi',
    tags: [],
    ...overrides,
  };
}

describe('getPlayerPickSummary — çıkış metni', () => {
  it('kadro dolu + yedek kaleci: kadrodan çıkar (yedeğe inmez)', () => {
    const squad: PlayerCard[] = [
      p({ id: 'gk1', name: 'Asıl Kaleci', position: 'KL', currentRating: 75, rating: 75 }),
      p({ id: 'gk2', name: 'Flash Kane', position: 'KL', currentRating: 64, rating: 64 }),
      ...['slb', 'stp1', 'stp2', 'sgb', 'dos', 'os', 'slk', 'sf1', 'sf2'].map((id, i) =>
        p({
          id,
          name: id,
          position: (['SLB', 'STP', 'STP', 'SÖB', 'DOS', 'OS', 'SLK', 'SF', 'SF'] as const)[i]!,
          currentRating: 68 + i,
          rating: 68 + i,
        }),
      ),
    ];
    expect(squad.length).toBe(11);
    const incoming = p({ id: 'new', name: 'Kanat', position: 'SÖK', currentRating: 72, rating: 72 });
    const summary = getPlayerPickSummary(incoming, squad, 11, 50, []);
    expect(summary.text).toMatch(/SĞK slotuna girer/);
    expect(summary.text).toMatch(/Flash Kane.*kadrodan çıkar/);
    expect(summary.text).not.toMatch(/yedeğe iner/);
    expect(summary.replacementKind).toBe('squad');
  });
});

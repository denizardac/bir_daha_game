import { describe, expect, it } from 'vitest';
import { getStartingSquad } from './players';

describe('getStartingSquad traits', () => {
  it('daily squad keeps only fixed template tags', () => {
    const squad = getStartingSquad('daily', true);
    const withTrait = squad.filter((p) => p.tags.length > 0);
    expect(withTrait).toHaveLength(1);
    expect(withTrait[0]?.name).toBe('Burak Koç');
    expect(withTrait[0]?.tags).toEqual(['GÜÇLÜ']);
  });

  it('free squad does not force pool template tags on every player', () => {
    let traitlessPlayers = 0;
    let squadsWithTraitless = 0;

    for (let i = 0; i < 100; i++) {
      const squad = getStartingSquad(`free-trait-${i}`, false);
      const empty = squad.filter((p) => p.tags.length === 0).length;
      traitlessPlayers += empty;
      if (empty > 0) squadsWithTraitless++;
    }

    expect(traitlessPlayers).toBeGreaterThan(200);
    expect(squadsWithTraitless).toBeGreaterThan(80);
  });
});

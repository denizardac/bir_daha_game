import { describe, expect, it } from 'vitest';
import { PLAYER_POOL, getStartingSquad } from './players';

describe('getStartingSquad traits', () => {
  it('daily squad is deterministic per seed but changes across seeds', () => {
    const a = getStartingSquad('2026-06-27-gunluk', true);
    const b = getStartingSquad('2026-06-27-gunluk', true);
    const c = getStartingSquad('2026-06-28-gunluk', true);

    expect(a.map((p) => `${p.name}-${p.currentRating}-${p.tags.join(',')}`)).toEqual(
      b.map((p) => `${p.name}-${p.currentRating}-${p.tags.join(',')}`),
    );
    expect(a.map((p) => p.name)).not.toEqual(c.map((p) => p.name));
    expect(a).toHaveLength(7);
    expect(a.filter((p) => p.position === 'KL')).toHaveLength(1);
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

  it('keeps every legendary card curated with an imza quote', () => {
    const legends = PLAYER_POOL.filter((p) => p.rarity === 'efsane');
    expect(legends).toHaveLength(34);
    expect(legends.every((p) => p.signature && p.signatureQuote)).toBe(true);
  });
});

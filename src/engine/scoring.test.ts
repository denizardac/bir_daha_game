import { describe, expect, it } from 'vitest';
import { getTacticEffect } from '@/data/tactics';
import { calculateRoundPoints } from '@/engine/scoring';
import type { MatchResult, PlayerCard } from '@/types';

function mockMatch(overrides: Partial<MatchResult> = {}): MatchResult {
  return {
    outcome: 'win',
    goalsFor: 2,
    goalsAgainst: 1,
    cleanSheet: false,
    opponent: { name: 'Test', rating: 75, style: 'dengeli' },
    highlights: [],
    activeSynergies: [],
    newlyDiscoveredSynergies: [],
    roundPoints: 0,
    events: [],
    ...overrides,
  };
}

describe('calculateRoundPoints', () => {
  const squad = [
    { kind: 'player' as const, id: '1', name: 'A', rating: 70, currentRating: 70, position: 'OS' as const, rarity: 'normal' as const, tags: [] },
  ];

  it('returns 0 on loss', () => {
    expect(calculateRoundPoints(mockMatch({ outcome: 'loss' }), squad, 50, 0, 2, 0)).toBe(0);
  });

  it('awards win points from goals and opponent', () => {
    const pts = calculateRoundPoints(mockMatch(), squad, 50, 0, 2, 0);
    expect(pts).toBeGreaterThan(100);
  });

  it('adds timer bonus when seconds remain', () => {
    const base = calculateRoundPoints(mockMatch(), squad, 50, 0, 2, 0, [], 0);
    const withTimer = calculateRoundPoints(mockMatch(), squad, 50, 0, 2, 0, [], 10);
    expect(withTimer - base).toBe(50);
  });

  it('applies streak multiplier on win', () => {
    const noStreak = calculateRoundPoints(mockMatch(), squad, 50, 0, 3, 0);
    const streak = calculateRoundPoints(mockMatch(), squad, 50, 3, 3, 0);
    expect(streak).toBeGreaterThan(noStreak);
  });

  it('scores possession draw bonus for a technical squad', () => {
    const technicalPositions = ['KL', 'STP', 'OS', 'SF'] as const;
    const technicalSquad: PlayerCard[] = technicalPositions.map((position, i) => ({
      kind: 'player',
      id: `t${i}`,
      name: `T${i}`,
      rating: 70,
      currentRating: 70,
      position,
      rarity: 'normal',
      tags: ['TEKNİK'],
    }));
    const draw = mockMatch({ outcome: 'draw', goalsFor: 1, goalsAgainst: 1 });
    const base = calculateRoundPoints(draw, technicalSquad, 50, 0, 4, 0);
    const withTactic = calculateRoundPoints(draw, technicalSquad, 50, 0, 4, 0, [getTacticEffect('tactic_topla_oyn')]);
    expect(withTactic - base).toBe(176);
  });

  it('scores direct football first-strike bonus for fast squads', () => {
    const fastSquad: PlayerCard[] = Array.from({ length: 3 }, (_, i) => ({
      kind: 'player',
      id: `f${i}`,
      name: `F${i}`,
      rating: 70,
      currentRating: 70,
      position: i === 0 ? 'SLK' : i === 1 ? 'SÖK' : 'SF',
      rarity: 'normal',
      tags: ['HIZLI'],
    }));
    const base = calculateRoundPoints(mockMatch({ goalsFor: 2 }), fastSquad, 50, 0, 4, 0);
    const withTactic = calculateRoundPoints(mockMatch({ goalsFor: 2 }), fastSquad, 50, 0, 4, 0, [getTacticEffect('tactic_direkt')]);
    expect(withTactic - base).toBe(195);
  });

  it('scores clean-sheet system bonuses', () => {
    const draw = mockMatch({ outcome: 'draw', goalsFor: 0, goalsAgainst: 0, cleanSheet: true });
    const base = calculateRoundPoints(draw, squad, 50, 0, 5, 0);
    const withTactic = calculateRoundPoints(draw, squad, 50, 0, 5, 0, [getTacticEffect('tactic_catenaccio')]);
    expect(withTactic - base).toBe(100);
  });
});

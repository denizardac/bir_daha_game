import { describe, expect, it } from 'vitest';
import { analyzeEgoReplay } from '@/engine/egoAnalysis';
import type { RoundResult } from '@/types';

describe('analyzeEgoReplay', () => {
  it('returns null decisions for empty history', () => {
    const result = analyzeEgoReplay([], 'ego-seed');
    expect(result.bestDecision).toBeNull();
    expect(result.worstMistake).toBeNull();
  });

  it('finds best decision when alternatives differ', () => {
    const history: RoundResult[] = [
      {
        round: 1,
        isTacticBonus: false,
        cardsShown: [
          { kind: 'player', id: 'a', name: 'A', rating: 60, currentRating: 60, position: 'OS', rarity: 'normal', tags: [] },
          { kind: 'player', id: 'b', name: 'B', rating: 85, currentRating: 85, position: 'SF', rarity: 'güçlü', tags: ['HIZLI'] },
        ],
        cardSelected: { kind: 'player', id: 'a', name: 'A', rating: 60, currentRating: 60, position: 'OS', rarity: 'normal', tags: [] },
        pointsEarned: 120,
        matchResult: {
          outcome: 'win',
          goalsFor: 2,
          goalsAgainst: 1,
          cleanSheet: false,
          opponent: { name: 'X', rating: 70, style: 'dengeli' },
          highlights: [],
          activeSynergies: [],
          newlyDiscoveredSynergies: [],
          roundPoints: 120,
          events: [],
        },
      },
    ];

    const result = analyzeEgoReplay(history, 'ego-seed');
    expect(result.bestDecision).not.toBeNull();
    expect(result.bestDecision?.round).toBe(1);
  });
});

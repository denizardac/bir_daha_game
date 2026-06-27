import { describe, expect, it } from 'vitest';
import { buildOfferSynergyHint, sumRoundHistoryPoints, validateRunSubmissionSync } from '@/engine/runValidation';
import { SYNERGIES } from '@/data/synergies';
import type { RoundResult } from '@/types';

describe('runValidation', () => {
  it('sums round history points', () => {
    const history = [
      { pointsEarned: 100 },
      { pointsEarned: 250 },
    ] as RoundResult[];
    expect(sumRoundHistoryPoints(history)).toBe(350);
  });

  it('rejects score mismatch', () => {
    const result = validateRunSubmissionSync(
      {
        id: 'p1',
        seed: 'test-seed',
        displayName: 'Test',
        totalScore: 99999,
        roundsCompleted: 5,
        timestamp: Date.now(),
      },
      [{ round: 1, pointsEarned: 100, cardSelected: { id: 'a' } } as RoundResult],
      'abcd1234abcd1234',
    );
    expect(result.ok).toBe(false);
  });

  it('rejects selected player cards that were not shown', () => {
    const result = validateRunSubmissionSync(
      {
        id: 'p1',
        seed: 'test-seed',
        displayName: 'Test',
        totalScore: 100,
        roundsCompleted: 1,
        timestamp: Date.now(),
      },
      [{
        round: 1,
        pointsEarned: 100,
        cardsShown: [{ kind: 'player', id: 'shown', name: 'Shown', rating: 70, currentRating: 70, position: 'OS', rarity: 'normal', tags: [] }],
        cardSelected: { kind: 'player', id: 'forged', name: 'Forged', rating: 99, currentRating: 99, position: 'SF', rarity: 'efsane', tags: [] },
        matchResult: { outcome: 'win', goalsFor: 1, goalsAgainst: 0, cleanSheet: true, opponent: { name: 'X', rating: 60, style: 'dengeli' }, highlights: [], activeSynergies: [], newlyDiscoveredSynergies: [], roundPoints: 100, events: [] },
      } as RoundResult],
      'abcd1234abcd1234',
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('tekliflerde yok');
  });

  it('accepts event entries without cardsShown', () => {
    const result = validateRunSubmissionSync(
      {
        id: 'p1',
        seed: 'test-seed',
        displayName: 'Test',
        totalScore: 50,
        roundsCompleted: 4,
        timestamp: Date.now(),
      },
      [{
        round: 4,
        pointsEarned: 50,
        cardsShown: [],
        cardSelected: { kind: 'event', id: 'evt_x', name: 'Event', description: 'A' },
        matchResult: null,
        isEvent: true,
        eventChoice: 'A',
      } as RoundResult],
      'abcd1234abcd1234',
    );
    expect(result.ok).toBe(true);
  });

  it('builds offer hint for HIZLI synergy', () => {
    const synergy = SYNERGIES.find((s) => s.id === 'synergy_kontr_atiligi')!;
    const squad = [
      { kind: 'player' as const, id: '1', name: 'A', rating: 60, currentRating: 60, position: 'OS' as const, rarity: 'normal' as const, tags: [] },
    ];
    const offer = {
      kind: 'player' as const,
      id: '2',
      name: 'B',
      rating: 70,
      currentRating: 70,
      position: 'SLK' as const,
      rarity: 'iyi' as const,
      tags: ['HIZLI' as const],
    };
    const hint = buildOfferSynergyHint(synergy, squad, { current: 0, required: 3 }, [offer]);
    expect(hint).toContain('HIZLI');
    expect(hint).toContain('1/3');
  });
});

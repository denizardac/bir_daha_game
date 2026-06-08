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

import { describe, expect, it } from 'vitest';
import { EVENT_CARDS } from '@/data/events';
import { resolveEvent } from '@/engine/events';
import { matchBonusMultiplier, matchRiskMultiplier } from '@/engine/matchPower';

const state = { squad: [], morale: 60, score: 0, activeTactics: [] };

describe('riskli olay seçimleri', () => {
  it('takım gücü veren her riskli seçimde ödül rakip güç artışından büyük olur', () => {
    const failures: string[] = [];

    for (const event of EVENT_CARDS) {
      for (const choice of ['A', 'B'] as const) {
        const outcome = resolveEvent(event, choice, state);
        if (!outcome.nextMatchRisk || !outcome.nextMatchBonus) continue;
        const teamGain = matchBonusMultiplier(outcome.nextMatchBonus) - 1;
        const opponentGain = matchRiskMultiplier(outcome.nextMatchRisk) - 1;
        if (teamGain <= opponentGain) {
          failures.push(`${event.id}/${choice}: takım %${Math.round(teamGain * 100)}, rakip %${Math.round(opponentGain * 100)}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });
});

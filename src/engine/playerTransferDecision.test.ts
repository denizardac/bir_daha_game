import { describe, expect, it } from 'vitest';
import { SYNERGIES } from '@/data/synergies';
import { getPlayerCardInsight } from '@/engine/cardInsights';
import { simulateRosterDecision } from '@/engine/rosterDecision';
import { getSidePanelNearSynergies } from '@/engine/squadInsights';
import {
  applyPlayerToSquad,
  canSelectTransferDeparture,
  createPlayerTransferDraft,
  finalizePlayerTransfer,
  normalizeSquadGoalkeepers,
} from '@/engine/lineupPreview';
import type { PlayerCard, Position, Tag } from '@/types';

function player(id: string, position: Position, rating: number, tags: Tag[] = []): PlayerCard {
  return {
    kind: 'player',
    id,
    name: id,
    rating,
    currentRating: rating,
    position,
    rarity: 'normal',
    tags,
  };
}

function full442(midfieldLocal: boolean): PlayerCard[] {
  return [
    player('gk', 'KL', 74),
    player('lb-local', 'SLB', 72, ['YERLİ']),
    player('cb-local', 'STP', 73, ['YERLİ']),
    player('cb-foreign', 'STP', 72),
    player('rb', 'SÖB', 72),
    player('lw-local', 'SLK', 74, ['YERLİ']),
    player('mid-weak', 'OS', 55, midfieldLocal ? ['YERLİ'] : []),
    player('mid-strong', 'OS', 76, midfieldLocal ? [] : ['YERLİ']),
    player('rw', 'SÖK', 74),
    player('striker-a', 'SF', 76),
    player('striker-b', 'SF', 75),
  ];
}

const incoming = player('incoming-local', 'OS', 86, ['YERLİ']);
const localSynergy = SYNERGIES.find((synergy) => synergy.id === 'synergy_ev_sahibi')!;

describe('player transfer decision', () => {
  it('does not promise YERLİ KADRO when the automatic departure is also YERLİ', () => {
    const squad = full442(true);
    const automatic = applyPlayerToSquad(squad, incoming, 11);

    expect(automatic.filter((candidate) => candidate.tags.includes('YERLİ'))).toHaveLength(4);
    expect(automatic.some((candidate) => candidate.id === 'mid-weak')).toBe(false);

    const insight = getPlayerCardInsight(incoming, squad, [], 11);
    expect(insight.synergies.find((hint) => hint.name === localSynergy.name)).toBeUndefined();

    const sideHint = getSidePanelNearSynergies(squad, 50, [], [incoming], {
      limit: 8,
      maxSquadSize: 11,
    }).find(({ synergy }) => synergy.id === localSynergy.id);
    expect(sideHint?.offerHint).toBeNull();
  });

  it('keeps the automatic departure visible and lets another eligible player leave', () => {
    const squad = full442(true);
    const draft = createPlayerTransferDraft(squad, incoming, 11);

    expect(draft.squad).toHaveLength(12);
    expect(draft.outgoingPlayerId).toBe('mid-weak');
    expect(draft.squad.some((candidate) => candidate.id === 'mid-weak')).toBe(true);
    expect(canSelectTransferDeparture(draft.squad, incoming.id, 'striker-b', 11)).toBe(true);
    expect(canSelectTransferDeparture(draft.squad, incoming.id, incoming.id, 11)).toBe(false);
    expect(canSelectTransferDeparture(draft.squad, incoming.id, 'gk', 11)).toBe(false);

    const finalSquad = finalizePlayerTransfer(draft.squad, 'striker-b');
    expect(finalSquad).toHaveLength(11);
    expect(finalSquad.some((candidate) => candidate.id === 'mid-weak')).toBe(true);
    expect(finalSquad.filter((candidate) => candidate.tags.includes('YERLİ'))).toHaveLength(5);
    expect(localSynergy.check(finalSquad, 50)).toBe(true);

    const simulation = simulateRosterDecision(squad, incoming, {
      maxSquadSize: 11,
      outgoingPlayerId: 'striker-b',
    });
    expect(simulation.synergyImpacts.find((impact) => impact.synergy.id === localSynergy.id)?.status).toBe('activated');
  });

  it('marks a real full-squad unlock as dependent on the proposed departure', () => {
    const squad = full442(false);
    const insight = getPlayerCardInsight(incoming, squad, [], 11);
    const hint = insight.synergies.find((candidate) => candidate.name === localSynergy.name);

    expect(hint).toMatchObject({ before: 4, after: 5, required: 5, completes: true, decisionDependent: true });
  });

  it('repairs duplicate player identities from old saves and never adds a second copy', () => {
    const weakCopy = player('duplicate', 'OS', 61);
    const strongCopy = player('duplicate', 'OS', 75, ['YERLİ']);
    const repaired = normalizeSquadGoalkeepers([
      player('gk', 'KL', 70),
      weakCopy,
      strongCopy,
    ]);

    expect(repaired.filter((candidate) => candidate.id === 'duplicate')).toEqual([strongCopy]);

    const updated = applyPlayerToSquad(repaired, player('duplicate', 'OS', 80, ['YERLİ']), 11);
    expect(updated.filter((candidate) => candidate.id === 'duplicate')).toHaveLength(1);
    expect(updated.find((candidate) => candidate.id === 'duplicate')?.currentRating).toBe(80);
  });
});

// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { EVENT_CARDS } from '@/data/events';
import type { MatchResult, Tag } from '@/types';

const WIN_MATCH: MatchResult = {
  outcome: 'win',
  goalsFor: 1,
  goalsAgainst: 0,
  cleanSheet: true,
  opponent: { name: 'QA Rakibi', rating: 72, style: 'dengeli' },
  highlights: [],
  activeSynergies: [],
  newlyDiscoveredSynergies: [],
  roundPoints: 0,
  events: [],
};

describe('gameStore maç sonrası trait yaşam döngüsü', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.getState().goToMenu();
  });

  it('maç sonrası oluşan SAKATLIK RİSKİ cezasını bir sonraki maça taşır', () => {
    useGameStore.getState().startRun(true, 'Test', 'injury-store-2');
    const initial = useGameStore.getState();
    const riskPlayer = {
      ...initial.squad[0]!,
      id: 'injury-risk-player',
      tags: ['SAKATLIK RİSKİ'] as Tag[],
    };

    useGameStore.setState({
      seed: 'injury-store-2',
      round: 2,
      squad: [riskPlayer, ...initial.squad.slice(1)],
      phase: 'match',
      currentMatch: WIN_MATCH,
      pendingSelected: initial.currentOffers[0]!,
      pendingOffersShown: [...initial.currentOffers],
    });

    useGameStore.getState().finishMatch();

    const carried = useGameStore.getState().squad.find((player) => player.id === riskPlayer.id);
    expect(carried?.tempRatingMod).toBe(-6);
  });

  it('Transfer Teklifi olayında vaat edilen üç yenileme hakkının tamamını verir', () => {
    useGameStore.getState().startRun(false, 'Test', 'transfer-reroll-reward');
    const event = EVENT_CARDS.find((candidate) => candidate.id === 'evt_transfer_teklif')!;
    useGameStore.setState({
      phase: 'event',
      currentEvent: event,
      rerollsRemaining: 3,
    });

    useGameStore.getState().resolveEventChoice('A');

    expect(useGameStore.getState().rerollsRemaining).toBe(6);
  });
});

// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { loadPersisted, savePersisted } from '@/utils/storage';
import { buildMonthlyLegendCard, createMonthlyLegendRecord } from '@/engine/monthlyLegend';
import { getSeasonKey } from '@/engine/hallOfFame';
import { EVENT_CARDS } from '@/data/events';
import { getPlayerPoolForAccess } from '@/engine/cardDraw';
import { isPlayerCard, type MatchResult } from '@/types';

const LOSS_MATCH: MatchResult = {
  outcome: 'loss',
  goalsFor: 0,
  goalsAgainst: 1,
  cleanSheet: false,
  opponent: { name: 'QA Rakibi', rating: 72, style: 'dengeli' },
  highlights: [],
  activeSynergies: [],
  newlyDiscoveredSynergies: [],
  roundPoints: 0,
  events: [],
};

function unlockCrisisContract() {
  const persisted = loadPersisted();
  savePersisted({
    ...persisted,
    unlocks: {
      ...persisted.unlocks,
      unlockedIds: [...new Set([...persisted.unlocks.unlockedIds, 'danger_3_wins_contract'])],
    },
  });
}

describe('gameStore unlock entegrasyonu', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.getState().goToMenu();
  });

  it('sıradaki oyuncu garantisini ilk Serbest Mod teklifinde gösterip kuyruktan tüketir', () => {
    const persisted = loadPersisted();
    savePersisted({
      ...persisted,
      unlocks: {
        ...persisted.unlocks,
        unlockedIds: ['score_5k_gokhan'],
        pendingGuarantees: [{ unlockId: 'score_5k_gokhan', kind: 'player', contentId: 'legend_01' }],
      },
    });

    useGameStore.getState().startRun(false, 'Test', 'free-guarantee-seed');
    const state = useGameStore.getState();
    expect(state.currentOffers.map((card) => card.id)).toContain('legend_01');
    expect(state.unlockGuaranteeOffered).toBe(true);
    expect(loadPersisted().unlocks.pendingGuarantees).toEqual([]);
  });

  it('Günlük Seed kişisel garanti kuyruğunu tüketmez', () => {
    const persisted = loadPersisted();
    savePersisted({
      ...persisted,
      unlocks: {
        ...persisted.unlocks,
        unlockedIds: ['locals_7_neighborhood_captain'],
        pendingGuarantees: [{
          unlockId: 'locals_7_neighborhood_captain',
          kind: 'player',
          contentId: 'player_mahallenin_kaptani',
        }],
      },
    });

    useGameStore.getState().startRun(true, 'Test');
    expect(useGameStore.getState().currentOffers.map((card) => card.id)).not.toContain('player_mahallenin_kaptani');
    expect(loadPersisted().unlocks.pendingGuarantees).toHaveLength(1);
  });

  it('Günlük Ranked devamlılığı küçük ama gerçek bir başlangıç avantajı verir', () => {
    const withoutStreak = loadPersisted();
    savePersisted({ ...withoutStreak, dailyStreak: 0 });
    useGameStore.getState().startRun(true, 'Test');
    const baseline = useGameStore.getState();
    const baselineResources = {
      morale: baseline.morale,
      rerollsRemaining: baseline.rerollsRemaining,
      offers: baseline.currentOffers.map((card) => card.id),
      squad: baseline.squad.map((player) => player.id),
    };

    const withStreak = loadPersisted();
    savePersisted({ ...withStreak, dailyStreak: 7 });
    useGameStore.getState().startRun(true, 'Test');
    const streakRun = useGameStore.getState();

    expect(streakRun.morale).toBe(baselineResources.morale + 2);
    expect(streakRun.rerollsRemaining).toBe(baselineResources.rerollsRemaining + 1);
    expect(streakRun.currentOffers.map((card) => card.id)).toEqual(baselineResources.offers);
    expect(streakRun.squad.map((player) => player.id)).toEqual(baselineResources.squad);
  });

  it('Ayın Efsanesi Günlük Ranked oyuncu teklif havuzuna eklenir', () => {
    const persisted = loadPersisted();
    const monthlyLegend = createMonthlyLegendRecord({
      id: 'monthly-ranked-cache', seed: 'valid-seed', displayName: 'Cache Oyuncusu', totalScore: 16_000,
      roundsCompleted: 15, timestamp: 1, flawless: true, integrityDigest: '0123456789abcdef',
    }, getSeasonKey(), 2);
    savePersisted({ ...persisted, monthlyLegend });
    useGameStore.getState().startRun(true, 'Test');
    const frozenLegend = buildMonthlyLegendCard(useGameStore.getState().monthlyLegendAtRunStart)!;
    const pool = getPlayerPoolForAccess({
      isDailySeed: true,
      unlockedPlayerIds: [],
      globalPlayers: [frozenLegend],
    });

    expect(pool.some((player) => player.id === frozenLegend.id)).toBe(true);
  });

  it('Hedefli Scout Serbest Modda ücretsiz ve Run başına bir kez kullanılabilir', () => {
    const persisted = loadPersisted();
    savePersisted({
      ...persisted,
      unlocks: {
        ...persisted.unlocks,
        unlockedIds: ['synergies_5_targeted_scout'],
      },
    });

    useGameStore.getState().startRun(false, 'Test', 'free-scout-seed');
    const rerollsBefore = useGameStore.getState().rerollsRemaining;
    expect(useGameStore.getState().targetedScoutAvailable).toBe(true);
    useGameStore.getState().useTargetedScout();
    expect(useGameStore.getState().targetedScoutAvailable).toBe(false);
    expect(useGameStore.getState().rerollsRemaining).toBe(rerollsBefore);
  });

  it('görülmeyen içerik bildirimini yeniden açılışta yükler ve yalnız onayla temizler', () => {
    const persisted = loadPersisted();
    savePersisted({
      ...persisted,
      unlocks: {
        ...persisted.unlocks,
        unlockedIds: ['score_5k_gokhan'],
        pendingNotificationIds: ['score_5k_gokhan'],
      },
    });

    useGameStore.getState().init();
    expect(useGameStore.getState().newContentUnlocks.map((unlock) => unlock.id)).toEqual(['score_5k_gokhan']);
    expect(loadPersisted().unlocks.pendingNotificationIds).toEqual(['score_5k_gokhan']);

    useGameStore.getState().acknowledgeContentUnlocks();
    expect(useGameStore.getState().newContentUnlocks).toEqual([]);
    expect(loadPersisted().unlocks.pendingNotificationIds).toEqual([]);
  });

  it('Ayın Efsanesi kaydını Run başında dondurup snapshot ile taşır', () => {
    const persisted = loadPersisted();
    const monthlyLegend = createMonthlyLegendRecord({
      id: 'monthly-test', seed: 'valid-seed', displayName: 'Şampiyon', totalScore: 16_000,
      roundsCompleted: 15, timestamp: 1, flawless: true, integrityDigest: '0123456789abcdef',
    }, getSeasonKey(), 2);
    savePersisted({ ...persisted, monthlyLegend });

    useGameStore.getState().startRun(true, 'Test');
    expect(useGameStore.getState().monthlyLegendAtRunStart).toEqual(monthlyLegend);
    expect(loadPersisted().currentRun?.monthlyLegendAtRunStart).toEqual(monthlyLegend);
  });

  it('Günlük Seed mağlubiyetinde kadro 6 oyuncudan 5 oyuncuya düşse de Kriz Kontratını tetiklemez', () => {
    unlockCrisisContract();
    useGameStore.getState().startRun(true, 'Test');
    const initial = useGameStore.getState();
    const rerollsBefore = initial.rerollsRemaining;

    useGameStore.setState({
      squad: initial.squad.slice(0, 6),
      phase: 'match',
      currentMatch: LOSS_MATCH,
      pendingSelected: initial.currentOffers[0]!,
      pendingOffersShown: [...initial.currentOffers],
      crisisContractTriggered: false,
      crisisRecoveryPending: false,
    });
    useGameStore.getState().finishMatch();

    const result = useGameStore.getState();
    expect(result.phase).toBe('loss');
    expect(result.squad).toHaveLength(5);
    expect(result.dangerMode).toBe(true);
    expect(result.crisisContractTriggered).toBe(false);
    expect(result.crisisRecoveryPending).toBe(false);
    expect(result.rerollsRemaining).toBe(rerollsBefore);
  });

  it('Serbest Mod oyuncu ayrılığı eventinde 6→5 düşüş Kriz Kontratını ve toparlanma teklifini tetikler', () => {
    unlockCrisisContract();
    useGameStore.getState().startRun(false, 'Test', 'free-crisis-event-seed');
    const initial = useGameStore.getState();
    const departureEvent = EVENT_CARDS.find((event) => event.id === 'evt_kavga')!;
    const rerollsBefore = initial.rerollsRemaining;

    useGameStore.setState({
      squad: initial.squad.slice(0, 6),
      phase: 'event',
      currentEvent: departureEvent,
      morale: 20,
      crisisContractTriggered: false,
      crisisRecoveryPending: false,
    });
    useGameStore.getState().resolveEventChoice('A');

    const result = useGameStore.getState();
    const recoveryTags = new Set(['POTANSİYEL', 'MENTOR', 'LİDER', 'KAPİTAN', 'DAYANIKLI']);
    expect(result.squad).toHaveLength(5);
    expect(result.dangerMode).toBe(true);
    expect(result.morale).toBe(50);
    expect(result.crisisContractTriggered).toBe(true);
    expect(result.rerollsRemaining).toBe(rerollsBefore + 1);
    expect(result.currentOffers.filter(isPlayerCard).some((player) => (
      player.currentRating >= 78 && player.tags.some((tag) => recoveryTags.has(tag))
    ))).toBe(true);
  });
});

// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { loadPersisted, savePersisted } from '@/utils/storage';

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
});

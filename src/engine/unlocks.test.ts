import { describe, expect, it } from 'vitest';
import {
  applyCompletedRunToUnlocks,
  createInitialUnlockState,
  createRunUnlockTelemetry,
  getClosestUnlockStatuses,
  getUnlockStatuses,
  normalizeUnlockState,
  consumeUnlockGuarantee,
  getNextUnlockGuarantee,
  updateRunUnlockTelemetry,
} from '@/engine/unlocks';
import type { CompletedRunForUnlocks } from '@/engine/unlocks';
import type { MatchResult, PlayerCard, RoundResult } from '@/types';

function player(name: string, tags: PlayerCard['tags']): PlayerCard {
  return {
    kind: 'player', id: name, name, rating: 80, currentRating: 80,
    position: 'OS', rarity: 'güçlü', tags,
  };
}

function match(round: number, outcome: MatchResult['outcome'], goals: string[] = [], synergies: string[] = []): RoundResult {
  return {
    round,
    cardsShown: [],
    cardSelected: player(`Seçim ${round}`, []),
    pointsEarned: 0,
    matchResult: {
      outcome, goalsFor: goals.length, goalsAgainst: outcome === 'loss' ? 1 : 0,
      cleanSheet: outcome !== 'loss', opponent: { name: 'Rakip', rating: 70, style: 'dengeli' },
      highlights: [], activeSynergies: synergies, newlyDiscoveredSynergies: [], roundPoints: 0,
      events: goals.map((playerName, index) => ({ minute: index + 1, type: 'goal_for', playerName })),
    },
  };
}

let runCounter = 0;
function run(overrides: Partial<CompletedRunForUnlocks> = {}): CompletedRunForUnlocks {
  const squad = overrides.squad ?? [];
  const morale = overrides.morale ?? 50;
  return {
    runId: `test-run-${++runCounter}`,
    score: 0,
    round: 15,
    maxRounds: 15,
    squad,
    morale,
    roundHistory: [],
    unlockTelemetry: createRunUnlockTelemetry(squad, morale),
    ...overrides,
  };
}

describe('unlock çekirdeği', () => {
  it('bağımsız koşulları birlikte açar ama skor zincirinden yalnız sıradakini açar', () => {
    const fiveTags = ['HIZLI', 'TEKNİK', 'LİDER', 'YERLİ', 'DAYANIKLI'] as PlayerCard['tags'];
    const squad = [player('Traitli', fiveTags), ...Array.from({ length: 6 }, (_, i) => player(`Yerli ${i}`, ['YERLİ']))];
    const history = [
      match(1, 'loss'),
      match(4, 'loss'),
      ...Array.from({ length: 10 }, (_, i) => match(i + 6, 'win', ['Golcü'], [`syn-${i % 5}`])),
    ];
    const result = applyCompletedRunToUnlocks(createInitialUnlockState(), run({
      score: 25_000,
      morale: 100,
      squad,
      roundHistory: history,
      unlockTelemetry: createRunUnlockTelemetry(squad, 100),
    }));

    expect(result.newlyUnlocked.map((unlock) => unlock.id)).toEqual(expect.arrayContaining([
      'score_5k_gokhan',
      'traits_5_legend_touch',
      'locals_7_neighborhood_captain',
      'goals_10_box_master',
      'synergies_5_targeted_scout',
      'comeback_first_five',
      'morale_100_oath',
    ]));
    expect(result.newlyUnlocked.filter((unlock) => unlock.chain === 'score')).toHaveLength(1);
    expect(result.state.pendingGuarantees.map((item) => item.unlockId)).toContain('score_5k_gokhan');
    expect(result.state.stats.maxGoalsByPlayer).toBe(10);
  });

  it('25k skorla bile skor zincirini beş farklı Run boyunca sırayla açar', () => {
    let state = createInitialUnlockState();
    const opened: string[] = [];
    for (let i = 0; i < 5; i++) {
      const result = applyCompletedRunToUnlocks(state, run({ score: 25_000 }));
      opened.push(...result.newlyUnlocked.filter((unlock) => unlock.chain === 'score').map((unlock) => unlock.id));
      state = result.state;
    }
    expect(opened).toEqual([
      'score_5k_gokhan',
      'score_10k_etebo',
      'score_15k_guiza',
      'score_20k_sabri',
      'score_25k_burak',
    ]);
  });

  it('aynı runId ikinci kez uygulandığında istatistik ve bildirimleri çoğaltmaz', () => {
    const completed = run({ score: 6_000 });
    const first = applyCompletedRunToUnlocks(createInitialUnlockState(), completed);
    const second = applyCompletedRunToUnlocks(first.state, completed);

    expect(first.newlyUnlocked.map((unlock) => unlock.id)).toContain('score_5k_gokhan');
    expect(second.newlyUnlocked).toEqual([]);
    expect(second.state).toEqual(first.state);
  });

  it('garantiyi Günlük Seed için ayırmaz ve yalnız teklif sonrası kuyruktan tüketir', () => {
    const unlocked = applyCompletedRunToUnlocks(createInitialUnlockState(), run({ score: 6_000 })).state;
    expect(getNextUnlockGuarantee(unlocked, true)).toBeNull();
    const guarantee = getNextUnlockGuarantee(unlocked, false)!;
    expect(guarantee.contentId).toBe('legend_01');
    expect(consumeUnlockGuarantee(unlocked, guarantee).pendingGuarantees).toEqual([]);
  });

  it('Run içinde görülüp final Kadrosunda kalmayan maksimum trait/YERLİ/morali korur', () => {
    const peakSquad = Array.from({ length: 7 }, (_, i) => player(`Yerli ${i}`, i === 0
      ? ['YERLİ', 'HIZLI', 'TEKNİK', 'LİDER', 'DAYANIKLI']
      : ['YERLİ']));
    let telemetry = createRunUnlockTelemetry([], 50);
    telemetry = updateRunUnlockTelemetry(telemetry, peakSquad, 100);
    const result = applyCompletedRunToUnlocks(createInitialUnlockState(), run({
      squad: [player('Final', [])], morale: 40, unlockTelemetry: telemetry,
    }));

    expect(result.state.stats.maxTraitsOnPlayer).toBe(5);
    expect(result.state.stats.maxLocalPlayers).toBe(7);
    expect(result.state.stats.maxMorale).toBe(100);
  });

  it('5 kişilik Kadrodan sonraki üçüncü galibiyeti kriz hedefi sayar', () => {
    const five = Array.from({ length: 5 }, (_, i) => player(`Dar ${i}`, []));
    let telemetry = createRunUnlockTelemetry(five, 50);
    telemetry = updateRunUnlockTelemetry(telemetry, five, 60, 'win');
    telemetry = updateRunUnlockTelemetry(telemetry, five, 70, 'win');
    telemetry = updateRunUnlockTelemetry(telemetry, five, 80, 'win');
    const result = applyCompletedRunToUnlocks(createInitialUnlockState(), run({ squad: five, unlockTelemetry: telemetry }));
    expect(result.newlyUnlocked.map((unlock) => unlock.id)).toContain('danger_3_wins_contract');
  });

  it('kariyer maksimumlarını geriye düşürmez ve zincir engelini gösterir', () => {
    const first = applyCompletedRunToUnlocks(createInitialUnlockState(), run({ score: 4_000 }));
    const second = applyCompletedRunToUnlocks(first.state, run({ score: 2_000 }));
    const status = getUnlockStatuses(second.state).find((item) => item.unlock.id === 'score_10k_etebo')!;

    expect(second.state.stats.bestScore).toBe(4_000);
    expect(status.blockedByUnlockId).toBe('score_5k_gokhan');
  });

  it('ana menü için yalnızca erişilebilir en yakın üç hedefi sıralar', () => {
    const state = createInitialUnlockState();
    state.stats.bestScore = 4_500;
    state.stats.maxLocalPlayers = 6;
    state.stats.maxTraitsOnPlayer = 2;

    const closest = getClosestUnlockStatuses(state, 3);
    expect(closest.map((status) => status.unlock.id)).toEqual([
      'score_5k_gokhan',
      'locals_7_neighborhood_captain',
      'traits_5_legend_touch',
    ]);
    expect(closest.some((status) => status.blockedByUnlockId)).toBe(false);
  });

  it('bozuk ve v4 kayıt alanlarını onarırken eski moral maksimumunu taşır', () => {
    const normalized = normalizeUnlockState({
      unlockedIds: ['future_unlock', 'future_unlock', 3],
      stats: { bestScore: Number.NaN, maxTraitsOnPlayer: 4, maxFinalMorale: 92 },
      pendingGuarantees: [{ unlockId: 'u', contentId: 'c', kind: 'player' }, { nope: true }],
    });

    expect(normalized.unlockedIds).toEqual(['future_unlock']);
    expect(normalized.stats.bestScore).toBe(0);
    expect(normalized.stats.maxMorale).toBe(92);
    expect(normalized.pendingGuarantees).toEqual([{ unlockId: 'u', contentId: 'c', kind: 'player' }]);
  });
});

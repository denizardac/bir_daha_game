import type {
  GameState,
  PlayerCard,
  RunUnlockTelemetry,
  UnlockGuarantee,
  UnlockState,
  UnlockStats,
} from '@/types';

export const UNLOCK_CATALOG_VERSION = 1;
const MAX_PROCESSED_RUN_IDS = 50;

export type UnlockRewardKind = 'player' | 'event' | 'mechanic';
export type UnlockMetric = keyof UnlockStats;

export interface UnlockDefinition {
  id: string;
  name: string;
  description: string;
  reward: {
    kind: UnlockRewardKind;
    contentId: string;
    name: string;
  };
  metric: UnlockMetric;
  target: number;
  chain?: 'score';
  order?: number;
}

export interface UnlockStatus {
  unlock: UnlockDefinition;
  current: number;
  unlocked: boolean;
  percent: number;
  blockedByUnlockId?: string;
}

export type CompletedRunForUnlocks = Pick<
  GameState,
  'runId' | 'score' | 'round' | 'maxRounds' | 'squad' | 'morale' | 'roundHistory' | 'unlockTelemetry'
>;

const RULES: readonly UnlockDefinition[] = [
  {
    id: 'score_5k_gokhan', name: 'İlk Büyük İmza', description: "Tek Run'da 5.000 skor yap.",
    reward: { kind: 'player', contentId: 'legend_01', name: 'Gökhan Sazdağı' },
    metric: 'bestScore', target: 5_000, chain: 'score', order: 1,
  },
  {
    id: 'score_10k_etebo', name: 'Orta Saha Gücü', description: "Tek Run'da 10.000 skor yap.",
    reward: { kind: 'player', contentId: 'legend_03', name: 'Peter Etebo' },
    metric: 'bestScore', target: 10_000, chain: 'score', order: 2,
  },
  {
    id: 'score_15k_guiza', name: 'Riskli Bitirici', description: "Tek Run'da 15.000 skor yap.",
    reward: { kind: 'player', contentId: 'legend_04', name: 'Daniel Güiza' },
    metric: 'bestScore', target: 15_000, chain: 'score', order: 3,
  },
  {
    id: 'score_20k_sabri', name: 'Çizgi Efsanesi', description: "Tek Run'da 20.000 skor yap.",
    reward: { kind: 'player', contentId: 'legend_05', name: 'Sabri Sarıoğlu' },
    metric: 'bestScore', target: 20_000, chain: 'score', order: 4,
  },
  {
    id: 'score_25k_burak', name: 'Elit Golcü', description: "Tek Run'da 25.000 skor yap.",
    reward: { kind: 'player', contentId: 'legend_02', name: 'Burak Yılmaz' },
    metric: 'bestScore', target: 25_000, chain: 'score', order: 5,
  },
  {
    id: 'traits_5_legend_touch', name: 'Trait Ustası',
    description: "Bir Run'da bir Oyuncu Kartını 5 trait'e ulaştır.",
    reward: { kind: 'event', contentId: 'evt_unlock_efsane_dokunusu', name: 'Efsane Dokunuşu' },
    metric: 'maxTraitsOnPlayer', target: 5,
  },
  {
    id: 'locals_7_neighborhood_captain', name: 'Bizim Çocuklar',
    description: 'Bir Run sırasında aynı anda Kadroda 7 YERLİ bulundur.',
    reward: { kind: 'player', contentId: 'player_mahallenin_kaptani', name: 'Mahallenin Kaptanı' },
    metric: 'maxLocalPlayers', target: 7,
  },
  {
    id: 'goals_10_box_master', name: 'Gol Makinesi',
    description: "Tek oyuncuyla bir Run'da 10 gol at.",
    reward: { kind: 'player', contentId: 'player_ceza_sahasi_ustasi', name: 'Ceza Sahası Ustası' },
    metric: 'maxGoalsByPlayer', target: 10,
  },
  {
    id: 'synergies_5_targeted_scout', name: 'Taktik Laboratuvarı',
    description: "Bir Run'da 5 farklı Sinerjiyi etkinleştir.",
    reward: { kind: 'mechanic', contentId: 'mechanic_hedefli_scout', name: 'Hedefli Scout' },
    metric: 'maxUniqueSynergies', target: 5,
  },
  {
    id: 'comeback_first_five', name: 'Pes Etmeyenler',
    description: 'İlk 5 Roundda 2 mağlubiyet aldıktan sonra Finaleye ulaş.',
    reward: { kind: 'player', contentId: 'player_geri_donuscu', name: 'Geri Dönüşçü' },
    metric: 'completedComebackRuns', target: 1,
  },
  {
    id: 'morale_100_oath', name: 'Tek Yürek',
    description: "Bir Run sırasında 100 morale ulaş.",
    reward: { kind: 'event', contentId: 'evt_unlock_soyunma_odasi_yemini', name: 'Soyunma Odası Yemini' },
    metric: 'maxMorale', target: 100,
  },
  {
    id: 'danger_3_wins_contract', name: 'Dar Kadro Ustası',
    description: 'Kadro 5 kişiye düştükten sonra 4 kişiye düşmeden 3 maç kazan.',
    reward: { kind: 'mechanic', contentId: 'mechanic_kriz_kontrati', name: 'Kriz Kontratı' },
    metric: 'completedDangerRecoveryRuns', target: 1,
  },
] as const;

export const UNLOCK_CATALOG: readonly UnlockDefinition[] = RULES;

export function createRunUnlockTelemetry(squad: readonly PlayerCard[], morale: number): RunUnlockTelemetry {
  return updateRunUnlockTelemetry({
    maxTraitsOnPlayer: 0,
    maxLocalPlayers: 0,
    maxMorale: 0,
    dangerReached: false,
    dangerWinsAfterReached: 0,
    dangerRecoveryAchieved: false,
  }, squad, morale);
}

export function normalizeRunUnlockTelemetry(
  value: unknown,
  squad: readonly PlayerCard[],
  morale: number,
): RunUnlockTelemetry {
  const base = createRunUnlockTelemetry(squad, morale);
  if (!isRecord(value)) return base;
  return {
    maxTraitsOnPlayer: Math.max(base.maxTraitsOnPlayer, safeStat(value.maxTraitsOnPlayer)),
    maxLocalPlayers: Math.max(base.maxLocalPlayers, safeStat(value.maxLocalPlayers)),
    maxMorale: Math.max(base.maxMorale, safeStat(value.maxMorale)),
    dangerReached: value.dangerReached === true || base.dangerReached,
    dangerWinsAfterReached: safeStat(value.dangerWinsAfterReached),
    dangerRecoveryAchieved: value.dangerRecoveryAchieved === true,
  };
}

export function updateRunUnlockTelemetry(
  previous: RunUnlockTelemetry,
  squad: readonly PlayerCard[],
  morale: number,
  matchOutcome?: 'win' | 'draw' | 'loss',
): RunUnlockTelemetry {
  const reachedNow = previous.dangerReached || squad.length === 5;
  const dangerWinsAfterReached = reachedNow && matchOutcome === 'win'
    ? previous.dangerWinsAfterReached + 1
    : previous.dangerWinsAfterReached;
  return {
    maxTraitsOnPlayer: Math.max(previous.maxTraitsOnPlayer, ...squad.map((player) => new Set(player.tags).size), 0),
    maxLocalPlayers: Math.max(previous.maxLocalPlayers, squad.filter((player) => player.tags.includes('YERLİ')).length),
    maxMorale: Math.max(previous.maxMorale, Math.max(0, Math.round(morale))),
    dangerReached: reachedNow,
    dangerWinsAfterReached,
    dangerRecoveryAchieved: previous.dangerRecoveryAchieved || (squad.length > 4 && dangerWinsAfterReached >= 3),
  };
}

export function getUnlockedContentIds(state: UnlockState, kind: UnlockRewardKind): string[] {
  const open = new Set(normalizeUnlockState(state).unlockedIds);
  return RULES.filter((unlock) => unlock.reward.kind === kind && open.has(unlock.id))
    .map((unlock) => unlock.reward.contentId);
}

export function hasUnlockedContent(state: UnlockState, contentId: string): boolean {
  const open = new Set(normalizeUnlockState(state).unlockedIds);
  return RULES.some((unlock) => unlock.reward.contentId === contentId && open.has(unlock.id));
}

export function grantUnlocksForCollectedContent(state: UnlockState, contentIds: readonly string[]): UnlockState {
  const normalized = normalizeUnlockState(state);
  const collected = new Set(contentIds);
  const unlockedIds = RULES.filter((unlock) => collected.has(unlock.reward.contentId)).map((unlock) => unlock.id);
  return { ...normalized, unlockedIds: [...new Set([...normalized.unlockedIds, ...unlockedIds])] };
}

export function createInitialUnlockState(): UnlockState {
  return {
    catalogVersion: UNLOCK_CATALOG_VERSION,
    unlockedIds: [],
    stats: {
      bestScore: 0,
      maxTraitsOnPlayer: 0,
      maxLocalPlayers: 0,
      maxGoalsByPlayer: 0,
      maxUniqueSynergies: 0,
      maxMorale: 0,
      completedComebackRuns: 0,
      completedDangerRecoveryRuns: 0,
    },
    pendingGuarantees: [],
    pendingNotificationIds: [],
    processedRunIds: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeStat(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0))]
    : [];
}

function guaranteeList(value: unknown): UnlockGuarantee[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.unlockId !== 'string' || typeof item.contentId !== 'string') return [];
    if (item.kind !== 'player' && item.kind !== 'event') return [];
    if (seen.has(item.unlockId)) return [];
    seen.add(item.unlockId);
    return [{ unlockId: item.unlockId, contentId: item.contentId, kind: item.kind }];
  });
}

/** Eski/bozuk alanları onarır; bilinmeyen id'leri ileri uyumluluk için korur. */
export function normalizeUnlockState(value: unknown): UnlockState {
  const base = createInitialUnlockState();
  if (!isRecord(value)) return base;
  const rawStats = isRecord(value.stats) ? value.stats : {};
  const legacyMaxFinalMorale = safeStat(rawStats.maxFinalMorale);
  return {
    catalogVersion: safeStat(value.catalogVersion) || UNLOCK_CATALOG_VERSION,
    unlockedIds: stringList(value.unlockedIds),
    stats: {
      bestScore: safeStat(rawStats.bestScore),
      maxTraitsOnPlayer: safeStat(rawStats.maxTraitsOnPlayer),
      maxLocalPlayers: safeStat(rawStats.maxLocalPlayers),
      maxGoalsByPlayer: safeStat(rawStats.maxGoalsByPlayer),
      maxUniqueSynergies: safeStat(rawStats.maxUniqueSynergies),
      maxMorale: Math.max(safeStat(rawStats.maxMorale), legacyMaxFinalMorale),
      completedComebackRuns: safeStat(rawStats.completedComebackRuns),
      completedDangerRecoveryRuns: safeStat(rawStats.completedDangerRecoveryRuns),
    },
    pendingGuarantees: guaranteeList(value.pendingGuarantees),
    pendingNotificationIds: stringList(value.pendingNotificationIds),
    processedRunIds: stringList(value.processedRunIds).slice(-MAX_PROCESSED_RUN_IDS),
  };
}

function getRunMetrics(run: CompletedRunForUnlocks): UnlockStats {
  const goalsByPlayer = new Map<string, number>();
  const synergies = new Set<string>();
  let earlyLosses = 0;
  for (const result of run.roundHistory) {
    if (result.round <= 5 && result.matchResult?.outcome === 'loss') earlyLosses += 1;
    for (const synergy of result.matchResult?.activeSynergies ?? []) synergies.add(synergy);
    for (const event of result.matchResult?.events ?? []) {
      if (event.type !== 'goal_for') continue;
      const key = event.playerName.trim().toLocaleLowerCase('tr-TR');
      goalsByPlayer.set(key, (goalsByPlayer.get(key) ?? 0) + 1);
    }
  }
  const telemetry = run.unlockTelemetry ?? createRunUnlockTelemetry(run.squad, run.morale);
  return {
    bestScore: Math.max(0, Math.round(run.score)),
    maxTraitsOnPlayer: Math.max(telemetry.maxTraitsOnPlayer, ...run.squad.map((p) => new Set(p.tags).size), 0),
    maxLocalPlayers: Math.max(telemetry.maxLocalPlayers, run.squad.filter((p) => p.tags.includes('YERLİ')).length),
    maxGoalsByPlayer: Math.max(0, ...goalsByPlayer.values()),
    maxUniqueSynergies: synergies.size,
    maxMorale: Math.max(telemetry.maxMorale, Math.max(0, Math.round(run.morale))),
    completedComebackRuns: run.round >= run.maxRounds && earlyLosses >= 2 ? 1 : 0,
    completedDangerRecoveryRuns: telemetry.dangerRecoveryAchieved ? 1 : 0,
  };
}

function mergeStats(previous: UnlockStats, current: UnlockStats): UnlockStats {
  return {
    bestScore: Math.max(previous.bestScore, current.bestScore),
    maxTraitsOnPlayer: Math.max(previous.maxTraitsOnPlayer, current.maxTraitsOnPlayer),
    maxLocalPlayers: Math.max(previous.maxLocalPlayers, current.maxLocalPlayers),
    maxGoalsByPlayer: Math.max(previous.maxGoalsByPlayer, current.maxGoalsByPlayer),
    maxUniqueSynergies: Math.max(previous.maxUniqueSynergies, current.maxUniqueSynergies),
    maxMorale: Math.max(previous.maxMorale, current.maxMorale),
    completedComebackRuns: previous.completedComebackRuns + current.completedComebackRuns,
    completedDangerRecoveryRuns: previous.completedDangerRecoveryRuns + current.completedDangerRecoveryRuns,
  };
}

function scoreRules(): UnlockDefinition[] {
  return RULES.filter((rule) => rule.chain === 'score').sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function getUnlockStatuses(state: UnlockState): UnlockStatus[] {
  const normalized = normalizeUnlockState(state);
  const open = new Set(normalized.unlockedIds);
  const scores = scoreRules();
  return RULES.map((unlock) => {
    const previous = unlock.chain === 'score'
      ? scores.find((candidate) => candidate.order === (unlock.order ?? 0) - 1)
      : undefined;
    return {
      unlock,
      current: Math.min(unlock.target, normalized.stats[unlock.metric]),
      unlocked: open.has(unlock.id),
      percent: unlock.target > 0 ? Math.round((Math.min(unlock.target, normalized.stats[unlock.metric]) / unlock.target) * 100) : 0,
      blockedByUnlockId: previous && !open.has(previous.id) ? previous.id : undefined,
    };
  });
}

export function getUnlockDefinitionsByIds(unlockIds: readonly string[]): UnlockDefinition[] {
  const wanted = new Set(unlockIds);
  return RULES.filter((unlock) => wanted.has(unlock.id));
}

/** Oyuncunun şu anda gerçekten ilerletebildiği en yakın hedefleri döndürür. */
export function getClosestUnlockStatuses(state: UnlockState, limit = 3): UnlockStatus[] {
  return getUnlockStatuses(state)
    .filter((status) => !status.unlocked && !status.blockedByUnlockId)
    .sort((a, b) => b.percent - a.percent || (a.unlock.target - a.current) - (b.unlock.target - b.current))
    .slice(0, Math.max(0, limit));
}

function guaranteeFor(unlock: UnlockDefinition): UnlockGuarantee | null {
  if (unlock.reward.kind !== 'player' && unlock.reward.kind !== 'event') return null;
  return { unlockId: unlock.id, kind: unlock.reward.kind, contentId: unlock.reward.contentId };
}

/** Biten Run'ı bir kez uygular; skor zincirinden yalnız sıradaki tek ödülü açar. */
export function applyCompletedRunToUnlocks(
  previous: UnlockState,
  run: CompletedRunForUnlocks,
): { state: UnlockState; newlyUnlocked: UnlockDefinition[] } {
  const normalized = normalizeUnlockState(previous);
  if (normalized.processedRunIds.includes(run.runId)) return { state: normalized, newlyUnlocked: [] };

  const stats = mergeStats(normalized.stats, getRunMetrics(run));
  const alreadyOpen = new Set(normalized.unlockedIds);
  const nextScoreRule = scoreRules().find((rule) => !alreadyOpen.has(rule.id));
  const newlyUnlocked = RULES.filter((rule) => {
    if (alreadyOpen.has(rule.id)) return false;
    if (rule.chain === 'score') return rule.id === nextScoreRule?.id && run.score >= rule.target;
    return stats[rule.metric] >= rule.target;
  });
  const guarantees = newlyUnlocked.map(guaranteeFor).filter((item): item is UnlockGuarantee => item !== null);
  const pendingGuarantees = [...normalized.pendingGuarantees];
  for (const guarantee of guarantees) {
    if (!pendingGuarantees.some((item) => item.unlockId === guarantee.unlockId)) pendingGuarantees.push(guarantee);
  }

  return {
    state: {
      ...normalized,
      unlockedIds: [...normalized.unlockedIds, ...newlyUnlocked.map((unlock) => unlock.id)],
      stats,
      pendingGuarantees,
      pendingNotificationIds: [...new Set([...normalized.pendingNotificationIds, ...newlyUnlocked.map((unlock) => unlock.id)])],
      processedRunIds: [...normalized.processedRunIds, run.runId].slice(-MAX_PROCESSED_RUN_IDS),
    },
    newlyUnlocked,
  };
}

export function dismissUnlockNotifications(state: UnlockState, unlockIds: readonly string[]): UnlockState {
  const dismissed = new Set(unlockIds);
  const normalized = normalizeUnlockState(state);
  return { ...normalized, pendingNotificationIds: normalized.pendingNotificationIds.filter((id) => !dismissed.has(id)) };
}

export function getNextUnlockGuarantee(state: UnlockState, isDailySeed: boolean): UnlockGuarantee | null {
  if (isDailySeed) return null;
  return normalizeUnlockState(state).pendingGuarantees[0] ?? null;
}

export function consumeUnlockGuarantee(state: UnlockState, guarantee: UnlockGuarantee): UnlockState {
  const normalized = normalizeUnlockState(state);
  return {
    ...normalized,
    pendingGuarantees: normalized.pendingGuarantees.filter((item) => item.unlockId !== guarantee.unlockId),
  };
}

import type { GameCard, GameState, Tag, TrainingCard } from '@/types';

export interface PersistedTrainingFlow {
  card: TrainingCard;
  offeredTags: Tag[];
  step: 'player' | 'tag';
  selectedPlayerId?: string;
}

/** localStorage'da saklanan run — GameState + oyun içi geçici alanlar */
export type RunSnapshot = GameState & {
  usedEventIds: string[];
  trainingFlow: PersistedTrainingFlow | null;
  pendingOffersShown: GameCard[];
  pendingSelected: GameCard | null;
  lastLossBrokenSynergies: string[];
  pendingSynergyReveal: string[];
  nextMatchRisk: number;
  nextMatchBonus: number;
};

type SnapshotSource = Partial<RunSnapshot> & {
  seed: string;
  usedEventIds?: string[];
  trainingFlow?: PersistedTrainingFlow | null;
  pendingOffersShown?: GameCard[];
  pendingSelected?: GameCard | null;
  lastLossBrokenSynergies?: string[];
  pendingSynergyReveal?: string[];
  nextMatchRisk?: number;
  nextMatchBonus?: number;
};

const GAME_STATE_KEYS: (keyof GameState)[] = [
  'seed', 'isDailySeed', 'displayName', 'round', 'maxRounds', 'squad', 'maxSquadSize',
  'morale', 'score', 'streak', 'phase', 'roundHistory', 'currentOffers', 'currentMatch',
  'currentEvent', 'activeTactics', 'lastLossPlayer', 'discoveredSynergies', 'lossesCount',
  'dangerMode', 'isFirstRun', 'timerSeconds', 'eventResolvedThisRound', 'flawless',
  'runEndAnalysis', 'extraDrawUsed', 'extraDrawAvailable', 'rerollsRemaining',
  'offersRerollIndex', 'recoveryGuaranteed',
];

export function mergeRunSnapshot(
  prev: Partial<RunSnapshot> | null | undefined,
  partial: SnapshotSource,
): RunSnapshot {
  const base = prev ?? {};
  return {
    ...base,
    ...partial,
    usedEventIds: partial.usedEventIds ?? base.usedEventIds ?? [],
    trainingFlow: partial.trainingFlow !== undefined ? partial.trainingFlow : (base.trainingFlow ?? null),
    pendingOffersShown: partial.pendingOffersShown ?? base.pendingOffersShown ?? [],
    pendingSelected: partial.pendingSelected !== undefined ? partial.pendingSelected : (base.pendingSelected ?? null),
    lastLossBrokenSynergies: partial.lastLossBrokenSynergies ?? base.lastLossBrokenSynergies ?? [],
    pendingSynergyReveal: partial.pendingSynergyReveal ?? base.pendingSynergyReveal ?? [],
    nextMatchRisk: partial.nextMatchRisk ?? base.nextMatchRisk ?? 0,
    nextMatchBonus: partial.nextMatchBonus ?? base.nextMatchBonus ?? 0,
  } as RunSnapshot;
}

/** Store veya kısmi güncellemeden snapshot çıkarır */
export function toRunSnapshot(source: SnapshotSource & Record<string, unknown>): RunSnapshot {
  const gameState = {} as GameState;
  for (const key of GAME_STATE_KEYS) {
    if (key in source && source[key] !== undefined) {
      gameState[key] = source[key] as never;
    }
  }
  return mergeRunSnapshot(null, {
    ...gameState,
    seed: source.seed,
    usedEventIds: source.usedEventIds ?? [],
    trainingFlow: source.trainingFlow ?? null,
    pendingOffersShown: source.pendingOffersShown ?? [],
    pendingSelected: source.pendingSelected ?? null,
    lastLossBrokenSynergies: source.lastLossBrokenSynergies ?? [],
    pendingSynergyReveal: source.pendingSynergyReveal ?? [],
    nextMatchRisk: source.nextMatchRisk ?? 0,
    nextMatchBonus: source.nextMatchBonus ?? 0,
  });
}

export function isResumableRun(saved: Partial<RunSnapshot> | null | undefined): boolean {
  return !!(saved?.seed && saved.phase !== 'runEnd');
}

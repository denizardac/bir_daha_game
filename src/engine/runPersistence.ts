import type { GameCard, GameState, Tag, TrainingCard } from '@/types';
import { normalizeSquadGoalkeepers, reconcileManualLineup } from '@/engine/lineupPreview';
import { getActiveFormationKey } from '@/engine/lineupPreview';
import type { PlayerCard } from '@/types';
import { normalizeRunUnlockTelemetry } from '@/engine/unlocks';

export interface PersistedTrainingFlow {
  card: TrainingCard;
  offeredTags: Tag[];
  step: 'player' | 'tag';
  selectedPlayerId?: string;
}

/** Taktik round'unda formasyon + sistem ayrı ayrı seçilir; onaylanana kadar taslak tutulur */
export interface TacticDraft {
  formationId: string | null;
  systemId: string | null;
}

/** localStorage'da saklanan run — GameState + oyun içi geçici alanlar */
export type RunSnapshot = GameState & {
  usedEventIds: string[];
  trainingFlow: PersistedTrainingFlow | null;
  tacticDraft: TacticDraft;
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
  tacticDraft?: TacticDraft;
  pendingOffersShown?: GameCard[];
  pendingSelected?: GameCard | null;
  lastLossBrokenSynergies?: string[];
  pendingSynergyReveal?: string[];
  nextMatchRisk?: number;
  nextMatchBonus?: number;
};

const EMPTY_TACTIC_DRAFT: TacticDraft = { formationId: null, systemId: null };

const GAME_STATE_KEYS: (keyof GameState)[] = [
  'runId', 'seed', 'isDailySeed', 'displayName', 'round', 'maxRounds', 'squad', 'maxSquadSize',
  'morale', 'score', 'streak', 'phase', 'roundHistory', 'currentOffers', 'currentMatch',
  'currentEvent', 'activeTactics', 'lastLossPlayer', 'discoveredSynergies', 'lossesCount',
  'dangerMode', 'isFirstRun', 'timerSeconds', 'eventResolvedThisRound', 'flawless',
  'recentlyJoinedPlayerId', 'runEndAnalysis', 'rerollsRemaining', 'formationRerollUsed', 'systemRerollUsed',
  'offersRerollIndex', 'recoveryGuaranteed', 'manualLineup', 'unlockTelemetry',
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
    tacticDraft: partial.tacticDraft ?? base.tacticDraft ?? { ...EMPTY_TACTIC_DRAFT },
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
    tacticDraft: source.tacticDraft ?? { ...EMPTY_TACTIC_DRAFT },
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

const PHASES = new Set(['cardSelect', 'event', 'match', 'loss', 'runEnd']);
const POSITIONS = new Set(['KL', 'STP', 'SLB', 'SÖB', 'DOS', 'OS', 'OOS', 'SLK', 'SÖK', 'SF']);
const RARITIES = new Set(['normal', 'iyi', 'güçlü', 'efsane']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPlayer(value: unknown): value is PlayerCard {
  if (!isRecord(value)) return false;
  return value.kind === 'player'
    && typeof value.id === 'string'
    && value.id.length > 0
    && typeof value.name === 'string'
    && typeof value.rating === 'number'
    && Number.isFinite(value.rating)
    && typeof value.currentRating === 'number'
    && Number.isFinite(value.currentRating)
    && typeof value.position === 'string'
    && POSITIONS.has(value.position)
    && typeof value.rarity === 'string'
    && RARITIES.has(value.rarity)
    && Array.isArray(value.tags);
}

function uniqueCards(cards: unknown, squadIds: Set<string>): GameCard[] {
  if (!Array.isArray(cards)) return [];
  const seen = new Set<string>();
  return cards.filter((card): card is GameCard => {
    if (!isRecord(card) || typeof card.id !== 'string' || typeof card.kind !== 'string') return false;
    if (seen.has(card.id)) return false;
    if (card.kind === 'player' && squadIds.has(card.id)) return false;
    seen.add(card.id);
    return ['player', 'tactic', 'training', 'skip'].includes(card.kind);
  });
}

/** Eski veya kısmen bozulmuş bir run'ı güvenli oyun invariant'larına geri çeker. */
export function repairRunSnapshot(input: unknown): Partial<RunSnapshot> | null {
  if (!isRecord(input) || typeof input.seed !== 'string' || input.seed.length === 0) return null;
  const maxSquadSize = Number.isInteger(input.maxSquadSize)
    ? Math.min(11, Math.max(1, Number(input.maxSquadSize)))
    : 11;
  const rawSquad = Array.isArray(input.squad) ? input.squad.filter(isPlayer) : [];
  const normalized = normalizeSquadGoalkeepers(rawSquad);
  const squad = normalized.length > maxSquadSize ? normalized.slice(0, maxSquadSize) : normalized;
  const squadIds = new Set(squad.map((player) => player.id));
  const activeTactics = Array.isArray(input.activeTactics)
    ? input.activeTactics.filter((tactic) => isRecord(tactic) && typeof tactic.id === 'string') as GameState['activeTactics']
    : [];
  const rawManual = isRecord(input.manualLineup)
    ? Object.fromEntries(Object.entries(input.manualLineup).flatMap(([slot, playerId]) => {
      const index = Number(slot);
      return Number.isInteger(index) && index >= 0 && index < 11 && typeof playerId === 'string' && squadIds.has(playerId)
        ? [[index, playerId]]
        : [];
    }))
    : {};
  const manualLineup = reconcileManualLineup(rawManual, squad, getActiveFormationKey(activeTactics));
  const round = Number.isInteger(input.round) ? Math.min(15, Math.max(1, Number(input.round))) : 1;
  const phase = typeof input.phase === 'string' && PHASES.has(input.phase) ? input.phase : 'cardSelect';

  return {
    ...(input as Partial<RunSnapshot>),
    seed: input.seed,
    runId: typeof input.runId === 'string' && input.runId.length > 0
      ? input.runId
      : `legacy:${input.seed}:${round}`,
    round,
    maxRounds: 15,
    maxSquadSize,
    phase: phase as GameState['phase'],
    squad,
    unlockTelemetry: normalizeRunUnlockTelemetry(
      input.unlockTelemetry,
      squad,
      typeof input.morale === 'number' ? input.morale : 50,
    ),
    activeTactics,
    manualLineup,
    currentOffers: uniqueCards(input.currentOffers, squadIds),
    roundHistory: Array.isArray(input.roundHistory)
      ? input.roundHistory.filter(isRecord) as unknown as GameState['roundHistory']
      : [],
  };
}

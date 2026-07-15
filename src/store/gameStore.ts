import { create } from 'zustand';
import {
  DANGER_MORALE_FLOOR,
  REROLLS_PER_RUN,
} from '@/constants/game';
import { getDailyStreakBonus } from '@/engine/dailyStreak';
import { getWeeklyModifier } from '@/engine/weeklyModifier';
import { isChallengeSeedDaily, type Challenge } from '@/engine/challenge';
import { ACHIEVEMENTS, getUnlockedAchievementIds, type Achievement } from '@/engine/achievements';
import { isRemoteLeaderboardEnabled, recordRunStart, submitRunToLeaderboard } from '@/api/leaderboardRemote';
import { buildSignedRunPayload } from '@/engine/runIntegrity';
import { validateRunSubmission } from '@/engine/runValidation';
import { getEventRatingTarget, resolveEventRemoval } from '@/engine/eventRemoval';
import { isEventRound } from '@/data/events';
import { getTacticCard, getTacticCategory, getTacticEffect } from '@/data/tactics';
import { canAddTag } from '@/data/tagConflicts';
import { createTrainingCard, MAX_PLAYER_TAGS } from '@/data/training';
import { getActiveSynergies, SYNERGIES, TOTAL_SYNERGIES } from '@/data/synergies';
import { getStartingSquad } from '@/data/players';
import { applyRandomEventTags, drawEvent, previewEventPlayer, resolveEvent } from '@/engine/events';
import { drawOffers, drawTargetedScoutOffers, drawTacticCategoryOffers, getOfferDrawModeForRound, pickAutoOffer, rerollSinglePlayerOffer } from '@/engine/cardDraw';
import { canPassCardPick } from '@/engine/cardPass';
import { getFinaleRivalName, isTacticBonusRound, TACTIC_BONUS_MORALE, TACTIC_BONUS_SCORE } from '@/engine/roundFlow';
import { simulateMatch } from '@/engine/matchSimulation';
import { calculateRoundPoints } from '@/engine/scoring';
import { addToHallOfFame, getHallOfFameForMonth, getSeasonKey } from '@/engine/hallOfFame';
import { detectMatchMilestones, mergeMilestones, type Milestone } from '@/engine/milestones';
import { createRng, getDailySeed, getRandomSeed } from '@/engine/seed';
import {
  addScoreToLeaderboards,
  analyzeEgo,
  getDailyList,
  getNearRivals,
  getRank,
  getRankPercent,
  getTodayKey,
} from '@/engine/leaderboard';
import {
  canSelectTransferDeparture,
  finalizePlayerTransfer,
  getActiveFormationKey,
  normalizeSquadGoalkeepers,
  reconcileManualLineup,
} from '@/engine/lineupPreview';
import { simulateRosterDecision } from '@/engine/rosterDecision';
import {
  applyGerileyen,
  applyInjuryRisk,
  applyMentorGrowth,
  applyPotentialGrowth,
  getBrokenSynergies,
  getWeakestPlayer,
  passiveMoraleFromSquad,
  selectDepartingPlayer,
} from '@/engine/squadLogic';
import type {
  GameCard,
  GamePhase,
  GameState,
  RoundResult,
  RunEndAnalysis,
  Screen,
  Tag,
  TrainingCard,
} from '@/types';
import { isPlayerCard, isTacticCard, isSkipCard } from '@/types';
import { isResumableRun, mergeRunSnapshot, type RunSnapshot, type TacticDraft, toRunSnapshot } from '@/engine/runPersistence';
import { getAnonymousId, loadPersisted, savePartial, savePersisted } from '@/utils/storage';
import { playSound } from '@/utils/sound';
import {
  applyCompletedRunToUnlocks,
  consumeUnlockGuarantee,
  createRunUnlockTelemetry,
  dismissUnlockNotifications,
  getNextUnlockGuarantee,
  getUnlockDefinitionsByIds,
  getUnlockedContentIds,
  hasUnlockedContent,
  updateRunUnlockTelemetry,
  type UnlockDefinition,
} from '@/engine/unlocks';
import { buildMonthlyLegendCard, fetchMonthlyLegendRecord, normalizeMonthlyLegendRecord } from '@/engine/monthlyLegend';
import type { MonthlyLegendRecord } from '@/types';

const MAX_ROUNDS = 15;
const MAX_SQUAD = 11;
let runIdFallback = 0;

function createRunId(seed: string): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `${seed}:${uuid}`;
  runIdFallback += 1;
  return `${seed}:${Date.now().toString(36)}:${runIdFallback}`;
}

// Kart zamanlayıcısı oyundan tamamen kaldırıldı — her zaman kapalı.
// timerSeconds 0 kalır; scoring'deki zamanlayıcı bonusu da böylece devre dışı.
function cardTimerSeconds() {
  return 0;
}

function isCardTimerEnabled() {
  return false;
}

function getPlayerContentAccess(
  isDailySeed: boolean,
  options: { guaranteedPlayerId?: string; guaranteeRecoveryPlayer?: boolean } = {},
  monthlyLegendRecord: MonthlyLegendRecord | null | undefined = undefined,
) {
  const persisted = loadPersisted();
  const unlocks = persisted.unlocks;
  const record = monthlyLegendRecord === undefined ? persisted.monthlyLegend : monthlyLegendRecord;
  const monthlyLegend = buildMonthlyLegendCard(record);
  return {
    isDailySeed,
    unlockedPlayerIds: getUnlockedContentIds(unlocks, 'player'),
    globalPlayers: monthlyLegend ? [monthlyLegend] : [],
    ...options,
  };
}

function getEventContentAccess(isDailySeed: boolean, guaranteedEventId?: string) {
  const unlocks = loadPersisted().unlocks;
  return {
    isDailySeed,
    unlockedEventIds: getUnlockedContentIds(unlocks, 'event'),
    guaranteedEventId,
  };
}

function consumeOfferedGuarantee(guarantee: GameState['activeUnlockGuarantee']): void {
  if (!guarantee) return;
  const persisted = loadPersisted();
  savePersisted({ ...persisted, unlocks: consumeUnlockGuarantee(persisted.unlocks, guarantee) });
}

interface TrainingFlow {
  card: TrainingCard;
  offeredTags: Tag[];
  step: 'player' | 'tag';
  selectedPlayerId?: string;
}

interface GameStore extends GameState {
  screen: Screen;
  showContinuePrompt: boolean;
  pendingOffersShown: GameCard[];
  pendingSelected: GameCard | null;
  trainingFlow: TrainingFlow | null;
  tacticDraft: TacticDraft;
  usedEventIds: string[];
  nextMatchRisk: number;
  nextMatchBonus: number;
  runEndStep: number;
  pendingMilestones: Milestone[];
  lastLossBrokenSynergies: string[];
  pendingSynergyReveal: string[];
  /** Oyuncu seçildikten sonra İlk 11 düzenleme modalı açık mı (maç onaydan sonra). */
  lineupEditorOpen: boolean;
  /** URL ile gelen meydan okuma (menüde banner) */
  pendingChallenge: Challenge | null;
  /** Run başında açık olan başarım id'leri — run sonu "yeni açıldı" kıyası için */
  unlockedAtRunStart: string[];
  /** Bu run'da açılan başarımlar (run sonu ekranında gösterilir) */
  newAchievements: Achievement[];
  /** Bu run'da ilk kez açılan oynanabilir içerikler; UI ikinci aşamada gösterecek. */
  newContentUnlocks: UnlockDefinition[];
  /** İçinde bulunulan ay için doğrulanmış global topluluk kartı. */
  monthlyLegend: MonthlyLegendRecord | null;
  /** Editörde vurgulanacak yeni oyuncu id'si. */
  lineupEditorHighlightId: string | null;
  /** Transfer taslağında kadrodan ayrılması önerilen mevcut oyuncu. */
  lineupEditorOutgoingId: string | null;
  /** Editör açılmadan önceki kadro/diziliş — iptal edilince geri yüklenir. */
  lineupEditorPrevSquad: GameState['squad'] | null;
  lineupEditorPrevManual: Record<number, string> | null;
  init: () => void;
  refreshMonthlyLegend: () => Promise<void>;
  /** seedOverride verilirse meydan okuma seed'iyle başlar (günlük olup olmadığı seed'den türetilir) */
  startRun: (daily?: boolean, displayName?: string, seedOverride?: string) => void;
  setChallenge: (challenge: Challenge | null) => void;
  continueRun: () => void;
  abandonRun: () => void;
  selectOffer: (card: GameCard) => void;
  confirmTacticRound: () => void;
  /** İlk 11 editörü onaylanınca maçı oynatır. */
  confirmLineupAndPlay: () => void;
  /** İlk 11 editörünü iptal eder — seçilen oyuncu geri alınır, kart seçimine dönülür. */
  cancelLineupEditor: () => void;
  /** Dolu kadroda otomatik çıkış önerisini başka bir mevcut oyuncuyla değiştirir. */
  setLineupEditorOutgoing: (playerId: string) => void;
  /** Manuel ilk 11 override'ını günceller (editör sürükle-bırak sonrası). */
  setManualLineup: (manualLineup: Record<number, string>) => void;
  /** Manuel override'ı temizler — saf otomatik yerleşime döner. */
  resetManualLineup: () => void;
  beginTraining: () => void;
  pickTrainingPlayer: (playerId: string) => void;
  completeTraining: (tag: Tag) => void;
  cancelTraining: () => void;
  backTrainingPlayer: () => void;
  autoSelectOffer: () => void;
  resolveEventChoice: (choice: 'A' | 'B') => void;
  useTargetedScout: () => void;
  finishMatch: () => void;
  finishLoss: () => void;
  advanceRunEnd: () => void;
  goToMenu: () => void;
  exitToMenu: () => void;
  resetRun: () => void;
  rerollSingleOffer: (slotIndex: number) => void;
  rerollAllOffers: () => void;
  /** Taktik turunda formasyon tekliflerini yeniler — oyun-boyu tek hak. */
  rerollFormationOffers: () => void;
  /** Taktik turunda oyun sistemi tekliflerini yeniler — oyun-boyu tek hak. */
  rerollSystemOffers: () => void;
  dismissMilestone: (id: string) => void;
  dismissSynergyReveal: () => void;
  acknowledgeContentUnlocks: () => void;
  tickTimer: () => void;
  saveCurrentRun: () => void;
  setScreen: (screen: Screen) => void;
}

function initialRun(
  seed: string,
  isDailySeed: boolean,
  isFirstRun: boolean,
  displayName: string,
  streakBonus = getDailyStreakBonus(0),
): GameState {
  const squad = normalizeSquadGoalkeepers(getStartingSquad(seed, isDailySeed));
  const weeklyMod = getWeeklyModifier();
  const persistedUnlocks = loadPersisted().unlocks;
  const activeUnlockGuarantee = getNextUnlockGuarantee(persistedUnlocks, isDailySeed);
  const cachedMonthlyLegend = normalizeMonthlyLegendRecord(loadPersisted().monthlyLegend);
  const monthlyLegendAtRunStart = buildMonthlyLegendCard(cachedMonthlyLegend) ? cachedMonthlyLegend : null;
  const guaranteedPlayerId = activeUnlockGuarantee?.kind === 'player' ? activeUnlockGuarantee.contentId : undefined;
  const startMorale = Math.min(100, 50 + streakBonus.startMoraleBonus + (weeklyMod.startMoraleBonus ?? 0));
  const currentOffers = drawOffers(
    seed, 1, 0, squad, [], false, 0, 'normal', 'players',
    getPlayerContentAccess(isDailySeed, { guaranteedPlayerId }, monthlyLegendAtRunStart),
  );
  const unlockGuaranteeOffered = Boolean(
    guaranteedPlayerId && currentOffers.some((card) => card.kind === 'player' && card.id === guaranteedPlayerId),
  );
  return {
    runId: createRunId(seed),
    seed,
    isDailySeed,
    displayName,
    round: 1,
    maxRounds: MAX_ROUNDS,
    squad,
    maxSquadSize: MAX_SQUAD,
    morale: startMorale,
    score: 0,
    streak: 0,
    phase: 'cardSelect',
    roundHistory: [],
    currentOffers,
    currentMatch: null,
    currentEvent: null,
    activeTactics: [],
    lastLossPlayer: null,
    discoveredSynergies: loadPersisted().discoveredSynergies,
    lossesCount: 0,
    dangerMode: false,
    isFirstRun,
    timerSeconds: cardTimerSeconds(),
    eventResolvedThisRound: false,
    flawless: true,
    recentlyJoinedPlayerId: null,
    runEndAnalysis: null,
    rerollsRemaining: REROLLS_PER_RUN + streakBonus.extraRerolls + (weeklyMod.extraRerolls ?? 0),
    formationRerollUsed: false,
    systemRerollUsed: false,
    offersRerollIndex: 0,
    recoveryGuaranteed: false,
    manualLineup: {},
    unlockTelemetry: createRunUnlockTelemetry(squad, startMorale),
    activeUnlockGuarantee,
    unlockGuaranteeOffered,
    targetedScoutAvailable: !isDailySeed && hasUnlockedContent(persistedUnlocks, 'mechanic_hedefli_scout'),
    crisisContractTriggered: false,
    crisisRecoveryPending: false,
    monthlyLegendAtRunStart,
  };
}

/** Run başındaki açık başarımlarla kıyaslayıp bu run'da açılanları döner */
function computeNewAchievements(unlockedAtRunStart: string[]): Achievement[] {
  const before = new Set(unlockedAtRunStart);
  const after = new Set(getUnlockedAchievementIds(loadPersisted()));
  return ACHIEVEMENTS.filter((a) => after.has(a.id) && !before.has(a.id));
}

async function persistRunEndScore(
  state: GameStore,
  score: number,
  roundsCompleted: number,
  flawless: boolean,
): Promise<UnlockDefinition[]> {
  // Kişisel ilerleme leaderboard/digest/ağ sonucundan bağımsızdır. Async imza
  // başlamadan önce kalıcı yazılır; hızlı "Bir Daha" tıklaması bildirimi yutmaz.
  const beforeScorePersistence = loadPersisted();
  const unlockResult = applyCompletedRunToUnlocks(beforeScorePersistence.unlocks, {
    runId: state.runId,
    score,
    round: roundsCompleted,
    maxRounds: state.maxRounds,
    squad: state.squad,
    morale: state.morale,
    roundHistory: state.roundHistory,
    unlockTelemetry: state.unlockTelemetry,
  });
  savePersisted({ ...beforeScorePersistence, unlocks: unlockResult.state });

  const base = {
    id: getAnonymousId(),
    seed: state.seed,
    displayName: state.displayName || 'Anonim',
    totalScore: score,
    roundsCompleted,
    timestamp: Date.now(),
    flawless: flawless && state.lossesCount === 0,
  };
  const signed = await buildSignedRunPayload(base, state.roundHistory);
  const validation = await validateRunSubmission(signed.entry, state.roundHistory, signed.digest);
  const latest = loadPersisted();
  const hallEntry = { ...signed.entry, flawless: signed.entry.flawless ?? false };
  if (!validation.ok) {
    console.warn('[leaderboard] Run doğrulanamadı:', validation.reason);
    savePersisted(addToHallOfFame(latest, hallEntry));
    return unlockResult.newlyUnlocked;
  }
  const withScore = addToHallOfFame(addScoreToLeaderboards(latest, signed.entry, state.isDailySeed), hallEntry);
  savePersisted({ ...withScore, unlocks: unlockResult.state });
  if (isRemoteLeaderboardEnabled()) {
    void submitRunToLeaderboard(signed, state.roundHistory, state.isDailySeed).then((result) => {
      if (!result.ok) console.warn('[leaderboard] Uzak skor gönderilemedi:', result.error);
    });
  }
  return unlockResult.newlyUnlocked;
}

function persistRun(state: (Partial<RunSnapshot> & Pick<RunSnapshot, 'seed'>) | GameStore) {
  const p = loadPersisted();
  const input = 'screen' in state
    ? toRunSnapshot(state as GameStore & Record<string, unknown>)
    : (state as Partial<RunSnapshot> & Pick<RunSnapshot, 'seed'>);
  const next = mergeRunSnapshot(p.currentRun as Partial<RunSnapshot> | null, input);
  savePersisted({
    ...p,
    currentRun: next,
    discoveredSynergies: next.discoveredSynergies ?? p.discoveredSynergies,
  });
}

function clearRun() {
  savePersisted({ ...loadPersisted(), currentRun: null });
}

function drawRoundOffers(state: Pick<GameState, 'seed' | 'isDailySeed' | 'round' | 'lossesCount' | 'squad' | 'activeTactics' | 'recoveryGuaranteed' | 'offersRerollIndex' | 'maxRounds' | 'activeUnlockGuarantee' | 'unlockGuaranteeOffered' | 'crisisRecoveryPending' | 'monthlyLegendAtRunStart'>) {
  const mode = getOfferDrawModeForRound(state.round, state.maxRounds ?? MAX_ROUNDS);
  return drawOffers(
    state.seed,
    state.round,
    state.lossesCount,
    state.squad,
    state.activeTactics.map((t) => t.id),
    state.recoveryGuaranteed,
    state.offersRerollIndex ?? 0,
    'normal',
    mode,
    getPlayerContentAccess(state.isDailySeed, {
      guaranteedPlayerId: !state.unlockGuaranteeOffered && state.activeUnlockGuarantee?.kind === 'player'
        ? state.activeUnlockGuarantee.contentId
        : undefined,
      guaranteeRecoveryPlayer: state.crisisRecoveryPending,
    }, state.monthlyLegendAtRunStart),
  );
}

function activateCrisisContract(
  state: Pick<GameState, 'isDailySeed' | 'crisisContractTriggered'>,
  squadSize: number,
  rerollsRemaining: number,
) {
  const activated = squadSize === 5
    && !state.isDailySeed
    && !state.crisisContractTriggered
    && hasUnlockedContent(loadPersisted().unlocks, 'mechanic_kriz_kontrati');
  return activated
    ? {
        rerollsRemaining: Math.min(REROLLS_PER_RUN + 2, rerollsRemaining + 1),
        crisisContractTriggered: true,
        crisisRecoveryPending: true,
      }
    : {
        rerollsRemaining,
        crisisContractTriggered: state.crisisContractTriggered,
        crisisRecoveryPending: false,
      };
}

/** Round geçmişindeki olay kararları — zincirleme olay ağırlıkları için */
function pastEventChoices(roundHistory: GameState['roundHistory']): Record<string, 'A' | 'B'> {
  const choices: Record<string, 'A' | 'B'> = {};
  for (const r of roundHistory) {
    if (r.isEvent && r.eventChoice && r.cardSelected.kind === 'event') {
      choices[r.cardSelected.id] = r.eventChoice;
    }
  }
  return choices;
}

function startRound(state: GameStore): Partial<GameStore> {
  if (isEventRound(state.round) && !state.eventResolvedThisRound) {
    const guaranteedEventId = !state.unlockGuaranteeOffered && state.activeUnlockGuarantee?.kind === 'event'
      ? state.activeUnlockGuarantee.contentId
      : undefined;
    const event = drawEvent(state.seed, state.round, state.usedEventIds, {
      streak: state.streak,
      morale: state.morale,
      lossesCount: state.lossesCount,
      squadSize: state.squad.length,
      maxSquadSize: state.maxSquadSize,
      round: state.round,
      pastChoices: pastEventChoices(state.roundHistory),
    }, getEventContentAccess(state.isDailySeed, guaranteedEventId));
    const unlockGuaranteeOffered = Boolean(guaranteedEventId && event.id === guaranteedEventId);
    if (unlockGuaranteeOffered) consumeOfferedGuarantee(state.activeUnlockGuarantee);
    return {
      phase: 'event' as GamePhase,
      currentEvent: event,
      timerSeconds: cardTimerSeconds(),
      unlockGuaranteeOffered: state.unlockGuaranteeOffered || unlockGuaranteeOffered,
    };
  }
  const currentOffers = drawRoundOffers(state);
  const guaranteedPlayerId = !state.unlockGuaranteeOffered && state.activeUnlockGuarantee?.kind === 'player'
    ? state.activeUnlockGuarantee.contentId
    : undefined;
  const unlockGuaranteeOffered = Boolean(
    guaranteedPlayerId && currentOffers.some((card) => card.kind === 'player' && card.id === guaranteedPlayerId),
  );
  if (unlockGuaranteeOffered) consumeOfferedGuarantee(state.activeUnlockGuarantee);
  return {
    phase: 'cardSelect' as GamePhase,
    currentOffers,
    timerSeconds: cardTimerSeconds(),
    eventResolvedThisRound: false,
    offersRerollIndex: 0,
    unlockGuaranteeOffered: state.unlockGuaranteeOffered || unlockGuaranteeOffered,
    crisisRecoveryPending: false,
  };
}

function finalizeBonusRound(
  state: GameStore,
  squad: GameState['squad'],
  activeTactics: GameState['activeTactics'],
  card: GameCard,
  set: (partial: Partial<GameStore>) => void,
) {
  let score = state.score + TACTIC_BONUS_SCORE;
  let morale = Math.min(100, state.morale + TACTIC_BONUS_MORALE);
  if (squad.length <= 5) morale = Math.max(DANGER_MORALE_FLOOR, morale);
  const unlockTelemetry = updateRunUnlockTelemetry(state.unlockTelemetry, squad, morale);

  const historyEntry = {
    round: state.round,
    cardsShown: [...state.currentOffers],
    cardSelected: card,
    matchResult: null,
    pointsEarned: TACTIC_BONUS_SCORE,
    isTacticBonus: true,
  };
  const roundHistory = [...state.roundHistory, historyEntry];
  const dangerMode = squad.length <= 5;

  // Formasyon değiştiyse manuel diziliş sıfırlanır (slot index'leri yeni
  // formasyonda farklı pozisyona denk gelir); aksi halde geçersiz pin'ler temizlenir.
  const newFormationKey = getActiveFormationKey(activeTactics);
  const formationChanged = newFormationKey !== getActiveFormationKey(state.activeTactics);
  const manualLineup = formationChanged
    ? {}
    : reconcileManualLineup(state.manualLineup, squad, newFormationKey);

  if (squad.length <= 4 || state.round >= state.maxRounds) {
    const analysis = buildRunEndAnalysis({
      ...state,
      squad,
      score,
      roundHistory,
      activeTactics,
      morale,
      unlockTelemetry,
    });
    void persistRunEndScore({
      ...state, squad, activeTactics, morale, score, roundHistory, unlockTelemetry, flawless: state.flawless,
    }, score, state.round, state.flawless)
      .then((newContentUnlocks) => set({
        newAchievements: computeNewAchievements(state.unlockedAtRunStart),
        newContentUnlocks,
      }));
    set({
      squad,
      activeTactics,
      morale,
      score,
      unlockTelemetry,
      phase: 'runEnd',
      roundHistory,
      dangerMode,
      isFirstRun: false,
      runEndAnalysis: analysis,
      runEndStep: 0,
      currentOffers: [],
      pendingOffersShown: [],
      pendingSelected: null,
      trainingFlow: null,
      tacticDraft: { formationId: null, systemId: null },
    });
    clearRun();
    return;
  }

  const round = state.round + 1;
  const pendingMilestones = state.pendingMilestones;

  const next = startRound({
    ...state,
    squad,
    morale,
    score,
    unlockTelemetry,
    round,
    roundHistory,
    activeTactics,
    dangerMode,
    recoveryGuaranteed: state.lossesCount <= 2 && state.lossesCount > 0,
  });
  const nextState = {
    squad,
    morale,
    score,
    unlockTelemetry,
    activeTactics,
    round,
    roundHistory,
    dangerMode,
    pendingMilestones,
    currentMatch: null,
    pendingOffersShown: [],
    pendingSelected: null,
    trainingFlow: null,
    tacticDraft: { formationId: null, systemId: null } as TacticDraft,
    manualLineup,
    ...next,
  };
  playSound('tick', loadPersisted().soundEnabled);
  persistRun({ ...state, ...nextState });
  set(nextState);
}

function synergyPointsFromMatch(
  synergy: (typeof SYNERGIES)[number],
  match: NonNullable<import('@/types').RoundResult['matchResult']>,
): number {
  let pts = 0;
  if (synergy.perGoalBonus && match.goalsFor > 0) pts += synergy.perGoalBonus * match.goalsFor;
  if (synergy.perWinBonus && match.outcome === 'win') pts += synergy.perWinBonus;
  if (synergy.perRoundBonus) pts += synergy.perRoundBonus;
  return pts;
}

function buildRunEndAnalysis(state: GameStore): RunEndAnalysis {
  const persisted = loadPersisted();
  const rankList = state.isDailySeed
    ? getDailyList(persisted)
    : persisted.allTimeLeaderboard;
  const currentPlayerId = getAnonymousId();
  const previousLeaderboardBest = rankList.find((entry) => entry.id === currentPlayerId)?.totalScore;
  const monthBest = getHallOfFameForMonth(persisted, getSeasonKey())
    .find((entry) => entry.id === currentPlayerId)?.totalScore;
  const ego = analyzeEgo(
    state.roundHistory,
    state.seed,
    getStartingSquad(state.seed, state.isDailySeed),
    state.isDailySeed,
  );
  const rank = getRank(state.score, rankList);
  const rankPercent = getRankPercent(state.score, rankList);
  const rivals = getNearRivals(state.score, rankList, state.displayName || 'Sen');

  const synergyStats = state.discoveredSynergies.flatMap((id) => {
    // Eski sürümden persist edilmiş, artık var olmayan sinerji id'lerini atla
    const s = SYNERGIES.find((x) => x.id === id);
    if (!s) return [];
    let activations = 0;
    let points = 0;
    for (const r of state.roundHistory) {
      if (!r.matchResult?.activeSynergies.includes(id)) continue;
      activations += 1;
      points += synergyPointsFromMatch(s, r.matchResult);
    }
    return [{ id, name: s.name, icon: s.icon, activations, points }];
  });

  const badges: string[] = [];
  if (state.round >= 15) badges.push('SÜPER RUN');
  if (state.flawless && state.lossesCount === 0) badges.push('NAMAĞLUP');
  if (state.score >= 12000) badges.push('ELİT SKOR');

  return {
    rank,
    totalPlayers: Math.max(rankList.length, 1),
    rankPercent,
    bestDecision: ego.bestDecision,
    worstMistake: ego.worstMistake,
    synergyStats,
    nearRivalBefore: rivals.before,
    nearRivalAfter: rivals.after,
    badges,
    scoreRecord: {
      isLeaderboardBest: previousLeaderboardBest === undefined || state.score > previousLeaderboardBest,
      previousLeaderboardBest,
      isHallOfFameBest: monthBest === undefined || state.score > monthBest,
      previousHallOfFameBest: monthBest,
    },
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialRun(getDailySeed(), true, true, 'Anonim'),
  screen: 'menu',
  showContinuePrompt: false,
  pendingOffersShown: [],
  pendingSelected: null,
  trainingFlow: null,
  tacticDraft: { formationId: null, systemId: null },
  usedEventIds: [],
  nextMatchRisk: 0,
  nextMatchBonus: 0,
  runEndStep: 0,
  pendingMilestones: [],
  lastLossBrokenSynergies: [],
  pendingSynergyReveal: [],
  recentlyJoinedPlayerId: null,
  pendingChallenge: null,
  unlockedAtRunStart: [],
  newAchievements: [],
  newContentUnlocks: [],
  monthlyLegend: normalizeMonthlyLegendRecord(loadPersisted().monthlyLegend),
  lineupEditorOpen: false,
  lineupEditorHighlightId: null,
  lineupEditorOutgoingId: null,
  lineupEditorPrevSquad: null,
  lineupEditorPrevManual: null,

  init: () => {
    getAnonymousId();
    const p = loadPersisted();
    const saved = p.currentRun as Partial<RunSnapshot> | null;
    set({
      showContinuePrompt: isResumableRun(saved),
      isFirstRun: p.isFirstRun,
      newContentUnlocks: getUnlockDefinitionsByIds(p.unlocks.pendingNotificationIds),
      monthlyLegend: normalizeMonthlyLegendRecord(p.monthlyLegend),
    });
    void get().refreshMonthlyLegend();
  },

  refreshMonthlyLegend: async () => {
    try {
      const cached = normalizeMonthlyLegendRecord(loadPersisted().monthlyLegend);
      if (buildMonthlyLegendCard(cached)) {
        set({ monthlyLegend: cached });
        return;
      }
      const record = await fetchMonthlyLegendRecord();
      if (!record) return;
      const persisted = loadPersisted();
      savePersisted({ ...persisted, monthlyLegend: record });
      set({ monthlyLegend: record });
    } catch {
      // Ağ yoksa geçerli cache kullanılmaya devam eder.
    }
  },

  setChallenge: (challenge) => set({ pendingChallenge: challenge }),

  startRun: (daily = true, displayName = 'Anonim', seedOverride?: string) => {
    const p = loadPersisted();
    const name = displayName.trim().slice(0, 18) || 'Anonim';
    const seed = seedOverride ?? (daily ? getDailySeed() : getRandomSeed());
    // Meydan okuma seed'i bugünün günlük seed'i değilse serbest mod sayılır —
    // sunucu da günlük skorlarda seed↔gün eşleşmesi arıyor.
    const isDaily = seedOverride ? isChallengeSeedDaily(seed) : daily;
    const streakBonus = isDaily ? getDailyStreakBonus(p.dailyStreak) : getDailyStreakBonus(0);
    const run = initialRun(seed, isDaily, p.isFirstRun, name, streakBonus);
    clearRun();
    persistRun(run);
    if (run.unlockGuaranteeOffered) consumeOfferedGuarantee(run.activeUnlockGuarantee);
    {
      const p2 = loadPersisted();
      const today = getTodayKey();
      const todayRuns = (p2.todayRunsDate === today ? p2.todayRuns : 0) + 1;
      savePersisted({ ...p2, lastPlayerName: name, todayRuns, todayRunsDate: today });
    }
    if (isRemoteLeaderboardEnabled()) {
      void recordRunStart({
        playerId: getAnonymousId(),
        displayName: name,
        seed,
        isDaily,
      }).then((result) => {
        if (!result.ok) console.warn('[run-start] Başlangıç kaydedilemedi:', result.error);
      });
    }
    set({
      ...run, screen: 'game', showContinuePrompt: false, pendingOffersShown: [], pendingSelected: null,
      trainingFlow: null, tacticDraft: { formationId: null, systemId: null }, usedEventIds: [], runEndStep: 0,
      pendingMilestones: [], lastLossBrokenSynergies: [], pendingSynergyReveal: [], nextMatchRisk: 0, nextMatchBonus: 0,
      pendingChallenge: null,
      unlockedAtRunStart: getUnlockedAchievementIds(p),
      newAchievements: [],
      newContentUnlocks: [],
      lineupEditorOpen: false,
      lineupEditorHighlightId: null,
      lineupEditorOutgoingId: null,
      lineupEditorPrevSquad: null,
      lineupEditorPrevManual: null,
    });
  },

  continueRun: () => {
    const saved = loadPersisted().currentRun as Partial<RunSnapshot> | null;
    if (!isResumableRun(saved) || !saved?.seed) return;

    const squad = normalizeSquadGoalkeepers(saved.squad ?? getStartingSquad(saved.seed, saved.isDailySeed ?? true));
    const phase = saved.phase ?? 'cardSelect';
    let currentOffers = saved.currentOffers ?? [];
    if (phase === 'cardSelect' && currentOffers.length === 0) {
      currentOffers = drawOffers(
        saved.seed,
        saved.round ?? 1,
        saved.lossesCount ?? 0,
        squad,
        saved.activeTactics?.map((t) => t.id) ?? [],
        saved.recoveryGuaranteed ?? false,
        saved.offersRerollIndex ?? 0,
        'normal',
        getOfferDrawModeForRound(saved.round ?? 1, saved.maxRounds ?? MAX_ROUNDS),
        getPlayerContentAccess(saved.isDailySeed ?? true, {}, saved.monthlyLegendAtRunStart ?? null),
      );
    }

    set({
      ...(saved as GameState),
      runId: saved.runId ?? createRunId(saved.seed),
      squad,
      displayName: saved.displayName ?? 'Anonim',
      screen: 'game',
      showContinuePrompt: false,
      phase,
      currentOffers: phase === 'cardSelect' ? currentOffers : (saved.currentOffers ?? []),
      currentMatch: saved.currentMatch ?? null,
      currentEvent: saved.currentEvent ?? null,
      lastLossPlayer: saved.lastLossPlayer ?? null,
      rerollsRemaining: saved.rerollsRemaining ?? REROLLS_PER_RUN,
      formationRerollUsed: saved.formationRerollUsed ?? false,
      systemRerollUsed: saved.systemRerollUsed ?? false,
      offersRerollIndex: saved.offersRerollIndex ?? 0,
      manualLineup: saved.manualLineup ?? {},
      unlockTelemetry: saved.unlockTelemetry ?? createRunUnlockTelemetry(squad, saved.morale ?? 50),
      activeUnlockGuarantee: saved.activeUnlockGuarantee ?? null,
      unlockGuaranteeOffered: saved.unlockGuaranteeOffered ?? false,
      targetedScoutAvailable: saved.targetedScoutAvailable ?? false,
      crisisContractTriggered: saved.crisisContractTriggered ?? false,
      crisisRecoveryPending: saved.crisisRecoveryPending ?? false,
      monthlyLegendAtRunStart: saved.monthlyLegendAtRunStart ?? null,
      timerSeconds: 0,
      usedEventIds: saved.usedEventIds ?? [],
      trainingFlow: saved.trainingFlow ?? null,
      tacticDraft: saved.tacticDraft ?? { formationId: null, systemId: null },
      pendingOffersShown: saved.pendingOffersShown ?? [],
      pendingSelected: saved.pendingSelected ?? null,
      lastLossBrokenSynergies: saved.lastLossBrokenSynergies ?? [],
      pendingSynergyReveal: saved.pendingSynergyReveal ?? [],
      nextMatchRisk: saved.nextMatchRisk ?? 0,
      nextMatchBonus: saved.nextMatchBonus ?? 0,
      recentlyJoinedPlayerId: saved.recentlyJoinedPlayerId ?? null,
      runEndStep: 0,
      pendingMilestones: [],
      // Devam edilen run'da yalnızca bundan sonra açılanlar "yeni" sayılır
      unlockedAtRunStart: getUnlockedAchievementIds(loadPersisted()),
      newAchievements: [],
      newContentUnlocks: [],
      lineupEditorOpen: false,
      lineupEditorHighlightId: null,
      lineupEditorOutgoingId: null,
      lineupEditorPrevSquad: null,
      lineupEditorPrevManual: null,
    });
  },

  saveCurrentRun: () => {
    const s = get();
    if (s.screen !== 'game' || s.phase === 'runEnd') return;
    // Transfer editörü açıkken state geçici olarak kapasitenin bir üstünde aday
    // taşıyabilir. Kayda yalnızca son onaylı kadroyu yaz; yarım kalmış karar yüklenmesin.
    if (s.lineupEditorOpen && s.lineupEditorPrevSquad) {
      persistRun({
        ...s,
        squad: s.lineupEditorPrevSquad,
        manualLineup: s.lineupEditorPrevManual ?? {},
        pendingSelected: null,
      });
      return;
    }
    persistRun(s);
  },

  dismissMilestone: (id) => set((s) => ({ pendingMilestones: s.pendingMilestones.filter((m) => m.id !== id) })),
  dismissSynergyReveal: () => set({ pendingSynergyReveal: [] }),

  rerollSingleOffer: (slotIndex) => {
    const state = get();
    if (state.phase !== 'cardSelect' || state.rerollsRemaining <= 0) return;
    if (isTacticBonusRound(state.round, state.maxRounds)) return;

    const offers = [...state.currentOffers];
    if (slotIndex < 0 || slotIndex >= offers.length) return;
    if (!isPlayerCard(offers[slotIndex]!)) return;

    playSound('tick', loadPersisted().soundEnabled);
    const newIndex = state.offersRerollIndex + 1;
    // Slot'un KENDİ mevcut kartını da hariç tut — aksi halde art arda reroll'de
    // aynı oyuncu tekrar gelebilir (bir önceki reroll sonucu havuzdan çıkarılmıyordu).
    const otherOffers = offers.filter(isPlayerCard);
    const replacement = rerollSinglePlayerOffer(
      state.seed,
      state.round,
      state.lossesCount,
      state.squad,
      otherOffers,
      slotIndex,
      newIndex,
      state.recoveryGuaranteed,
      getPlayerContentAccess(state.isDailySeed, {}, state.monthlyLegendAtRunStart),
    );

    offers[slotIndex] = replacement;
    const next = {
      currentOffers: offers,
      rerollsRemaining: state.rerollsRemaining - 1,
      offersRerollIndex: newIndex,
      timerSeconds: cardTimerSeconds(),
    };
    set(next);
    persistRun({ ...get(), ...next });
  },

  rerollAllOffers: () => {
    const state = get();
    if (state.phase !== 'cardSelect' || state.rerollsRemaining <= 0) return;
    if (isTacticBonusRound(state.round, state.maxRounds)) return;

    playSound('tick', loadPersisted().soundEnabled);
    const cost = 1;
    const newIndex = state.offersRerollIndex + cost;
    const offers = drawOffers(
      state.seed,
      state.round,
      state.lossesCount,
      state.squad,
      state.activeTactics.map((t) => t.id),
      state.recoveryGuaranteed,
      newIndex,
      'normal',
      getOfferDrawModeForRound(state.round),
      getPlayerContentAccess(state.isDailySeed, {}, state.monthlyLegendAtRunStart),
    );
    const next = {
      currentOffers: offers,
      rerollsRemaining: state.rerollsRemaining - cost,
      offersRerollIndex: newIndex,
      timerSeconds: cardTimerSeconds(),
    };
    set(next);
    persistRun({ ...get(), ...next });
  },

  rerollFormationOffers: () => {
    const state = get();
    if (state.phase !== 'cardSelect' || !isTacticBonusRound(state.round, state.maxRounds)) return;
    if (state.formationRerollUsed) return;
    playSound('tick', loadPersisted().soundEnabled);
    const newIndex = state.offersRerollIndex + 1;
    const currentFormationIds = state.currentOffers
      .filter((c) => isTacticCard(c) && getTacticCategory(c.id) === 'formasyon')
      .map((c) => c.id);
    const fresh = drawTacticCategoryOffers(state.seed, state.round, state.activeTactics.map((t) => t.id), 'formasyon', newIndex, currentFormationIds);
    const systems = state.currentOffers.filter((c) => isTacticCard(c) && getTacticCategory(c.id) === 'sistem');
    const next = {
      currentOffers: [...fresh, ...systems],
      formationRerollUsed: true,
      offersRerollIndex: newIndex,
      // İptal edilen formasyon seçimini temizle (yeni kartlar geldi)
      tacticDraft: { ...state.tacticDraft, formationId: null } as TacticDraft,
      timerSeconds: cardTimerSeconds(),
    };
    set(next);
    persistRun({ ...get(), ...next });
  },

  rerollSystemOffers: () => {
    const state = get();
    if (state.phase !== 'cardSelect' || !isTacticBonusRound(state.round, state.maxRounds)) return;
    if (state.systemRerollUsed) return;
    playSound('tick', loadPersisted().soundEnabled);
    const newIndex = state.offersRerollIndex + 1;
    const currentSystemIds = state.currentOffers
      .filter((c) => isTacticCard(c) && getTacticCategory(c.id) === 'sistem')
      .map((c) => c.id);
    const fresh = drawTacticCategoryOffers(state.seed, state.round, state.activeTactics.map((t) => t.id), 'sistem', newIndex, currentSystemIds);
    const formations = state.currentOffers.filter((c) => isTacticCard(c) && getTacticCategory(c.id) === 'formasyon');
    const next = {
      currentOffers: [...formations, ...fresh],
      systemRerollUsed: true,
      offersRerollIndex: newIndex,
      tacticDraft: { ...state.tacticDraft, systemId: null } as TacticDraft,
      timerSeconds: cardTimerSeconds(),
    };
    set(next);
    persistRun({ ...get(), ...next });
  },

  abandonRun: () => {
    clearRun();
    set({ showContinuePrompt: false });
  },

  selectOffer: (card) => {
    const state = get();
    if (state.phase !== 'cardSelect') return;
    // İlk 11 editörü açıkken tekrar seçim engellenir (çift ekleme/çift oyuncu olmasın).
    if (state.lineupEditorOpen) return;

    let squad = [...state.squad];
    let activeTactics = [...state.activeTactics];

    if (isTacticBonusRound(state.round, state.maxRounds)) {
      // Taktik round: formasyon ve sistem ayrı ayrı seçilir, onaylanana kadar taslakta tutulur.
      if (!isTacticCard(card)) return;
      const category = getTacticCategory(card.id);
      if (category !== 'formasyon' && category !== 'sistem') return;
      playSound('select', loadPersisted().soundEnabled);
      const hasActiveFormation = state.activeTactics.some((t) => getTacticCategory(t.id) === 'formasyon');
      const hasActiveSystem = state.activeTactics.some((t) => getTacticCategory(t.id) === 'sistem');
      const optionalTacticPick = hasActiveFormation && hasActiveSystem;
      const currentDraftId = category === 'formasyon' ? state.tacticDraft.formationId : state.tacticDraft.systemId;
      const nextDraftId = optionalTacticPick && currentDraftId === card.id ? null : card.id;
      const tacticDraft: TacticDraft = {
        ...state.tacticDraft,
        ...(category === 'formasyon' ? { formationId: nextDraftId } : { systemId: nextDraftId }),
      };
      set({ tacticDraft });
      persistRun({ ...get(), tacticDraft });
      return;
    }

    playSound('select', loadPersisted().soundEnabled);

    if (isPlayerCard(card)) {
      const transferDecision = simulateRosterDecision(squad, card, {
        maxSquadSize: state.maxSquadSize,
        morale: state.morale,
        activeTactics: state.activeTactics,
        manualLineup: state.manualLineup,
      });
      squad = transferDecision.draftSquad;
      const recentlyJoinedPlayerId = squad.some((p) => p.id === card.id) ? card.id : null;
      // Koleksiyon: efsane kart çekildiyse kaydet
      if (card.rarity === 'efsane') {
        const persisted = loadPersisted();
        if (!persisted.collectedLegends.includes(card.name)) {
          savePartial({ collectedLegends: [...persisted.collectedLegends, card.name] });
        }
      }
      // Yeni oyuncu otomatik yerleşti; pin'leri yeni kadroya göre temizle ve
      // İlk 11 düzenleme modalını aç — maç ancak onaylanınca oynanır.
      const manualLineup = transferDecision.manualLineup;
      set({
        squad,
        manualLineup,
        recentlyJoinedPlayerId,
        pendingSelected: card,
        pendingOffersShown: [...state.currentOffers],
        lineupEditorOpen: true,
        lineupEditorHighlightId: card.id,
        lineupEditorOutgoingId: transferDecision.outgoingPlayerId,
        // İptal edilirse bu kadroya/dizilişe dönülür.
        lineupEditorPrevSquad: state.squad,
        lineupEditorPrevManual: state.manualLineup,
      });
      // Transfer taslağı (geçici 12 aday) onaylanana kadar persist edilmez.
      return;
    } else if (isSkipCard(card)) {
      if (!canPassCardPick({
        phase: state.phase,
        round: state.round,
        maxRounds: state.maxRounds,
        squadLength: state.squad.length,
        maxSquadSize: state.maxSquadSize,
        currentOffers: state.currentOffers,
      })) return;
    } else if (isTacticCard(card)) {
      return;
    }

    const match = simulateMatch(
      state.seed,
      state.round,
      squad,
      state.morale,
      state.maxSquadSize,
      state.discoveredSynergies,
      activeTactics,
      state.nextMatchRisk,
      state.nextMatchBonus,
      state.lossesCount,
      state.isDailySeed,
      state.manualLineup,
      state.round === state.maxRounds ? getFinaleRivalName(state.roundHistory) : null,
    );

    set({
      squad,
      activeTactics,
      currentMatch: match,
      phase: 'match',
      pendingOffersShown: [...state.currentOffers],
      pendingSelected: card,
      currentOffers: [],
      nextMatchRisk: 0,
      nextMatchBonus: 0,
    });
    persistRun({
      ...get(),
      squad,
      activeTactics,
      currentMatch: match,
      phase: 'match',
    });
  },

  confirmLineupAndPlay: () => {
    const state = get();
    if (!state.lineupEditorOpen || state.phase !== 'cardSelect') return;
    const incoming = state.lineupEditorHighlightId
      ? state.squad.find((player) => player.id === state.lineupEditorHighlightId)
      : null;
    const previousSquad = state.lineupEditorPrevSquad;
    if (!incoming || !previousSquad) return;
    const transferDecision = simulateRosterDecision(previousSquad, incoming, {
      maxSquadSize: state.maxSquadSize,
      morale: state.morale,
      activeTactics: state.activeTactics,
      manualLineup: state.manualLineup,
      outgoingPlayerId: state.lineupEditorOutgoingId,
    });
    const squad = transferDecision.finalSquad;
    const manualLineup = transferDecision.manualLineup;
    const unlockTelemetry = updateRunUnlockTelemetry(state.unlockTelemetry, squad, state.morale);
    const match = simulateMatch(
      state.seed,
      state.round,
      squad,
      state.morale,
      state.maxSquadSize,
      state.discoveredSynergies,
      state.activeTactics,
      state.nextMatchRisk,
      state.nextMatchBonus,
      state.lossesCount,
      state.isDailySeed,
      manualLineup,
      state.round === state.maxRounds ? getFinaleRivalName(state.roundHistory) : null,
    );
    set({
      squad,
      manualLineup,
      unlockTelemetry,
      currentMatch: match,
      phase: 'match',
      currentOffers: [],
      nextMatchRisk: 0,
      nextMatchBonus: 0,
      lineupEditorOpen: false,
      lineupEditorHighlightId: null,
      lineupEditorOutgoingId: null,
      lineupEditorPrevSquad: null,
      lineupEditorPrevManual: null,
    });
    persistRun({ ...get(), squad, manualLineup, unlockTelemetry, currentMatch: match, phase: 'match', currentOffers: [] });
  },

  cancelLineupEditor: () => {
    const state = get();
    if (!state.lineupEditorOpen) return;
    // Seçimi geri al: editör açılmadan önceki kadro ve dizilişe dön, kart seçim
    // ekranında kal (oyuncu yanlışlıkla eklenmiş sayılmaz).
    const squad = state.lineupEditorPrevSquad ?? state.squad;
    const manualLineup = state.lineupEditorPrevManual ?? state.manualLineup;
    set({
      squad,
      manualLineup,
      recentlyJoinedPlayerId: null,
      lineupEditorOpen: false,
      lineupEditorHighlightId: null,
      lineupEditorOutgoingId: null,
      lineupEditorPrevSquad: null,
      lineupEditorPrevManual: null,
      pendingSelected: null,
    });
    persistRun({ ...get(), squad, manualLineup, recentlyJoinedPlayerId: null });
  },

  setLineupEditorOutgoing: (playerId) => {
    const state = get();
    const incomingId = state.lineupEditorHighlightId;
    if (!state.lineupEditorOpen || !incomingId) return;
    if (!canSelectTransferDeparture(state.squad, incomingId, playerId, state.maxSquadSize)) return;

    const incoming = state.squad.find((player) => player.id === incomingId);
    const previousSquad = state.lineupEditorPrevSquad;
    if (!incoming || !previousSquad) return;
    const transferDecision = simulateRosterDecision(previousSquad, incoming, {
      maxSquadSize: state.maxSquadSize,
      morale: state.morale,
      activeTactics: state.activeTactics,
      manualLineup: state.manualLineup,
      outgoingPlayerId: playerId,
    });
    set({ lineupEditorOutgoingId: transferDecision.outgoingPlayerId, manualLineup: transferDecision.manualLineup });
  },

  confirmTacticRound: () => {
    const state = get();
    if (state.phase !== 'cardSelect' || !isTacticBonusRound(state.round, state.maxRounds)) return;
    // Mevcut aktif formasyon/sistem varsa (ilk taktik turu değilse) seçim zorunlu değil:
    // taslakta yenisi seçilmediyse aktif olanı koru — oyuncu her turda değiştirmek zorunda kalmasın.
    const existingFormationId = state.activeTactics.find((t) => getTacticCategory(t.id) === 'formasyon')?.id ?? null;
    const existingSystemId = state.activeTactics.find((t) => getTacticCategory(t.id) === 'sistem')?.id ?? null;
    const formationId = state.tacticDraft.formationId ?? existingFormationId;
    const systemId = state.tacticDraft.systemId ?? existingSystemId;
    if (!formationId || !systemId) return;

    // Aynı kategorideki aktif taktikleri çıkar, seçilen formasyon + sistemi ekle.
    const activeTactics = [
      ...state.activeTactics.filter((t) => {
        const cat = getTacticCategory(t.id);
        return cat !== 'formasyon' && cat !== 'sistem';
      }),
      getTacticEffect(formationId),
      getTacticEffect(systemId),
    ];
    // Round geçmişinde gösterim için formasyon kartını birincil seçim olarak kullan.
    const primaryCard = getTacticCard(formationId) ?? getTacticCard(systemId)!;
    finalizeBonusRound(state, [...state.squad], activeTactics, primaryCard, set);
  },

  setManualLineup: (manualLineup) => {
    const state = get();
    const formationKey = getActiveFormationKey(state.activeTactics);
    const effectiveSquad = state.lineupEditorOpen
      ? finalizePlayerTransfer(state.squad, state.lineupEditorOutgoingId)
      : state.squad;
    const clean = reconcileManualLineup(manualLineup, effectiveSquad, formationKey);
    set({ manualLineup: clean });
    if (!state.lineupEditorOpen) persistRun({ ...get(), manualLineup: clean });
  },

  resetManualLineup: () => {
    set({ manualLineup: {} });
    if (!get().lineupEditorOpen) persistRun({ ...get(), manualLineup: {} });
  },

  beginTraining: () => {
    const state = get();
    if (state.phase !== 'cardSelect') return;
    // Antrenman yalnızca normal oyuncu seçim round'larında bir alternatiftir (taktik round'unda değil).
    if (isTacticBonusRound(state.round, state.maxRounds)) return;
    if (state.trainingFlow) return;
    playSound('select', loadPersisted().soundEnabled);
    const card = createTrainingCard(state.seed, state.round, state.offersRerollIndex ?? 0);
    const trainingFlow: TrainingFlow = { card, offeredTags: card.offeredTags, step: 'player' };
    set({ trainingFlow });
    persistRun({ ...get(), trainingFlow });
  },

  pickTrainingPlayer: (playerId) => {
    const state = get();
    if (!state.trainingFlow) return;
    const player = state.squad.find((p) => p.id === playerId);
    if (!player || player.tags.length >= MAX_PLAYER_TAGS) return;
    const trainingFlow: TrainingFlow = {
      ...state.trainingFlow,
      step: 'tag',
      selectedPlayerId: playerId,
    };
    set({ trainingFlow });
    persistRun(get());
  },

  completeTraining: (tag) => {
    const state = get();
    if (!state.trainingFlow || state.trainingFlow.step !== 'tag' || !state.trainingFlow.selectedPlayerId) return;
    playSound('select', loadPersisted().soundEnabled);

    const playerId = state.trainingFlow.selectedPlayerId;
    const player = state.squad.find((p) => p.id === playerId);
    if (!player || !canAddTag(tag, player.tags) || player.tags.length >= MAX_PLAYER_TAGS) return;

    const squad = state.squad.map((p) =>
      p.id === playerId ? { ...p, tags: [...p.tags, tag] } : p,
    );
    const unlockTelemetry = updateRunUnlockTelemetry(state.unlockTelemetry, squad, state.morale);
    const card: TrainingCard = {
      ...state.trainingFlow.card,
      description: `${player.name} → ${tag}`,
    };

    // Antrenman normal round'da oyuncu seçiminin yerine geçer: nitelik eklenir, ardından maç oynanır.
    const match = simulateMatch(
      state.seed,
      state.round,
      squad,
      state.morale,
      state.maxSquadSize,
      state.discoveredSynergies,
      state.activeTactics,
      state.nextMatchRisk,
      state.nextMatchBonus,
      state.lossesCount,
      state.isDailySeed,
      state.manualLineup,
      state.round === state.maxRounds ? getFinaleRivalName(state.roundHistory) : null,
    );

    set({
      squad,
      unlockTelemetry,
      currentMatch: match,
      phase: 'match',
      pendingOffersShown: [...state.currentOffers],
      pendingSelected: card,
      currentOffers: [],
      trainingFlow: null,
      nextMatchRisk: 0,
      nextMatchBonus: 0,
    });
    persistRun({
      ...get(),
      squad,
      currentMatch: match,
      phase: 'match',
      trainingFlow: null,
    });
  },

  cancelTraining: () => {
    set({ trainingFlow: null });
    persistRun({ ...get(), trainingFlow: null });
  },

  backTrainingPlayer: () => {
    const state = get();
    if (!state.trainingFlow) return;
    const trainingFlow: TrainingFlow = {
      ...state.trainingFlow,
      step: 'player',
      selectedPlayerId: undefined,
    };
    set({ trainingFlow });
    persistRun(get());
  },

  autoSelectOffer: () => {
    const s = get();
    if (s.phase !== 'cardSelect' || !s.currentOffers.length) return;
    // Editör açıkken zaman aşımı yeni oyuncu seçmez — mevcut dizilişi onaylar.
    if (s.lineupEditorOpen) { get().confirmLineupAndPlay(); return; }
    if (isTacticBonusRound(s.round, s.maxRounds)) {
      // Taktik round: ilk formasyon + ilk sistemi otomatik seç ve onayla.
      const formation = s.currentOffers.find((c) => isTacticCard(c) && getTacticCategory(c.id) === 'formasyon');
      const system = s.currentOffers.find((c) => isTacticCard(c) && getTacticCategory(c.id) === 'sistem');
      if (formation) get().selectOffer(formation);
      if (system) get().selectOffer(system);
      get().confirmTacticRound();
      return;
    }
    get().selectOffer(pickAutoOffer(s.currentOffers, s.squad.length, s.maxSquadSize));
    // Oyuncu kartı editörü açtıysa (zaman aşımı oto-seçimi) otomatik onayla → maç oynanır.
    if (get().lineupEditorOpen) get().confirmLineupAndPlay();
  },

  useTargetedScout: () => {
    const state = get();
    if (
      state.isDailySeed
      || !state.targetedScoutAvailable
      || state.phase !== 'cardSelect'
      || state.lineupEditorOpen
      || state.trainingFlow
      || isTacticBonusRound(state.round, state.maxRounds)
      || !state.currentOffers.every(isPlayerCard)
    ) return;
    const offersRerollIndex = state.offersRerollIndex + 1;
    const currentOffers = drawTargetedScoutOffers(
      state.seed,
      state.round,
      state.lossesCount,
      state.squad,
      state.activeTactics.map((tactic) => tactic.id),
      state.recoveryGuaranteed,
      offersRerollIndex,
      getPlayerContentAccess(state.isDailySeed, {}, state.monthlyLegendAtRunStart),
    );
    const next = { currentOffers, offersRerollIndex, targetedScoutAvailable: false };
    playSound('tick', loadPersisted().soundEnabled);
    set(next);
    persistRun({ ...state, ...next });
  },

  resolveEventChoice: (choice) => {
    const state = get();
    if (!state.currentEvent) return;
    // Koleksiyon: görülen olayı kaydet
    {
      const persisted = loadPersisted();
      if (!persisted.seenEvents.includes(state.currentEvent.id)) {
        savePartial({ seenEvents: [...persisted.seenEvents, state.currentEvent.id] });
      }
    }
    const outcome = resolveEvent(state.currentEvent, choice, state);
    let squad = [...state.squad];
    let score = state.score + outcome.scoreDelta;
    let morale = Math.min(100, Math.max(0, state.morale + outcome.moraleDelta));
    let rerollsRemaining = state.rerollsRemaining;
    if (outcome.removeWeakest && squad.length > 4) {
      const sellTarget = resolveEventRemoval(
        state.currentEvent.id,
        choice,
        squad,
        state.activeTactics,
        outcome.sellPlayerId,
      ) ?? getWeakestPlayer(squad);
      squad = squad.filter((p) => p.id !== sellTarget.id);
    }
    const dangerMode = squad.length <= 5;
    if (dangerMode) morale = Math.max(DANGER_MORALE_FLOOR, morale);
    if (outcome.tempRatingDelta) {
      const target = getEventRatingTarget(state.currentEvent.id, choice, squad, state.activeTactics);
      if (target) {
        squad = squad.map((p) =>
          p.id === target.id ? { ...p, tempRatingMod: (p.tempRatingMod ?? 0) + outcome.tempRatingDelta! } : p,
        );
      }
    }
    if (outcome.grantRerolls) {
      rerollsRemaining = Math.min(REROLLS_PER_RUN + 2, rerollsRemaining + outcome.grantRerolls);
    }
    const crisisContract = activateCrisisContract(state, squad.length, rerollsRemaining);
    rerollsRemaining = crisisContract.rerollsRemaining;
    let recentlyJoinedPlayerId = state.recentlyJoinedPlayerId;
    if (outcome.addYouth && squad.length < state.maxSquadSize) {
      // Önizlemede gösterilen oyuncuyla birebir aynı kart eklenir (mevki dahil).
      // previewEventPlayer aynı seed+round ile deterministik aynı sonucu verir.
      const player = previewEventPlayer(state.seed, state.round, state.currentEvent.id);
      squad = [...squad, player];
      recentlyJoinedPlayerId = player.id;
    }
    if (outcome.grantTag) {
      const tag = outcome.grantTag;
      // Tag'i taşımayan VE çelişmeyen (ör. MENTOR'u POTANSİYEL oyuncuya verme),
      // en yüksek ratingli oyuncuya ver (efsanenin gençlere aktardığı buff)
      const candidates = squad.filter((p) => canAddTag(tag, p.tags));
      if (candidates.length) {
        const target = [...candidates].sort((a, b) => b.currentRating - a.currentRating)[0]!;
        squad = squad.map((p) =>
          p.id === target.id ? { ...p, tags: [...p.tags, tag] } : p,
        );
      } else {
        // Kadroda tag'i çelişmeden alabilecek kimse yoksa (ör. tüm kadro POTANSİYEL/YENİ
        // SEZON iken MENTOR verilmek istenirse) seçim boşa gitmesin diye telafi puanı ver.
        score += state.currentEvent.id === 'evt_unlock_soyunma_odasi_yemini' ? 80 : 60;
      }
    }
    if (outcome.grantRandomTags) {
      const tagResult = applyRandomEventTags(
        squad,
        outcome.grantRandomTags,
        state.seed,
        state.round,
        state.currentEvent.id,
      );
      squad = tagResult.squad;
      if (tagResult.addedTags.length === 0) score += 140;
    }
    const unlockTelemetry = updateRunUnlockTelemetry(state.unlockTelemetry, squad, morale);

    // Olay puanını roundHistory'ye işle — yoksa skor toplamı totalScore ile uyuşmaz
    const eventHistoryEntry: RoundResult = {
      round: state.round,
      cardsShown: [],
      cardSelected: {
        kind: 'event',
        id: state.currentEvent.id,
        name: state.currentEvent.title,
        description: choice === 'A' ? state.currentEvent.optionA.label : state.currentEvent.optionB.label,
      },
      matchResult: null,
      pointsEarned: score - state.score,
      eventChoice: choice,
      isEvent: true,
    };
    const roundHistory = [...state.roundHistory, eventHistoryEntry];

    const formationKey = getActiveFormationKey(state.activeTactics);
    const manualLineup = reconcileManualLineup(state.manualLineup, squad, formationKey);
    recentlyJoinedPlayerId = squad.some((p) => p.id === recentlyJoinedPlayerId) ? recentlyJoinedPlayerId : null;
    const next = startRound({
      ...state,
      squad,
      morale,
      score,
      roundHistory,
      unlockTelemetry,
      dangerMode,
      eventResolvedThisRound: true,
      usedEventIds: [...state.usedEventIds, state.currentEvent.id],
      manualLineup,
      recentlyJoinedPlayerId,
      ...crisisContract,
    });
    set({
      squad,
      manualLineup,
      score,
      morale,
      unlockTelemetry,
      roundHistory,
      dangerMode,
      rerollsRemaining,
      crisisContractTriggered: crisisContract.crisisContractTriggered,
      crisisRecoveryPending: crisisContract.crisisRecoveryPending,
      currentEvent: null,
      eventResolvedThisRound: true,
      usedEventIds: [...state.usedEventIds, state.currentEvent.id],
      nextMatchRisk: outcome.nextMatchRisk ?? 0,
      nextMatchBonus: outcome.nextMatchBonus ?? 0,
      recentlyJoinedPlayerId,
      recoveryGuaranteed: state.lossesCount > 0 && state.lossesCount <= 2,
      ...next,
    });
    persistRun(get());
  },

  finishMatch: () => {
    const state = get();
    const match = state.currentMatch;
    // Idempotency: yalnızca maç fazında ve seçili kart varken işle (çift "Devam" tıklaması korunur)
    if (state.phase !== 'match' || !match || !state.pendingSelected) return;

    const injuryRng = createRng(state.seed, 'injury', state.round);
    let squad = applyPotentialGrowth(state.squad, state.round);
    squad = applyMentorGrowth(squad);
    squad = applyInjuryRisk(squad, injuryRng);
    squad = applyGerileyen(squad, state.activeTactics);
    squad = squad.map((p) => {
      const { tempRatingMod, ...rest } = p;
      void tempRatingMod;
      return rest;
    });

    const formationKey = getActiveFormationKey(state.activeTactics);
    let manualLineup = reconcileManualLineup(state.manualLineup, squad, formationKey);

    const tacticMorale = state.activeTactics.reduce((n, t) => n + (t.moralePerMatch ?? 0), 0);
    let morale = Math.min(100, state.morale + passiveMoraleFromSquad(squad) + tacticMorale);
    const activeSynergyList = getActiveSynergies(squad, morale, { activeTactics: state.activeTactics, manualLineup });
    for (const s of activeSynergyList) {
      if (s.perMatchMorale) morale = Math.min(100, morale + s.perMatchMorale);
    }
    const synergyMin = activeSynergyList.find((s) => s.minMorale)?.minMorale;
    if (synergyMin) morale = Math.max(morale, synergyMin);

    let { streak, lossesCount, score, flawless } = state;
    let unlockTelemetry = state.unlockTelemetry;
    let rerollsRemaining = state.rerollsRemaining;
    let crisisContractTriggered = state.crisisContractTriggered;
    let crisisRecoveryPending = state.crisisRecoveryPending;
    const discoveries = [...state.discoveredSynergies];
    for (const id of match.newlyDiscoveredSynergies) {
      if (!discoveries.includes(id)) discoveries.push(id);
      playSound('synergy', loadPersisted().soundEnabled);
    }

    const points = calculateRoundPoints(
      match,
      squad,
      morale,
      streak,
      state.round,
      lossesCount,
      state.activeTactics,
      state.timerSeconds,
      flawless,
      manualLineup,
      getWeeklyModifier(),
    );
    score += points;
    match.roundPoints = points;

    const historyEntry = {
      round: state.round,
      cardsShown: state.pendingOffersShown,
      cardSelected: state.pendingSelected,
      matchResult: match,
      pointsEarned: points,
    };
    const roundHistory = [...state.roundHistory, historyEntry];

    if (match.outcome === 'win') {
      streak += 1;
      morale = Math.min(100, morale + 10);
      unlockTelemetry = updateRunUnlockTelemetry(unlockTelemetry, squad, morale, 'win');
      playSound('win', loadPersisted().soundEnabled);
    } else if (match.outcome === 'draw') {
      streak = 0;
      morale = Math.max(0, morale - 5);
      unlockTelemetry = updateRunUnlockTelemetry(unlockTelemetry, squad, morale, 'draw');
    } else {
      streak = 0;
      // Mağlubiyet momentumunu (snowball) yumuşat: -20 yerine -16. Kayıpta zaten
      // bir oyuncu da gidiyor; çift ceza üst üste yenilgiyi kaçınılmaz yapıyordu.
      morale = Math.max(0, morale - 16);
      flawless = false;
      const squadBeforeLoss = squad;
      const protectedJoinedPlayerIds = state.recentlyJoinedPlayerId && squad.some((p) => p.id === state.recentlyJoinedPlayerId)
        ? [state.recentlyJoinedPlayerId]
        : [];
      const departing = selectDepartingPlayer(squad, morale, state.activeTactics, manualLineup, protectedJoinedPlayerIds);
      const manualBeforeLoss = manualLineup;
      squad = squad.filter((p) => p.id !== departing.id);
      manualLineup = reconcileManualLineup(manualLineup, squad, formationKey);
      const brokenSynergies = getBrokenSynergies(squadBeforeLoss, squad, morale, state.activeTactics, manualBeforeLoss, manualLineup).map((s) => s.id);
      if (squad.length <= 5) morale = Math.max(DANGER_MORALE_FLOOR, morale);
      lossesCount += 1;
      unlockTelemetry = updateRunUnlockTelemetry(unlockTelemetry, squad, morale, 'loss');
      const crisisContract = activateCrisisContract(
        { isDailySeed: state.isDailySeed, crisisContractTriggered },
        squad.length,
        rerollsRemaining,
      );
      rerollsRemaining = crisisContract.rerollsRemaining;
      crisisContractTriggered = crisisContract.crisisContractTriggered;
      crisisRecoveryPending ||= crisisContract.crisisRecoveryPending;
      playSound('loss', loadPersisted().soundEnabled);

      if (squad.length <= 4) {
        const analysis = buildRunEndAnalysis({
          ...state, squad, morale, streak, score, lossesCount, flawless, unlockTelemetry,
          roundHistory, discoveredSynergies: discoveries,
        });
        void persistRunEndScore({
          ...state, squad, morale, streak, score, lossesCount, flawless, unlockTelemetry, roundHistory, manualLineup,
        }, score, state.round, flawless)
          .then((newContentUnlocks) => set({
            newAchievements: computeNewAchievements(state.unlockedAtRunStart),
            newContentUnlocks,
          }));
        set({
          squad, morale, streak, score, lossesCount, flawless, unlockTelemetry,
          rerollsRemaining, crisisContractTriggered, crisisRecoveryPending,
          manualLineup,
          phase: 'runEnd',
          roundHistory,
          discoveredSynergies: discoveries,
          dangerMode: true,
          currentMatch: match,
          isFirstRun: false,
          runEndAnalysis: analysis,
          runEndStep: 0,
          recentlyJoinedPlayerId: null,
          lastLossPlayer: departing,
          lastLossBrokenSynergies: brokenSynergies,
          pendingOffersShown: [],
          pendingSelected: null,
          pendingSynergyReveal: [],
        });
        clearRun();
        return;
      }

      const lossState = {
        squad, morale, streak, score, lossesCount, flawless, unlockTelemetry,
        rerollsRemaining, crisisContractTriggered, crisisRecoveryPending,
        manualLineup,
        phase: 'loss' as GamePhase,
        roundHistory,
        discoveredSynergies: discoveries,
        dangerMode: squad.length <= 5,
        currentMatch: match,
        lastLossPlayer: departing,
        lastLossBrokenSynergies: brokenSynergies,
        // Sinerji açılışı maç ekranında (sonuç anında) zaten gösterildi —
        // kayıp ekranında ikinci kez gösterme.
        pendingSynergyReveal: [],
        recentlyJoinedPlayerId: null,
        recoveryGuaranteed: lossesCount <= 2,
        pendingOffersShown: [],
        pendingSelected: null,
      };
      persistRun({ ...state, ...lossState });
      set(lossState);
      return;
    }

    const dangerMode = squad.length <= 5;
    let pendingMilestones = mergeMilestones(state.pendingMilestones, detectMatchMilestones({
      round: state.round,
      streak,
      outcome: match.outcome,
      lossesCount,
      flawless,
      maxRounds: state.maxRounds,
      isRunComplete: false,
    }));

    if (squad.length <= 4 || state.round >= state.maxRounds) {
      pendingMilestones = mergeMilestones(pendingMilestones, detectMatchMilestones({
        round: state.round,
        streak,
        outcome: match.outcome,
        lossesCount,
        flawless,
        maxRounds: state.maxRounds,
        isRunComplete: true,
      }));
      const analysis = buildRunEndAnalysis({ ...state, squad, morale, streak, lossesCount, score, roundHistory, discoveredSynergies: discoveries, flawless, unlockTelemetry });
      void persistRunEndScore({
        ...state, squad, morale, streak, score, lossesCount, flawless, unlockTelemetry, roundHistory, manualLineup,
      }, score, state.round, flawless)
        .then((newContentUnlocks) => set({
          newAchievements: computeNewAchievements(state.unlockedAtRunStart),
          newContentUnlocks,
        }));
      set({
        squad, morale, streak, score, lossesCount, flawless, unlockTelemetry,
        rerollsRemaining, crisisContractTriggered, crisisRecoveryPending,
        manualLineup,
        phase: 'runEnd',
        roundHistory,
        discoveredSynergies: discoveries,
        dangerMode,
        currentMatch: match,
        isFirstRun: false,
        runEndAnalysis: analysis,
        runEndStep: 0,
        recentlyJoinedPlayerId: null,
        pendingOffersShown: [],
        pendingSelected: null,
        pendingMilestones,
      });
      clearRun();
      return;
    }

    const round = state.round + 1;
    const next = startRound({
      ...state,
      squad,
      manualLineup,
      morale,
      score,
      streak,
      lossesCount,
      flawless,
      unlockTelemetry,
      rerollsRemaining,
      crisisContractTriggered,
      crisisRecoveryPending,
      round,
      roundHistory,
      discoveredSynergies: discoveries,
      dangerMode,
      recoveryGuaranteed: lossesCount <= 2 && lossesCount > 0,
      recentlyJoinedPlayerId: null,
    });
    const nextState = {
      squad, morale, streak, score, lossesCount, flawless, unlockTelemetry,
      rerollsRemaining, crisisContractTriggered, crisisRecoveryPending,
      round, roundHistory, discoveredSynergies: discoveries,
      manualLineup,
      dangerMode, currentMatch: null, lastLossPlayer: null, lastLossBrokenSynergies: [],
      pendingSynergyReveal: [],
      pendingOffersShown: [], pendingSelected: null,
      recentlyJoinedPlayerId: null,
      isFirstRun: false, pendingMilestones, ...next,
    };
    persistRun({ ...state, ...nextState });
    set(nextState);
  },

  finishLoss: () => {
    const state = get();
    // Idempotency: yalnızca kayıp fazında işle — çift tıklamada round iki kez artmasın
    if (state.phase !== 'loss') return;
    if (state.squad.length <= 4 || state.round >= state.maxRounds) {
      const analysis = buildRunEndAnalysis(state);
      const pendingMilestones = mergeMilestones(state.pendingMilestones, detectMatchMilestones({
        round: state.round,
        streak: state.streak,
        outcome: 'loss',
        lossesCount: state.lossesCount,
        flawless: state.flawless,
        maxRounds: state.maxRounds,
        isRunComplete: true,
      }));
      void persistRunEndScore(state, state.score, state.round, state.flawless)
        .then((newContentUnlocks) => set({
          newAchievements: computeNewAchievements(state.unlockedAtRunStart),
          newContentUnlocks,
        }));
      set({ phase: 'runEnd', isFirstRun: false, runEndAnalysis: analysis, runEndStep: 0, pendingMilestones, recentlyJoinedPlayerId: null });
      clearRun();
      return;
    }
    const round = state.round + 1;
    const next = startRound({ ...state, round, recoveryGuaranteed: state.lossesCount > 0 && state.lossesCount <= 2, recentlyJoinedPlayerId: null });
    persistRun({ ...state, round, ...next, lastLossPlayer: null, currentMatch: null, recentlyJoinedPlayerId: null });
    set({ round, ...next, lastLossPlayer: null, currentMatch: null, recentlyJoinedPlayerId: null });
  },

  advanceRunEnd: () => set((s) => ({ runEndStep: s.runEndStep + 1 })),

  acknowledgeContentUnlocks: () => {
    const persisted = loadPersisted();
    const ids = get().newContentUnlocks.map((unlock) => unlock.id);
    if (ids.length) {
      savePersisted({
        ...persisted,
        unlocks: dismissUnlockNotifications(persisted.unlocks, ids),
      });
    }
    set({ newContentUnlocks: [] });
  },

  goToMenu: () => {
    clearRun();
    set({ screen: 'menu', showContinuePrompt: false });
  },

  exitToMenu: () => {
    const s = get();
    if (s.phase !== 'runEnd') persistRun(s);
    set({ screen: 'menu', showContinuePrompt: s.phase !== 'runEnd' });
  },

  resetRun: () => {
    const s = get();
    clearRun();
    const run = initialRun(s.seed, s.isDailySeed, s.isFirstRun, s.displayName || 'Anonim');
    persistRun(run);
    if (run.unlockGuaranteeOffered) consumeOfferedGuarantee(run.activeUnlockGuarantee);
    set({
      ...run, screen: 'game', usedEventIds: [], runEndStep: 0, pendingMilestones: [],
      unlockedAtRunStart: getUnlockedAchievementIds(loadPersisted()),
      newAchievements: [],
      newContentUnlocks: [],
    });
  },

  tickTimer: () => {
    const s = get();
    if (!isCardTimerEnabled() || s.phase !== 'cardSelect') return;
    if (s.timerSeconds <= 1) get().autoSelectOffer();
    else {
      const timerSeconds = s.timerSeconds - 1;
      set({ timerSeconds });
      if (timerSeconds % 5 === 0) persistRun({ ...get(), timerSeconds });
    }
  },

  setScreen: (screen) => set({ screen }),
}));

export function getPersistedStats() {
  return loadPersisted();
}

export { TOTAL_SYNERGIES };

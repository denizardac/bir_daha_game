import { create } from 'zustand';
import {
  CARD_TIMER_DEFAULT_ENABLED,
  CARD_TIMER_SECONDS,
  DANGER_MORALE_FLOOR,
  REROLLS_PER_RUN,
} from '@/constants/game';
import { getDailyStreakBonus } from '@/engine/dailyStreak';
import { submitRunToLeaderboard } from '@/api/leaderboardRemote';
import { buildSignedRunPayload } from '@/engine/runIntegrity';
import { isEventRound } from '@/data/events';
import { getTacticCategory, getTacticEffect } from '@/data/tactics';
import { MAX_PLAYER_TAGS } from '@/data/training';
import { getActiveSynergies, SYNERGIES, TOTAL_SYNERGIES } from '@/data/synergies';
import { getStartingSquad } from '@/data/players';
import { drawEvent, createLoanPlayer, createYouthPlayer, resolveEvent } from '@/engine/events';
import { drawOffers, getOfferDrawModeForRound, pickAutoOffer, rerollSinglePlayerOffer } from '@/engine/cardDraw';
import { isTacticBonusRound, TACTIC_BONUS_MORALE, TACTIC_BONUS_SCORE } from '@/engine/roundFlow';
import { simulateMatch } from '@/engine/matchSimulation';
import { calculateRoundPoints } from '@/engine/scoring';
import { addToHallOfFame } from '@/engine/hallOfFame';
import { detectMatchMilestones, mergeMilestones, type Milestone } from '@/engine/milestones';
import { getDailySeed, getRandomSeed } from '@/engine/seed';
import {
  addScoreToLeaderboards,
  analyzeEgo,
  getDailyList,
  getNearRivals,
  getRank,
  getRankPercent,
} from '@/engine/leaderboard';
import { applyPlayerToSquad } from '@/engine/lineupPreview';
import {
  applyGerileyen,
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
  RunEndAnalysis,
  Screen,
  Tag,
  TrainingCard,
} from '@/types';
import { isPlayerCard, isTacticCard, isTrainingCard } from '@/types';
import { getAnonymousId, loadPersisted, savePersisted } from '@/utils/storage';
import { playSound } from '@/utils/sound';

const MAX_ROUNDS = 15;
const MAX_SQUAD = 11;

function cardTimerSeconds() {
  return CARD_TIMER_SECONDS;
}

function isCardTimerEnabled() {
  const p = loadPersisted();
  return p.cardTimerEnabled ?? CARD_TIMER_DEFAULT_ENABLED;
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
  usedEventIds: string[];
  nextMatchRisk: number;
  nextMatchBonus: number;
  runEndStep: number;
  pendingMilestones: Milestone[];
  lastLossBrokenSynergies: string[];
  pendingSynergyReveal: string[];
  init: () => void;
  startRun: (daily?: boolean, displayName?: string) => void;
  continueRun: () => void;
  abandonRun: () => void;
  selectOffer: (card: GameCard) => void;
  pickTrainingPlayer: (playerId: string) => void;
  completeTraining: (tag: Tag) => void;
  cancelTraining: () => void;
  backTrainingPlayer: () => void;
  autoSelectOffer: () => void;
  resolveEventChoice: (choice: 'A' | 'B') => void;
  finishMatch: () => void;
  finishLoss: () => void;
  advanceRunEnd: () => void;
  goToMenu: () => void;
  exitToMenu: () => void;
  resetRun: () => void;
  redrawOffers: () => void;
  rerollSingleOffer: (slotIndex: number) => void;
  rerollAllOffers: () => void;
  dismissMilestone: (id: string) => void;
  dismissSynergyReveal: () => void;
  tickTimer: () => void;
  setScreen: (screen: Screen) => void;
}

function initialRun(
  seed: string,
  isDailySeed: boolean,
  isFirstRun: boolean,
  displayName: string,
  streakBonus = getDailyStreakBonus(0),
): GameState {
  const squad = getStartingSquad();
  return {
    seed,
    isDailySeed,
    displayName,
    round: 1,
    maxRounds: MAX_ROUNDS,
    squad,
    maxSquadSize: MAX_SQUAD,
    morale: Math.min(100, 50 + streakBonus.startMoraleBonus),
    score: 0,
    streak: 0,
    phase: 'cardSelect',
    roundHistory: [],
    currentOffers: drawOffers(seed, 1, 0, squad.map((p) => p.id), [], false),
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
    runEndAnalysis: null,
    extraDrawUsed: false,
    extraDrawAvailable: false,
    rerollsRemaining: REROLLS_PER_RUN + streakBonus.extraRerolls,
    offersRerollIndex: 0,
    recoveryGuaranteed: false,
  };
}

async function persistRunEndScore(state: GameStore, score: number, roundsCompleted: number, flawless: boolean) {
  const p = loadPersisted();
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
  const hallEntry = { ...signed.entry, flawless: signed.entry.flawless ?? false };
  savePersisted(addToHallOfFame(addScoreToLeaderboards(p, signed.entry), hallEntry));
  void submitRunToLeaderboard(signed, state.roundHistory, state.isDailySeed);
}

function persistRun(state: Partial<GameState> & Pick<GameState, 'seed'>) {
  const p = loadPersisted();
  savePersisted({
    ...p,
    currentRun: { ...state },
    discoveredSynergies: state.discoveredSynergies ?? p.discoveredSynergies,
  });
}

function clearRun() {
  savePersisted({ ...loadPersisted(), currentRun: null });
}

function drawRoundOffers(state: Pick<GameState, 'seed' | 'round' | 'lossesCount' | 'squad' | 'activeTactics' | 'recoveryGuaranteed' | 'offersRerollIndex' | 'maxRounds'>, variant: 'normal' | 'extradraw' = 'normal') {
  const mode = getOfferDrawModeForRound(state.round, state.maxRounds ?? MAX_ROUNDS);
  return drawOffers(
    state.seed,
    state.round,
    state.lossesCount,
    state.squad.map((p) => p.id),
    state.activeTactics.map((t) => t.id),
    state.recoveryGuaranteed,
    state.offersRerollIndex ?? 0,
    variant,
    mode,
  );
}

function startRound(state: GameStore): Partial<GameStore> {
  if (isEventRound(state.round) && !state.eventResolvedThisRound) {
    const event = drawEvent(state.seed, state.round, state.usedEventIds);
    return { phase: 'event' as GamePhase, currentEvent: event, timerSeconds: cardTimerSeconds() };
  }
  return {
    phase: 'cardSelect' as GamePhase,
    currentOffers: drawRoundOffers(state),
    timerSeconds: cardTimerSeconds(),
    eventResolvedThisRound: false,
    offersRerollIndex: 0,
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

  if (squad.length <= 4 || state.round >= state.maxRounds) {
    const analysis = buildRunEndAnalysis({
      ...state,
      squad,
      score,
      roundHistory,
      activeTactics,
      morale,
    });
    void persistRunEndScore({ ...state, score, roundHistory, flawless: state.flawless }, score, state.round, state.flawless);
    set({
      squad,
      activeTactics,
      morale,
      score,
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
    });
    clearRun();
    return;
  }

  const round = state.round + 1;
  let extraDrawAvailable = state.extraDrawAvailable;
  let pendingMilestones = state.pendingMilestones;
  if (round === 10) {
    extraDrawAvailable = true;
    pendingMilestones = mergeMilestones(pendingMilestones, [{
      id: 'cift_haneli',
      icon: '🎯',
      title: 'ÇİFT HANELİ',
      subtitle: 'Round 10! Ekstra kart çek hakkı kazandın',
    }]);
  }

  const next = startRound({
    ...state,
    squad,
    morale,
    score,
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
    activeTactics,
    round,
    roundHistory,
    dangerMode,
    extraDrawAvailable,
    pendingMilestones,
    currentMatch: null,
    pendingOffersShown: [],
    pendingSelected: null,
    trainingFlow: null,
    ...next,
  };
  playSound('tick', loadPersisted().soundEnabled);
  persistRun({ ...state, ...nextState });
  set(nextState);
}

function buildRunEndAnalysis(state: GameStore): RunEndAnalysis {
  const persisted = loadPersisted();
  const daily = getDailyList(persisted);
  const ego = analyzeEgo(state.roundHistory, state.seed);
  const rank = getRank(state.score, daily);
  const rankPercent = getRankPercent(state.score, daily);
  const rivals = getNearRivals(state.score, daily, state.displayName || 'Sen');

  const synergyStats = state.discoveredSynergies.map((id) => {
    const s = SYNERGIES.find((x) => x.id === id)!;
    const activations = state.roundHistory.filter((r) => r.matchResult?.activeSynergies.includes(id)).length;
    return { id, name: s.name, icon: s.icon, activations, points: activations * 80 };
  });

  const badges: string[] = [];
  if (state.round >= 15) badges.push('SÜPER RUN');
  if (state.flawless && state.lossesCount === 0) badges.push('NAMAĞLUP');
  if (state.score >= 12000) badges.push('ELİT SKOR');

  return {
    rank,
    totalPlayers: Math.max(daily.length, 1),
    rankPercent,
    bestDecision: ego.bestDecision,
    worstMistake: ego.worstMistake,
    synergyStats,
    nearRivalBefore: rivals.before,
    nearRivalAfter: rivals.after,
    badges,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialRun(getDailySeed(), true, true, 'Anonim'),
  screen: 'menu',
  showContinuePrompt: false,
  pendingOffersShown: [],
  pendingSelected: null,
  trainingFlow: null,
  usedEventIds: [],
  nextMatchRisk: 0,
  nextMatchBonus: 0,
  runEndStep: 0,
  pendingMilestones: [],
  lastLossBrokenSynergies: [],
  pendingSynergyReveal: [],

  init: () => {
    getAnonymousId();
    const p = loadPersisted();
    const saved = p.currentRun as Partial<GameState> | null;
    set({ showContinuePrompt: !!(saved && saved.phase !== 'runEnd'), isFirstRun: p.isFirstRun });
  },

  startRun: (daily = true, displayName = 'Anonim') => {
    const p = loadPersisted();
    const name = displayName.trim().slice(0, 18) || 'Anonim';
    const seed = daily ? getDailySeed() : getRandomSeed();
    const streakBonus = daily ? getDailyStreakBonus(p.dailyStreak) : getDailyStreakBonus(0);
    const run = initialRun(seed, daily, p.isFirstRun, name, streakBonus);
    clearRun();
    persistRun(run);
    savePersisted({ ...loadPersisted(), lastPlayerName: name });
    set({ ...run, screen: 'game', showContinuePrompt: false, pendingOffersShown: [], pendingSelected: null, usedEventIds: [], runEndStep: 0, pendingMilestones: [], lastLossBrokenSynergies: [], pendingSynergyReveal: [], nextMatchRisk: 0, nextMatchBonus: 0 });
  },

  continueRun: () => {
    const p = loadPersisted();
    const saved = p.currentRun as Partial<GameState> | null;
    if (!saved?.seed) return;
    const squad = saved.squad ?? getStartingSquad();
    set({
      ...(saved as GameState),
      squad,
      displayName: saved.displayName ?? 'Anonim',
      screen: 'game',
      showContinuePrompt: false,
      currentOffers: saved.phase === 'cardSelect'
        ? drawOffers(
            saved.seed,
            saved.round ?? 1,
            saved.lossesCount ?? 0,
            squad.map((x) => x.id),
            saved.activeTactics?.map((t) => t.id) ?? [],
            saved.recoveryGuaranteed ?? false,
            saved.offersRerollIndex ?? 0,
            'normal',
            getOfferDrawModeForRound(saved.round ?? 1, saved.maxRounds ?? MAX_ROUNDS),
          )
        : [],
      rerollsRemaining: saved.rerollsRemaining ?? REROLLS_PER_RUN,
      offersRerollIndex: saved.offersRerollIndex ?? 0,
      timerSeconds: cardTimerSeconds(),
      usedEventIds: [],
      runEndStep: 0,
      pendingMilestones: [],
    });
  },

  dismissMilestone: (id) => set((s) => ({ pendingMilestones: s.pendingMilestones.filter((m) => m.id !== id) })),
  dismissSynergyReveal: () => set({ pendingSynergyReveal: [] }),

  redrawOffers: () => {
    const state = get();
    if (state.phase !== 'cardSelect' || !state.extraDrawAvailable || state.extraDrawUsed) return;
    playSound('tick', loadPersisted().soundEnabled);
    const offers = drawRoundOffers(state, 'extradraw');
    set({ currentOffers: offers, extraDrawUsed: true, timerSeconds: cardTimerSeconds() });
    persistRun({ ...get(), currentOffers: offers, extraDrawUsed: true, timerSeconds: cardTimerSeconds() });
  },

  rerollSingleOffer: (slotIndex) => {
    const state = get();
    if (state.phase !== 'cardSelect' || state.rerollsRemaining <= 0) return;
    if (isTacticBonusRound(state.round, state.maxRounds)) return;

    const offers = [...state.currentOffers];
    if (slotIndex < 0 || slotIndex >= offers.length) return;
    if (!isPlayerCard(offers[slotIndex]!)) return;

    playSound('tick', loadPersisted().soundEnabled);
    const newIndex = state.offersRerollIndex + 1;
    const otherIds = offers.filter((_, i) => i !== slotIndex).map((o) => o.id);
    const replacement = rerollSinglePlayerOffer(
      state.seed,
      state.round,
      state.lossesCount,
      state.squad.map((p) => p.id),
      otherIds,
      slotIndex,
      newIndex,
      state.recoveryGuaranteed,
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
    const cost = state.rerollsRemaining;
    const newIndex = state.offersRerollIndex + cost;
    const offers = drawOffers(
      state.seed,
      state.round,
      state.lossesCount,
      state.squad.map((p) => p.id),
      state.activeTactics.map((t) => t.id),
      state.recoveryGuaranteed,
      newIndex,
      'normal',
      getOfferDrawModeForRound(state.round),
    );
    const next = {
      currentOffers: offers,
      rerollsRemaining: 0,
      offersRerollIndex: newIndex,
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
    playSound('select', loadPersisted().soundEnabled);

    let squad = [...state.squad];
    let activeTactics = [...state.activeTactics];

    if (isTacticBonusRound(state.round, state.maxRounds)) {
      if (isTrainingCard(card)) {
        set({
          trainingFlow: {
            card,
            offeredTags: card.offeredTags,
            step: 'player',
          },
        });
        return;
      }

      if (!isTacticCard(card)) return;
      const category = getTacticCategory(card.id);
      activeTactics = [
        ...activeTactics.filter((t) => getTacticCategory(t.id) !== category),
        getTacticEffect(card.id),
      ];
      finalizeBonusRound(state, squad, activeTactics, card, set);
      return;
    }

    if (isPlayerCard(card)) {
      squad = applyPlayerToSquad(squad, card, state.maxSquadSize, state.morale, state.activeTactics);
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

  pickTrainingPlayer: (playerId) => {
    const state = get();
    if (!state.trainingFlow) return;
    const player = state.squad.find((p) => p.id === playerId);
    if (!player || player.tags.length >= MAX_PLAYER_TAGS) return;
    set({
      trainingFlow: {
        ...state.trainingFlow,
        step: 'tag',
        selectedPlayerId: playerId,
      },
    });
  },

  completeTraining: (tag) => {
    const state = get();
    if (!state.trainingFlow || state.trainingFlow.step !== 'tag' || !state.trainingFlow.selectedPlayerId) return;
    playSound('select', loadPersisted().soundEnabled);

    const playerId = state.trainingFlow.selectedPlayerId;
    const player = state.squad.find((p) => p.id === playerId);
    if (!player || player.tags.includes(tag) || player.tags.length >= MAX_PLAYER_TAGS) return;

    const squad = state.squad.map((p) =>
      p.id === playerId ? { ...p, tags: [...p.tags, tag] } : p,
    );
    const card: TrainingCard = {
      ...state.trainingFlow.card,
      description: `${player.name} → ${tag}`,
    };
    finalizeBonusRound(state, squad, state.activeTactics, card, set);
  },

  cancelTraining: () => set({ trainingFlow: null }),

  backTrainingPlayer: () => {
    const state = get();
    if (!state.trainingFlow) return;
    set({
      trainingFlow: {
        ...state.trainingFlow,
        step: 'player',
        selectedPlayerId: undefined,
      },
    });
  },

  autoSelectOffer: () => {
    const s = get();
    if (s.phase !== 'cardSelect' || !s.currentOffers.length) return;
    get().selectOffer(pickAutoOffer(s.currentOffers, s.squad.length, s.maxSquadSize));
  },

  resolveEventChoice: (choice) => {
    const state = get();
    if (!state.currentEvent) return;
    const outcome = resolveEvent(state.currentEvent, choice, state);
    let squad = [...state.squad];
    let score = state.score + outcome.scoreDelta;
    let morale = Math.min(100, Math.max(0, state.morale + outcome.moraleDelta));
    if (state.squad.length <= 5) morale = Math.max(DANGER_MORALE_FLOOR, morale);
    if (outcome.removeWeakest && squad.length > 4) {
      const w = getWeakestPlayer(squad);
      squad = squad.filter((p) => p.id !== w.id);
    }
    if (outcome.addYouth && squad.length < state.maxSquadSize) {
      const player = state.currentEvent?.id === 'evt_kiralik'
        ? createLoanPlayer(state.seed, state.round)
        : createYouthPlayer(state.seed, state.round);
      squad = [...squad, player];
    }
    const next = startRound({ ...state, squad, morale, score, eventResolvedThisRound: true, usedEventIds: [...state.usedEventIds, state.currentEvent.id] });
    set({
      squad,
      score,
      morale,
      currentEvent: null,
      eventResolvedThisRound: true,
      usedEventIds: [...state.usedEventIds, state.currentEvent.id],
      nextMatchRisk: outcome.nextMatchRisk ?? 0,
      nextMatchBonus: outcome.nextMatchBonus ?? 0,
      recoveryGuaranteed: state.lossesCount <= 2,
      ...next,
    });
    persistRun(get());
  },

  finishMatch: () => {
    const state = get();
    const match = state.currentMatch;
    if (!match || !state.pendingSelected) return;

    let squad = applyPotentialGrowth(state.squad, state.round);
    squad = applyMentorGrowth(squad);
    squad = applyGerileyen(squad);

    let morale = Math.min(100, state.morale + passiveMoraleFromSquad(squad));
    const synergyMin = getActiveSynergies(squad, morale).find((s) => s.minMorale)?.minMorale;
    if (synergyMin) morale = Math.max(morale, synergyMin);

    let { streak, lossesCount, score, flawless } = state;
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
      playSound('win', loadPersisted().soundEnabled);
    } else if (match.outcome === 'draw') {
      streak = 0;
      morale = Math.max(0, morale - 5);
    } else {
      streak = 0;
      morale = Math.max(0, morale - 20);
      flawless = false;
      const squadBeforeLoss = squad;
      const departing = selectDepartingPlayer(squad, morale);
      squad = squad.filter((p) => p.id !== departing.id);
      const brokenSynergies = getBrokenSynergies(squadBeforeLoss, squad, morale).map((s) => s.id);
      if (squad.length <= 5) morale = Math.max(DANGER_MORALE_FLOOR, morale);
      lossesCount += 1;
      playSound('loss', loadPersisted().soundEnabled);

      if (squad.length <= 4) {
        const analysis = buildRunEndAnalysis({
          ...state, squad, morale, streak, score, lossesCount, flawless,
          roundHistory, discoveredSynergies: discoveries,
        });
        void persistRunEndScore({ ...state, score, roundHistory, flawless, lossesCount }, score, state.round, flawless);
        set({
          squad, morale, streak, score, lossesCount, flawless,
          phase: 'runEnd',
          roundHistory,
          discoveredSynergies: discoveries,
          dangerMode: true,
          currentMatch: match,
          isFirstRun: false,
          runEndAnalysis: analysis,
          runEndStep: 0,
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
        squad, morale, streak, score, lossesCount, flawless,
        phase: 'loss' as GamePhase,
        roundHistory,
        discoveredSynergies: discoveries,
        dangerMode: squad.length <= 5,
        currentMatch: match,
        lastLossPlayer: departing,
        lastLossBrokenSynergies: brokenSynergies,
        pendingSynergyReveal: match.newlyDiscoveredSynergies,
        recoveryGuaranteed: lossesCount <= 2,
        pendingOffersShown: [],
        pendingSelected: null,
      };
      persistRun({ ...state, ...lossState });
      set(lossState);
      return;
    }

    const dangerMode = squad.length <= 5;
    let extraDrawAvailable = state.extraDrawAvailable;
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
      const analysis = buildRunEndAnalysis({ ...state, score, roundHistory, discoveredSynergies: discoveries, flawless });
      void persistRunEndScore({ ...state, score, roundHistory, flawless, lossesCount }, score, state.round, flawless);
      set({
        squad, morale, streak, score, lossesCount, flawless,
        phase: 'runEnd',
        roundHistory,
        discoveredSynergies: discoveries,
        dangerMode,
        currentMatch: match,
        isFirstRun: false,
        runEndAnalysis: analysis,
        runEndStep: 0,
        pendingOffersShown: [],
        pendingSelected: null,
        pendingMilestones,
        extraDrawAvailable,
      });
      clearRun();
      return;
    }

    const round = state.round + 1;
    if (round === 10) {
      extraDrawAvailable = true;
      pendingMilestones = mergeMilestones(pendingMilestones, [{
        id: 'cift_haneli',
        icon: '🎯',
        title: 'ÇİFT HANELİ',
        subtitle: 'Round 10! Ekstra kart çek hakkı kazandın',
      }]);
    }
    const next = startRound({
      ...state,
      squad,
      morale,
      score,
      streak,
      lossesCount,
      flawless,
      round,
      roundHistory,
      discoveredSynergies: discoveries,
      dangerMode,
      recoveryGuaranteed: lossesCount <= 2 && lossesCount > 0,
    });
    const nextState = {
      squad, morale, streak, score, lossesCount, flawless, round, roundHistory, discoveredSynergies: discoveries,
      dangerMode, currentMatch: null, lastLossPlayer: null, lastLossBrokenSynergies: [],
      pendingSynergyReveal: [],
      pendingOffersShown: [], pendingSelected: null,
      isFirstRun: false, extraDrawAvailable, pendingMilestones, ...next,
    };
    persistRun({ ...state, ...nextState });
    set(nextState);
  },

  finishLoss: () => {
    const state = get();
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
      void persistRunEndScore(state, state.score, state.round, state.flawless);
      set({ phase: 'runEnd', isFirstRun: false, runEndAnalysis: analysis, runEndStep: 0, pendingMilestones });
      clearRun();
      return;
    }
    const round = state.round + 1;
    const next = startRound({ ...state, round, recoveryGuaranteed: state.lossesCount <= 2 });
    persistRun({ ...state, round, ...next, lastLossPlayer: null, currentMatch: null });
    set({ round, ...next, lastLossPlayer: null, currentMatch: null });
  },

  advanceRunEnd: () => set((s) => ({ runEndStep: s.runEndStep + 1 })),

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
    set({ ...run, screen: 'game', usedEventIds: [], runEndStep: 0, pendingMilestones: [] });
  },

  tickTimer: () => {
    const s = get();
    if (!isCardTimerEnabled() || s.phase !== 'cardSelect') return;
    if (s.timerSeconds <= 1) get().autoSelectOffer();
    else set({ timerSeconds: s.timerSeconds - 1 });
  },

  setScreen: (screen) => set({ screen }),
}));

export function getPersistedStats() {
  return loadPersisted();
}

export { TOTAL_SYNERGIES };

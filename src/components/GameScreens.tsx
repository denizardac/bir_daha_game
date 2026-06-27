import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameHeader } from '@/components/GameHeader';
import { PlayerCard, PlayerCardMini } from '@/components/PlayerCard';
import { TacticCard } from '@/components/TacticCard';
import { CardSelectCommandBar, type CardPickMode } from '@/components/CardSelectCommandBar';
import { TacticPickGrid } from '@/components/TacticPickGrid';
import { buildMatchAnimSchedule, buildMatchAnimScheduleResume, type MatchAnimState } from '@/engine/matchAnimSchedule';
import { isFinaleRound, isTacticBonusRound } from '@/engine/roundFlow';
import { getLegendaryChanceTier, getDailySeed } from '@/engine/seed';
import { getEventSubjects } from '@/engine/eventSubjects';
import { fetchRemoteRank, isRemoteLeaderboardEnabled } from '@/api/leaderboardRemote';
import { SynergyRevealOverlay } from '@/components/SynergyRevealOverlay';
import { SidePanel } from '@/components/SidePanel';
import { SynergySideSection } from '@/components/SynergySideSection';
import { PlayerHeroMini } from '@/components/PlayerHero';
import { MatchTeamCard } from '@/components/MatchPickPanel';
import { getActiveSynergies, getSynergyById, SYNERGIES } from '@/data/synergies';
import { getSidePanelNearSynergies } from '@/engine/squadInsights';
import { BITE, EVENT_CATEGORY_BITE } from '@/data/biteTips';
import { getEventPresentation } from '@/data/eventVisuals';
import { EventChoiceVisual, EventSceneVisual } from '@/components/EventSceneVisual';
import { explainMatchResult, getDepartureScore, getEventPreviews, getTacticPreview } from '@/engine/contextPreview';
import { calculateRoundPoints, formatScore } from '@/engine/scoring';
import { getSquadLineupSummary, lineupSlotToMatchPitch } from '@/engine/lineupPreview';
import { getPersistedStats, TOTAL_SYNERGIES, useGameStore } from '@/store/gameStore';
import { isPlayerCard, isSkipCard, isTacticCard, isTrainingCard } from '@/types';
import type { GameCard, PlayerCard as PlayerCardType } from '@/types';
import { MatchAnimation } from '@/components/MatchAnimation';
import { MatchMoraleBanner } from '@/components/MatchMoraleBanner';
import { MatchLeftPanel, MatchRightPanel } from '@/components/MatchLivePanels';
import { LineupPreviewCenterTrigger, LineupPreviewExpanded, LineupPreviewModal } from '@/components/LineupPreview';
import { LineupEditorModal } from '@/components/LineupEditorModal';
import { TrainingPickModal } from '@/components/TrainingPickModal';
import { FirstWinCelebration } from '@/components/FirstWinCelebration';
import { downloadShareCard, copyShareCardImage, getShareTier, renderShareCardToCanvas } from '@/utils/shareCard';
import { playSound } from '@/utils/sound';
import { formatStatDisplay } from '@/utils/formatNumber';
import { formatPosition } from '@/utils/positionStyle';
import { DANGER_MORALE_FLOOR } from '@/constants/game';
import { getEventChoiceTones, eventChoiceClass, formatMatchRiskDelta, MATCH_RISK_EXPLAINER } from '@/engine/eventRisk';
import { formatMatchPowerBonusLabel } from '@/engine/matchPower';
import { sortSquadByRating } from '@/engine/squadLogic';
import type { EventOutcome } from '@/engine/events';

type EventResultBadge = { icon: string; text: string; positive: boolean };

function CardSelectInsightRail({
  squad,
  morale,
  discoveredSynergies,
  currentOffers,
}: {
  squad: PlayerCardType[];
  morale: number;
  discoveredSynergies: string[];
  currentOffers: GameCard[];
}) {
  return (
    <aside className="card-select-insight-rail" aria-label="Sinerji ve tag özeti">
      <SynergySideSection
        squad={squad}
        morale={morale}
        discoveredSynergies={discoveredSynergies}
        currentOffers={currentOffers}
      />
    </aside>
  );
}

/** Seçim sonrası animasyonlu "sonuç rozeti" listesi — sayısal etkiyi vurgular */
function getEventResultBadges(o: EventOutcome): EventResultBadge[] {
  const badges: EventResultBadge[] = [];
  if (o.moraleDelta) badges.push({ icon: '❤️', text: `Moral ${o.moraleDelta > 0 ? '+' : ''}${o.moraleDelta}`, positive: o.moraleDelta > 0 });
  if (o.scoreDelta) badges.push({ icon: '⭐', text: `${o.scoreDelta > 0 ? '+' : ''}${o.scoreDelta} puan`, positive: o.scoreDelta > 0 });
  if (o.nextMatchBonus) badges.push({ icon: '💪', text: `Sonraki maç +${o.nextMatchBonus}`, positive: true });
  if (o.grantRerolls) badges.push({ icon: '🔄', text: `+${o.grantRerolls} çek hakkı`, positive: true });
  if (o.addYouth) badges.push({ icon: '🌱', text: 'Yeni oyuncu katıldı', positive: true });
  if (o.grantTag) badges.push({ icon: '🏷️', text: `${o.grantTag} kazandırıldı`, positive: true });
  if (o.removeWeakest) badges.push({ icon: '➖', text: o.sellPlayerName ? `${o.sellPlayerName} ayrıldı` : 'Oyuncu kadrodan çıktı', positive: false });
  if (o.tempRatingDelta) badges.push({ icon: '📉', text: `Rating ${o.tempRatingDelta > 0 ? '+' : ''}${o.tempRatingDelta} (1 maç)`, positive: o.tempRatingDelta > 0 });
  if (o.nextMatchRisk) badges.push({ icon: '⚠️', text: `Maç riski +%${Math.round(o.nextMatchRisk * 100)}`, positive: false });
  return badges;
}

function formatEventOutcome(o: EventOutcome, eventId?: string) {
  const parts: string[] = [];
  if (o.moraleDelta) parts.push(`Moral ${o.moraleDelta > 0 ? '+' : ''}${o.moraleDelta}`);
  if (o.scoreDelta) parts.push(`Anlık skor ${o.scoreDelta > 0 ? '+' : ''}${o.scoreDelta}`);
  if (o.addYouth) parts.push('Kadroya genç oyuncu eklenir');
  if (o.removeWeakest) {
    parts.push(
      o.sellPlayerName
        ? `${o.sellPlayerName} kadrodan çıkar`
        : eventId === 'evt_transfer_teklif'
          ? 'En yüksek ratingli saha oyuncusu satılır'
          : 'Oyuncu kadrodan çıkar',
    );
  }
  if (o.grantRerolls) parts.push(`+${o.grantRerolls} çek hakkı`);
  if (o.nextMatchBonus) parts.push(formatMatchPowerBonusLabel(o.nextMatchBonus));
  if (o.tempRatingDelta) parts.push(`Rating ${o.tempRatingDelta > 0 ? '+' : ''}${o.tempRatingDelta} (1 maç)`);
  if (o.nextMatchRisk) parts.push(formatMatchRiskDelta(o.nextMatchRisk));
  return parts.length ? parts.join(' · ') : '';
}

export function CardSelectScreen() {
  const [lineupOpen, setLineupOpen] = useState(false);
  const [pickMode, setPickMode] = useState<CardPickMode>('cards');
  const state = useGameStore();
  const {
    round, maxRounds, squad, maxSquadSize, morale, score, streak,
    currentOffers, selectOffer,
    dangerMode, isFirstRun, discoveredSynergies, activeTactics, usedEventIds,
    manualLineup,
    rerollsRemaining, rerollSingleOffer, offersRerollIndex,
    trainingFlow, beginTraining, pickTrainingPlayer, completeTraining, cancelTraining, backTrainingPlayer,
    tacticDraft, confirmTacticRound, rerollFormationOffers, rerollSystemOffers,
    formationRerollUsed, systemRerollUsed,
  } = state;
  const sound = getPersistedStats().soundEnabled;

  const empty = maxSquadSize - squad.length;
  const lineupSummary = getSquadLineupSummary(squad, activeTactics, manualLineup);
  const activeSynergies = getActiveSynergies(squad, morale, { activeTactics });
  const nearSynergies = getSidePanelNearSynergies(squad, morale, discoveredSynergies, currentOffers, 4);
  const emptyField = 11 - lineupSummary.filled;
  const tacticBonus = isTacticBonusRound(round, maxRounds);
  const finaleMatch = isFinaleRound(round, maxRounds);
  const pickSubtitle = finaleMatch
    ? 'Şampiyonluk maçı — son kartını seç, büyük puan için kazan'
    : tacticBonus
      ? 'Antrenman günü — maç yok · bir formasyon ve bir oyun sistemi seç, sonra onayla'
      : empty > 0
        ? `3 oyuncu teklifi · Kadroya eklenir (${empty} boş slot)`
        : emptyField > 0
          ? `3 oyuncu teklifi · Sahada ${emptyField} boş slot — yedek çıkar, slota yerleşir`
          : 'Kadro dolu — kart al (en riskli oyuncunun yerine) ya da 🎓 Özel antrenman yap';

  const pickTitle = finaleMatch
    ? 'Şampiyonluk Maçı'
    : tacticBonus
      ? 'Taktik Bonusu'
      : 'İkisinden Birini Seç';

  const cardsLocked = pickMode === 'training' || Boolean(trainingFlow);

  const handlePickModeChange = (mode: CardPickMode) => {
    setPickMode(mode);
    if (mode === 'training' && !trainingFlow) {
      playSound('tick', sound);
      beginTraining();
    }
  };

  return (
    <div className={`game-shell pitch-bg card-select-screen ${tacticBonus ? 'card-select-screen--tactic' : ''} ${dangerMode ? 'danger-pulse' : ''}`}>
      <div className="card-select-inner w-full max-w-none px-3 py-2 md:px-4 md:py-3">
        <GameHeader round={round} maxRounds={maxRounds} score={score} streak={streak} />

        {!tacticBonus ? (
          <CardSelectCommandBar
            morale={morale}
            pickMode={pickMode}
            onPickModeChange={handlePickModeChange}
            trainingAvailable={!finaleMatch}
            title={pickTitle}
            subtitle={pickSubtitle}
            activeSynergies={activeSynergies}
            nearSynergies={nearSynergies}
            rerollsRemaining={rerollsRemaining}
            actions={(
              <>
                <LineupPreviewCenterTrigger
                  squad={squad}
                  activeTactics={activeTactics}
                  manualLineup={manualLineup}
                  compact
                  onOpen={() => setLineupOpen(true)}
                />
              </>
            )}
          />
        ) : (
          <MatchMoraleBanner morale={morale} />
        )}

        {dangerMode && (
          <p className="card-select-danger-banner">
            TEHLİKE MODU — {squad.length} oyuncu · Moral {DANGER_MORALE_FLOOR}&apos;nin altına düşmez
          </p>
        )}

        <div className={`game-layout card-select-layout ${tacticBonus ? 'card-select-layout--tactic' : 'card-select-layout--pick'}`}>
          {!tacticBonus && (
            <CardSelectInsightRail
              squad={squad}
              morale={morale}
              discoveredSynergies={discoveredSynergies}
              currentOffers={currentOffers}
            />
          )}

          <div className={`card-pick-center min-w-0 ${cardsLocked ? 'card-pick-center--training' : ''} ${tacticBonus ? 'card-pick-center--tactic' : ''}`}>
            <LineupPreviewModal
              open={lineupOpen}
              onClose={() => setLineupOpen(false)}
              squad={squad}
              activeTactics={activeTactics}
              manualLineup={manualLineup}
            />

            {finaleMatch && (
              <div className="card-pick-bonus-banner card-pick-bonus-banner--finale">
                <span className="card-pick-bonus-icon" aria-hidden>🏆</span>
                <div>
                  <p className="card-pick-bonus-title">Final maçı — run burada biter</p>
                  <p className="card-pick-bonus-desc">Son oyuncu kartını seç ve şampiyonluk maçını oyna. Galibiyet ekstra büyük puan verir (+2500 bonus).</p>
                </div>
              </div>
            )}

            {!tacticBonus && (() => {
              const tier = getLegendaryChanceTier(round);
              if (!tier.boosted) return null;
              return (
                <div className={`legendary-chance-banner ${round >= 13 ? 'legendary-chance-banner--peak' : ''}`}>
                  <span aria-hidden>{round >= 13 ? '🌟' : '✨'}</span>
                  <span>{tier.label} — efsane kart ihtimali %{Math.round(tier.chance * 100)}</span>
                </div>
              );
            })()}

            {tacticBonus ? (
              <TacticPickGrid
                offers={currentOffers}
                squad={squad}
                activeTactics={activeTactics}
                draft={tacticDraft}
                manualLineup={manualLineup}
                sound={sound}
                onSelect={selectOffer}
                onConfirm={confirmTacticRound}
                onRerollFormation={rerollFormationOffers}
                onRerollSystem={rerollSystemOffers}
                formationRerollUsed={formationRerollUsed}
                systemRerollUsed={systemRerollUsed}
              />
            ) : (
              <>
                <div className={`cards-pick-grid ${cardsLocked ? 'cards-pick-grid--locked' : ''}`}>
                  {currentOffers.map((offer, slotIndex) => {
                    const tipPlacement = slotIndex === 0 ? 'right' : slotIndex === currentOffers.length - 1 ? 'left' : 'auto';
                    const inner = isPlayerCard(offer) ? (
                      <PlayerCard
                        key={`${offer.id}-r${offersRerollIndex}`}
                        card={offer}
                        squad={squad}
                        discovered={discoveredSynergies}
                        maxSquadSize={maxSquadSize}
                        activeTactics={activeTactics}
                        morale={morale}
                        tipPlacement={tipPlacement}
                        onSelect={() => {
                          if (cardsLocked) return;
                          playSound('tick', sound);
                          selectOffer(offer);
                        }}
                        onReroll={() => {
                          if (rerollsRemaining <= 0 || cardsLocked) return;
                          playSound('tick', sound);
                          rerollSingleOffer(slotIndex);
                        }}
                        rerollDisabled={rerollsRemaining <= 0 || cardsLocked}
                        showTagHint={isFirstRun && round === 1}
                      />
                    ) : isTacticCard(offer) ? (
                      <TacticCard key={`${offer.id}-r${offersRerollIndex}`} card={offer} squad={squad} activeTactics={activeTactics} onSelect={() => selectOffer(offer)} />
                    ) : null;
                    return (
                      <div key={`${offer.id}-slot-r${offersRerollIndex}-i${slotIndex}`} className="card-pick-slot">
                        <div className="card-pick-slot-anchor">{inner}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {trainingFlow && (
            <TrainingPickModal
              squad={squad}
              offeredTags={trainingFlow.offeredTags}
              step={trainingFlow.step}
              selectedPlayerId={trainingFlow.selectedPlayerId}
              onPickPlayer={pickTrainingPlayer}
              onPickTag={completeTraining}
              onClose={() => { cancelTraining(); setPickMode('cards'); }}
              onBack={backTrainingPlayer}
            />
          )}

          <SidePanel
            squad={squad}
            activeTactics={activeTactics}
            usedEventIds={usedEventIds}
            round={round}
            currentOffers={currentOffers}
            tacticDraft={tacticBonus ? tacticDraft : undefined}
          />
        </div>
      </div>
      {state.lineupEditorOpen && (
        <LineupEditorModal
          open
          squad={squad}
          activeTactics={activeTactics}
          manualLineup={state.manualLineup}
          highlightId={state.lineupEditorHighlightId}
          onChange={state.setManualLineup}
          onReset={state.resetManualLineup}
          onConfirm={state.confirmLineupAndPlay}
          onCancel={state.cancelLineupEditor}
        />
      )}
    </div>
  );
}

export function EventScreen() {
  const { currentEvent, resolveEventChoice, round, maxRounds, score, streak, squad, morale, isFirstRun, seed, discoveredSynergies, activeTactics, manualLineup, maxSquadSize } = useGameStore();
  const [picked, setPicked] = useState<'A' | 'B' | null>(null);
  const [lineupOpen, setLineupOpen] = useState(false);
  const pickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pickTimeout.current) clearTimeout(pickTimeout.current);
    };
  }, []);

  if (!currentEvent) return null;

  const previews = getEventPreviews(currentEvent, squad, morale, score, activeTactics);
  const eventSubjects = getEventSubjects(currentEvent.id, squad, activeTactics, {
    seed,
    round,
    sellPlayerId: previews.a.sellPlayerId,
  });
  const tones = getEventChoiceTones(previews);
  const categoryBite = EVENT_CATEGORY_BITE[currentEvent.category];
  const presentation = getEventPresentation(currentEvent.id);
  const avg = squad.length ? Math.round(squad.reduce((s, p) => s + p.currentRating, 0) / squad.length) : 0;
  const lineupSummary = getSquadLineupSummary(squad, activeTactics, manualLineup);
  const topPlayers = sortSquadByRating(squad);
  const hasRiskChoice = Boolean(previews.a.nextMatchRisk || previews.b.nextMatchRisk);

  const handlePick = (choice: 'A' | 'B') => {
    if (picked) return;
    setPicked(choice);
    playSound('tick', getPersistedStats().soundEnabled);
    pickTimeout.current = setTimeout(() => resolveEventChoice(choice), 850);
  };

  const renderChoice = (
    choice: 'A' | 'B',
    label: string,
    description: string,
    preview: EventOutcome,
    tone: typeof tones.a,
    choiceVisual: { icon: string; flavor: string; scene: string },
  ) => {
    const selected = picked === choice;
    const dimmed = picked !== null && picked !== choice;
    const outcomeText = formatEventOutcome(preview, currentEvent.id);
    return (
      <button
        type="button"
        disabled={picked !== null}
        className={`${eventChoiceClass(tone, selected, dimmed)} event-choice-card`}
        onClick={() => handlePick(choice)}
      >
        <EventChoiceVisual
          scene={choiceVisual.scene}
          icon={choiceVisual.icon}
          flavor={choiceVisual.flavor}
          choice={choice}
        />
        <div className="event-choice-body">
          <span className="event-choice-kicker">{choiceVisual.flavor}</span>
          <span className="event-choice-label">{label}</span>
          <p className={`event-choice-desc ${dimmed ? 'opacity-50' : ''}`}>{description}</p>
          {outcomeText && (
            <p className={`event-choice-outcome ${dimmed ? 'opacity-40' : ''}`}>
              {selected ? `✓ ${outcomeText}` : outcomeText}
            </p>
          )}
          {selected && !outcomeText && (
            <p className="event-choice-outcome">✓ Seçildi</p>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="game-shell min-h-screen p-4">
      <div className="mx-auto max-w-6xl">
        <GameHeader round={round} maxRounds={maxRounds} score={score} streak={streak} />

        <div className="game-layout event-layout">
          <div className="panel event-squad-panel">
            <div className="event-squad-title-row">
              <div>
                <p className="event-squad-kicker">Olay öncesi</p>
                <h3 className="event-squad-title">Kadro durumu</h3>
              </div>
              <span className="event-squad-score">{avg}</span>
            </div>
            <LineupPreviewModal
              open={lineupOpen}
              onClose={() => setLineupOpen(false)}
              squad={squad}
              activeTactics={activeTactics}
              manualLineup={manualLineup}
            />
            <div className="event-squad-metrics">
              <div>
                <span>Kadro</span>
                <strong>{lineupSummary.squadSize}/{maxSquadSize}</strong>
              </div>
              <div>
                <span>Saha</span>
                <strong>{lineupSummary.filled}/11</strong>
              </div>
              <div className="event-squad-morale-cell">
                <span>Moral</span>
                <strong>{morale}/100</strong>
                <div className="event-squad-morale-bar">
                  <div className="event-squad-morale-bar-fill" style={{ width: `${morale}%` }} />
                </div>
              </div>
            </div>
            <LineupPreviewCenterTrigger
              squad={squad}
              activeTactics={activeTactics}
              manualLineup={manualLineup}
              compact
              onOpen={() => setLineupOpen(true)}
            />
            <div className="event-squad-card event-squad-card--category">
              <span className="event-category-badge">{categoryBite.label}</span>
              <p>{categoryBite.desc}</p>
            </div>
            <div className="event-squad-card">
              <p className="event-squad-card-title">Bu tur maç yok</p>
              <p>{BITE.eventNoMatch}</p>
            </div>
            <div className="event-squad-mini-list">
              <p className="event-squad-card-title">Öne çıkan kadro</p>
              {topPlayers.slice(0, 3).map((p) => (
                <div key={p.id} className="event-squad-mini-row">
                  <span className="event-squad-mini-name">{p.name}</span>
                  <span>{formatPosition(p.position)}</span>
                  <strong>{p.currentRating}</strong>
                </div>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="panel event-main-panel border-amber-500/30">
            <p className="text-sm uppercase tracking-widest text-amber-400">Olay Kartı · Round {round}</p>
            <p className="event-round-bite">{BITE.eventIntro}</p>

            {hasRiskChoice && (
              <p className="event-risk-explainer">{MATCH_RISK_EXPLAINER}</p>
            )}

            <EventSceneVisual event={currentEvent} />

            <h2 className="event-title">{currentEvent.title}</h2>
            <p className="event-atmosphere-line">{presentation.atmosphere}</p>
            <p className="event-description">{presentation.narrative}</p>
            <p className="event-story-bite">
              {categoryBite.desc} Maç yok — kararın doğrudan moral, kadro veya sonraki maç gücüne yansır.
            </p>

            {eventSubjects.length > 0 && (
              <div className={`event-subjects ${eventSubjects.length > 1 ? 'event-subjects--multi' : ''}`}>
                {eventSubjects.map((subject) => (
                  <div
                    key={`${subject.player.id}-${subject.label}`}
                    className={`event-player-offer event-player-offer--${subject.variant ?? 'focus'}`}
                  >
                    <p className="event-player-offer-label">{subject.label}</p>
                    {subject.incoming ? (
                      <PlayerCard
                        card={subject.player}
                        squad={squad}
                        discovered={discoveredSynergies}
                        maxSquadSize={maxSquadSize}
                        activeTactics={activeTactics}
                        morale={morale}
                      />
                    ) : (
                      <PlayerCardMini card={subject.player} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {isFirstRun && round <= 4 && (
              <p className="mt-2 text-sm text-amber-200">Doğru cevap yok — mevcut moral ve kadroya göre seç</p>
            )}

            <div className="event-choices">
              {renderChoice('A', currentEvent.optionA.label, currentEvent.optionA.description, previews.a, tones.a, presentation.choiceA)}
              {renderChoice('B', currentEvent.optionB.label, currentEvent.optionB.description, previews.b, tones.b, presentation.choiceB)}
            </div>

            <AnimatePresence>
              {picked && (
                <motion.div
                  className="event-result-badges"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {getEventResultBadges(picked === 'A' ? previews.a : previews.b).map((b, i) => (
                    <motion.span
                      key={`${b.text}-${i}`}
                      className={`event-result-badge ${b.positive ? 'event-result-badge--good' : 'event-result-badge--bad'}`}
                      initial={{ opacity: 0, y: 18, scale: 0.7 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.08 * i, type: 'spring', stiffness: 320, damping: 18 }}
                    >
                      <span className="event-result-badge-icon">{b.icon}</span>
                      {b.text}
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function MatchScreen() {
  const {
    currentMatch, pendingSelected, finishMatch, squad, round, maxRounds, score, streak, morale,
    activeTactics, maxSquadSize, lossesCount, timerSeconds, flawless,
  } = useGameStore();
  const [anim, setAnim] = useState<MatchAnimState>({
    minute: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    eventFeed: [],
    latestEvent: null,
    playing: true,
    halftime: false,
    showResult: false,
    showHighlights: false,
  });
  const [speed, setSpeed] = useState(1);
  const [microToasts, setMicroToasts] = useState<{ id: number; text: string; kind: 'synergy' | 'tag' }[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const prevGoalsRef = useRef(0);
  const toastIdRef = useRef(0);
  const speedRef = useRef(speed);
  const animRef = useRef(anim);
  const speedReadyRef = useRef(false);
  speedRef.current = speed;
  animRef.current = anim;

  useEffect(() => {
    if (!currentMatch) return;
    speedReadyRef.current = false;
    prevGoalsRef.current = 0;
    setMicroToasts([]);
    setAnim({
      minute: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      eventFeed: [],
      latestEvent: null,
      playing: true,
      halftime: false,
      showResult: false,
      showHighlights: false,
    });
    playSound('whistle', getPersistedStats().soundEnabled);
    const timers = buildMatchAnimSchedule(
      currentMatch.events,
      currentMatch.goalsFor,
      currentMatch.goalsAgainst,
      (partial) => setAnim((prev) => ({ ...prev, ...partial })),
      () => playSound('goal', getPersistedStats().soundEnabled),
      () => playSound('whistle', getPersistedStats().soundEnabled),
      speedRef.current,
    );
    timersRef.current = timers;
    speedReadyRef.current = true;
    return () => timers.forEach(clearTimeout);
  }, [currentMatch]);

  useEffect(() => {
    if (!currentMatch || !speedReadyRef.current) return;
    const snapshot = animRef.current;
    if (!snapshot.playing || snapshot.showResult) return;
    timersRef.current.forEach(clearTimeout);
    const timers = buildMatchAnimScheduleResume(
      currentMatch.events,
      currentMatch.goalsFor,
      currentMatch.goalsAgainst,
      snapshot.minute,
      snapshot.goalsFor,
      snapshot.goalsAgainst,
      snapshot.eventFeed,
      (partial) => setAnim((prev) => ({ ...prev, ...partial })),
      () => playSound('goal', getPersistedStats().soundEnabled),
      () => playSound('whistle', getPersistedStats().soundEnabled),
      speed,
    );
    timersRef.current = timers;
    return () => timers.forEach(clearTimeout);
  }, [speed, currentMatch]);

  // Maçı atla — animasyonu kapatıp doğrudan sonuca git
  const skipMatch = () => {
    if (!currentMatch) return;
    timersRef.current.forEach(clearTimeout);
    playSound('whistle', getPersistedStats().soundEnabled);
    setAnim({
      minute: 90,
      goalsFor: currentMatch.goalsFor,
      goalsAgainst: currentMatch.goalsAgainst,
      eventFeed: currentMatch.events,
      latestEvent: null,
      playing: false,
      halftime: false,
      showResult: true,
      showHighlights: true,
    });
  };

  useEffect(() => {
    if (!anim.showResult || !currentMatch?.newlyDiscoveredSynergies.length) return;
    useGameStore.setState({ pendingSynergyReveal: currentMatch.newlyDiscoveredSynergies });
  }, [anim.showResult, currentMatch]);

  // Gol anında "anlık tetiklenen" sinerji/tag bonusu mikro-bildirimi (ör. "HIZLI KONTRA +55!")
  useEffect(() => {
    if (anim.goalsFor <= prevGoalsRef.current) {
      prevGoalsRef.current = anim.goalsFor;
      return;
    }
    const newGoals = anim.goalsFor - prevGoalsRef.current;
    prevGoalsRef.current = anim.goalsFor;
    const goalSynergies = getActiveSynergies(squad, morale, { activeTactics, behindInMatch: anim.goalsFor <= anim.goalsAgainst })
      .filter((s) => s.perGoalBonus || s.goalMultiplier);
    if (!goalSynergies.length) return;
    for (let g = 0; g < newGoals; g++) {
      const syn = goalSynergies[(anim.goalsFor - newGoals + g) % goalSynergies.length]!;
      const amount = syn.perGoalBonus
        ? `+${syn.perGoalBonus}`
        : `×${syn.goalMultiplier}`;
      const id = ++toastIdRef.current;
      setMicroToasts((prev) => [...prev, { id, text: `${syn.icon} ${syn.name} ${amount}!`, kind: 'synergy' }]);
      setTimeout(() => setMicroToasts((prev) => prev.filter((t) => t.id !== id)), 1900);
    }
  }, [anim.goalsFor, anim.goalsAgainst, squad, morale, activeTactics]);

  if (!currentMatch || !pendingSelected) {
    return (
      <div className="game-shell flex min-h-screen items-center justify-center p-4">
        <div className="panel text-center">
          <p className="text-lg text-neutral-400">Maç yükleniyor…</p>
          <button type="button" className="btn-secondary mt-4" onClick={() => useGameStore.getState().goToMenu()}>
            Ana Menü
          </button>
        </div>
      </div>
    );
  }

  const outcome = currentMatch.outcome === 'win' ? 'GALİBİYET' : currentMatch.outcome === 'draw' ? 'BERABERLİK' : 'MAĞLUBİYET';
  const outcomeColor = currentMatch.outcome === 'win' ? 'text-green-400' : currentMatch.outcome === 'draw' ? 'text-amber-400' : 'text-red-400';
  const moraleOutcomeDelta = currentMatch.outcome === 'win' ? 10 : currentMatch.outcome === 'draw' ? -5 : -20;
  const lineupSummary = getSquadLineupSummary(squad, activeTactics);
  const pitchDots = lineupSummary.lineup
    .filter((slot) => slot.player)
    .map((slot) => lineupSlotToMatchPitch(slot));
  const squadAvg = Math.round(
    lineupSummary.lineup
      .filter((s) => s.player)
      .reduce((sum, s) => sum + s.player!.currentRating, 0) / Math.max(lineupSummary.filled, 1),
  );
  const streakMult = streak >= 4 ? 1.35 : streak === 3 ? 1.2 : streak === 2 ? 1.1 : 1;

  const selectionSubtitle = isPlayerCard(pendingSelected)
    ? `${formatPosition(pendingSelected.position)} · Kadroya eklendi · ${pendingSelected.currentRating} rating`
    : isSkipCard(pendingSelected)
      ? 'Kadro değişmedi · mevcut 11 ile maça çıkıyorsun'
      : isTacticCard(pendingSelected)
        ? `${getTacticPreview(pendingSelected, squad, activeTactics).headline} — sonraki maçlarda bonus`
        : 'Antrenman uygulandı';

  const resultExplain = explainMatchResult(
    squadAvg,
    currentMatch.opponent.rating,
    currentMatch.goalsFor,
    currentMatch.goalsAgainst,
    currentMatch.outcome,
    activeTactics,
    morale,
  );

  const previewRoundPoints = anim.showHighlights
    ? calculateRoundPoints(
        currentMatch,
        squad,
        morale,
        streak,
        round,
        lossesCount,
        activeTactics,
        timerSeconds,
        flawless,
      )
    : 0;

  return (
    <div className="game-shell pitch-bg match-screen">
      <SynergyRevealOverlay />
      <div className="match-screen-inner">
        <GameHeader round={round} maxRounds={maxRounds} score={score} streak={streak} />

        <MatchMoraleBanner morale={morale} />

        <div className="match-layout">
          <div className="match-col match-col--pick">
            <MatchLeftPanel
              selection={pendingSelected}
              subtitle={selectionSubtitle}
              squad={squad}
              morale={morale}
              activeTactics={activeTactics}
              squadAvg={squadAvg}
              opponentRating={currentMatch.opponent.rating}
            />
          </div>

          <div className="match-col match-col--arena">
            <div className="match-vs-row">
              <MatchTeamCard
                side="home"
                label="Kadron"
                rating={squadAvg}
                meta={`Moral ${morale} · ${activeTactics.length} taktik`}
                squadSize={squad.length}
                maxSquadSize={maxSquadSize}
              />
              <span className="match-vs-badge">VS</span>
              <MatchTeamCard
                side="away"
                label={currentMatch.opponent.name}
                rating={currentMatch.opponent.rating}
                opponentStyle={currentMatch.opponent.style}
              />
            </div>

            {(() => {
              const diff = squadAvg - currentMatch.opponent.rating;
              const cls = diff >= 5 ? 'favorite' : diff <= -5 ? 'underdog' : 'even';
              const label = diff >= 5 ? `★ Favori (+${diff})` : diff <= -5 ? `⚔ Underdog (${diff})` : '≈ Başa baş';
              return (
                <div className="flex items-center justify-center gap-2 my-2">
                  <span className={`match-odds-badge match-odds-badge--${cls}`}>{label}</span>
                  {anim.playing && !anim.showResult && (
                    <span className="match-speed-control">
                      <button type="button" className={`match-speed-btn ${speed === 1 ? 'match-speed-btn--active' : ''}`} onClick={() => setSpeed(1)}>1x</button>
                      <button type="button" className={`match-speed-btn ${speed === 2 ? 'match-speed-btn--active' : ''}`} onClick={() => setSpeed(2)}>2x</button>
                      <button type="button" className="match-speed-btn" onClick={skipMatch}>Atla ⏭</button>
                    </span>
                  )}
                </div>
              );
            })()}

            <div className="relative">
              <AnimatePresence>
                {microToasts.length > 0 && (
                  <div className="match-microfeed">
                    {microToasts.map((toast) => (
                      <motion.span
                        key={toast.id}
                        className={`match-micro-toast match-micro-toast--${toast.kind}`}
                        initial={{ opacity: 0, x: 40, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                      >
                        {toast.text}
                      </motion.span>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            <MatchAnimation
              wide
              minute={anim.minute}
              goalsFor={anim.goalsFor}
              goalsAgainst={anim.goalsAgainst}
              latestEvent={anim.latestEvent}
              eventFeed={anim.eventFeed}
              playing={anim.playing}
              halftime={anim.halftime}
              outcome={anim.showResult ? currentMatch.outcome : undefined}
              pitchDots={pitchDots}
              filledCount={lineupSummary.filled}
              opponentStyle={currentMatch.opponent.style}
              round={round}
            />
            </div>
          </div>

          <div className="match-col match-col--result">
            <MatchRightPanel
              anim={anim}
              currentMatch={currentMatch}
              squad={squad}
              morale={morale}
              squadAvg={squadAvg}
              activeTactics={activeTactics}
              streak={streak}
              outcomeLabel={anim.showResult ? outcome : undefined}
              outcomeColor={anim.showResult ? outcomeColor : undefined}
              resultExplain={anim.showResult ? resultExplain : undefined}
            />

            {anim.showResult && (
              <div className="match-result-extras">
                <div className={`match-morale-delta match-morale-delta--${moraleOutcomeDelta >= 0 ? 'up' : 'down'}`}>
                  <span className="match-morale-delta-icon" aria-hidden>{moraleOutcomeDelta >= 0 ? '❤️' : '💔'}</span>
                  <span className="match-morale-delta-label">Moral</span>
                  <span className="match-morale-delta-value">{moraleOutcomeDelta > 0 ? `+${moraleOutcomeDelta}` : moraleOutcomeDelta}</span>
                  <span className="match-morale-delta-after">{currentMatch.outcome === 'win' ? 'galibiyet' : currentMatch.outcome === 'draw' ? 'beraberlik' : 'mağlubiyet'}</span>
                </div>
                <div className="match-bonus-row">
                  {currentMatch.outcome === 'win' && currentMatch.cleanSheet && (
                    <span className="match-bonus-chip">🛡️ Clean sheet +100</span>
                  )}
                  {currentMatch.outcome === 'win' && streakMult > 1 && (
                    <span className="match-bonus-chip match-bonus-chip--fire">🔥 Seri ×{streakMult}</span>
                  )}
                  {round === 1 && currentMatch.outcome === 'win' && (
                    <FirstWinCelebration compact />
                  )}
                </div>


                {currentMatch.wowMoment && (
                  <p className="match-wow">{currentMatch.wowMoment}</p>
                )}
              </div>
            )}

            {anim.showHighlights && (
              <div className="match-footer-panel">
                <div className="match-highlights">
                  {currentMatch.highlights.map((h, i) => (
                    <p key={i} className="match-highlight-line">
                      {h.text} <span>+{h.points}</span>
                    </p>
                  ))}
                  <p className={`match-round-points ${previewRoundPoints > 0 ? 'match-round-points--pos' : ''}`}>
                    Round puanı: {previewRoundPoints > 0 ? `+${previewRoundPoints}` : '0'}
                  </p>
                </div>
                <button type="button" className="btn-primary match-continue-btn" onClick={finishMatch}>
                  Devam
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LossScreen() {
  const { lastLossPlayer, lastLossBrokenSynergies, finishLoss, dangerMode, squad, round, maxRounds, score, streak, morale, activeTactics, manualLineup } = useGameStore();

  const departedScore = lastLossPlayer ? getDepartureScore(lastLossPlayer, morale) : 0;
  const remainingScores = squad
    .map((p) => ({ player: p, score: getDepartureScore(p, morale) }))
    .sort((a, b) => a.score - b.score);
  const lineupSummary = getSquadLineupSummary(squad, activeTactics, manualLineup);
  const avg = squad.length ? Math.round(squad.reduce((sum, p) => sum + p.currentRating, 0) / squad.length) : 0;

  return (
    <div className="game-shell min-h-screen p-4">
      <SynergyRevealOverlay />
      <div className="mx-auto max-w-5xl">
        <GameHeader round={round} maxRounds={maxRounds} score={score} streak={streak} />
        <div className="loss-screen-layout">
          <motion.div initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="panel loss-screen-main border-red-800/60 bg-red-950/20">
            <div className="loss-hero">
              <p className="loss-kicker">Round {round}</p>
              <h2>Maç kaybedildi</h2>
              <p>En düşük ayrılma skoruna sahip oyuncu kadrodan çıkar. MENTOR, LİDER ve KAPİTAN oyuncular daha zor ayrılır.</p>
            </div>

            <div className="loss-summary-grid">
              <div className="loss-summary-morale">
                <span>Moral</span>
                <strong>{morale}/100</strong>
                <div className="loss-summary-morale-bar">
                  <div className="loss-summary-morale-bar-fill" style={{ width: `${morale}%` }} />
                </div>
                <small>Mağlubiyet sonrası -20</small>
              </div>
              <div>
                <span>Kadro</span>
                <strong>{squad.length}/11</strong>
                <small>Ort. {avg}</small>
              </div>
              <div>
                <span>Saha</span>
                <strong>{lineupSummary.filled}/11</strong>
                <small>{lineupSummary.filled < 11 ? `${11 - lineupSummary.filled} boş slot` : 'Hazır'}</small>
              </div>
            </div>

            {lastLossPlayer && (
              <div className="loss-departed-card">
                <PlayerHeroMini
                  player={lastLossPlayer}
                  label="Kadrodan ayrıldı"
                  strikethrough
                  highlight="loss"
                  extra={`Ayrılma skoru ${formatStatDisplay(departedScore)} · en düşük değer`}
                />
              </div>
            )}

            {lastLossBrokenSynergies.length > 0 && (
              <div className="loss-broken-card">
                <p className="loss-risk-title">Kırılan sinerji</p>
                {lastLossBrokenSynergies.map((id) => (
                  <p key={id}>
                    {getSynergyById(id)?.icon} {getSynergyById(id)?.name}
                    <span> · {lastLossPlayer?.name} ayrıldığı için pasif</span>
                  </p>
                ))}
                <small>Keşif kaydın kalır; şartları tekrar kurarsan yeniden aktif olur.</small>
              </div>
            )}


          </motion.div>

        <div className="loss-screen-right">
          <div className="loss-screen-lineup panel loss-screen-lineup--enhanced">
            <div className="loss-screen-lineup-head">
              <div className="loss-screen-lineup-title-group">
                <span className="loss-screen-lineup-icon" aria-hidden>⚽</span>
                <p className="loss-screen-lineup-title">Kalan ilk 11</p>
              </div>
              <span className="loss-screen-lineup-badge">{lineupSummary.squadSize}/11 kadro</span>
            </div>
            <LineupPreviewExpanded squad={squad} activeTactics={activeTactics} manualLineup={manualLineup} />
          </div>

          <div className="loss-screen-actions panel">
            {remainingScores.length > 0 && (
              <div className="loss-risk-block">
                <p className="loss-risk-title">Kalan kadro — ayrılma riski</p>
                <ul className="loss-risk-list">
                  {remainingScores.slice(0, 6).map(({ player, score: ds }) => (
                    <li key={player.id} className={`loss-risk-row ${player.id === remainingScores[0]?.player.id ? 'loss-risk-row--hot' : ''}`}>
                      <span className="loss-risk-name">{player.name}</span>
                      <span className="loss-risk-pos">{formatPosition(player.position)}</span>
                      <span className="loss-risk-score">{formatStatDisplay(ds)}</span>
                      {player.id === remainingScores[0]?.player.id && (
                        <span className="loss-risk-badge">En riskli</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {dangerMode && (
              <p className="loss-danger-banner">
                TEHLİKE — {squad.length} oyuncu kaldı · Bir kayıp daha = run biter
              </p>
            )}

            <button type="button" className="btn-primary loss-screen-cta" onClick={finishLoss}>
              {squad.length <= 4 ? 'Run Özeti' : 'Sonraki Round'}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function ShareCardPreview({ score, analysis, displayName, flawless, roundsCompleted, squad, wins, lossesCount }: {
  score: number;
  analysis: import('@/types').RunEndAnalysis | null;
  displayName: string;
  flawless?: boolean;
  roundsCompleted: number;
  squad: import('@/types').PlayerCard[];
  wins: number;
  lossesCount: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const squadAvg = squad.length ? Math.round(squad.reduce((s, p) => s + p.currentRating, 0) / squad.length) : 0;
  useEffect(() => {
    if (!hostRef.current) return;
    hostRef.current.innerHTML = '';
    const canvas = renderShareCardToCanvas({
      score,
      analysis,
      displayName,
      flawless,
      roundsCompleted,
      squad,
      stats: {
        wins,
        losses: lossesCount,
        synergiesFound: analysis?.synergyStats.filter((s) => s.activations > 0).length ?? 0,
        squadAvg,
      },
    });
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.borderRadius = '12px';
    hostRef.current.appendChild(canvas);
  }, [score, analysis, displayName, flawless, roundsCompleted, squad, wins, lossesCount, squadAvg]);
  return <div ref={hostRef} className="share-card-preview" />;
}

export function RunEndScreen() {
  const { score, roundHistory, squad, goToMenu, resetRun, discoveredSynergies, round, lossesCount, runEndAnalysis, runEndStep, advanceRunEnd, flawless, displayName, isDailySeed } = useGameStore();
  const analysis = runEndAnalysis;
  const playerName = displayName || 'Anonim';
  const [shareMsg, setShareMsg] = useState('');
  const [liveRank, setLiveRank] = useState<{ rank: number; total: number; percent: number } | null>(null);
  const wins = roundHistory.filter((r) => r.matchResult?.outcome === 'win').length;
  const matchesPlayed = roundHistory.filter((r) => r.matchResult).length;
  const draws = roundHistory.filter((r) => r.matchResult?.outcome === 'draw').length;
  const allLoss = lossesCount > 0 && wins === 0;
  const squadAvg = squad.length ? Math.round(squad.reduce((s, p) => s + p.currentRating, 0) / squad.length) : 0;
  const activeSynergyStats = analysis?.synergyStats.filter((s) => s.activations > 0) ?? [];
  const bestRound = roundHistory.reduce<typeof roundHistory[number] | null>(
    (best, item) => (!best || item.pointsEarned > best.pointsEarned ? item : best),
    null,
  );
  const goalCounts = new Map<string, number>();
  for (const item of roundHistory) {
    for (const event of item.matchResult?.events ?? []) {
      if (event.type !== 'goal_for') continue;
      goalCounts.set(event.playerName, (goalCounts.get(event.playerName) ?? 0) + 1);
    }
  }
  const topScorers = [...goalCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr'))
    .slice(0, 3);
  const finalRank = liveRank?.rank ?? analysis?.rank;
  const finalTotal = liveRank?.total ?? analysis?.totalPlayers;
  const finalPercent = liveRank?.percent ?? analysis?.rankPercent;
  const shareStats = {
    wins,
    losses: lossesCount,
    synergiesFound: activeSynergyStats.length,
    squadAvg,
  };
  const outcomeLine = flawless && lossesCount === 0
    ? 'Namağlup tamamlandı'
    : lossesCount >= 3
      ? 'Kadro son haftalarda yıprandı'
      : wins >= Math.max(1, matchesPlayed - 1)
        ? 'Maç planı büyük ölçüde tuttu'
        : 'Run dalgalı geçti';

  // Gerçek sıralama: bot-dolgulu yerel liste yerine canlı remote leaderboard'dan
  // hesapla (varsa). Yoksa yerel analiz değerlerine düşer.
  useEffect(() => {
    if (!isRemoteLeaderboardEnabled() || score <= 0) return;
    let cancelled = false;
    fetchRemoteRank(isDailySeed ? 'daily' : 'allTime', score, isDailySeed ? getDailySeed() : undefined)
      .then((rank) => {
        if (cancelled || !rank) return;
        setLiveRank(rank);
      })
      .catch(() => { /* sessiz: yerel değerlere düşer */ });
    return () => { cancelled = true; };
  }, [score, isDailySeed]);

  const shareText = analysis
    ? `BİR DAHA\nSkor: ${formatScore(score)}\nSıra: #${analysis.rank}/${analysis.totalPlayers}${analysis.rankPercent >= 50 ? ` (en iyi %${Math.max(1, 100 - analysis.rankPercent)})` : ''}\n${analysis.bestDecision ? `En iyi karar: R${analysis.bestDecision.round} ${analysis.bestDecision.cardName}` : ''}`
    : formatScore(score);

  return (
    <div className="game-shell min-h-screen p-4">
      <div className="mx-auto max-w-5xl run-end-shell">
        <AnimatePresence mode="wait">
          {runEndStep === 0 && (
            <motion.div key="score" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="panel run-end-hero-panel run-end-hero-panel--dashboard">
              <div className="run-end-hero-top">
                <div>
                  <p className="run-end-summary-kicker">Run bitti</p>
                  <h1 className="run-end-hero-title">{playerName}</h1>
                  <p className="run-end-hero-sub">{outcomeLine}</p>
                </div>
                <div className="run-end-score-lockup">
                  <span>Final skor</span>
                  <strong>{formatScore(score)}</strong>
                </div>
              </div>

              <div className="run-end-hero-metrics">
                <div className="run-end-hero-metric">
                  <span>Maç karnesi</span>
                  <strong>{wins}G {draws}B {lossesCount}M</strong>
                  <small>{matchesPlayed} maç · {round} round</small>
                </div>
                <div className="run-end-hero-metric">
                  <span>Sıralama</span>
                  <strong>{finalRank && finalTotal ? `#${finalRank}/${finalTotal}` : 'Kaydedildi'}</strong>
                  <small>{finalPercent ? `Yüzdelik: %${finalPercent}` : liveRank ? 'Canlı veri' : 'Yerel kayıt'}</small>
                </div>
                <div className="run-end-hero-metric">
                  <span>Kadro</span>
                  <strong>{squad.length}/11</strong>
                  <small>Ortalama rating {squadAvg || '-'}</small>
                </div>
                <div className="run-end-hero-metric">
                  <span>Sinerji</span>
                  <strong>{activeSynergyStats.length}</strong>
                  <small>{discoveredSynergies.length}/{TOTAL_SYNERGIES} keşif</small>
                </div>
              </div>

              <div className="run-end-spotlight-grid">
                <div className="run-end-spotlight">
                  <span>En iyi round</span>
                  <strong>{bestRound ? `R${bestRound.round} · +${formatScore(bestRound.pointsEarned)}` : 'Yok'}</strong>
                  <small>{bestRound ? bestRound.cardSelected.name : 'Puan üreten round bulunamadı'}</small>
                </div>
                <div className="run-end-spotlight">
                  <span>Gol yükü</span>
                  <strong>{topScorers[0] ? `${topScorers[0][0]} · ${topScorers[0][1]}` : 'Gol yok'}</strong>
                  <small>{topScorers.slice(1).map(([name, goals]) => `${name} ${goals}`).join(' · ') || 'Bir sonraki run daha net bitebilir'}</small>
                </div>
              </div>

              {allLoss && (
                <p className="mt-3 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-neutral-400">
                  Hiç galip gelmedin — kayıp roundlar puan vermez. Bir sonraki run&apos;da ilk galibiyeti hedefle.
                </p>
              )}
              {score === 0 && (
                <p className="mt-3 text-sm text-neutral-400">
                  Bu runu unutma — bir dahaki farklı olabilir. {round} round hayatta kaldın.
                </p>
              )}
              {score > 0 && score < 500 && !allLoss && (
                <p className="mt-3 text-sm text-neutral-500">Beraberlikler az puan verir; bir sonraki run&apos;da sinerji kurmayı dene.</p>
              )}
              <div className="run-end-primary-actions">
                <button type="button" className="btn-primary" onClick={() => resetRun()}>Bir Daha</button>
                <button type="button" className="btn-secondary" onClick={advanceRunEnd}>Sıralama ve detaylar</button>
                <button type="button" className="btn-secondary" onClick={goToMenu}>Ana Menü</button>
              </div>
            </motion.div>
          )}

          {runEndStep === 1 && (
            <motion.div key="rank" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel text-center run-end-rank-panel">
              {analysis ? (
                <>
                  <p className="text-lg text-neutral-400">
                    {isDailySeed ? 'Günlük sıralama' : 'Tüm zamanlar sıralaması'}
                    {liveRank && <span className="ml-2 text-xs text-emerald-400">· canlı</span>}
                  </p>
                  <p className="mt-4 text-4xl font-extrabold">#{(liveRank?.rank ?? analysis.rank)} / {(liveRank?.total ?? analysis.totalPlayers)}</p>
                  {(() => {
                    const percent = liveRank?.percent ?? analysis.rankPercent;
                    const rank = liveRank?.rank ?? analysis.rank;
                    const total = liveRank?.total ?? analysis.totalPlayers;
                    return (
                      <p className="mt-2 text-xl">
                        {score <= 0
                          ? `${round} round hayatta kaldın — bir dahaki sefer farklı olabilir`
                          : total <= 1 && !liveRank
                            ? 'Skorun yerel kayda işlendi; canlı sıralama verisi yok'
                          : percent >= 50
                            ? `En iyi %${Math.max(1, 100 - percent)} içindesin 🔥`
                            : `Sıralaman #${rank} — bir dahaki run'da yüksel`}
                      </p>
                    );
                  })()}
                  {!liveRank && analysis.nearRivalBefore && (
                    <p className="mt-3 text-sm text-neutral-400">Önünde: {analysis.nearRivalBefore.name} (+{analysis.nearRivalBefore.gap})</p>
                  )}
                </>
              ) : (
                <p className="text-neutral-400">Skor kaydedildi.</p>
              )}
              <button type="button" className="btn-primary mt-6 w-full" onClick={advanceRunEnd}>Özet</button>
            </motion.div>
          )}

          {runEndStep >= 2 && (
            <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel run-end-summary space-y-4">
              <div className="run-end-summary-hero">
                <div>
                  <p className="run-end-summary-kicker">Run özeti</p>
                  <p className="run-end-summary-title">{playerName}</p>
                </div>
                <strong>{formatScore(score)}</strong>
              </div>
              <div className="run-end-stats-row">
                <div className="run-end-stat">
                  <span className="run-end-stat-label">Round</span>
                  <span className="run-end-stat-value">{round}</span>
                </div>
                <div className="run-end-stat">
                  <span className="run-end-stat-label">Maç</span>
                  <span className="run-end-stat-value">{matchesPlayed}</span>
                </div>
                <div className="run-end-stat">
                  <span className="run-end-stat-label">Galibiyet</span>
                  <span className="run-end-stat-value run-end-stat-value--win">{wins}</span>
                </div>
                <div className="run-end-stat">
                  <span className="run-end-stat-label">Beraberlik</span>
                  <span className="run-end-stat-value">{draws}</span>
                </div>
                <div className="run-end-stat">
                  <span className="run-end-stat-label">Kayıp</span>
                  <span className="run-end-stat-value run-end-stat-value--loss">{lossesCount}</span>
                </div>
                <div className="run-end-stat">
                  <span className="run-end-stat-label">Kadro</span>
                  <span className="run-end-stat-value">{squad.length}/11</span>
                </div>
              </div>

              {squad.length < 11 && (
                <p className="run-end-understrength-note">
                  Run sonunda {squad.length} oyuncu kaldı — eksik kadro maç gücünü düşürür; geri dönüş zorlaşır.
                </p>
              )}
              {analysis?.bestDecision && (
                <div className="rounded-xl border border-green-800/40 bg-green-950/30 p-4">
                  <p className="text-sm uppercase text-green-400">En İyi Kararın</p>
                  <p className="text-lg font-bold">Round {analysis.bestDecision.round}: {analysis.bestDecision.cardName}</p>
                  <p className="text-sm text-neutral-400">Bunu yalnızca %{analysis.bestDecision.rarePercent} oyuncu yaptı</p>
                  <p className="text-sm text-green-300">+{analysis.bestDecision.pointsGained} puan etkisi</p>
                </div>
              )}
              {analysis?.worstMistake && (
                <div className="rounded-xl border border-red-800/40 bg-red-950/30 p-4">
                  <p className="text-sm uppercase text-red-400">En Kritik Hata</p>
                  <p className="text-lg font-bold">Round {analysis.worstMistake.round}</p>
                  <p className="text-sm text-neutral-300">{analysis.worstMistake.description}</p>
                </div>
              )}

              <div className="run-end-synergies">
                <p className="text-sm uppercase text-neutral-500">Keşfedilen sinerjiler ({discoveredSynergies.length}/{TOTAL_SYNERGIES})</p>
                {analysis?.synergyStats.length ? (
                  <div className="run-end-synergy-grid">
                    {analysis.synergyStats.map((s) => (
                      <div
                        key={s.id}
                        className={`run-end-synergy-chip ${s.activations > 0 ? 'run-end-synergy-chip--active' : 'run-end-synergy-chip--idle'}`}
                      >
                        <span className="run-end-synergy-icon">{s.icon}</span>
                        <div className="run-end-synergy-body">
                          <p className="run-end-synergy-name">{s.name}</p>
                          <p className="run-end-synergy-detail">
                            {s.activations > 0
                              ? `${s.activations}× (+${s.points})`
                              : `Keşfedildi · ${SYNERGIES.find((x) => x.id === s.id)?.description ?? ''}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">Bu run&apos;da sinerji puanı yok</p>
                )}
              </div>

              <div className="run-end-history max-h-48 overflow-y-auto">
                {roundHistory.map((r) => {
                  const icon = r.isTacticBonus
                    ? '📋'
                    : r.matchResult?.outcome === 'win'
                      ? '✓'
                      : r.matchResult?.outcome === 'draw'
                        ? '≈'
                        : '✗';
                  const iconColor = r.isTacticBonus
                    ? 'text-amber-400'
                    : r.matchResult?.outcome === 'win'
                      ? 'text-green-400'
                      : r.matchResult?.outcome === 'draw'
                        ? 'text-amber-500'
                        : 'text-red-400';
                  return (
                    <div key={r.round} className="flex justify-between border-b border-neutral-800 py-2 text-sm">
                      <span>
                        <span className={`mr-2 font-bold ${iconColor}`}>{icon}</span>
                        R{r.round}{' '}
                        {r.isTacticBonus
                          ? isTrainingCard(r.cardSelected)
                            ? `Antrenman · ${r.cardSelected.description}`
                            : `Taktik · ${isTacticCard(r.cardSelected) ? r.cardSelected.name : 'Bonus'}`
                          : isSkipCard(r.cardSelected)
                            ? 'Pas geç'
                            : isPlayerCard(r.cardSelected)
                              ? r.cardSelected.name
                              : isTrainingCard(r.cardSelected)
                                ? `🎓 ${r.cardSelected.description}`
                                : `📋 ${r.cardSelected.name}`}
                      </span>
                      <span className={r.pointsEarned > 0 ? 'text-amber-400' : 'text-neutral-600'}>
                        {r.pointsEarned > 0 ? `+${r.pointsEarned}` : '0'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {squad.slice(0, 6).map((p) => <PlayerCardMini key={p.id} card={p} />)}
              </div>

              {analysis && (
                <div>
                  <p className="mb-2 text-xs uppercase text-neutral-500">
                    Paylaşım kartı · {getShareTier(analysis.rankPercent).toUpperCase()}
                  </p>
                  <ShareCardPreview
                    score={score}
                    analysis={analysis}
                    displayName={playerName}
                    flawless={flawless && lossesCount === 0}
                    roundsCompleted={round}
                    squad={squad}
                    wins={wins}
                    lossesCount={lossesCount}
                  />
                </div>
              )}

              {shareMsg && <p className="text-center text-sm text-green-400">{shareMsg}</p>}

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={async () => {
                    await downloadShareCard({
                      score,
                      analysis,
                      displayName: playerName,
                      flawless: flawless && lossesCount === 0,
                      roundsCompleted: round,
                      squad,
                      stats: shareStats,
                    });
                    setShareMsg('PNG indirildi!');
                  }}
                >
                  Paylaşım Kartını İndir (PNG)
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={async () => {
                    const ok = await copyShareCardImage({
                      score,
                      analysis,
                      displayName: playerName,
                      flawless: flawless && lossesCount === 0,
                      roundsCompleted: round,
                      squad,
                      stats: shareStats,
                    });
                    setShareMsg(ok ? 'Görsel panoya kopyalandı!' : 'Kopyalama desteklenmiyor — PNG indir.');
                  }}
                >
                  Görseli Kopyala
                </button>
                <button type="button" className="btn-secondary" onClick={() => navigator.clipboard.writeText(shareText)}>Paylaş Metnini Kopyala</button>
                <button type="button" className="btn-primary" onClick={() => resetRun()}>Bir Daha</button>
                <button type="button" className="btn-secondary" onClick={goToMenu}>Ana Menü</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

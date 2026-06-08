import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameHeader } from '@/components/GameHeader';
import { PlayerCard, PlayerCardMini } from '@/components/PlayerCard';
import { TacticCard } from '@/components/TacticCard';
import { PickMoraleBanner } from '@/components/PickMoraleBanner';
import { SquadPanel } from '@/components/SquadPanel';
import { getCardPickHeaderSubtitle } from '@/data/biteTips';
import { LineupPreviewCenterTrigger, LineupPreviewExpanded, LineupPreviewModal } from '@/components/LineupPreview';
import { isFinaleRound, isTacticBonusRound } from '@/engine/roundFlow';
import { previewEventPlayer } from '@/engine/events';
import { SynergyRevealOverlay } from '@/components/SynergyRevealOverlay';
import { SidePanel } from '@/components/SidePanel';
import { MoralePanel } from '@/components/MoralePanel';
import { PlayerHeroMini } from '@/components/PlayerHero';
import { MatchTeamCard } from '@/components/MatchPickPanel';
import { getSynergyById, SYNERGIES } from '@/data/synergies';
import { BITE, EVENT_CATEGORY_BITE } from '@/data/biteTips';
import { explainMatchResult, getDepartureScore, getEventPreviews, getTacticPreview } from '@/engine/contextPreview';
import { calculateRoundPoints, formatScore } from '@/engine/scoring';
import { getSquadLineupSummary } from '@/engine/lineupPreview';
import { getPersistedStats, TOTAL_SYNERGIES, useGameStore } from '@/store/gameStore';
import { isPlayerCard, isTacticCard, isTrainingCard } from '@/types';
import { MatchAnimation } from '@/components/MatchAnimation';
import { MatchMoraleBanner } from '@/components/MatchMoraleBanner';
import { MatchLeftPanel, MatchRightPanel } from '@/components/MatchLivePanels';
import { TrainingCard } from '@/components/TrainingCard';
import { TrainingPickModal } from '@/components/TrainingPickModal';
import { buildMatchAnimSchedule, type MatchAnimState } from '@/engine/matchAnimSchedule';
import { FirstWinCelebration } from '@/components/FirstWinCelebration';
import { downloadShareCard, copyShareCardImage, getShareTier, renderShareCardToCanvas } from '@/utils/shareCard';
import { playSound } from '@/utils/sound';
import { formatStatDisplay } from '@/utils/formatNumber';
import { formatPosition } from '@/utils/positionStyle';
import { DANGER_MORALE_FLOOR, REROLLS_PER_RUN } from '@/constants/game';
import { getEventChoiceTones, eventChoiceClass, formatMatchRiskDelta, MATCH_RISK_EXPLAINER } from '@/engine/eventRisk';
import { formatMatchPowerBonusLabel } from '@/engine/matchPower';
import { sortSquadByRating } from '@/engine/squadLogic';
import type { EventOutcome } from '@/engine/events';

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
  const state = useGameStore();
  const {
    round, maxRounds, squad, maxSquadSize, morale, score, streak,
    currentOffers, selectOffer,
    dangerMode, isFirstRun, discoveredSynergies, activeTactics, usedEventIds,
    extraDrawAvailable, extraDrawUsed, redrawOffers,
    rerollsRemaining, rerollSingleOffer, rerollAllOffers, offersRerollIndex,
    trainingFlow, pickTrainingPlayer, completeTraining, cancelTraining, backTrainingPlayer,
  } = state;
  const sound = getPersistedStats().soundEnabled;

  const empty = maxSquadSize - squad.length;
  const lineupSummary = getSquadLineupSummary(squad, activeTactics);
  const emptyField = 11 - lineupSummary.filled;
  const tacticBonus = isTacticBonusRound(round, maxRounds);
  const finaleMatch = isFinaleRound(round, maxRounds);
  const pickSubtitle = finaleMatch
    ? 'Şampiyonluk maçı — son kartını seç, büyük puan için kazan'
    : tacticBonus
      ? getCardPickHeaderSubtitle(currentOffers, empty, round)
      : empty > 0
        ? `3 oyuncu teklifi · Kadroya eklenir (${empty} boş slot)`
        : emptyField > 0
          ? `3 oyuncu teklifi · Sahada ${emptyField} boş slot — yedek çıkar, slota yerleşir`
          : '3 oyuncu teklifi · Kadro dolu — en riskli oyuncunun yerine geçer';

  return (
    <div className={`game-shell pitch-bg card-select-screen ${dangerMode ? 'danger-pulse' : ''}`}>
      <div className="card-select-inner w-full max-w-none px-3 py-2 md:px-4 md:py-3">
        <GameHeader round={round} maxRounds={maxRounds} score={score} streak={streak} />

        <PickMoraleBanner morale={morale} />

        {dangerMode && (
          <p className="card-select-danger-banner">
            TEHLİKE MODU — {squad.length} oyuncu · Moral {DANGER_MORALE_FLOOR}&apos;nin altına düşmez
          </p>
        )}

        <div className="game-layout card-select-layout">
          <SquadPanel
            squad={squad}
            maxSquadSize={maxSquadSize}
            round={round}
            maxRounds={maxRounds}
            activeTactics={activeTactics}
            onShowLineup={() => setLineupOpen(true)}
          />

          <div className="card-pick-center min-w-0">
            <div className="card-pick-toolbar">
              <div className="card-pick-toolbar-main">
                {finaleMatch ? (
                  <h2 className="card-pick-title card-pick-title--finale">Şampiyonluk Maçı</h2>
                ) : tacticBonus ? (
                  <h2 className="card-pick-title card-pick-title--tactic">Taktik Bonusu</h2>
                ) : (
                  <h2 className="card-pick-title">Bir Kart Seç</h2>
                )}
                <p className="card-pick-subtitle">{pickSubtitle}</p>
              </div>
              <div className="card-pick-toolbar-actions">
                {!tacticBonus && (
                  <div className="card-pick-reroll-bar">
                    <span
                      className={`card-pick-reroll-count ${rerollsRemaining <= 0 ? 'card-pick-reroll-count--empty' : ''}`}
                      title="Kalan yenileme hakkı"
                    >
                      🔄 {rerollsRemaining}/{REROLLS_PER_RUN}
                    </span>
                    <button
                      type="button"
                      className="btn-reroll-all"
                      disabled={rerollsRemaining <= 0}
                      onClick={() => { playSound('tick', sound); rerollAllOffers(); }}
                    >
                      3&apos;ünü yenile
                      <span className="btn-reroll-all-cost">
                        {rerollsRemaining > 0 ? '−1 hak' : '0 hak'}
                      </span>
                    </button>
                  </div>
                )}
                <LineupPreviewCenterTrigger
                  squad={squad}
                  activeTactics={activeTactics}
                  compact
                  onOpen={() => setLineupOpen(true)}
                />
                {extraDrawAvailable && !extraDrawUsed && (
                  <button
                    type="button"
                    className="btn-secondary btn-reroll-extra"
                    title="Round 10 ödülü — 3 yeni oyuncu teklifi"
                    onClick={redrawOffers}
                  >
                    🎯 Ekstra çek (Round 10)
                  </button>
                )}
              </div>
            </div>
            <LineupPreviewModal
              open={lineupOpen}
              onClose={() => setLineupOpen(false)}
              squad={squad}
              activeTactics={activeTactics}
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

            {tacticBonus && (
              <div className="card-pick-bonus-banner">
                <span className="card-pick-bonus-icon" aria-hidden>📋</span>
                <div>
                  <p className="card-pick-bonus-title">Antrenman günü — maç yok</p>
                  <p className="card-pick-bonus-desc">2 taktik/formasyon + 1 antrenman kartı. Taktik slota yerleşir; antrenman ile oyuncuya nitelik eklersin. +35 puan · +8 moral.</p>
                </div>
              </div>
            )}

            <div className="cards-pick-grid">
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
                    onSelect={() => { playSound('tick', sound); selectOffer(offer); }}
                    showTagHint={isFirstRun && round === 1}
                  />
                ) : isTrainingCard(offer) ? (
                  <TrainingCard
                    key={`${offer.id}-r${offersRerollIndex}`}
                    card={offer}
                    onSelect={() => { playSound('tick', sound); selectOffer(offer); }}
                  />
                ) : (
                  <TacticCard key={`${offer.id}-r${offersRerollIndex}`} card={offer} squad={squad} activeTactics={activeTactics} onSelect={() => selectOffer(offer)} />
                );
                const label = isTrainingCard(offer)
                  ? 'Antrenman kartı'
                  : isPlayerCard(offer)
                    ? 'Oyuncu kartı'
                    : 'Taktik kartı';
                return (
                  <div key={`${offer.id}-slot-r${offersRerollIndex}-i${slotIndex}`} className="card-pick-slot">
                    <div className="card-pick-slot-head">
                      <span className={`card-pick-slot-label ${
                        isTrainingCard(offer)
                          ? 'card-pick-slot-label--training'
                          : isPlayerCard(offer)
                            ? 'card-pick-slot-label--player'
                            : 'card-pick-slot-label--tactic'
                      }`}>
                        {label}
                      </span>
                      {!tacticBonus && isPlayerCard(offer) && (
                        <button
                          type="button"
                          className="btn-reroll-slot"
                          disabled={rerollsRemaining <= 0}
                          title={rerollsRemaining > 0 ? 'Bu kartı yenile (−1 hak)' : 'Yenileme hakkın kalmadı'}
                          aria-label={`${offer.name} kartını yenile`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (rerollsRemaining <= 0) return;
                            playSound('tick', sound);
                            rerollSingleOffer(slotIndex);
                          }}
                        >
                          {rerollsRemaining > 0 ? '🔄' : '0'}
                        </button>
                      )}
                    </div>
                    <div className="card-pick-slot-anchor">{inner}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {trainingFlow && (
            <TrainingPickModal
              squad={squad}
              offeredTags={trainingFlow.offeredTags}
              step={trainingFlow.step}
              selectedPlayerId={trainingFlow.selectedPlayerId}
              onPickPlayer={pickTrainingPlayer}
              onPickTag={completeTraining}
              onClose={cancelTraining}
              onBack={backTrainingPlayer}
            />
          )}

          <SidePanel
            squad={squad}
            morale={morale}
            activeTactics={activeTactics}
            usedEventIds={usedEventIds}
            round={round}
            currentOffers={currentOffers}
            discoveredSynergies={discoveredSynergies}
          />
        </div>
      </div>
    </div>
  );
}

export function EventScreen() {
  const { currentEvent, resolveEventChoice, round, maxRounds, score, streak, squad, morale, isFirstRun, seed, discoveredSynergies, activeTactics, maxSquadSize } = useGameStore();
  const [picked, setPicked] = useState<'A' | 'B' | null>(null);

  if (!currentEvent) return null;

  const previews = getEventPreviews(currentEvent, squad, morale, score, activeTactics);
  const offerPlayer = (currentEvent.id === 'evt_kiralik' || currentEvent.id === 'evt_genc_yetenek' || currentEvent.id === 'evt_scout')
    ? previewEventPlayer(seed, round, currentEvent.id)
    : null;
  const tones = getEventChoiceTones(previews);
  const categoryBite = EVENT_CATEGORY_BITE[currentEvent.category];
  const avg = squad.length ? Math.round(squad.reduce((s, p) => s + p.currentRating, 0) / squad.length) : 0;
  const lineupSummary = getSquadLineupSummary(squad, activeTactics);
  const topPlayers = sortSquadByRating(squad);
  const hasRiskChoice = Boolean(previews.a.nextMatchRisk || previews.b.nextMatchRisk);

  const handlePick = (choice: 'A' | 'B') => {
    if (picked) return;
    setPicked(choice);
    playSound('tick', getPersistedStats().soundEnabled);
    setTimeout(() => resolveEventChoice(choice), 850);
  };

  const renderChoice = (
    choice: 'A' | 'B',
    label: string,
    description: string,
    preview: EventOutcome,
    tone: typeof tones.a,
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
        <div className="event-choice-visual" aria-hidden>
          <span className="event-choice-visual-icon">{choice === 'A' ? '◆' : '◇'}</span>
          <span className="event-choice-visual-glow" />
        </div>
        <div className="event-choice-body">
          <span className="event-choice-kicker">Seçenek {choice}</span>
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
          <div className="panel space-y-3">
            <h3 className="text-sm font-bold uppercase text-neutral-400">Kadro durumu</h3>
            <p className="text-lg font-extrabold">
              {lineupSummary.squadSize}/{maxSquadSize} kadro · {lineupSummary.filled}/11 saha · Ort. {avg}
            </p>
            <MoralePanel morale={morale} />
            <p className="text-xs text-neutral-500">{BITE.eventNoMatch}</p>
            <p className="event-category-bite">
              <span className="event-category-badge">{categoryBite.label}</span>
              {categoryBite.desc}
            </p>
            {topPlayers.slice(0, 4).map((p) => (
              <PlayerCardMini key={p.id} card={p} />
            ))}
            {squad.length > 4 && <p className="text-xs text-neutral-600">+{squad.length - 4} oyuncu daha</p>}
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="panel event-main-panel border-amber-500/30">
            <p className="text-sm uppercase tracking-widest text-amber-400">Olay Kartı · Round {round}</p>
            <p className="event-round-bite">{BITE.eventIntro}</p>

            {hasRiskChoice && (
              <p className="event-risk-explainer">{MATCH_RISK_EXPLAINER}</p>
            )}

            <div className={`event-hero event-hero--${currentEvent.category}`}>
              <div className="event-hero-scene" aria-hidden>
                <span className="event-hero-scene-ring" />
                <span className="event-hero-scene-ring event-hero-scene-ring--2" />
              </div>
              <span className="event-hero-icon" aria-hidden>{currentEvent.icon}</span>
              <div className="event-hero-glow" aria-hidden />
            </div>

            <h2 className="event-title">{currentEvent.title}</h2>
            <p className="event-description">{currentEvent.description}</p>
            <p className="event-story-bite">
              {categoryBite.desc} Maç yok — kararın doğrudan moral, kadro veya sonraki maç gücüne yansır.
            </p>

            {offerPlayer && previews.a.addYouth && squad.length < maxSquadSize && (
              <div className="event-player-offer">
                <p className="event-player-offer-label">Teklif edilen oyuncu</p>
                <PlayerCard
                  card={offerPlayer}
                  squad={squad}
                  discovered={discoveredSynergies}
                  maxSquadSize={maxSquadSize}
                  activeTactics={activeTactics}
                  morale={morale}
                />
              </div>
            )}

            {isFirstRun && round <= 4 && (
              <p className="mt-2 text-sm text-amber-200">Doğru cevap yok — mevcut moral ve kadroya göre seç</p>
            )}

            <div className="event-choices">
              {renderChoice('A', currentEvent.optionA.label, currentEvent.optionA.description, previews.a, tones.a)}
              {renderChoice('B', currentEvent.optionB.label, currentEvent.optionB.description, previews.b, tones.b)}
            </div>
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

  useEffect(() => {
    if (!currentMatch) return;
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
    );
    return () => timers.forEach(clearTimeout);
  }, [currentMatch]);

  useEffect(() => {
    if (!anim.showResult || !currentMatch?.newlyDiscoveredSynergies.length) return;
    useGameStore.setState({ pendingSynergyReveal: currentMatch.newlyDiscoveredSynergies });
  }, [anim.showResult, currentMatch]);

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
  const lineupSummary = getSquadLineupSummary(squad, activeTactics);
  const pitchDots = lineupSummary.lineup
    .filter((slot) => slot.player)
    .map((slot) => ({ x: slot.x, y: slot.y, gk: slot.role === 'gk' }));
  const squadAvg = Math.round(
    lineupSummary.lineup
      .filter((s) => s.player)
      .reduce((sum, s) => sum + s.player!.currentRating, 0) / Math.max(lineupSummary.filled, 1),
  );
  const streakMult = streak >= 4 ? 1.35 : streak === 3 ? 1.2 : streak === 2 ? 1.1 : 1;

  const selectionSubtitle = isPlayerCard(pendingSelected)
    ? `${formatPosition(pendingSelected.position)} · Kadroya eklendi · ${pendingSelected.currentRating} rating`
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
  const { lastLossPlayer, lastLossBrokenSynergies, pendingSelected, roundHistory, finishLoss, dangerMode, squad, round, maxRounds, score, streak, morale, activeTactics } = useGameStore();
  const lastPick = pendingSelected ?? roundHistory[roundHistory.length - 1]?.cardSelected;

  const departedScore = lastLossPlayer ? getDepartureScore(lastLossPlayer, morale) : 0;
  const remainingScores = squad
    .map((p) => ({ player: p, score: getDepartureScore(p, morale) }))
    .sort((a, b) => a.score - b.score);

  return (
    <div className="game-shell min-h-screen p-4">
      <SynergyRevealOverlay />
      <div className="mx-auto max-w-5xl">
        <GameHeader round={round} maxRounds={maxRounds} score={score} streak={streak} />
        <div className="loss-screen-layout">
        <motion.div initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="panel loss-screen-main border-red-800/60 bg-red-950/20">
          <p className="text-2xl font-extrabold uppercase text-red-400">Maç Kaybedildi</p>
          <p className="mt-2 text-xs text-neutral-500">
            Not: İlk maçta mağlubiyet sayılmaz — koruma kalkanı aktiftir.
          </p>
          <p className="mt-2 text-base leading-relaxed text-neutral-300">
            En düşük ayrılma skoru olan oyuncu gider — MENTOR / LİDER / KAPİTAN daha zor ayrılır. Moral −20.
          </p>

          <div className="mt-4">
            <MoralePanel morale={morale} compact />
          </div>

          {lastPick && isPlayerCard(lastPick) && (
            <div className="mt-4">
              <PlayerHeroMini
                player={lastPick}
                label="Bu round aldın"
                highlight="gain"
                extra="Mağlubiyet sonrası kadroda kalır"
              />
            </div>
          )}

          {lastPick && isTacticCard(lastPick) && (
            <div className="mt-4 rounded-xl border border-purple-500/40 bg-purple-950/20 p-4">
              <p className="text-xs uppercase text-purple-400">Bu round seçtin</p>
              <p className="text-xl font-extrabold">📋 {lastPick.name}</p>
              <p className="text-sm text-neutral-400">Taktik aktif — oyuncu ayrılmaz</p>
            </div>
          )}

          {lastLossPlayer && (
            <div className="mt-4">
              <PlayerHeroMini
                player={lastLossPlayer}
                label="Ayrılan"
                strikethrough
                highlight="loss"
                extra={`Ayrılma skoru: ${formatStatDisplay(departedScore)} (en düşük)`}
              />
            </div>
          )}

          {lastLossBrokenSynergies.length > 0 && (
            <div className="mt-4 rounded-xl border border-red-500/35 bg-red-950/25 p-3">
              <p className="text-xs font-bold uppercase text-red-300">Artık aktif değil</p>
              {lastLossBrokenSynergies.map((id) => (
                <p key={id} className="text-sm text-red-200/90">
                  {getSynergyById(id)?.icon} {getSynergyById(id)?.name} — {lastLossPlayer?.name} gittiği için
                </p>
              ))}
              <p className="mt-1 text-xs text-neutral-500">Keşif kaydın kalır; yeniden aynı şartları sağlarsan tekrar aktif olur.</p>
            </div>
          )}

        </motion.div>

        <div className="loss-screen-right">
          <div className="loss-screen-lineup panel">
            <p className="loss-screen-lineup-title">Kadro & diziliş</p>
            <LineupPreviewExpanded squad={squad} activeTactics={activeTactics} />
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
  const wins = roundHistory.filter((r) => r.matchResult?.outcome === 'win').length;
  const allLoss = lossesCount > 0 && wins === 0;

  const shareText = analysis
    ? `BİR DAHA\nSkor: ${formatScore(score)}\nSıra: #${analysis.rank}/${analysis.totalPlayers}\n${analysis.bestDecision ? `En iyi karar: R${analysis.bestDecision.round} ${analysis.bestDecision.cardName}` : ''}\nBugünkü oyuncuların %${analysis.rankPercent}'ini geçtim`
    : formatScore(score);

  return (
    <div className="game-shell min-h-screen p-4">
      <div className="mx-auto max-w-xl space-y-3">
        <AnimatePresence mode="wait">
          {runEndStep === 0 && (
            <motion.div key="score" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="panel text-center">
              <p className="text-sm uppercase text-neutral-500">Run Bitti</p>
              <p className="text-6xl font-extrabold text-amber-400">{formatScore(score)}</p>
              <p className="text-neutral-400">{round} round · {lossesCount} kayıp · {wins} galibiyet {flawless && lossesCount === 0 ? '· NAMAĞLUP' : ''}</p>
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
              <button type="button" className="btn-primary mt-6 w-full" onClick={() => resetRun()}>BİR DAHA</button>
              <button type="button" className="btn-secondary mt-2 w-full" onClick={advanceRunEnd}>İSTATİSTİKLERİNE BAK</button>
              <button type="button" className="mt-2 w-full text-sm text-neutral-500 underline-offset-2 hover:underline" onClick={goToMenu}>
                Ana Menü
              </button>
            </motion.div>
          )}

          {runEndStep === 1 && (
            <motion.div key="rank" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel text-center">
              {analysis ? (
                <>
                  <p className="text-lg text-neutral-400">
                    {isDailySeed ? 'Günlük sıralama' : 'Tüm zamanlar sıralaması'}
                  </p>
                  <p className="mt-4 text-4xl font-extrabold">#{analysis.rank} / {analysis.totalPlayers}</p>
                  <p className="mt-2 text-xl">
                    {score > 0
                      ? `Bugünkü oyuncuların %${analysis.rankPercent}'ini geçtin`
                      : `${round} round hayatta kaldın — bir dahaki sefer farklı olabilir`}
                  </p>
                  {analysis.nearRivalBefore && (
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
              <div className="run-end-stats-row">
                <div className="run-end-stat">
                  <span className="run-end-stat-label">Round</span>
                  <span className="run-end-stat-value">{round}</span>
                </div>
                <div className="run-end-stat">
                  <span className="run-end-stat-label">Galibiyet</span>
                  <span className="run-end-stat-value run-end-stat-value--win">{wins}</span>
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
                          : isPlayerCard(r.cardSelected)
                            ? r.cardSelected.name
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
                      stats: {
                        wins,
                        losses: lossesCount,
                        synergiesFound: analysis?.synergyStats.filter((s) => s.activations > 0).length ?? 0,
                        squadAvg: squad.length ? Math.round(squad.reduce((s, p) => s + p.currentRating, 0) / squad.length) : 0,
                      },
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
                      stats: {
                        wins,
                        losses: lossesCount,
                        synergiesFound: analysis?.synergyStats.filter((s) => s.activations > 0).length ?? 0,
                        squadAvg: squad.length ? Math.round(squad.reduce((s, p) => s + p.currentRating, 0) / squad.length) : 0,
                      },
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

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameHeader } from '@/components/GameHeader';
import { HoverTip } from '@/components/HoverTip';
import { PlayerCard, PlayerCardMini } from '@/components/PlayerCard';
import { PlayerCardCompareGrid, type CardPickMode } from '@/components/PlayerCardCompareGrid';
import { TacticCard } from '@/components/TacticCard';
import { TacticPickGrid } from '@/components/TacticPickGrid';
import { buildMatchAnimSchedule, buildMatchAnimScheduleResume, type MatchAnimState } from '@/engine/matchAnimSchedule';
import { isFinaleRound, isTacticBonusRound } from '@/engine/roundFlow';
import { getDailySeed } from '@/engine/seed';
import { getEventSubjects, type EventSubject } from '@/engine/eventSubjects';
import { getTacticCategory } from '@/data/tactics';
import { fetchRemoteRank, isRemoteLeaderboardEnabled } from '@/api/leaderboardRemote';
import { SynergyRevealOverlay } from '@/components/SynergyRevealOverlay';
import { SidePanel } from '@/components/SidePanel';
import { SynergySideSection, SynergyFullPanel, getActiveSynergyUnlockTip } from '@/components/SynergySideSection';
import { MatchTeamCard } from '@/components/MatchPickPanel';
import { getActiveSynergies, getSynergyById, SYNERGIES } from '@/data/synergies';
import { explainActiveTactic, getSidePanelNearSynergies, type NearSynergyProgress } from '@/engine/squadInsights';
import { getEventPresentation } from '@/data/eventVisuals';
import { EventChoiceVisual, EventSceneVisual } from '@/components/EventSceneVisual';
import { getDepartureScore, getEventPreviews, getMoraleEffect, getTacticPreview } from '@/engine/contextPreview';
import { calculateRoundPoints, formatScore, streakMultiplier } from '@/engine/scoring';
import { matchBonusMultiplier } from '@/engine/matchPower';
import { getSquadLineupSummary, lineupSlotToMatchPitch } from '@/engine/lineupPreview';
import { getPersistedStats, TOTAL_SYNERGIES, useGameStore } from '@/store/gameStore';
import { isPlayerCard, isSkipCard, isTacticCard, isTrainingCard } from '@/types';
import type { ActiveTactic, PlayerCard as PlayerCardType } from '@/types';
import { MatchAnimation } from '@/components/MatchAnimation';
import { MatchMoraleBanner } from '@/components/MatchMoraleBanner';
import { MatchLeftPanel, MatchRightPanel } from '@/components/MatchLivePanels';
import { LineupPitchOnly, LineupPreviewCenterTrigger, LineupPreviewModal } from '@/components/LineupPreview';
import { LineupEditorModal } from '@/components/LineupEditorModal';
import { TrainingPickModal } from '@/components/TrainingPickModal';
import { FirstWinCelebration } from '@/components/FirstWinCelebration';
import {
  buildChallengeLink,
  buildShareText,
  canNativeShare,
  copyShareCardImage,
  downloadShareCard,
  ensureShareFonts,
  getShareTier,
  getShareTierLabel,
  renderShareCardToCanvas,
  shareShareCard,
  type ShareCardOptions,
} from '@/utils/shareCard';
import { playSound } from '@/utils/sound';
import { formatStatDisplay } from '@/utils/formatNumber';
import { POSITION_BADGE, formatPosition, getPositionRoleColor, TAG_AVATAR_BG } from '@/utils/positionStyle';
import { iconForSynergy } from '@/utils/gameIcons';
import { DANGER_MORALE_FLOOR } from '@/constants/game';
import { getEventChoiceTones, eventChoiceClass } from '@/engine/eventRisk';
import { getWeeklyModifier } from '@/engine/weeklyModifier';
import { UiIcon, type UiIconName } from '@/components/UiIcon';
import type { EventOutcome } from '@/engine/events';

type EventResultBadge = { icon: UiIconName; text: string; positive: boolean };
type EventOutcomeLine = { icon: UiIconName; label: string; value: string; tone: 'good' | 'bad' | 'warn' | 'neutral' };

function CardSelectInsightRail({
  squad,
  activeSynergies,
  nearSynergies,
}: {
  squad: PlayerCardType[];
  activeSynergies: ReturnType<typeof getActiveSynergies>;
  nearSynergies: NearSynergyProgress[];
}) {
  return (
    <aside className="card-select-insight-rail" aria-label="Sinerji ve tag özeti">
      <SynergySideSection
        squad={squad}
        activeSynergies={activeSynergies}
        near={nearSynergies}
      />
    </aside>
  );
}

function CardSelectLineupMini({
  summary,
  onOpen,
}: {
  summary: ReturnType<typeof getSquadLineupSummary>;
  onOpen: () => void;
}) {
  return (
    <section className="pick-rail-card pick-rail-lineup" aria-label="Diziliş özeti" data-tutorial-target="lineup">
      <div className="pick-rail-card-head">
        <span>Diziliş</span>
        <strong>{summary.formationLabel} · {summary.filled}/11</strong>
      </div>
      <button type="button" className="pick-rail-pitch-btn" onClick={onOpen} aria-label="İlk 11'i göster">
        <div className="pick-rail-pitch">
          <div className="pick-rail-pitch-center" aria-hidden />
          {summary.lineup.map((slot) => (
            <span
              key={slot.index}
              className={`pick-rail-dot ${slot.player ? 'pick-rail-dot--filled' : 'pick-rail-dot--empty'} ${
                slot.outOfPosition ? 'pick-rail-dot--flex' : ''
              } ${slot.player?.position === 'KL' ? 'pick-rail-dot--gk' : ''}`}
              style={{ left: `${100 - slot.y}%`, top: `${slot.x}%` }}
              title={slot.player ? `${slot.player.name} · ${POSITION_BADGE[slot.player.position]}` : `${slot.slot.label} boş`}
            />
          ))}
        </div>
      </button>
      <button type="button" className="pick-rail-lineup-cta" onClick={onOpen}>
        <UiIcon name="arrow-right" />
        İLK 11'İ GÖR
      </button>
    </section>
  );
}

function CardSelectLeftRail({
  morale,
  lineupSummary,
  activeSynergies,
  nearSynergies,
  activeTactics,
  squad,
  onOpenLineup,
  onOpenSynergy,
}: {
  morale: number;
  lineupSummary: ReturnType<typeof getSquadLineupSummary>;
  activeSynergies: ReturnType<typeof getActiveSynergies>;
  nearSynergies: NearSynergyProgress[];
  activeTactics: ActiveTactic[];
  squad: PlayerCardType[];
  onOpenLineup: () => void;
  onOpenSynergy: () => void;
}) {
  const fx = getMoraleEffect(morale);
  const activeSystem = activeTactics.find((tactic) => getTacticCategory(tactic.id) === 'sistem');
  const activeSystemTip = activeSystem ? explainActiveTactic(activeSystem, squad).join('\n') : null;
  const maxVisibleSynergyRows = 4;
  const activeRows = activeSynergies.slice(0, maxVisibleSynergyRows).map((synergy) => ({
    id: synergy.id,
    name: synergy.name,
    icon: iconForSynergy(synergy.icon),
    current: 1,
    required: 1,
    active: true,
    label: 'Aktif',
    tip: getActiveSynergyUnlockTip(synergy, squad),
  }));
  const nearRows = nearSynergies
    .filter(({ synergy }) => !activeRows.some((row) => row.id === synergy.id))
    .slice(0, Math.max(0, maxVisibleSynergyRows - activeRows.length))
    .map(({ synergy, progress }) => ({
      id: synergy.id,
      name: synergy.name,
      icon: iconForSynergy(synergy.icon),
      current: progress.current,
      required: progress.required,
      active: false,
      label: `${progress.current}/${progress.required}`,
      tip: null,
    }));
  const synergyRows = [
    ...activeRows,
    ...nearRows,
  ];

  return (
    <aside className="card-select-left-rail" aria-label="Kadro durumu">
      <section className="pick-rail-card pick-rail-morale">
        <div className="pick-rail-morale-row">
          <span className="pick-rail-title">
            <UiIcon name="heart" />
            Moral
            <span className="pick-rail-morale-tier">{fx.label}</span>
          </span>
          <strong>{morale}</strong>
        </div>
        <div className="pick-rail-morale-bar">
          <span style={{ width: `${morale}%` }} />
        </div>
        <div className="pick-rail-morale-foot">
          <span>Maç gücü çarpanı</span>
          <strong>{fx.multiplier.split(' ')[0]}</strong>
        </div>
      </section>

      <CardSelectLineupMini summary={lineupSummary} onOpen={onOpenLineup} />

      <section className="pick-rail-card pick-rail-synergy">
        <button type="button" className="pick-rail-card-link" onClick={onOpenSynergy}>
          <span><UiIcon name="zap" /> Sinerji</span>
          <strong>{activeSynergies.length} aktif · {nearSynergies.length} yakın</strong>
          <UiIcon name="arrow-right" />
        </button>
        {synergyRows.length > 0 ? (
          <div className="pick-rail-synergy-list">
            {synergyRows.map((row) => {
              const pct = row.active ? 100 : Math.min(100, Math.round((row.current / row.required) * 100));
              const rowContent = (
                <div key={row.id} className={`pick-rail-synergy-row ${row.active ? 'pick-rail-synergy-row--active' : ''}`}>
                  <div className="pick-rail-synergy-line">
                    <span><UiIcon name={row.icon} /> {row.name}</span>
                    <strong>{row.label}</strong>
                  </div>
                  <div className="pick-rail-synergy-bar"><span style={{ width: `${pct}%` }} /></div>
                </div>
              );
              return row.tip ? (
                <HoverTip key={row.id} tip={row.tip} placement="right" className="pick-rail-active-synergy-tip">
                  {rowContent}
                </HoverTip>
              ) : rowContent;
            })}
          </div>
        ) : (
          <p className="pick-rail-empty">Tag topla, sinerjiler burada belirir.</p>
        )}
        {(() => {
          const box = (
            <div className={`pick-rail-system ${activeSystem ? 'pick-rail-system--active' : ''}`}>
              <span className="pick-rail-system-kicker">Oyun sistemi</span>
              <strong>{activeSystem?.name ?? 'Henüz yok'}</strong>
              <p>{activeSystem?.description || 'Taktik turunda bir sistem seçince burada görünür.'}</p>
            </div>
          );
          return activeSystemTip ? <HoverTip tip={activeSystemTip} placement="right">{box}</HoverTip> : box;
        })()}
      </section>
    </aside>
  );
}

function CardSelectSubHeader({
  morale,
  title,
  pickMode,
  onPickModeChange,
  trainingAvailable,
  rerollsRemaining,
}: {
  morale: number;
  title: string;
  pickMode: CardPickMode;
  onPickModeChange: (mode: CardPickMode) => void;
  trainingAvailable: boolean;
  rerollsRemaining: number;
}) {
  const fx = getMoraleEffect(morale);
  return (
    <div className="card-select-subheader">
      <div className="card-select-subheader-moral">
        <UiIcon name="heart" className="card-select-subheader-moral-icon" />
        <span className="card-select-subheader-moral-label">MORAL</span>
        <span className="card-select-subheader-moral-tier">{fx.label}</span>
        <strong className="card-select-subheader-moral-value">{morale}</strong>
      </div>
      <div className="card-select-subheader-center">
        <span className="card-compare-dot" aria-hidden />
        <h2 className="card-compare-title">{title}</h2>
      </div>
      <div className="card-select-subheader-right">
        {trainingAvailable && (
          <div className="card-compare-mode-tabs" role="group" aria-label="Mod seç" data-tutorial-target="pick-mode">
            <button
              type="button"
              className={`card-compare-mode-tab card-compare-mode-tab--cards ${pickMode === 'cards' ? 'card-compare-mode-tab--active' : ''}`}
              onClick={() => onPickModeChange('cards')}
            >
              <UiIcon name="circle-dot" /> Oyuncu Kartı
            </button>
            <button
              type="button"
              className={`card-compare-mode-tab card-compare-mode-tab--training ${pickMode === 'training' ? 'card-compare-mode-tab--active' : ''}`}
              onClick={() => onPickModeChange('training')}
            >
              <UiIcon name="zap" /> Antrenman
            </button>
          </div>
        )}
        <div className="card-compare-reroll-btn">
          <UiIcon name="refresh" />
          <strong>{rerollsRemaining}</strong>
          <span>Yenile</span>
        </div>
      </div>
    </div>
  );
}

/** Seçim sonrası animasyonlu "sonuç rozeti" listesi — sayısal etkiyi vurgular */
function decimalOdds(probability: number): string {
  const safe = Math.max(8, Math.min(86, probability));
  const odds = Math.max(1.08, Math.min(9.9, 92 / safe));
  return odds.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getEventResultBadges(o: EventOutcome): EventResultBadge[] {
  const badges: EventResultBadge[] = [];
  if (o.moraleDelta) badges.push({ icon: 'heart', text: `Moral ${o.moraleDelta > 0 ? '+' : ''}${o.moraleDelta}`, positive: o.moraleDelta > 0 });
  if (o.scoreDelta) badges.push({ icon: 'sparkles', text: `${o.scoreDelta > 0 ? '+' : ''}${o.scoreDelta} puan`, positive: o.scoreDelta > 0 });
  if (o.nextMatchBonus) badges.push({ icon: 'zap', text: `Sonraki maçta takım gücü +%${Math.round((matchBonusMultiplier(o.nextMatchBonus) - 1) * 100)}`, positive: true });
  if (o.grantRerolls) badges.push({ icon: 'refresh', text: `+${o.grantRerolls} çek hakkı`, positive: true });
  if (o.addYouth) badges.push({ icon: 'circle-dot', text: 'Yeni oyuncu katıldı', positive: true });
  if (o.grantTag) badges.push({ icon: 'tag', text: `${o.grantTag} kazandırıldı`, positive: true });
  if (o.removeWeakest) badges.push({ icon: 'minus', text: o.sellPlayerName ? `${o.sellPlayerName} ayrıldı` : 'Oyuncu kadrodan çıktı', positive: false });
  if (o.tempRatingDelta) badges.push({ icon: 'trending-down', text: `Rating ${o.tempRatingDelta > 0 ? '+' : ''}${o.tempRatingDelta} (1 maç)`, positive: o.tempRatingDelta > 0 });
  if (o.nextMatchRisk) badges.push({ icon: 'info', text: `Maç riski +%${Math.round(o.nextMatchRisk * 100)}`, positive: false });
  return badges;
}

function getEventOutcomeLines(o: EventOutcome, eventId?: string): EventOutcomeLine[] {
  const lines: EventOutcomeLine[] = [];
  if (o.moraleDelta) {
    lines.push({
      icon: o.moraleDelta > 0 ? 'heart' : 'heart-crack',
      label: 'Moral',
      value: `${o.moraleDelta > 0 ? '+' : ''}${o.moraleDelta}`,
      tone: o.moraleDelta > 0 ? 'good' : 'bad',
    });
  }
  if (o.scoreDelta) {
    lines.push({
      icon: 'sparkles',
      label: 'Anlık puan',
      value: `${o.scoreDelta > 0 ? '+' : ''}${o.scoreDelta}`,
      tone: o.scoreDelta > 0 ? 'good' : 'bad',
    });
  }
  if (o.nextMatchBonus) {
    const pct = Math.round((matchBonusMultiplier(o.nextMatchBonus) - 1) * 100);
    lines.push({
      icon: 'zap',
      label: 'Takım gücü',
      value: `Sonraki maç +%${pct}`,
      tone: 'good',
    });
  }
  if (o.nextMatchRisk) {
    const pct = Math.round(o.nextMatchRisk * 100);
    lines.push({
      icon: 'info',
      label: 'Rakip gücü',
      value: `Sonraki maç +%${pct}`,
      tone: 'warn',
    });
  }
  if (o.grantRerolls) {
    lines.push({ icon: 'refresh', label: 'Yenileme', value: `+${o.grantRerolls} hak`, tone: 'good' });
  }
  if (o.addYouth) {
    lines.push({ icon: 'circle-dot', label: 'Kadro', value: 'Genç oyuncu eklenir', tone: 'good' });
  }
  if (o.grantTag) {
    lines.push({ icon: 'tag', label: 'Tag', value: `${o.grantTag} eklenir`, tone: 'good' });
  }
  if (o.removeWeakest) {
    lines.push({
      icon: 'minus',
      label: 'Kadro',
      value: o.sellPlayerName
        ? `${o.sellPlayerName} ayrılır`
        : eventId === 'evt_transfer_teklif'
          ? 'En yüksek ratingli saha oyuncusu satılır'
          : 'Bir oyuncu ayrılır',
      tone: 'bad',
    });
  }
  if (o.tempRatingDelta) {
    lines.push({
      icon: 'trending-down',
      label: '1 maç rating',
      value: `${o.tempRatingDelta > 0 ? '+' : ''}${o.tempRatingDelta}`,
      tone: o.tempRatingDelta > 0 ? 'good' : 'bad',
    });
  }
  return lines;
}

export function CardSelectScreen() {
  const [lineupOpen, setLineupOpen] = useState(false);
  const [detailDrawer, setDetailDrawer] = useState<'synergy' | 'plan' | null>(null);
  const [pickMode, setPickMode] = useState<CardPickMode>('cards');
  const state = useGameStore();
  const {
    round, maxRounds, squad, maxSquadSize, morale, score, streak, roundHistory,
    currentOffers, selectOffer,
    dangerMode, discoveredSynergies, activeTactics, usedEventIds,
    manualLineup,
    rerollsRemaining, rerollSingleOffer, offersRerollIndex,
    trainingFlow, beginTraining, pickTrainingPlayer, completeTraining, cancelTraining, backTrainingPlayer,
    tacticDraft, confirmTacticRound, rerollFormationOffers, rerollSystemOffers,
    formationRerollUsed, systemRerollUsed,
  } = state;
  const sound = getPersistedStats().soundEnabled;

  const lineupSummary = getSquadLineupSummary(squad, activeTactics, manualLineup);
  const activeSynergies = getActiveSynergies(squad, morale, { activeTactics, manualLineup });
  // Kompakt rayda sadece birkaç satır gösterilir (CardSelectLeftRail kendi içinde
  // ayrıca kısıtlar) ama sayaç ve detay popup'ı TÜM yakın sinerjileri görmeli —
  // limiti düşük tutmak, gerçekten yakın olan ama sırada geride kalan bir sinerjinin
  // (ör. ORTA DUVAR) popup'ta hiç görünmemesine yol açıyordu.
  const nearSynergies = getSidePanelNearSynergies(squad, morale, discoveredSynergies, currentOffers, {
    limit: 8,
    maxSquadSize,
    activeTactics,
    manualLineup,
  });
  const tacticBonus = isTacticBonusRound(round, maxRounds);
  const finaleMatch = isFinaleRound(round, maxRounds);
  const pickTitle = tacticBonus
      ? 'Taktik Bonusu'
      : pickMode === 'training' || trainingFlow
        ? 'Bir Oyuncuyu Geliştir'
        : 'Üç Adayı Kıyasla';

  const cardsLocked = pickMode === 'training' || Boolean(trainingFlow);

  const handlePickModeChange = (mode: CardPickMode) => {
    setPickMode(mode);
    if (mode === 'training' && !trainingFlow) {
      playSound('tick', sound);
      beginTraining();
    } else if (mode === 'cards' && trainingFlow) {
      cancelTraining();
    }
  };

  return (
    <div className={`game-shell pitch-bg card-select-screen ${tacticBonus ? 'card-select-screen--tactic' : ''} ${dangerMode ? 'danger-pulse' : ''}`}>
      <div className="card-select-inner w-full px-3 py-2 md:px-4 md:py-3">
        <GameHeader round={round} maxRounds={maxRounds} score={score} streak={streak} trackRecord={roundHistory} />

        {tacticBonus && <MatchMoraleBanner morale={morale} />}

        {!tacticBonus && (
          <CardSelectSubHeader
            morale={morale}
            title={pickTitle}
            pickMode={pickMode}
            onPickModeChange={handlePickModeChange}
            trainingAvailable={!finaleMatch}
            rerollsRemaining={rerollsRemaining}
          />
        )}

        {dangerMode && (
          <p className="card-select-danger-banner">
            TEHLİKE MODU — {squad.length} oyuncu · Moral {DANGER_MORALE_FLOOR}&apos;nin altına düşmez
          </p>
        )}

        <div className={`game-layout card-select-layout card-select-layout--focused ${tacticBonus ? 'card-select-layout--tactic' : 'card-select-layout--pick'}`}>
          {!tacticBonus && (
            <CardSelectLeftRail
              morale={morale}
              lineupSummary={lineupSummary}
              activeSynergies={activeSynergies}
              nearSynergies={nearSynergies}
              activeTactics={activeTactics}
              squad={squad}
              onOpenLineup={() => setLineupOpen(true)}
              onOpenSynergy={() => setDetailDrawer('synergy')}
            />
          )}
          <div
            className={`card-pick-center min-w-0 ${cardsLocked ? 'card-pick-center--training' : ''} ${tacticBonus ? 'card-pick-center--tactic' : ''}`}
            data-tutorial-target={!tacticBonus ? 'cards' : undefined}
          >
            <LineupPreviewModal
              open={lineupOpen}
              onClose={() => setLineupOpen(false)}
              squad={squad}
              activeTactics={activeTactics}
              manualLineup={manualLineup}
            />

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
                {trainingFlow ? (
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
                ) : currentOffers.every(isPlayerCard) ? (
                  <PlayerCardCompareGrid
                    offers={currentOffers}
                    squad={squad}
                    discovered={discoveredSynergies}
                    maxSquadSize={maxSquadSize}
                    activeTactics={activeTactics}
                    morale={morale}
                    rerollsRemaining={rerollsRemaining}
                    locked={cardsLocked}
                    rerollKey={offersRerollIndex}
                    onSelect={(offer) => {
                      if (cardsLocked) return;
                      playSound('tick', sound);
                      selectOffer(offer);
                    }}
                    onReroll={(slotIndex) => {
                      if (rerollsRemaining <= 0 || cardsLocked) return;
                      playSound('tick', sound);
                      rerollSingleOffer(slotIndex);
                    }}
                  />
                ) : (
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
                          showTagHint={false}
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
                )}
              </>
            )}
          </div>

          <div className="card-select-mobile-dock" aria-label="Oyun bilgileri">
            {!tacticBonus && (
              <details className="card-select-mobile-drawer">
                <summary>
                  <span>Sinerjiler</span>
                  <small>{activeSynergies.length} aktif · {nearSynergies.length} yakın</small>
                </summary>
                <CardSelectInsightRail
                  squad={squad}
                  activeSynergies={activeSynergies}
                  nearSynergies={nearSynergies}
                />
              </details>
            )}
            <details className="card-select-mobile-drawer">
              <summary>
                <span>Maç Planı</span>
                <small>Taktik slotları · olay takvimi</small>
              </summary>
              <SidePanel
                squad={squad}
                activeTactics={activeTactics}
                usedEventIds={usedEventIds}
                round={round}
                currentOffers={currentOffers}
                tacticDraft={tacticBonus ? tacticDraft : undefined}
              />
            </details>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {detailDrawer && (
          <motion.div
            className="game-detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetailDrawer(null)}
          >
            <motion.aside
              className="game-detail-dialog"
              role="dialog"
              aria-modal="true"
              aria-label={detailDrawer === 'synergy' ? 'Sinerji bilgileri' : 'Maç planı'}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="game-detail-head">
                <div>
                  <span>{detailDrawer === 'synergy' ? 'Sinerji ve tag özeti' : 'Maç planı'}</span>
                  <strong>{detailDrawer === 'synergy' ? `${activeSynergies.length} aktif · ${nearSynergies.length} yakın` : 'Taktik slotları ve olay takvimi'}</strong>
                </div>
                <button type="button" className="game-detail-close" onClick={() => setDetailDrawer(null)} aria-label="Kapat">
                  <UiIcon name="x" />
                </button>
              </div>
              {detailDrawer === 'synergy' ? (
                <SynergyFullPanel
                  squad={squad}
                  activeSynergies={activeSynergies}
                  near={nearSynergies}
                />
              ) : (
                <SidePanel
                  squad={squad}
                  activeTactics={activeTactics}
                  usedEventIds={usedEventIds}
                  round={round}
                  currentOffers={currentOffers}
                  tacticDraft={tacticBonus ? tacticDraft : undefined}
                />
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      {state.lineupEditorOpen && (
        <LineupEditorModal
          open
          seed={state.seed}
          round={state.round}
          squad={squad}
          activeTactics={activeTactics}
          morale={morale}
          discoveredSynergies={discoveredSynergies}
          manualLineup={state.manualLineup}
          highlightId={state.lineupEditorHighlightId}
          outgoingId={state.lineupEditorOutgoingId}
          maxSquadSize={maxSquadSize}
          onChange={state.setManualLineup}
          onOutgoingChange={state.setLineupEditorOutgoing}
          onReset={state.resetManualLineup}
          onConfirm={state.confirmLineupAndPlay}
          onCancel={state.cancelLineupEditor}
        />
      )}
    </div>
  );
}

function EventSubjectCard({ subject }: { subject: EventSubject }) {
  const p = subject.player;
  return (
    <div className="event-subject-card">
      <span className="event-subject-avatar">
        <UiIcon name="shirt" />
      </span>
      <div className="event-subject-body">
        <strong className="event-subject-name" title={p.name}>{p.name}</strong>
        <div className="event-subject-pills">
          <span className="event-subject-rating">{p.currentRating}</span>
          <span className="event-subject-pos-pill" style={pillStyle(getPositionRoleColor(p.position))}>
            {POSITION_BADGE[p.position]}
          </span>
          {p.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="event-subject-tag-pill" style={pillStyle(tagPillColor(tag))}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EventScreen() {
  const { currentEvent, resolveEventChoice, round, maxRounds, score, streak, squad, morale, isFirstRun, seed, activeTactics, manualLineup, maxSquadSize, roundHistory } = useGameStore();
  const [picked, setPicked] = useState<'A' | 'B' | null>(null);
  const [lineupOpen, setLineupOpen] = useState(false);

  if (!currentEvent) return null;

  const previews = getEventPreviews(currentEvent, squad, morale, score, activeTactics);
  const eventSubjects = getEventSubjects(currentEvent.id, squad, activeTactics, {
    seed,
    round,
    sellPlayerId: previews.a.sellPlayerId,
  });
  const tones = getEventChoiceTones(previews);
  const presentation = getEventPresentation(currentEvent.id);
  const avg = squad.length ? Math.round(squad.reduce((s, p) => s + p.currentRating, 0) / squad.length) : 0;
  const lineupSummary = getSquadLineupSummary(squad, activeTactics, manualLineup);
  const hasRiskChoice = Boolean(previews.a.nextMatchRisk || previews.b.nextMatchRisk);
  const eventActionHint = hasRiskChoice
    ? 'Risk varsa seçim kartında görünür. Karar sonrası etki rozetleri çıkar.'
    : 'Bir karar seç. Etki hemen uygulanır, sonra run devam eder.';

  const handlePick = (choice: 'A' | 'B') => {
    setPicked(choice);
    playSound('tick', getPersistedStats().soundEnabled);
  };

  const confirmPick = () => {
    if (!picked) return;
    playSound('tick', getPersistedStats().soundEnabled);
    resolveEventChoice(picked);
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
    const outcomeLines = getEventOutcomeLines(preview, currentEvent.id);
    return (
      <button
        type="button"
        aria-pressed={selected}
        className={`${eventChoiceClass(tone, selected, dimmed)} event-choice-card`}
        onClick={() => handlePick(choice)}
      >
        {selected && (
          <span className="event-choice-check" aria-hidden>
            <UiIcon name="check" />
          </span>
        )}
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
          {outcomeLines.length > 0 && (
            <div className={`event-choice-effects ${dimmed ? 'opacity-40' : ''}`}>
              {outcomeLines.map((line) => (
                <span key={`${line.label}-${line.value}`} className={`event-choice-effect event-choice-effect--${line.tone}`}>
                  <UiIcon name={line.icon} />
                  <span>{line.label}</span>
                  <strong>{line.value}</strong>
                </span>
              ))}
            </div>
          )}
          {selected && outcomeLines.length === 0 && (
            <p className="event-choice-outcome">Seçildi</p>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="game-shell event-v2 min-h-screen p-4">
      <div className="mx-auto max-w-6xl">
        <GameHeader round={round} maxRounds={maxRounds} score={score} streak={streak} trackRecord={roundHistory} />

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
            <div className="event-squad-card event-squad-card--note">
              <UiIcon name="circle-dot" className="event-squad-card-dot" />
              <div>
                <p className="event-squad-card-title">Olay turu</p>
                <p>Bu roundda maç yok — seçimin sonraki maçı etkileyecek.</p>
              </div>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="panel event-main-panel">
            <div className="event-brief-head">
              <p>Olay Kartı · Round {round}</p>
              <span>{eventActionHint}</span>
            </div>

            <EventSceneVisual event={currentEvent} />

            <h2 className="event-title">{currentEvent.title}</h2>
            <p className="event-atmosphere-line">{presentation.atmosphere}</p>
            <p className="event-description">{presentation.narrative}</p>

            {eventSubjects.length > 0 && (
              <div className={`event-subjects ${eventSubjects.length > 1 ? 'event-subjects--multi' : ''}`}>
                {eventSubjects.map((subject) => (
                  <div
                    key={`${subject.player.id}-${subject.label}`}
                    className={`event-player-offer event-player-offer--${subject.variant ?? 'focus'}`}
                  >
                    <p className="event-player-offer-label">{subject.label}</p>
                    <EventSubjectCard subject={subject} />
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
            <button
              type="button"
              className="btn-primary event-confirm-choice"
              disabled={!picked}
              onClick={confirmPick}
            >
              {picked ? `${(picked === 'A' ? currentEvent.optionA : currentEvent.optionB).label} kararını onayla` : 'Kararı onayla'}
              <UiIcon name="arrow-right" />
            </button>

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
                      <UiIcon name={b.icon} className="event-result-badge-icon" />
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
    activeTactics, lossesCount, timerSeconds, flawless, manualLineup,
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
      setMicroToasts((prev) => [...prev, { id, text: `${syn.name} ${amount}!`, kind: 'synergy' }]);
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
  const moraleOutcomeDelta = currentMatch.outcome === 'win' ? 10 : currentMatch.outcome === 'draw' ? -5 : -16;
  const lineupSummary = getSquadLineupSummary(squad, activeTactics, manualLineup);
  const pitchDots = lineupSummary.lineup
    .filter((slot) => slot.player)
    .map((slot) => lineupSlotToMatchPitch(slot));
  const squadAvg = Math.round(
    lineupSummary.lineup
      .filter((s) => s.player)
      .reduce((sum, s) => sum + s.player!.currentRating, 0) / Math.max(lineupSummary.filled, 1),
  );
  const matchEdge = squadAvg - currentMatch.opponent.rating;
  const drawPct = Math.max(8, Math.min(22, Math.round(18 - Math.abs(matchEdge) * 0.35)));
  const homeNoDrawPct = Math.max(10, Math.min(90, Math.round(50 + matchEdge * 2)));
  const homeWinPct = Math.round(((100 - drawPct) * homeNoDrawPct) / 100);
  const awayWinPct = 100 - drawPct - homeWinPct;
  const moraleFx = getMoraleEffect(morale);
  const streakMult = streakMultiplier(streak);

  const selectionSubtitle = isPlayerCard(pendingSelected)
    ? `${formatPosition(pendingSelected.position)} · Kadroya eklendi · ${pendingSelected.currentRating} rating`
    : isSkipCard(pendingSelected)
      ? 'Kadro değişmedi · mevcut 11 ile maça çıkıyorsun'
      : isTacticCard(pendingSelected)
        ? `${getTacticPreview(pendingSelected, squad, activeTactics).headline} — sonraki maçlarda bonus`
        : 'Antrenman uygulandı';

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
        manualLineup,
        getWeeklyModifier(),
      )
    : 0;
  const nextStepText = currentMatch.outcome === 'loss'
    ? 'Devam edince kadrodan ayrılan oyuncuyu göreceksin.'
    : round >= maxRounds
      ? 'Devam edince run özeti ve final skor açılacak.'
      : `Devam edince Round ${round + 1} için yeni seçim yapacaksın.`;

  return (
    <div className="game-shell pitch-bg match-screen">
      <SynergyRevealOverlay />
      <div className="match-screen-inner">
        <GameHeader round={round} maxRounds={maxRounds} score={score} streak={streak} />

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
              const cls = homeWinPct >= awayWinPct + 10 ? 'favorite' : awayWinPct >= homeWinPct + 10 ? 'underdog' : 'even';
              return (
                <div className="match-odds-row">
                  <span className="match-morale-chip" title={moraleFx.detail}>
                    <UiIcon name="heart" />
                    <span>Moral</span>
                    <strong>{morale}</strong>
                    <small>{moraleFx.label} · {moraleFx.multiplier}</small>
                  </span>
                  <span className={`match-odds-badge match-odds-badge--${cls}`} title="Kadrona açılan oran">
                    <span>Kadrona açılan oran</span>
                    <strong>{decimalOdds(homeWinPct)}</strong>
                  </span>
                  <span className={`match-odds-badge match-odds-badge--${cls === 'favorite' ? 'underdog' : cls === 'underdog' ? 'favorite' : 'even'}`} title="Rakibe açılan oran">
                    <span>Rakibe açılan oran</span>
                    <strong>{decimalOdds(awayWinPct)}</strong>
                  </span>
                </div>
              );
            })()}

            <div className="relative">
              {anim.playing && !anim.showResult && (
                <span className="match-speed-control match-speed-control--floating">
                  <button type="button" className={`match-speed-btn ${speed === 1 ? 'match-speed-btn--active' : ''}`} onClick={() => setSpeed(1)}>1x</button>
                  <button type="button" className={`match-speed-btn ${speed === 2 ? 'match-speed-btn--active' : ''}`} onClick={() => setSpeed(2)}>2x</button>
                  <button type="button" className="match-speed-btn" onClick={skipMatch}>Atla</button>
                </span>
              )}
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

          <div className="match-mobile-dock" aria-label="Maç detayları">
            {anim.showHighlights && (
              <div className={`match-mobile-result-bar match-mobile-result-bar--${currentMatch.outcome}`}>
                <div>
                  <span>{outcome}</span>
                  <strong>{anim.goalsFor} - {anim.goalsAgainst}</strong>
                  <small>Round puanı {previewRoundPoints > 0 ? `+${previewRoundPoints}` : '0'}</small>
                </div>
                <button type="button" className="btn-primary match-mobile-continue" onClick={finishMatch}>
                  Devam
                </button>
              </div>
            )}

            <details className="match-mobile-drawer" open={!anim.showHighlights}>
              <summary>
                <span>{anim.showHighlights ? 'Maç özeti' : 'Canlı anlatım'}</span>
                <small>{anim.minute}&apos; · {anim.goalsFor}-{anim.goalsAgainst}</small>
              </summary>
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
                resultExplain={undefined}
              />

              {anim.showResult && (
                <div className="match-result-extras">
                  <div className={`match-morale-delta match-morale-delta--${moraleOutcomeDelta >= 0 ? 'up' : 'down'}`}>
                    <UiIcon name={moraleOutcomeDelta >= 0 ? 'heart' : 'heart-crack'} className="match-morale-delta-icon" />
                    <span className="match-morale-delta-label">Moral</span>
                    <span className="match-morale-delta-value">{moraleOutcomeDelta > 0 ? `+${moraleOutcomeDelta}` : moraleOutcomeDelta}</span>
                    <span className="match-morale-delta-after">{currentMatch.outcome === 'win' ? 'galibiyet' : currentMatch.outcome === 'draw' ? 'beraberlik' : 'mağlubiyet'}</span>
                  </div>
                  <div className="match-bonus-row">
                  {currentMatch.outcome === 'win' && currentMatch.cleanSheet && (
                      <span className="match-bonus-chip"><UiIcon name="shield" /> Clean sheet +100</span>
                    )}
                    {currentMatch.outcome === 'win' && streakMult > 1 && (
                      <span className="match-bonus-chip match-bonus-chip--fire"><UiIcon name="flame" /> Seri ×{streakMult}</span>
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
            </details>

            <details className="match-mobile-drawer">
              <summary>
                <span>Maç planı</span>
                <small>Kadro · moral · sinerji</small>
              </summary>
              <MatchLeftPanel
                selection={pendingSelected}
                subtitle={selectionSubtitle}
                squad={squad}
                morale={morale}
                activeTactics={activeTactics}
                squadAvg={squadAvg}
                opponentRating={currentMatch.opponent.rating}
              />
            </details>
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
              resultExplain={undefined}
            />

            {anim.showResult && (
              <div className="match-result-extras">
                <div className={`match-morale-delta match-morale-delta--${moraleOutcomeDelta >= 0 ? 'up' : 'down'}`}>
                  <UiIcon name={moraleOutcomeDelta >= 0 ? 'heart' : 'heart-crack'} className="match-morale-delta-icon" />
                  <span className="match-morale-delta-label">Moral</span>
                  <span className="match-morale-delta-value">{moraleOutcomeDelta > 0 ? `+${moraleOutcomeDelta}` : moraleOutcomeDelta}</span>
                  <span className="match-morale-delta-after">{currentMatch.outcome === 'win' ? 'galibiyet' : currentMatch.outcome === 'draw' ? 'beraberlik' : 'mağlubiyet'}</span>
                </div>
                <div className="match-bonus-row">
                  {currentMatch.outcome === 'win' && currentMatch.cleanSheet && (
                    <span className="match-bonus-chip"><UiIcon name="shield" /> Clean sheet +100</span>
                  )}
                  {currentMatch.outcome === 'win' && streakMult > 1 && (
                    <span className="match-bonus-chip match-bonus-chip--fire"><UiIcon name="flame" /> Seri ×{streakMult}</span>
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
                <div className="match-next-step">
                  <span>Sonuç netleşti</span>
                  <strong>{outcome} · {anim.goalsFor} - {anim.goalsAgainst}</strong>
                  <p>
                    {previewRoundPoints > 0 ? `+${formatScore(previewRoundPoints)} puan kazandın. ` : 'Bu maçtan puan gelmedi. '}
                    {nextStepText}
                  </p>
                </div>
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

function tagPillColor(tag: string): string {
  const css = TAG_AVATAR_BG[tag as keyof typeof TAG_AVATAR_BG] ?? '';
  const colors = [...css.matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => m[0]);
  return colors[1] ?? colors[0] ?? '#8a948f';
}

function pillStyle(color: string) {
  return { color, background: `${color}1a`, borderColor: `${color}66` };
}

export function LossScreen() {
  const { lastLossPlayer, lastLossBrokenSynergies, finishLoss, dangerMode, squad, round, maxRounds, score, streak, morale, activeTactics, manualLineup } = useGameStore();

  const departedScore = lastLossPlayer ? getDepartureScore(lastLossPlayer, morale) : 0;
  const remainingScores = squad
    .map((p) => ({ player: p, score: getDepartureScore(p, morale) }))
    .sort((a, b) => a.score - b.score);
  const lineupSummary = getSquadLineupSummary(squad, activeTactics, manualLineup);

  const MORALE_LOSS_PENALTY = 16;
  const prevMorale = Math.min(100, morale + MORALE_LOSS_PENALTY);
  const nextCta = squad.length <= 4 ? 'Run Özeti' : 'Sonraki Round';

  return (
    <div className="game-shell loss-game-shell min-h-screen p-4">
      <SynergyRevealOverlay />
      <div className="mx-auto max-w-5xl">
        <GameHeader round={round} maxRounds={maxRounds} score={score} streak={streak} />

        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="loss-v2-hero">
          <p className="loss-v2-kicker">Round {round} sonucu</p>
          <h2 className="loss-v2-title">Mağlubiyet</h2>
          <p className="loss-v2-desc">
            Run bitmedi. {lastLossPlayer ? `${lastLossPlayer.name} takımdan ayrıldı` : 'Bir oyuncu takımdan ayrıldı'}, moral ve sinerjiler darbe aldı.
          </p>
        </motion.div>

        <div className="loss-v2-grid">
          <div className="loss-v2-col-left">
            {lastLossPlayer && (
              <div className="panel loss-v2-card loss-v2-departed">
                <p className="loss-v2-card-title loss-v2-card-title--bad">Kadrodan Ayrıldı</p>
                <div className="loss-v2-departed-row">
                  <span className="loss-v2-departed-avatar">
                    <UiIcon name="shirt" />
                  </span>
                  <div className="loss-v2-departed-body">
                    <strong>{lastLossPlayer.name}</strong>
                    <div className="loss-v2-departed-pills">
                      <span className="loss-v2-pos-pill" style={pillStyle(getPositionRoleColor(lastLossPlayer.position))}>
                        {POSITION_BADGE[lastLossPlayer.position]}
                      </span>
                      {lastLossPlayer.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="loss-v2-tag-pill" style={pillStyle(tagPillColor(tag))}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <small>kadronun en zayıf halkası · ayrılma skoru {formatStatDisplay(departedScore)}</small>
                  </div>
                </div>
              </div>
            )}

            <div className="panel loss-v2-card loss-v2-morale">
              <div className="loss-v2-card-head">
                <span className="loss-v2-card-title">Takım Morali</span>
                <span className="loss-v2-morale-delta">↓{MORALE_LOSS_PENALTY}</span>
              </div>
              <div className="loss-v2-morale-values">
                <strong>{morale}<small>/100</small></strong>
                <span className="loss-v2-morale-prev">{prevMorale}</span>
              </div>
              <div className="loss-v2-morale-bar">
                <div className="loss-v2-morale-bar-fill" style={{ width: `${morale}%` }} />
              </div>
              <p className="loss-v2-morale-caption">Düşük moral maç gücü çarpanını kırar.</p>
            </div>

            <div className="panel loss-v2-card loss-v2-synergies">
              <p className="loss-v2-card-title loss-v2-card-title--bad">Kırılan Sinerjiler</p>
              {lastLossBrokenSynergies.length > 0 ? (
                <div className="loss-v2-synergy-list">
                  {lastLossBrokenSynergies.map((id) => {
                    const syn = getSynergyById(id);
                    if (!syn) return null;
                    return (
                      <div key={id} className="loss-v2-synergy-row">
                        <span className="loss-v2-synergy-icon">
                          <UiIcon name={iconForSynergy(syn.icon)} />
                        </span>
                        <div className="loss-v2-synergy-body">
                          <strong>{syn.name}</strong>
                          <span>{syn.description}</span>
                        </div>
                        <span className="loss-v2-synergy-state">Pasif</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="loss-v2-synergy-empty">Bu kayıpta kırılan sinerji olmadı.</p>
              )}
            </div>
          </div>

          <div className="panel loss-v2-card loss-v2-lineup-panel">
            <div className="loss-v2-lineup-head">
              <div className="loss-v2-lineup-title-group">
                <UiIcon name="circle-dot" className="loss-v2-lineup-icon" />
                <p className="loss-v2-lineup-title">Kalan Diziliş</p>
              </div>
              <span className="loss-v2-lineup-badge">{lineupSummary.squadSize}/11 kadro</span>
            </div>
            <LineupPitchOnly squad={squad} activeTactics={activeTactics} manualLineup={manualLineup} />
          </div>
        </div>

        {remainingScores.length > 0 && (
          <div className="panel loss-v2-card loss-v2-next">
            <div className="loss-v2-next-head">
              <span className="loss-v2-card-title">Sonraki Ayrılma Sırası</span>
              <small>Yine kaybedersen en zayıf halka gider</small>
            </div>
            <div className="loss-v2-next-row">
              {remainingScores.slice(0, 3).map(({ player }, i) => (
                <div key={player.id} className={`loss-v2-next-card ${i === 0 ? 'loss-v2-next-card--top' : ''}`}>
                  <span className="loss-v2-next-rank">{i + 1}</span>
                  <div className="loss-v2-next-body">
                    <strong>{player.name}</strong>
                    <span>{formatPosition(player.position)}</span>
                  </div>
                  <span className="loss-v2-next-tag">{i === 0 ? 'Sıradaki' : 'İzlemede'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {dangerMode && (
          <p className="loss-danger-banner">
            TEHLİKE — {squad.length} oyuncu kaldı · Bir kayıp daha = run biter
          </p>
        )}

        <button type="button" className="btn-primary loss-v2-cta" onClick={finishLoss}>
          {nextCta}
          <UiIcon name="arrow-right" />
        </button>
      </div>
    </div>
  );
}

function ShareCardPreview({ opts }: { opts: ShareCardOptions }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    // Web fontları yüklenmeden çizersek kart sistem fontuna düşer — önce bekle
    void ensureShareFonts().then(() => {
      if (cancelled || !hostRef.current) return;
      const canvas = renderShareCardToCanvas(opts);
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.display = 'block';
      canvas.style.borderRadius = '14px';
      hostRef.current.replaceChildren(canvas);
    });
    return () => { cancelled = true; };
  }, [opts]);

  return <div ref={hostRef} className="share-card-preview" />;
}

export function RunEndScreen() {
  const { score, roundHistory, squad, goToMenu, resetRun, discoveredSynergies, round, lossesCount, runEndAnalysis, runEndStep, advanceRunEnd, flawless, displayName, isDailySeed, seed, newAchievements } = useGameStore();
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
  const isFlawlessRun = flawless && lossesCount === 0;
  // Kart canlı sıralamayı göstermeli — yerel analiz tek kayıtlı liste görebilir.
  // Memo'lanmazsa her render'da yeni nesne çıkar ve kart boşuna yeniden çizilir.
  const analysisForShare = useMemo(
    () => (analysis && liveRank
      ? { ...analysis, rank: liveRank.rank, totalPlayers: liveRank.total, rankPercent: liveRank.percent }
      : analysis),
    [analysis, liveRank],
  );
  const shareOpts: ShareCardOptions = useMemo(() => ({
    score,
    analysis: analysisForShare,
    displayName: playerName,
    flawless: isFlawlessRun,
    roundsCompleted: round,
    squad,
    seed,
    isDailySeed,
    stats: {
      wins,
      losses: lossesCount,
      synergiesFound: activeSynergyStats.length,
      squadAvg,
    },
  }), [score, analysisForShare, playerName, isFlawlessRun, round, squad, seed, isDailySeed, wins, lossesCount, activeSynergyStats.length, squadAvg]);

  const challengeUrl = buildChallengeLink(shareOpts);
  const runBadges = analysis?.badges ?? [];

  const flash = (msg: string) => {
    setShareMsg(msg);
    window.setTimeout(() => setShareMsg(''), 2600);
  };

  const handleNativeShare = async () => {
    const result = await shareShareCard(shareOpts);
    if (result === 'shared') flash('Paylaşıldı!');
    else if (result === 'failed') flash('Paylaşılamadı — PNG indirmeyi dene.');
    // 'cancelled' ve 'unsupported' sessiz
  };

  const handleCopyLink = async () => {
    if (!challengeUrl) return;
    try {
      await navigator.clipboard.writeText(challengeUrl);
      flash('Meydan okuma linki kopyalandı!');
    } catch {
      flash('Kopyalanamadı.');
    }
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

  const viralHook = score > 0
    ? `${formatScore(score)} puan yaptım. Aynı seed'de geçebilir misin?`
    : `${round} round hayatta kaldım. Aynı seed'de daha iyisini yapabilir misin?`;
  const shareText = buildShareText(shareOpts, challengeUrl ?? undefined);
  const scoreRecord = analysis?.scoreRecord;
  const leaderboardRecordText = scoreRecord?.isLeaderboardBest
    ? scoreRecord.previousLeaderboardBest
      ? `Yeni ${isDailySeed ? 'günlük' : 'tüm zamanlar'} rekorun: eski ${formatScore(scoreRecord.previousLeaderboardBest)} geçildi.`
      : `${isDailySeed ? 'Günlük' : 'Tüm zamanlar'} skor kaydın açıldı.`
    : `Bu deneme kişisel en iyini geçmedi; listede ${formatScore(scoreRecord?.previousLeaderboardBest ?? 0)} korunuyor.`;
  const hallOfFameRecordText = scoreRecord?.isHallOfFameBest
    ? scoreRecord.previousHallOfFameBest
      ? `Hall of Fame aylık rekorun yenilendi; eski skor ${formatScore(scoreRecord.previousHallOfFameBest)}.`
      : 'Hall of Fame için bu ayki ilk kaydın açıldı.'
    : `Hall of Fame'de aylık en iyi skorun ${formatScore(scoreRecord?.previousHallOfFameBest ?? 0)} korunuyor.`;

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
                <div className={`run-end-score-lockup run-end-score-lockup--${getShareTier(finalPercent ?? 50)}`}>
                  <span>Final skor</span>
                  <strong>{formatScore(score)}</strong>
                </div>
              </div>

              {runBadges.length > 0 && (
                <div className="run-end-badge-row" aria-label="Run rozetleri">
                  {runBadges.map((badge) => (
                    <span key={badge} className="run-end-badge">
                      <UiIcon name="medal" />
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              {newAchievements.length > 0 && (
                <div className="run-end-achievements" aria-label="Yeni açılan başarımlar">
                  <p className="run-end-achievements-kicker">
                    <UiIcon name="sparkles" />
                    Yeni başarım{newAchievements.length > 1 ? 'lar' : ''}
                  </p>
                  <div className="run-end-achievement-list">
                    {newAchievements.map((a) => (
                      <div key={a.id} className={`run-end-achievement run-end-achievement--${a.tier}`}>
                        <span className="run-end-achievement-icon" aria-hidden>
                          <UiIcon name={a.icon} />
                        </span>
                        <div>
                          <strong>{a.name}</strong>
                          <small>{a.description}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

              {scoreRecord && (
                <div className={`run-end-record-note ${scoreRecord.isLeaderboardBest || scoreRecord.isHallOfFameBest ? 'run-end-record-note--best' : 'run-end-record-note--kept'}`}>
                  <span>Kayıt durumu</span>
                  <strong>{leaderboardRecordText}</strong>
                  <small>{hallOfFameRecordText}</small>
                </div>
              )}

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
              <div className="run-end-viral-strip">
                <span>Paylaşılabilir meydan okuma</span>
                <strong>{viralHook}</strong>
                <small>Detaylarda PNG skor kartı ve kopyalanabilir paylaşım metni hazır.</small>
              </div>
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
                    return (
                      <p className="mt-2 text-xl">
                        {score <= 0
                          ? `${round} round hayatta kaldın — bir dahaki sefer farklı olabilir`
                          : percent >= 50
                            ? `En iyi %${Math.max(1, 100 - percent)} içindesin`
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

              <div className="run-end-summary-mobile-actions">
                <button type="button" className="btn-primary" onClick={() => resetRun()}>Bir Daha</button>
                <button type="button" className="btn-secondary" onClick={goToMenu}>Ana Menü</button>
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
                        <span className="run-end-synergy-icon"><UiIcon name={iconForSynergy(s.icon)} /></span>
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
                {/* Olay roundlarında (4/8/11/14) aynı round hem olay hem maç kaydı üretir —
                    key yalnızca r.round olursa çakışır ve satırlar atlanır. */}
                {roundHistory.map((r, historyIndex) => {
                  const icon = r.isTacticBonus
                    ? 'T'
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
                    <div key={`${r.round}-${historyIndex}`} className="flex justify-between border-b border-neutral-800 py-2 text-sm">
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
                                ? `Antrenman · ${r.cardSelected.description}`
                                : `Taktik · ${r.cardSelected.name}`}
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

              <section className="run-end-share" aria-label="Paylaşım">
                <div className="run-end-share-head">
                  <div>
                    <p className="run-end-share-kicker">Meydan okuma kartı</p>
                    <strong className="run-end-share-title">Arkadaşına bu seed’i gönder</strong>
                  </div>
                  <span className={`run-end-share-tier run-end-share-tier--${getShareTier(finalPercent ?? 50)}`}>
                    {getShareTierLabel(getShareTier(finalPercent ?? 50))}
                  </span>
                </div>

                <ShareCardPreview opts={shareOpts} />

                <div className="run-end-share-actions">
                  {canNativeShare() && (
                    <button type="button" className="btn-primary run-end-share-btn" onClick={handleNativeShare}>
                      <UiIcon name="arrow-right" />
                      Paylaş
                    </button>
                  )}
                  {challengeUrl && (
                    <button type="button" className="btn-secondary run-end-share-btn" onClick={handleCopyLink}>
                      <UiIcon name="globe" />
                      Meydan okuma linki
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-secondary run-end-share-btn"
                    onClick={async () => {
                      const ok = await copyShareCardImage(shareOpts);
                      flash(ok ? 'Görsel panoya kopyalandı!' : 'Kopyalama desteklenmiyor — PNG indir.');
                    }}
                  >
                    <UiIcon name="archive" />
                    Görseli kopyala
                  </button>
                  <button
                    type="button"
                    className="btn-secondary run-end-share-btn"
                    onClick={async () => {
                      await downloadShareCard(shareOpts);
                      flash('PNG indirildi!');
                    }}
                  >
                    <UiIcon name="chart" />
                    PNG indir
                  </button>
                  <button
                    type="button"
                    className="btn-secondary run-end-share-btn"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareText);
                        flash('Paylaşım metni kopyalandı!');
                      } catch {
                        flash('Kopyalanamadı.');
                      }
                    }}
                  >
                    <UiIcon name="info" />
                    Metni kopyala
                  </button>
                </div>

                {shareMsg && <p className="run-end-share-msg" role="status">{shareMsg}</p>}
              </section>

              <div className="run-end-final-actions">
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

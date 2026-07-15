import { getActiveSynergies, SYNERGIES } from '@/data/synergies';
import {
  canSelectTransferDeparture,
  createPlayerTransferDraft,
  finalizePlayerTransfer,
  getActiveFormationKey,
  getStartingEleven,
  reconcileManualLineup,
  type ManualLineup,
} from '@/engine/lineupPreview';
import type {
  ActiveTactic,
  PlayerCard,
  SynergyDefinition,
  SynergyProgress,
  Tag,
} from '@/types';

export type SynergyDecisionImpact = {
  synergy: SynergyDefinition;
  beforeActive: boolean;
  afterActive: boolean;
  beforeProgress: SynergyProgress | null;
  afterProgress: SynergyProgress | null;
  status: 'activated' | 'deactivated' | 'progressed' | 'regressed' | 'unchanged';
};

export type RosterDecisionSimulation = {
  draftSquad: PlayerCard[];
  outgoingPlayerId: string | null;
  finalSquad: PlayerCard[];
  manualLineup: ManualLineup;
  beforeSynergySquad: PlayerCard[];
  afterSynergySquad: PlayerCard[];
  activeBefore: SynergyDefinition[];
  activeAfter: SynergyDefinition[];
  /** Yalnızca seçilen oyuncunun taslak kadrodan çıkarılmasının etkileri. */
  departureSynergyImpacts: SynergyDecisionImpact[];
  synergyImpacts: SynergyDecisionImpact[];
};

export type RosterDecisionOptions = {
  maxSquadSize: number;
  morale?: number;
  activeTactics?: ActiveTactic[];
  manualLineup?: ManualLineup;
  outgoingPlayerId?: string | null;
};

function synergySquad(
  squad: PlayerCard[],
  activeTactics: ActiveTactic[],
  manualLineup: ManualLineup,
): PlayerCard[] {
  return activeTactics.length > 0
    ? getStartingEleven(squad, activeTactics, manualLineup)
    : squad;
}

function impactStatus(
  beforeActive: boolean,
  afterActive: boolean,
  beforeProgress: SynergyProgress | null,
  afterProgress: SynergyProgress | null,
): SynergyDecisionImpact['status'] {
  if (!beforeActive && afterActive) return 'activated';
  if (beforeActive && !afterActive) return 'deactivated';
  const before = beforeProgress?.current ?? 0;
  const after = afterProgress?.current ?? (afterActive ? beforeProgress?.required ?? 0 : 0);
  if (after > before) return 'progressed';
  if (after < before) return 'regressed';
  return 'unchanged';
}

function compareSynergies(
  activeBefore: SynergyDefinition[],
  activeAfter: SynergyDefinition[],
  beforeSynergySquad: PlayerCard[],
  afterSynergySquad: PlayerCard[],
): SynergyDecisionImpact[] {
  const beforeIds = new Set(activeBefore.map((synergy) => synergy.id));
  const afterIds = new Set(activeAfter.map((synergy) => synergy.id));

  return SYNERGIES.map((synergy) => {
    const beforeActive = beforeIds.has(synergy.id);
    const afterActive = afterIds.has(synergy.id);
    const beforeProgress = synergy.getProgress?.(beforeSynergySquad) ?? null;
    const afterProgress = synergy.getProgress?.(afterSynergySquad) ?? null;
    return {
      synergy,
      beforeActive,
      afterActive,
      beforeProgress,
      afterProgress,
      status: impactStatus(beforeActive, afterActive, beforeProgress, afterProgress),
    };
  });
}

/**
 * Oyuncu seçiminin tek gerçek sonucu. Kart önizlemesi, yan panel, transfer
 * editörü ve store aynı kadro/ilk 11/sinerji kararını buradan okumalıdır.
 */
export function simulateRosterDecision(
  squad: PlayerCard[],
  incoming: PlayerCard,
  options: RosterDecisionOptions,
): RosterDecisionSimulation {
  const morale = options.morale ?? 50;
  const activeTactics = options.activeTactics ?? [];
  const manualLineup = options.manualLineup ?? {};
  const draft = createPlayerTransferDraft(
    squad,
    incoming,
    options.maxSquadSize,
    morale,
    activeTactics,
    manualLineup,
  );

  const requestedOutgoing = options.outgoingPlayerId;
  const outgoingPlayerId = requestedOutgoing && canSelectTransferDeparture(
    draft.squad,
    incoming.id,
    requestedOutgoing,
    options.maxSquadSize,
  )
    ? requestedOutgoing
    : draft.outgoingPlayerId;

  const finalSquad = finalizePlayerTransfer(draft.squad, outgoingPlayerId);
  const formationKey = getActiveFormationKey(activeTactics);
  const nextManualLineup = reconcileManualLineup(manualLineup, finalSquad, formationKey);
  const beforeSynergySquad = synergySquad(squad, activeTactics, manualLineup);
  const afterSynergySquad = synergySquad(finalSquad, activeTactics, nextManualLineup);
  const ctx = { activeTactics, manualLineup };
  const afterCtx = { activeTactics, manualLineup: nextManualLineup };
  const activeBefore = getActiveSynergies(squad, morale, ctx);
  const activeAfter = getActiveSynergies(finalSquad, morale, afterCtx);
  const synergyImpacts = compareSynergies(activeBefore, activeAfter, beforeSynergySquad, afterSynergySquad);

  // Transfer taslağı gelen oyuncuyu da içerir. Bu ikinci kıyas, gelen kartın
  // pozitif katkısını karıştırmadan yalnızca seçilen çıkışın ne götürdüğünü ölçer.
  const draftManualLineup = reconcileManualLineup(manualLineup, draft.squad, formationKey);
  const draftCtx = { activeTactics, manualLineup: draftManualLineup };
  const draftSynergySquad = synergySquad(draft.squad, activeTactics, draftManualLineup);
  const activeBeforeDeparture = getActiveSynergies(draft.squad, morale, draftCtx);
  const departureSynergyImpacts = compareSynergies(
    activeBeforeDeparture,
    activeAfter,
    draftSynergySquad,
    afterSynergySquad,
  );

  return {
    draftSquad: draft.squad,
    outgoingPlayerId,
    finalSquad,
    manualLineup: nextManualLineup,
    beforeSynergySquad,
    afterSynergySquad,
    activeBefore,
    activeAfter,
    departureSynergyImpacts,
    synergyImpacts,
  };
}

function countTag(squad: PlayerCard[], tag: Tag): number {
  return squad.reduce((total, player) => total + Number(player.tags.includes(tag)), 0);
}

export function getOfferProgressTag(
  simulation: RosterDecisionSimulation,
  offer: PlayerCard,
): Tag | null {
  for (const tag of offer.tags) {
    if (countTag(simulation.afterSynergySquad, tag) > countTag(simulation.beforeSynergySquad, tag)) {
      return tag;
    }
  }
  return null;
}

export function buildOfferSynergyHint(
  synergy: SynergyDefinition,
  squad: PlayerCard[],
  progress: SynergyProgress,
  offers: PlayerCard[],
  options: Omit<RosterDecisionOptions, 'outgoingPlayerId'>,
): string | null {
  for (const offer of offers) {
    const simulation = simulateRosterDecision(squad, offer, options);
    const impact = simulation.synergyImpacts.find((candidate) => candidate.synergy.id === synergy.id);
    if (!impact || !['activated', 'progressed'].includes(impact.status)) continue;

    const after = impact.afterActive
      ? progress.required
      : impact.afterProgress?.current ?? progress.current;
    if (after <= progress.current) continue;
    const tag = getOfferProgressTag(simulation, offer);
    const prefix = tag ? `Tekliflerde ${tag} var` : 'Tekliflerde uygun kart var';
    const condition = simulation.outgoingPlayerId ? 'önerilen kadroyla' : 'seçersen';
    return `${prefix} — ${condition} ${after}/${progress.required}`;
  }
  return null;
}

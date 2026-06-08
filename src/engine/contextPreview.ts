import { getSynergyProgressForCard, SYNERGIES } from '@/data/synergies';
import { getTacticCategory, getTacticEffect } from '@/data/tactics';
import type { ActiveTactic, EventCard, PlayerCard, TacticCard } from '@/types';
import { resolveEvent, type EventOutcome } from '@/engine/events';
import {
  assignSquadToFormation,
  canDisplaceStarter,
  getActiveFormationKey,
  getLineupPlayerIds,
  getReplacementPreview,
  getStartingEleven,
  isIllegalCentralMidWingSlot,
  isMidfieldPlayer,
  simulateSquadAfterPick,
  type LineupSlot,
} from '@/engine/lineupPreview';
import { formationSlotLabel, POSITION_BADGE } from '@/utils/positionStyle';
import { getDepartureScore } from '@/engine/squadLogic';

export function getMoraleEffect(morale: number): { label: string; detail: string; multiplier: string } {
  const mult = 0.75 + (morale / 100) * 0.4;
  let label = 'Orta';
  if (morale >= 80) label = 'Yüksek';
  else if (morale >= 50) label = 'Orta';
  else if (morale >= 30) label = 'Düşük';
  else label = 'Kritik';

  return {
    label,
    detail:
      morale >= 80
        ? 'LİDER YÜRÜYÜŞÜ sinerjisi açılabilir (LİDER + 80 moral)'
        : morale < 30
          ? 'Kadro performansı ciddi düşer — galibiyet zor'
          : 'Maç gücüne doğrudan etki eder',
    multiplier: `×${mult.toFixed(2)} maç gücü`,
  };
}

export type PlayerPickSummary = {
  text: string;
  replacedPlayer: PlayerCard | null;
};

function findDisplacedStarter(card: PlayerCard, lineup: LineupSlot[]): PlayerCard | null {
  const targets = lineup
    .filter((s) => s.player && canDisplaceStarter(card, s.player, s.slot))
    .sort((a, b) => a.player!.currentRating - b.player!.currentRating);
  return targets[0]?.player ?? null;
}

function findBenchedByIncoming(
  squad: PlayerCard[],
  after: PlayerCard[],
  card: PlayerCard,
  formationKey: string,
): PlayerCard | null {
  const beforeLineup = assignSquadToFormation(squad, formationKey);
  const afterLineup = assignSquadToFormation(after, formationKey);
  const afterPitchIds = new Set(afterLineup.filter((s) => s.player).map((s) => s.player!.id));
  const dropped = beforeLineup
    .filter((s) => s.player && s.player.id !== card.id && !afterPitchIds.has(s.player.id))
    .map((s) => s.player!);
  return dropped.sort((a, b) => a.currentRating - b.currentRating)[0] ?? null;
}

function describeEnterSlot(
  card: PlayerCard,
  targetSlot: LineupSlot,
  fitNote: string,
  squadAfterSize: number,
  maxSquad: number,
  avgPart: string,
  lineupAfter: LineupSlot[],
): string {
  if (isIllegalCentralMidWingSlot(card, targetSlot.slot.label)) {
    return describeBenchPick(card, lineupAfter, squadAfterSize, maxSquad, avgPart);
  }

  const code = targetSlot.slot.label;
  const badge = POSITION_BADGE[card.position];

  if (code === badge || (card.position === 'SÖB' && code === 'SĞB') || (card.position === 'SÖK' && code === 'SĞK')) {
    return `İlk 11'de ${code} slotuna girer${fitNote} · Kadro ${squadAfterSize}/${maxSquad} · ${avgPart}`;
  }
  if (targetSlot.slot.zone === 'orta' && isMidfieldPlayer(card)) {
    return `İlk 11'de ${code} slotuna girer (${badge} oynar)${fitNote} · Kadro ${squadAfterSize}/${maxSquad} · ${avgPart}`;
  }
  return `İlk 11'de ${code} (${badge}) slotuna girer${fitNote} · Kadro ${squadAfterSize}/${maxSquad} · ${avgPart}`;
}

function describeBenchPick(
  card: PlayerCard,
  lineup: LineupSlot[],
  squadAfterSize: number,
  maxSquad: number,
  avgPart: string,
): string {
  const displaced = findDisplacedStarter(card, lineup);
  if (displaced) {
    const slot = lineup.find((s) => s.player?.id === displaced.id);
    const slotCode = slot?.slot.label ?? POSITION_BADGE[card.position];
    if (slotCode === POSITION_BADGE[card.position]) {
      return `İlk 11'de ${slotCode} slotuna girer · ${displaced.name} (${displaced.currentRating}) yedeğe iner · Kadro ${squadAfterSize}/${maxSquad} · ${avgPart}`;
    }
    return `İlk 11'de ${slotCode} slotuna girer (${POSITION_BADGE[card.position]} oynar) · ${displaced.name} (${displaced.currentRating}) yedeğe iner · Kadro ${squadAfterSize}/${maxSquad} · ${avgPart}`;
  }

  const emptyLabels = lineup.filter((s) => !s.player).map((s) => s.slot.label);
  const emptyPart = emptyLabels.length
    ? `Boş slotlar (${emptyLabels.join(', ')}) bu mevkiyle uyuşmuyor`
    : 'Orta saha dolu veya mevki uyumu yok';
  return `Yedek olarak kalır · ${emptyPart} · Kadro ${squadAfterSize}/${maxSquad} · ${avgPart}`;
}

function formatAvgDelta(card: PlayerCard, squad: PlayerCard[]): string {
  const avg = squad.length ? squad.reduce((s, p) => s + p.currentRating, 0) / squad.length : card.currentRating;
  const delta = Math.round(card.currentRating - avg);
  return `${delta >= 0 ? `+${delta}` : delta} ortalama`;
}

function describeOutgoing(player: PlayerCard, onPitchBefore: boolean): string {
  if (player.position === 'KL' && !onPitchBefore) {
    return `Yedek kaleci ${player.name} (${player.currentRating})`;
  }
  if (!onPitchBefore) {
    return `Yedek ${player.name} (${player.currentRating})`;
  }
  return `${player.name} (${player.currentRating})`;
}

export function getPlayerPickSummary(
  card: PlayerCard,
  squad: PlayerCard[],
  maxSquad: number,
  morale = 50,
  activeTactics: ActiveTactic[] = [],
): PlayerPickSummary {
  const formationKey = getActiveFormationKey(activeTactics);
  const lineupIdsBefore = getLineupPlayerIds(squad, activeTactics);
  const after = simulateSquadAfterPick(squad, card, maxSquad, morale, activeTactics);
  const lineupAfter = assignSquadToFormation(after, formationKey);
  const rawSlot = lineupAfter.find((s) => s.player?.id === card.id);
  const targetSlot = rawSlot && !isIllegalCentralMidWingSlot(card, rawSlot.slot.label) ? rawSlot : undefined;
  const onPitch = !!targetSlot;
  const avgPart = formatAvgDelta(card, squad);
  const squadAfterSize = after.length;

  const fitNote = (_slot: NonNullable<typeof targetSlot>) => '';

  if (squad.length < maxSquad) {
    if (onPitch && targetSlot) {
      return {
        text: describeEnterSlot(card, targetSlot, fitNote(targetSlot), squadAfterSize, maxSquad, avgPart, lineupAfter),
        replacedPlayer: findBenchedByIncoming(squad, after, card, formationKey),
      };
    }
    return {
      text: describeBenchPick(card, lineupAfter, squadAfterSize, maxSquad, avgPart),
      replacedPlayer: findDisplacedStarter(card, lineupAfter),
    };
  }

  const replaced = getReplacementPreview(squad, card, maxSquad, morale, activeTactics);
  const replacedOnPitch = replaced ? lineupIdsBefore.has(replaced.id) : false;
  const outgoing = replaced ? describeOutgoing(replaced, replacedOnPitch) : '';

  if (onPitch && targetSlot && replaced) {
    const slotCode = targetSlot.slot.label;
    const displaced = !replacedOnPitch
      ? `${outgoing} yedeğe iner`
      : `${outgoing} kadrodan çıkar`;
    return {
      text: `İlk 11'de ${slotCode} slotuna girer${fitNote(targetSlot)} · ${displaced}`,
      replacedPlayer: replaced,
    };
  }

  if (!onPitch && replaced) {
    return {
      text: `Yedek olarak kalır · mevkiler dolu · ${outgoing} kadrodan çıkar`,
      replacedPlayer: replaced,
    };
  }

  return {
    text: replaced
      ? `${outgoing} kadrodan çıkar`
      : 'En zayıf oyuncunun yerine geçer',
    replacedPlayer: replaced,
  };
}

export function getTacticPreview(
  card: TacticCard,
  squad: PlayerCard[],
  activeTactics: ActiveTactic[] = [],
): { headline: string; lines: string[]; recommend: 'good' | 'ok' | 'weak' } {
  const hasFormation = activeTactics.some((t) => getTacticCategory(t.id) === 'formasyon');
  if (card.id === 'tactic_442' && !hasFormation) {
    return {
      headline: 'Zaten varsayılan 4-4-2',
      lines: [
        'Şu an zaten 4-4-2 ile oynuyorsun — bu kart oyunu değiştirmez',
        'Farklı formasyon istiyorsan 4-3-3 veya 3-5-2 seç',
      ],
      recommend: 'weak',
    };
  }
  const fx = getTacticEffect(card.id);
  const fast = squad.filter((p) => p.tags.includes('HIZLI')).length;
  const tech = squad.filter((p) => p.tags.includes('TEKNİK')).length;
  const lines: string[] = [];
  let score = 0;

  if (fx.fastBonus) {
    const bonus = fast * (fx.fastBonus ?? 0);
    lines.push(`${fast} HIZLI oyuncu → ~+${bonus} puan/maç potansiyeli`);
    score += fast >= 2 ? 2 : fast >= 1 ? 1 : -1;
  }
  if (fx.technicalBonus) {
    const bonus = tech * (fx.technicalBonus ?? 0);
    lines.push(`${tech} TEKNİK oyuncu → ~+${bonus} puan/maç potansiyeli`);
    score += tech >= 2 ? 2 : tech >= 1 ? 1 : -1;
  }
  if (fx.defenseMod && fx.defenseMod > 0) lines.push('Savunma güçlenir — zayıf kadrolarda ideal');
  if (card.id === 'tactic_tekli_forvet') {
    const sf = getStartingEleven(squad, activeTactics).filter((p) => p.position === 'SF');
    const finisher = sf.filter((p) => p.tags.includes('FİNİŞÖR'));
    if (sf.length === 1 && finisher.length === 1) {
      lines.push('Tek forvet FİNİŞÖR — hücum +30%');
      score += 2;
    } else {
      lines.push(sf.length !== 1 ? 'Birden fazla forvet — bonus devreye girmez' : 'Forvet FİNİŞÖR değil — hücum -15%');
      score -= 1;
    }
  }
  if (fx.attackMod && fx.attackMod > 0) lines.push('Hücum güçlenir — gol şansı artar');
  if (fx.attackMod && fx.attackMod < 0) lines.push('Gol ihtimali düşer — dikkatli seç');
  const isBalanced = card.id === 'tactic_442'
    || (!fx.attackMod && !fx.defenseMod && !fx.fastBonus && !fx.technicalBonus);

  if (isBalanced) {
    lines.length = 0;
    lines.push('Güvenli taban — agresif taktik savunma cezası yok');
    lines.push('Her kadroyla uyumlu — risk almadan oyna');
    lines.push('Stabil maç gücü — ileride taktik değiştirene kadar');
    return {
      headline: 'Güvenli seçim',
      lines,
      recommend: 'good',
    };
  }

  const recommend = score >= 2 ? 'good' : score >= 0 ? 'ok' : 'weak';
  return {
    headline: recommend === 'good' ? 'Kadrona uygun taktik' : recommend === 'weak' ? 'Kadrona zayıf uyum' : 'Orta uyum',
    lines,
    recommend,
  };
}

export function getEventPreviews(
  event: EventCard,
  squad: PlayerCard[],
  morale: number,
  score: number,
  activeTactics: ActiveTactic[] = [],
): { a: EventOutcome; b: EventOutcome } {
  return {
    a: resolveEvent(event, 'A', { squad, morale, score, activeTactics }),
    b: resolveEvent(event, 'B', { squad, morale, score, activeTactics }),
  };
}

export { getDepartureScore };

export function explainMatchResult(
  squadAvg: number,
  opponentRating: number,
  goalsFor: number,
  goalsAgainst: number,
  outcome: string,
  activeTactics: ActiveTactic[],
  morale: number,
): string {
  const moralePct = Math.round((1 - (0.75 + (morale / 100) * 0.4)) * 100);

  if (outcome === 'win') {
    if (morale >= 50 && squadAvg >= opponentRating) return 'Kadro avantajını kullandın.';
    if (morale < 50) return `Düşük morale rağmen kazandın — moral ${morale}.`;
    return 'Zorlu maçı çevirdin.';
  }
  if (outcome === 'draw') {
    return morale < 50
      ? `Beraberlik · moral ${morale} performansı düşürdü · az puan`
      : 'Beraberlik · az puan';
  }

  const parts: string[] = [];
  if (morale < 30) parts.push(`Moral ${morale} olduğu için performans ~%${moralePct} düştü`);
  else if (morale < 50) parts.push(`Düşük moral (${morale}) galibiyet şansını azalttı`);
  if (squadAvg < opponentRating - 5) parts.push(`Rakip (${opponentRating}) kadrodan (${squadAvg}) güçlüydü`);
  else if (squadAvg >= opponentRating) parts.push('Güç dengesine rağmen sonuç ters gitti');
  if (activeTactics.some((t) => (t.defenseMod ?? 0) < 0)) parts.push('Agresif taktik savunmayı zayıflattı');
  return parts.length ? parts.join(' · ') : `${goalsFor}-${goalsAgainst} mağlubiyet · 0 puan`;
}

export function getTopSynergyHints(
  squad: PlayerCard[],
  candidate: PlayerCard,
  discovered: string[],
  limit = 2,
) {
  return SYNERGIES.map((s) => {
    const p = getSynergyProgressForCard(s, squad, candidate);
    if (!p) return null;
    const progress = p.current / p.required;
    return { id: s.id, known: discovered.includes(s.id), name: s.name, current: p.current, required: p.required, icon: p.icon, progress };
  })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, limit);
}

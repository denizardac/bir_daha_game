import { getSynergyProgressForCard, SYNERGIES } from '@/data/synergies';
import { getTacticCategory, getTacticEffect } from '@/data/tactics';
import type { ActiveTactic, EventCard, PlayerCard, TacticCard } from '@/types';
import { resolveEvent, type EventOutcome } from '@/engine/events';
import {
  assignSquadToFormation,
  getActiveFormationKey,
  getLineupPlayerIds,
  getReplacementPreview,
  getStartingEleven,
  isIllegalCentralMidWingSlot,
  isMidfieldPlayer,
  simulateSquadAfterPick,
  slotAcceptsPlayer,
  type LineupSlot,
} from '@/engine/lineupPreview';
import { POSITION_BADGE } from '@/utils/positionStyle';
import { getDepartureScore } from '@/engine/squadLogic';
import {
  countFastWidePlayers,
  hasSingleFinisherForward,
  hasWidePlayer,
  isGegenpressReady,
  isHighPressReady,
} from '@/engine/tacticRules';

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
  /** squad = kadrodan tamamen çıkar; lineup = yalnızca ilk 11'den düşer */
  replacementKind?: 'squad' | 'lineup';
};

function describeLineupDrop(player: PlayerCard): string {
  return `${player.name} (${player.currentRating}) yedeğe iner`;
}

function describeSquadRemoval(player: PlayerCard, wasOnPitch: boolean): string {
  if (!wasOnPitch && player.position === 'KL') {
    return `Yedek kaleci ${player.name} (${player.currentRating}) kadrodan çıkar — yer açılır`;
  }
  if (!wasOnPitch) {
    return `${player.name} (${player.currentRating}) kadrodan çıkar — yer açılır`;
  }
  return `${player.name} (${player.currentRating}) kadrodan çıkar`;
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
  const emptyLabels = lineup
    .filter((s) => !s.player && !slotAcceptsPlayer(card, s.slot))
    .map((s) => s.slot.label);
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
      const benched = findBenchedByIncoming(squad, after, card, formationKey);
      let text = describeEnterSlot(card, targetSlot, fitNote(targetSlot), squadAfterSize, maxSquad, avgPart, lineupAfter);
      if (benched) {
        text += ` · ${describeLineupDrop(benched)}`;
      }
      return {
        text,
        replacedPlayer: benched,
        replacementKind: benched ? 'lineup' : undefined,
      };
    }
    return {
      text: describeBenchPick(card, lineupAfter, squadAfterSize, maxSquad, avgPart),
      replacedPlayer: null,
    };
  }

  const replaced = getReplacementPreview(squad, card, maxSquad, morale, activeTactics);
  const replacedOnPitch = replaced ? lineupIdsBefore.has(replaced.id) : false;

  if (onPitch && targetSlot && replaced) {
    const slotCode = targetSlot.slot.label;
    return {
      text: `İlk 11'de ${slotCode} slotuna girer${fitNote(targetSlot)} · ${describeSquadRemoval(replaced, replacedOnPitch)}`,
      replacedPlayer: replaced,
      replacementKind: 'squad',
    };
  }

  if (!onPitch && replaced) {
    return {
      text: `Yedek olarak kalır · mevkiler dolu · ${describeSquadRemoval(replaced, replacedOnPitch)}`,
      replacedPlayer: replaced,
      replacementKind: 'squad',
    };
  }

  return {
    text: replaced
      ? describeSquadRemoval(replaced, replacedOnPitch)
      : 'En zayıf oyuncunun yerine geçer',
    replacedPlayer: replaced,
    replacementKind: replaced ? 'squad' : undefined,
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
      lines: ['Şu an zaten 4-4-2 ile oynuyorsun — bu kart oyunu değiştirmez'],
      recommend: 'weak',
    };
  }
  const fx = getTacticEffect(card.id);
  const fast = squad.filter((p) => p.tags.includes('HIZLI')).length;
  const tech = squad.filter((p) => p.tags.includes('TEKNİK')).length;
  const lines: string[] = [];
  let score = 0;

  if (fx.fastBonus) {
    lines.push(`${fast} HIZLI oyuncu bu plana doğrudan katkı verir`);
    score += fast >= 2 ? 2 : fast >= 1 ? 1 : -1;
  }
  if (fx.technicalBonus) {
    lines.push(`${tech} TEKNİK oyuncu bu plana doğrudan katkı verir`);
    score += tech >= 2 ? 2 : tech >= 1 ? 1 : -1;
  }
  if (card.id === 'tactic_yuksek_blok') {
    if (isHighPressReady(squad)) {
      lines.push('Baskı profili hazır — galibiyet ve goller ekstra değer kazanır');
      score += 2;
    } else {
      lines.push('Baskı profili eksik — arkada boşluk verme riski var');
      score -= 1;
    }
  }
  if (fx.defenseMod && fx.defenseMod > 0) lines.push('Savunma güçlenir — zayıf kadrolarda ideal');
  if (fx.defenseMod && fx.defenseMod < 0) lines.push('Savunma riski artar — geride boşluk verebilir');
  if (card.id === 'tactic_tekli_forvet') {
    if (hasSingleFinisherForward(getStartingEleven(squad, activeTactics))) {
      lines.push('Tek forvet FİNİŞÖR — hücum onun üzerinden akar');
      score += 2;
    } else {
      lines.push('Tek FİNİŞÖR santrafor şartı yok — bu sistem verimsiz kalır');
      score -= 1;
    }
  }
  if (card.id === 'tactic_catenaccio') {
    lines.push('Gol yemeden biten maçlar ekstra değer kazanır');
    score += 1;
  }
  if (card.id === 'tactic_gegenpress') {
    if (isGegenpressReady(squad)) {
      lines.push('Pres kombosu hazır — top kazanımları gole dönebilir');
      score += 2;
    } else {
      lines.push('Pres kombosu eksik — savunma çizgisi kırılabilir');
      score -= 1;
    }
  }
  if (card.id === 'tactic_tiki_taka' && tech >= 5) {
    lines.push('Çok teknik kadro — galibiyetleri büyütür');
    score += 2;
  }
  if (card.id === 'tactic_park_bus') {
    lines.push('Gol yemeden biten maçlar yüksek ödül getirir');
    score += 1;
  }
  if (card.id === 'tactic_kanat_bindirme') {
    const wideFast = countFastWidePlayers(squad);
    if (wideFast > 0) {
      lines.push(`${wideFast} HIZLI kanat/bek bu plana doğrudan katkı verir`);
      score += wideFast >= 2 ? 2 : 1;
    } else if (!hasWidePlayer(squad)) {
      lines.push('Kanat profili yok — bindirme arkada açık verir');
      score -= 1;
    }
  }
  if (fx.attackMod && fx.attackMod > 0) lines.push('Hücum güçlenir — gol şansı artar');
  if (fx.attackMod && fx.attackMod < 0) lines.push('Gol ihtimali düşer — dikkatli seç');
  const isBalanced = card.id === 'tactic_442'
    || (!fx.attackMod && !fx.defenseMod && !fx.fastBonus && !fx.technicalBonus
      && !fx.perGoalBonus && !fx.perWinBonus && !fx.drawBonus && !fx.cleanSheetWinBonus
      && !fx.cleanSheetDrawBonus && !fx.firstGoalBonus && !fx.squadSizeBonus);

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

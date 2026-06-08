import { getSynergyProgressForCard, SYNERGIES } from '@/data/synergies';
import { getTacticEffect } from '@/data/tactics';
import type { ActiveTactic, EventCard, PlayerCard, TacticCard } from '@/types';
import { resolveEvent, type EventOutcome } from '@/engine/events';
import {
  getFilledSlotAfterPick,
  getLineupPlayerIds,
  getReplacementPreview,
} from '@/engine/lineupPreview';
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
        ? 'KAPİTAN MODU sinerjisi açılabilir (LİDER + 80 moral)'
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

export function getPlayerPickSummary(
  card: PlayerCard,
  squad: PlayerCard[],
  maxSquad: number,
  morale = 50,
  activeTactics: ActiveTactic[] = [],
): PlayerPickSummary {
  const empty = maxSquad - squad.length;
  const avg = squad.length ? squad.reduce((s, p) => s + p.currentRating, 0) / squad.length : card.currentRating;
  const delta = Math.round(card.currentRating - avg);
  if (empty > 0) {
    return {
      text: `Kadroya eklenir (${squad.length + 1}/${maxSquad}) · ${delta >= 0 ? `+${delta}` : delta} ortalamaya`,
      replacedPlayer: null,
    };
  }

  const replaced = getReplacementPreview(squad, card, maxSquad, morale, activeTactics);
  const filledSlot = getFilledSlotAfterPick(squad, card, maxSquad, activeTactics, morale);
  const lineupIds = getLineupPlayerIds(squad, activeTactics);
  const replacedIsBench = replaced ? !lineupIds.has(replaced.id) : false;

  if (filledSlot && replacedIsBench && replaced) {
    const slotName = filledSlot.slot.label;
    const benchLabel = replaced.position === 'KL' ? 'Yedek kaleci' : 'Yedek';
    return {
      text: `Boş ${slotName} slotuna yerleştirilir · ${benchLabel} ${replaced.name} (${replaced.currentRating}) çıkar`,
      replacedPlayer: replaced,
    };
  }

  if (filledSlot && replaced) {
    return {
      text: `Boş ${filledSlot.slot.label} slotuna yerleştirilir · ${replaced.name} (${replaced.currentRating}) kadrodan çıkar`,
      replacedPlayer: replaced,
    };
  }

  return {
    text: replaced
      ? `${replaced.name} (${replaced.currentRating}) yerine geçer`
      : 'En zayıf oyuncunun yerine geçer',
    replacedPlayer: replaced,
  };
}

export function getTacticPreview(card: TacticCard, squad: PlayerCard[]): { headline: string; lines: string[]; recommend: 'good' | 'ok' | 'weak' } {
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
    const sf = squad.filter((p) => p.position === 'SF');
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
): { a: EventOutcome; b: EventOutcome } {
  return {
    a: resolveEvent(event, 'A', { squad, morale, score }),
    b: resolveEvent(event, 'B', { squad, morale, score }),
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

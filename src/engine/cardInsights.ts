import { getTagBite } from '@/data/biteTips';
import { SYNERGIES } from '@/data/synergies';
import { getTacticEffect } from '@/data/tactics';
import { getPlayerPickSummary, getTacticPreview } from '@/engine/contextPreview';
import { applyPlayerToSquad } from '@/engine/lineupPreview';
import { explainActiveTactic } from '@/engine/squadInsights';
import { getPositionHints, type PositionHint } from '@/engine/lineupPreview';
import { getSynergyBenefitText } from '@/engine/squadInsights';
import type { ActiveTactic, PlayerCard, Tag, TacticCard } from '@/types';
import { formatPosition } from '@/utils/positionStyle';

export type PlayerSynergyHint = {
  icon: string;
  name: string;
  description: string;
  before: number;
  after: number;
  required: number;
  contribution: string;
  reward: string;
  completes: boolean;
};

export type TagBite = { tag: Tag; desc: string };

export type TacticContributionLine = {
  tacticName: string;
  lines: string[];
};

export type PlayerCardInsight = {
  summary: string;
  replacedPlayer: PlayerCard | null;
  tagBites: TagBite[];
  positionHints: PositionHint[];
  synergies: PlayerSynergyHint[];
  tacticContributions: TacticContributionLine[];
};

export type TacticCardInsight = {
  pitch: string;
  onSelect: string;
  fitLabel: string;
  fit: 'good' | 'ok' | 'weak';
  effects: string[];
  whyPick: string[];
};

function contributionLabel(synergyId: string, card: PlayerCard): string {
    if (synergyId === 'synergy_kanatlar') {
    if (card.position === 'SLK' && card.tags.includes('HIZLI')) return 'Sol Kanat HIZLI';
    if (card.position === 'SÖK' && card.tags.includes('HIZLI')) return 'Sağ Kanat HIZLI';
  }
  if (card.tags.includes('HIZLI') && (synergyId === 'synergy_kontr_atiligi' || synergyId === 'synergy_ruzgar_gibi')) {
    return '+1 HIZLI sayılır';
  }
  if (card.tags.includes('TEKNİK')) return '+1 TEKNİK sayılır';
  if (card.tags.includes('ASİSTÇİ')) return '+1 ASİSTÇİ sayılır';
  if (card.tags.includes('GÜÇLÜ')) return '+1 GÜÇLÜ sayılır';
  if (card.tags.includes('YERLİ')) return '+1 YERLİ sayılır';
  if (card.tags.includes('MENTOR')) return '+1 MENTOR sayılır';
  if (card.tags.includes('POTANSİYEL')) return '+1 POTANSİYEL sayılır';
  return 'Kadroya katkı sağlar';
}

function resolveSynergyProgress(
  synergy: (typeof SYNERGIES)[number],
  squad: PlayerCard[],
  card: PlayerCard,
): PlayerSynergyHint | null {
  if (synergy.check(squad, 50)) return null;

  const before = synergy.getProgress?.(squad);
  const after = synergy.getProgress?.(squad, card);

  if (!before && !after) return null;

  const required = before?.required ?? after?.required ?? 0;
  const beforeCount = before?.current ?? 0;

  let afterCount: number;
  let completes: boolean;

  if (after) {
    afterCount = after.current;
    completes = afterCount >= required;
  } else if (before) {
    afterCount = required;
    completes = true;
  } else {
    return null;
  }

  if (afterCount <= beforeCount) return null;

  return {
    icon: before?.icon ?? after?.icon ?? synergy.icon,
    name: synergy.name,
    description: synergy.description,
    before: beforeCount,
    after: afterCount,
    required,
    contribution: contributionLabel(synergy.id, card),
    reward: getSynergyBenefitText(synergy),
    completes,
  };
}

function getPlayerTacticContributions(
  card: PlayerCard,
  squad: PlayerCard[],
  activeTactics: ActiveTactic[],
  maxSquadSize: number,
  morale: number,
): TacticContributionLine[] {
  const simSquad = applyPlayerToSquad(squad, card, maxSquadSize, morale, activeTactics);

  return activeTactics.map((tactic) => {
    const lines: string[] = [];
    if (tactic.fastBonus && card.tags.includes('HIZLI')) {
      lines.push(`HIZLI bonusu: +${tactic.fastBonus} puan/maç`);
    }
    if (tactic.technicalBonus && card.tags.includes('TEKNİK')) {
      lines.push(`TEKNİK bonusu: +${tactic.technicalBonus} puan/maç`);
    }
    if (tactic.id === 'tactic_tekli_forvet') {
      const sfCount = simSquad.filter((p) => p.position === 'SF').length;
      if (card.position === 'SF' && card.tags.includes('FİNİŞÖR') && sfCount <= 2) {
        lines.push(sfCount === 1 ? 'Tek forvet FİNİŞÖR — hücum +30%' : 'Forvet FİNİŞÖR — tek forvet şartına yakın');
      }
    }
    if (!lines.length) {
      const explain = explainActiveTactic(tactic, simSquad).find((l) =>
        card.tags.some((tag) => l.includes(tag)) || l.includes(formatPosition(card.position)),
      );
      if (explain) lines.push(explain);
    }
    return { tacticName: tactic.name, lines: lines.length ? lines : ['Bu sistemden doğrudan tag bonusu almaz'] };
  });
}

export function getPlayerCardInsight(
  card: PlayerCard,
  squad: PlayerCard[],
  _discovered: string[],
  maxSquadSize: number,
  activeTactics: ActiveTactic[] = [],
  morale = 50,
): PlayerCardInsight {
  const pick = getPlayerPickSummary(card, squad, maxSquadSize, morale, activeTactics);
  const positionHints = getPositionHints(card, squad, activeTactics, maxSquadSize, morale);

  const synergies = SYNERGIES
    .map((s) => resolveSynergyProgress(s, squad, card))
    .filter((x): x is PlayerSynergyHint => x !== null)
    .sort((a, b) => {
      const aPct = a.after / a.required;
      const bPct = b.after / b.required;
      if (a.completes !== b.completes) return a.completes ? -1 : 1;
      return bPct - aPct;
    })
    .slice(0, 2);

  const tagBites = card.tags.map((tag) => ({ tag, desc: getTagBite(tag) }));

  const tacticContributions = getPlayerTacticContributions(card, squad, activeTactics, maxSquadSize, morale);

  return {
    summary: pick.text,
    replacedPlayer: pick.replacedPlayer,
    tagBites,
    positionHints,
    synergies,
    tacticContributions,
  };
}

function getTacticWhyPick(card: TacticCard): string[] {
  const map: Record<string, string[]> = {
    tactic_442: ['Risk almadan oyna', 'Savunma ve hücum dengeli', 'Acemi run için en güvenli formasyon'],
    tactic_433_kontr: ['HIZLI kadrolarda patlar', 'Savunma güçlenir — zayıf kadrolarda ideal'],
    tactic_352: ['Gol atmak istiyorsan', 'Baskılı oyun — savunma riski bilinçli tercih'],
    tactic_532: ['Gol yememek öncelikse', 'Savunma duvarı — skor düşük kalabilir'],
    tactic_4231: ['TEKNİK oyuncuların varsa', 'Modern oyun — orta saha kontrolü'],
    tactic_yuksek_blok: ['Rakibi baskı altında tut', 'Gol yeme ihtimali azalır'],
    tactic_topla_oyn: ['TEKNİK tag\'li oyunculara göre', 'Maç başına ekstra puan'],
    tactic_direkt: ['HIZLI tag\'li oyunculara göre', 'Kontra ve sprint bonusu'],
    tactic_rotasyon: ['Kadro yorgunluğundan korun', 'Performans düşüşü engellenir'],
    tactic_tekli_forvet: ['Tek forvet FİNİŞÖR ise', 'Hücum odağı — forvete yüklenir'],
  };
  return map[card.id] ?? [card.effectSummary];
}

export function getTacticCardInsight(card: TacticCard, squad: PlayerCard[], activeTactics: ActiveTactic[] = []): TacticCardInsight {
  const preview = getTacticPreview(card, squad, activeTactics);

  const pitch = card.description;
  const onSelect = card.category === 'formasyon'
    ? 'Formasyon slotuna yerleşir — sonraki maçlarda aktif kalır'
    : 'Oyun sistemi slotuna yerleşir — sonraki maçlarda aktif kalır';

  const effects = preview.lines.slice(0, 3);

  return {
    pitch,
    onSelect,
    fitLabel: preview.headline,
    fit: preview.recommend,
    effects,
    whyPick: getTacticWhyPick(card).slice(0, 3),
  };
}

export function getTacticEffectLines(card: TacticCard): string[] {
  const fx = getTacticEffect(card.id);
  const lines: string[] = [];
  if (fx.attackMod) lines.push(`Hücum ${fx.attackMod > 0 ? '+' : ''}${fx.attackMod}%`);
  if (fx.defenseMod) lines.push(`Savunma ${fx.defenseMod > 0 ? '+' : ''}${fx.defenseMod}%`);
  if (fx.fastBonus) lines.push(`Her HIZLI +${fx.fastBonus} puan/maç`);
  if (fx.technicalBonus) lines.push(`Her TEKNİK +${fx.technicalBonus} puan/maç`);
  if (card.id === 'tactic_442') return ['Güvenli denge', 'Her hat eşit'];
  if (card.id === 'tactic_rotasyon') return ['Yorgunluk koruması'];
  return lines.length ? lines : [card.effectSummary];
}

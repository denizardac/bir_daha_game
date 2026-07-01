import { getTagBite } from '@/data/biteTips';
import { SYNERGIES } from '@/data/synergies';
import { getTacticEffect } from '@/data/tactics';
import { getPlayerPickSummary, getTacticPreview } from '@/engine/contextPreview';
import { applyPlayerToSquad, getPositionHints, getStartingEleven, type PositionHint } from '@/engine/lineupPreview';
import { explainActiveTactic } from '@/engine/squadInsights';
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
  replacementKind?: 'squad' | 'lineup';
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
  if (synergyId === 'synergy_firtina') {
    const parts: string[] = [];
    if (card.tags.includes('HIZLI')) parts.push('HIZLI');
    if (card.tags.includes('TEKNİK')) parts.push('TEKNİK');
    if (card.tags.includes('ASİSTÇİ')) parts.push('ASİSTÇİ');
    if (parts.length) return `+1 ${parts.join(' · ')} (4/4 · 2/2 · 1/1 hedef)`;
    return 'Tag katkısı yok';
  }
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
  morale: number,
): PlayerSynergyHint | null {
  if (synergy.check(squad, morale)) return null;

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
    description: after?.note ?? before?.note ?? synergy.description,
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
      lines.push('Bu sistem HIZLI oyuncudan ekstra skor çıkarır');
    }
    if (tactic.technicalBonus && card.tags.includes('TEKNİK')) {
      lines.push('Bu sistem TEKNİK oyuncudan ekstra skor çıkarır');
    }
    if (tactic.id === 'tactic_tekli_forvet') {
      const sfCount = getStartingEleven(simSquad, activeTactics).filter((p) => p.position === 'SF').length;
      if (card.position === 'SF' && card.tags.includes('FİNİŞÖR') && sfCount <= 2) {
        lines.push(sfCount === 1 ? 'Tek forvet FİNİŞÖR — plan hazır' : 'Forvet FİNİŞÖR — tek forvet şartına yakın');
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
  discovered: string[],
  maxSquadSize: number,
  activeTactics: ActiveTactic[] = [],
  morale = 50,
): PlayerCardInsight {
  const pick = getPlayerPickSummary(card, squad, maxSquadSize, morale, activeTactics);
  const positionHints = getPositionHints(card, squad, activeTactics, maxSquadSize, morale);

  const synergies = SYNERGIES
    .filter((s) => !s.hidden || discovered.includes(s.id))
    .map((s) => resolveSynergyProgress(s, squad, card, morale))
    .filter((x): x is PlayerSynergyHint => x !== null)
    .sort((a, b) => {
      const aPct = a.after / a.required;
      const bPct = b.after / b.required;
      if (a.completes !== b.completes) return a.completes ? -1 : 1;
      return bPct - aPct;
    })
    .slice(0, 4);

  const tagBites = card.tags.map((tag) => ({ tag, desc: getTagBite(tag) }));

  const tacticContributions = getPlayerTacticContributions(card, squad, activeTactics, maxSquadSize, morale);

  return {
    summary: pick.text,
    replacedPlayer: pick.replacedPlayer,
    replacementKind: pick.replacementKind,
    tagBites,
    positionHints,
    synergies,
    tacticContributions,
  };
}

function getTacticWhyPick(card: TacticCard): string[] {
  const map: Record<string, string[]> = {
    tactic_442: ['Risk almadan oyna', 'Her hatta küçük stabil avantaj', 'Acemi run için en güvenli formasyon'],
    tactic_433_kontr: ['Kanat ve forvet kadrolarında', 'Geniş alan açar', 'Arkada kontrollü risk bırakır'],
    tactic_352: ['Orta saha + çift forvet kadrolarında', 'Baskılı oynar', 'Kanat arkası riskli'],
    tactic_532: ['Zayıf kadroyu hayatta tut', 'Savunma duvarı kurar', 'Gol üretimi düşebilir'],
    tactic_4231: ['OOS/OS kadrolara uygun', 'İki yönlü modern yapı', 'Dengeli maç planı'],
    tactic_343: ['En yüksek risk/ödül', 'Üçlü hücumla patlar', 'Savunma açık kalır'],
    tactic_diamond: ['Merkez oyuncuların güçlüyse', 'Kanatsız merkez kontrolü', 'Kadro uyumu önemli'],
    tactic_yuksek_blok: ['HIZLI/SAVAŞÇI profili varsa', 'Galibiyet ve golleri ödüllendirir', 'Profil yoksa arkada boşluk'],
    tactic_topla_oyn: ['TEKNİK tag\'li oyunculara göre', 'Pas planı skor üretir', 'Çok teknik kadro beraberliği bile değerli tutar'],
    tactic_direkt: ['HIZLI tag\'li oyunculara göre', 'Direkt çıkışla ilk darbeyi arar'],
    tactic_rotasyon: ['Kadro yorgunluğundan korun', 'Performans düşüşü engellenir'],
    tactic_tekli_forvet: ['Tek forvet FİNİŞÖR ise', 'Her golü daha değerli yapar', 'Şart yoksa sistem kısırlaşır'],
    tactic_catenaccio: ['Skoru korumak istiyorsan', 'Gol yememeyi ödüllendirir', 'Hücum üretimi kısılır'],
    tactic_gegenpress: ['HIZLI + SAVAŞÇI/GÜÇLÜ kadrolarda', 'Zor kombo, güçlü ödül', 'Şart yoksa savunma kırılır'],
    tactic_tiki_taka: ['TEKNİK oyuncuların çoksa', 'Pas ekonomisi kurar', 'Geçiş savunması riskli'],
    tactic_park_bus: ['Güçlü rakibe karşı skoru tut', 'Gol yememeyi büyük ödüle çevirir', 'Hücum azalır'],
    tactic_kanat_bindirme: ['HIZLI bek/kanatların varsa', 'Doğru mevkide HIZLI ister', 'Kanat profili yoksa arkada boşluk'],
    tactic_4411: ['Gölge forvet + golcü ikilin varsa', 'Dengeli, ikinci forvetli hücum'],
    tactic_3412: ['İki santrafor + 10 numara ile', 'Çok hücumcu', '⚠ Kanat savunması zayıf'],
    tactic_451: ['Gol yememek öncelikse', 'Beş orta saha — kalabalık merkez', '⚠ Tek forvet — gol kısır kalabilir'],
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
  if (fx.attackMod && fx.attackMod > 0) lines.push('Gol bulma ihtimali artar');
  if (fx.attackMod && fx.attackMod < 0) lines.push('Gol üretimi düşer');
  if (fx.defenseMod && fx.defenseMod > 0) lines.push('Savunma direnci artar');
  if (fx.defenseMod && fx.defenseMod < 0) lines.push('Savunma riski artar');
  if (fx.fastBonus) lines.push('HIZLI oyuncular ekstra skor üretir');
  if (fx.technicalBonus) lines.push('TEKNİK oyuncular ekstra skor üretir');
  if (fx.perGoalBonus) lines.push('Goller ekstra puan getirir');
  if (fx.perWinBonus) lines.push('Galibiyetler ekstra puan getirir');
  if (fx.drawBonus) lines.push('Beraberlik bile değer kazanabilir');
  if (fx.cleanSheetWinBonus || fx.cleanSheetDrawBonus) lines.push('Gol yememek ekstra puan getirir');
  if (fx.firstGoalBonus) lines.push('İlk gol planı ödüllenir');
  if (fx.squadSizeBonus) lines.push('Geniş kadro ödüllendirilir');
  if (card.id === 'tactic_442') return ['Güvenli denge', 'Her hat eşit'];
  if (card.id === 'tactic_rotasyon') return ['Yorgunluk koruması'];
  return lines.length ? lines : [card.effectSummary];
}

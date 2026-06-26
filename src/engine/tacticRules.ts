import type { ActiveTactic, MatchHighlight, MatchOutcome, PlayerCard } from '@/types';

type MatchScoreContext = {
  outcome: MatchOutcome;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheet: boolean;
};

function hasTactic(tactics: ActiveTactic[], id: string): boolean {
  return tactics.some((t) => t.id === id);
}

function countTag(squad: PlayerCard[], tag: string): number {
  return squad.reduce((n, p) => n + (p.tags.includes(tag as never) ? 1 : 0), 0);
}

function countAnyTag(squad: PlayerCard[], tags: string[]): number {
  return squad.reduce((n, p) => n + (tags.some((tag) => p.tags.includes(tag as never)) ? 1 : 0), 0);
}

export function isHighPressReady(squad: PlayerCard[]): boolean {
  return countAnyTag(squad, ['HIZLI', 'SAVAŞÇI']) >= 3;
}

export function isGegenpressReady(squad: PlayerCard[]): boolean {
  return countTag(squad, 'HIZLI') >= 2 && countAnyTag(squad, ['SAVAŞÇI', 'GÜÇLÜ']) >= 2;
}

export function hasSingleFinisherForward(squad: PlayerCard[]): boolean {
  const forwards = squad.filter((p) => p.position === 'SF');
  return forwards.length === 1 && forwards[0]!.tags.includes('FİNİŞÖR');
}

export function countFastWidePlayers(squad: PlayerCard[]): number {
  const widePositions = new Set(['SLB', 'SÖB', 'SLK', 'SÖK']);
  return squad.filter((p) => widePositions.has(p.position) && p.tags.includes('HIZLI')).length;
}

export function hasWidePlayer(squad: PlayerCard[]): boolean {
  const widePositions = new Set(['SLB', 'SÖB', 'SLK', 'SÖK']);
  return squad.some((p) => widePositions.has(p.position));
}

export function conditionalAttackMod(tactics: ActiveTactic[], squad: PlayerCard[]): number {
  let mod = 0;
  if (hasTactic(tactics, 'tactic_tekli_forvet')) mod += hasSingleFinisherForward(squad) ? 12 : -8;
  if (hasTactic(tactics, 'tactic_gegenpress') && isGegenpressReady(squad)) mod += 8;
  return mod;
}

export function conditionalDefenseMod(tactics: ActiveTactic[], squad: PlayerCard[]): number {
  let mod = 0;
  if (hasTactic(tactics, 'tactic_yuksek_blok') && !isHighPressReady(squad)) mod -= 6;
  if (hasTactic(tactics, 'tactic_gegenpress') && !isGegenpressReady(squad)) mod -= 8;
  if (hasTactic(tactics, 'tactic_kanat_bindirme') && !hasWidePlayer(squad)) mod -= 6;
  return mod;
}

export function getTacticScoreHighlights(
  match: MatchScoreContext,
  squad: PlayerCard[],
  tactics: ActiveTactic[],
): MatchHighlight[] {
  if (match.outcome === 'loss') return [];
  const highlights: MatchHighlight[] = [];

  for (const tactic of tactics) {
    if (tactic.technicalBonus) {
      const tech = countTag(squad, 'TEKNİK');
      if (tech > 0) highlights.push({ text: `${tactic.name} · TEKNİK plan`, points: tech * tactic.technicalBonus });
    }
    if (tactic.fastBonus) {
      const fast = tactic.id === 'tactic_kanat_bindirme' ? countFastWidePlayers(squad) : countTag(squad, 'HIZLI');
      if (fast > 0) highlights.push({ text: `${tactic.name} · HIZLI plan`, points: fast * tactic.fastBonus });
    }
  }

  if (hasTactic(tactics, 'tactic_yuksek_blok') && isHighPressReady(squad)) {
    if (match.outcome === 'win') highlights.push({ text: 'Yüksek Press · baskı galibiyeti', points: 180 });
    if (match.goalsFor > 0) highlights.push({ text: 'Yüksek Press · top kazanımı', points: match.goalsFor * 30 });
  }

  if (hasTactic(tactics, 'tactic_topla_oyn') && match.outcome === 'draw' && countTag(squad, 'TEKNİK') >= 4) {
    highlights.push({ text: 'Topla Oynama · beraberliği tuttu', points: 120 });
  }

  if (hasTactic(tactics, 'tactic_direkt') && match.goalsFor > 0 && countTag(squad, 'HIZLI') >= 3) {
    highlights.push({ text: 'Direkt Futbol · ilk darbeyi vurdu', points: 150 });
  }

  if (hasTactic(tactics, 'tactic_rotasyon') && squad.length >= 10) {
    highlights.push({ text: 'Kadro Rotasyonu · geniş kadro', points: 80 });
  }

  if (hasTactic(tactics, 'tactic_tekli_forvet') && hasSingleFinisherForward(squad) && match.goalsFor > 0) {
    highlights.push({ text: 'Tek Forvet · bitirici odak', points: match.goalsFor * 60 });
  }

  if (hasTactic(tactics, 'tactic_catenaccio') && match.cleanSheet) {
    highlights.push({
      text: 'Alçak Blok · kale kapalı',
      points: match.outcome === 'win' ? 220 : 100,
    });
  }

  if (hasTactic(tactics, 'tactic_gegenpress') && isGegenpressReady(squad) && match.goalsFor > 0) {
    highlights.push({ text: 'Gegenpress · geri kazanım', points: match.goalsFor * 45 });
  }

  if (hasTactic(tactics, 'tactic_tiki_taka') && match.outcome === 'win' && countTag(squad, 'TEKNİK') >= 5) {
    highlights.push({ text: 'Tiki-Taka · tam kontrol', points: 250 });
  }

  if (hasTactic(tactics, 'tactic_park_bus') && match.cleanSheet) {
    highlights.push({
      text: 'Otobüsü Çek · kilit savunma',
      points: match.outcome === 'win' ? 260 : 120,
    });
  }

  return highlights;
}

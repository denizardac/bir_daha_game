import type { ActiveTactic, MatchHighlight, MatchOutcome, PlayerCard } from '@/types';

type MatchScoreContext = {
  outcome: MatchOutcome;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheet: boolean;
};

function findTactic(tactics: ActiveTactic[], id: string): ActiveTactic | undefined {
  return tactics.find((t) => t.id === id);
}

function hasTactic(tactics: ActiveTactic[], id: string): boolean {
  return tactics.some((t) => t.id === id);
}

function countTag(squad: PlayerCard[], tag: string): number {
  return squad.reduce((n, p) => n + (p.tags.includes(tag as never) ? 1 : 0), 0);
}

function countAnyTag(squad: PlayerCard[], tags: string[]): number {
  return squad.reduce((n, p) => n + (tags.some((tag) => p.tags.includes(tag as never)) ? 1 : 0), 0);
}

export type TacticRequirementStatus = {
  requirement: string;
  current: string;
  met: boolean;
};

export function getTacticRequirementStatus(id: string, squad: PlayerCard[]): TacticRequirementStatus | null {
  const fast = countTag(squad, 'HIZLI');
  const technical = countTag(squad, 'TEKNİK');
  const physicalPressers = countAnyTag(squad, ['SAVAŞÇI', 'GÜÇLÜ']);

  if (id === 'tactic_yuksek_blok') {
    const pressProfiles = countAnyTag(squad, ['HIZLI', 'SAVAŞÇI']);
    return { requirement: 'En az 3 HIZLI/SAVAŞÇI', current: `Şu an: ${pressProfiles} baskı oyuncusu`, met: pressProfiles >= 3 };
  }
  if (id === 'tactic_topla_oyn') {
    return { requirement: 'En az 4 TEKNİK', current: `Şu an: ${technical} TEKNİK`, met: technical >= 4 };
  }
  if (id === 'tactic_direkt') {
    return { requirement: 'En az 3 HIZLI', current: `Şu an: ${fast} HIZLI`, met: fast >= 3 };
  }
  if (id === 'tactic_rotasyon') {
    return { requirement: '10 kişilik geniş kadro', current: `Şu an: ${squad.length} oyuncu`, met: squad.length >= 10 };
  }
  if (id === 'tactic_tekli_forvet') {
    const forwards = squad.filter((player) => player.position === 'SF');
    const finisherForwards = forwards.filter((player) => player.tags.includes('FİNİŞÖR'));
    return {
      requirement: 'Tam 1 santrafor ve o oyuncuda FİNİŞÖR',
      current: `Şu an: ${forwards.length} santrafor · ${finisherForwards.length} FİNİŞÖR`,
      met: hasSingleFinisherForward(squad),
    };
  }
  if (id === 'tactic_gegenpress') {
    return {
      requirement: 'En az 2 HIZLI + 2 SAVAŞÇI/GÜÇLÜ',
      current: `Şu an: ${fast} HIZLI · ${physicalPressers} fiziksel presçi`,
      met: fast >= 2 && physicalPressers >= 2,
    };
  }
  if (id === 'tactic_tiki_taka') {
    return { requirement: 'En az 5 TEKNİK', current: `Şu an: ${technical} TEKNİK`, met: technical >= 5 };
  }
  if (id === 'tactic_kanat_bindirme') {
    const fastWide = countFastWidePlayers(squad);
    return { requirement: 'En az 2 HIZLI bek/kanat', current: `Şu an: ${fastWide} HIZLI bek/kanat`, met: fastWide >= 2 };
  }
  return null;
}

export function isHighPressReady(squad: PlayerCard[]): boolean {
  return getTacticRequirementStatus('tactic_yuksek_blok', squad)?.met ?? false;
}

export function isGegenpressReady(squad: PlayerCard[]): boolean {
  return getTacticRequirementStatus('tactic_gegenpress', squad)?.met ?? false;
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
  if (hasTactic(tactics, 'tactic_yuksek_blok') && isHighPressReady(squad)) mod += 6;
  if (hasTactic(tactics, 'tactic_topla_oyn')) {
    const technical = countTag(squad, 'TEKNİK');
    mod += technical >= 4 ? 4 : technical < 2 ? -3 : 0;
  }
  if (hasTactic(tactics, 'tactic_direkt')) {
    const fast = countTag(squad, 'HIZLI');
    mod += fast >= 3 ? 7 : fast < 2 ? -3 : 0;
  }
  if (hasTactic(tactics, 'tactic_tiki_taka')) {
    const technical = countTag(squad, 'TEKNİK');
    mod += technical >= 5 ? 6 : technical < 3 ? -4 : 0;
  }
  if (hasTactic(tactics, 'tactic_kanat_bindirme')) {
    const fastWide = countFastWidePlayers(squad);
    mod += fastWide >= 2 ? 8 : fastWide === 1 ? 3 : 0;
  }
  if (hasTactic(tactics, 'tactic_tekli_forvet')) mod += hasSingleFinisherForward(squad) ? 10 : -8;
  if (hasTactic(tactics, 'tactic_gegenpress') && isGegenpressReady(squad)) mod += 8;
  return mod;
}

export function conditionalDefenseMod(tactics: ActiveTactic[], squad: PlayerCard[]): number {
  let mod = 0;
  if (hasTactic(tactics, 'tactic_yuksek_blok') && isHighPressReady(squad)) mod += 3;
  if (hasTactic(tactics, 'tactic_yuksek_blok') && !isHighPressReady(squad)) mod -= 6;
  if (hasTactic(tactics, 'tactic_topla_oyn') && countTag(squad, 'TEKNİK') >= 4) mod += 5;
  if (hasTactic(tactics, 'tactic_tiki_taka') && countTag(squad, 'TEKNİK') >= 5) mod += 6;
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

  // Puan değerleri ActiveTactic (tactics.ts TACTIC_EFFECTS) alanlarından okunur —
  // burada yalnızca kartın KOŞULU tanımlanır; sayı tek kaynakta kalır.
  const yuksekBlok = findTactic(tactics, 'tactic_yuksek_blok');
  if (yuksekBlok && isHighPressReady(squad)) {
    if (match.outcome === 'win' && yuksekBlok.perWinBonus) {
      highlights.push({ text: 'Yüksek Press · baskı galibiyeti', points: yuksekBlok.perWinBonus });
    }
    if (match.goalsFor > 0 && yuksekBlok.perGoalBonus) {
      highlights.push({ text: 'Yüksek Press · top kazanımı', points: match.goalsFor * yuksekBlok.perGoalBonus });
    }
  }

  const toplaOyn = findTactic(tactics, 'tactic_topla_oyn');
  if (toplaOyn?.drawBonus && match.outcome === 'draw' && countTag(squad, 'TEKNİK') >= 4) {
    highlights.push({ text: 'Topla Oynama · beraberliği tuttu', points: toplaOyn.drawBonus });
  }

  const direkt = findTactic(tactics, 'tactic_direkt');
  if (direkt?.firstGoalBonus && match.goalsFor > 0 && countTag(squad, 'HIZLI') >= 3) {
    highlights.push({ text: 'Direkt Futbol · ilk darbeyi vurdu', points: direkt.firstGoalBonus });
  }

  const rotasyon = findTactic(tactics, 'tactic_rotasyon');
  if (rotasyon?.squadSizeBonus && squad.length >= (rotasyon.squadSizeThreshold ?? 10)) {
    highlights.push({ text: 'Kadro Rotasyonu · geniş kadro', points: rotasyon.squadSizeBonus });
  }

  const tekliForvet = findTactic(tactics, 'tactic_tekli_forvet');
  if (tekliForvet?.perGoalBonus && hasSingleFinisherForward(squad) && match.goalsFor > 0) {
    highlights.push({ text: 'Tek Forvet · bitirici odak', points: match.goalsFor * tekliForvet.perGoalBonus });
  }

  const catenaccio = findTactic(tactics, 'tactic_catenaccio');
  if (catenaccio && match.cleanSheet) {
    const points = match.outcome === 'win' ? catenaccio.cleanSheetWinBonus : catenaccio.cleanSheetDrawBonus;
    if (points) highlights.push({ text: 'Alçak Blok · kale kapalı', points });
  }

  const gegenpress = findTactic(tactics, 'tactic_gegenpress');
  if (gegenpress?.perGoalBonus && isGegenpressReady(squad) && match.goalsFor > 0) {
    highlights.push({ text: 'Gegenpress · geri kazanım', points: match.goalsFor * gegenpress.perGoalBonus });
  }

  const tikiTaka = findTactic(tactics, 'tactic_tiki_taka');
  if (tikiTaka?.perWinBonus && match.outcome === 'win' && countTag(squad, 'TEKNİK') >= 5) {
    highlights.push({ text: 'Tiki-Taka · tam kontrol', points: tikiTaka.perWinBonus });
  }

  const parkBus = findTactic(tactics, 'tactic_park_bus');
  if (parkBus && match.cleanSheet) {
    const points = match.outcome === 'win' ? parkBus.cleanSheetWinBonus : parkBus.cleanSheetDrawBonus;
    if (points) highlights.push({ text: 'Otobüsü Çek · kilit savunma', points });
  }

  return highlights;
}

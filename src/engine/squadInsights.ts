import { buildOfferSynergyHint } from '@/engine/runValidation';
import type { ActiveTactic, GameCard, PlayerCard, Tag } from '@/types';
import type { SynergyDefinition } from '@/types';
import { SYNERGIES } from '@/data/synergies';
import { isPlayerCard } from '@/types';

export type NearSynergyProgress = {
  synergy: SynergyDefinition;
  progress: { current: number; required: number; icon: string };
  offerHint?: string | null;
};

export function getSidePanelNearSynergies(
  squad: PlayerCard[],
  morale: number,
  discoveredIds: string[],
  currentOffers?: GameCard[],
  limit = 2,
): NearSynergyProgress[] {
  const playerOffers = currentOffers?.filter(isPlayerCard) ?? [];

  return SYNERGIES.filter((s) => {
    if (s.check(squad, morale)) return false;
    if (s.hidden && !discoveredIds.includes(s.id)) return false;
    return Boolean(s.getProgress?.(squad));
  })
    .map((s) => {
      const progress = s.getProgress!(squad)!;
      return {
        synergy: s,
        progress,
        offerHint: buildOfferSynergyHint(s, squad, progress, playerOffers),
      };
    })
    .filter(({ synergy, progress }) => {
      if (progress.current > 0) return true;
      return playerOffers.some((offer) => {
        const after = synergy.getProgress?.(squad, offer);
        return after != null && after.current > progress.current;
      });
    })
    .sort((a, b) => b.progress.current / b.progress.required - a.progress.current / a.progress.required)
    .slice(0, limit);
}

export function getSquadTagCounts(squad: PlayerCard[]): { tag: Tag; count: number }[] {
  const map = new Map<Tag, number>();
  for (const p of squad) {
    for (const t of p.tags) map.set(t, (map.get(t) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function explainActiveTactic(tactic: ActiveTactic, squad: PlayerCard[]): string[] {
  const lines: string[] = [];
  const fast = squad.filter((p) => p.tags.includes('HIZLI')).length;
  const tech = squad.filter((p) => p.tags.includes('TEKNİK')).length;

  if (tactic.attackMod && tactic.attackMod > 0) lines.push(`Hücum gücü +%${tactic.attackMod} — daha fazla gol şansı`);
  if (tactic.attackMod && tactic.attackMod < 0) lines.push(`Gol ihtimali ${tactic.attackMod}% — savunma odaklı`);
  if (tactic.defenseMod && tactic.defenseMod > 0) lines.push(`Savunma +%${tactic.defenseMod} — daha az gol yersin`);
  if (tactic.defenseMod && tactic.defenseMod < 0) lines.push(`Savunma ${tactic.defenseMod}% — riskli oyun`);
  if (tactic.fastBonus && fast > 0) lines.push(`${fast} HIZLI × +${tactic.fastBonus} puan/maç`);
  if (tactic.fastBonus && fast === 0) lines.push(`HIZLI oyuncu yok — bonus aktif olmaz`);
  if (tactic.technicalBonus && tech > 0) lines.push(`${tech} TEKNİK × +${tactic.technicalBonus} puan/maç`);
  if (tactic.technicalBonus && tech === 0) lines.push(`TEKNİK oyuncu yok — bonus aktif olmaz`);
  if (!lines.length) lines.push('Güvenli taban — stabil maç gücü, ekstra ceza yok');
  lines.push('Sonraki maçlarda aktif kalır, oyuncu eklemez');
  return lines;
}

export function getSynergyBenefitText(s: SynergyDefinition): string {
  if (s.perGoalBonus) return `Her attığın gol +${s.perGoalBonus} puan`;
  if (s.perWinBonus) return `Her galibiyet +${s.perWinBonus} puan`;
  if (s.perRoundBonus) return `Her round +${s.perRoundBonus} puan (pasif)`;
  if (s.goalMultiplier) return 'Gol çarpanı artar';
  if (s.cleanSheetDefenseBonus) return 'Clean sheet şansı yükselir';
  return 'Maç performansını güçlendirir';
}

export function getSynergyRequirementHint(s: SynergyDefinition, squad: PlayerCard[]): string {
  const progress = s.getProgress?.(squad);
  if (!progress) return s.description;
  const need = progress.required - progress.current;
  if (need <= 0) return s.description;
  return `${need} eksik · ${s.description}`;
}

export function getPickTypeHint(hasEmptySlots: boolean): { player: string; tactic: string } {
  return {
    player: hasEmptySlots
      ? 'Kadroya eklenir — rating ve tag\'ler kalıcı'
      : 'En zayıf oyuncunun yerine geçer',
    tactic: 'Formasyon veya oyun sistemi slotuna yerleşir — maç bonusu verir',
  };
}

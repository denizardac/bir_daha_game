import { buildOfferSynergyHint } from '@/engine/runValidation';
import type { ActiveTactic, GameCard, PlayerCard, Tag } from '@/types';
import type { SynergyDefinition } from '@/types';
import { SYNERGIES } from '@/data/synergies';
import { isPlayerCard } from '@/types';
import {
  countFastWidePlayers,
  isGegenpressReady,
  isHighPressReady,
} from '@/engine/tacticRules';

export type NearSynergyProgress = {
  synergy: SynergyDefinition;
  progress: { current: number; required: number; icon: string; note?: string };
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

  if (tactic.attackMod && tactic.attackMod > 0) lines.push('Hücum planı güçlenir — daha fazla gol şansı');
  if (tactic.attackMod && tactic.attackMod < 0) lines.push('Gol üretimi düşer — savunma odaklı');
  if (tactic.defenseMod && tactic.defenseMod > 0) lines.push('Savunma direnci artar — daha az gol yersin');
  if (tactic.defenseMod && tactic.defenseMod < 0) lines.push('Savunma riski artar — arkada boşluk verebilir');
  if (tactic.fastBonus && fast > 0) lines.push(`${fast} HIZLI oyuncu bu sistemden ekstra skor çıkarır`);
  if (tactic.fastBonus && fast === 0) lines.push(`HIZLI oyuncu yok — bonus aktif olmaz`);
  if (tactic.technicalBonus && tech > 0) lines.push(`${tech} TEKNİK oyuncu bu sistemden ekstra skor çıkarır`);
  if (tactic.technicalBonus && tech === 0) lines.push(`TEKNİK oyuncu yok — bonus aktif olmaz`);
  if (tactic.id === 'tactic_yuksek_blok') {
    lines.push(isHighPressReady(squad) ? 'Baskı profili hazır — goller ve galibiyet değerli' : 'Baskı profili eksik — savunma riski artar');
  }
  if (tactic.id === 'tactic_gegenpress') {
    lines.push(isGegenpressReady(squad) ? 'Pres kombosu hazır — top kazanımları ödüllenir' : 'Pres kombosu eksik — savunma çizgisi kırılabilir');
  }
  if (tactic.id === 'tactic_catenaccio' || tactic.id === 'tactic_park_bus') {
    lines.push('Gol yemeden biten maçlar ekstra değer kazanır');
  }
  if (tactic.id === 'tactic_kanat_bindirme') {
    const wideFast = countFastWidePlayers(squad);
    lines.push(wideFast > 0 ? `${wideFast} HIZLI kanat/bek bu planı besler` : 'HIZLI kanat/bek yok — plan zayıf kalır');
  }
  if (tactic.id === 'tactic_rotasyon') {
    const gerileyen = squad.filter((p) => p.tags.includes('GERİLEYEN')).length;
    lines.push(gerileyen > 0
      ? `${gerileyen} GERİLEYEN oyuncu — form düşüşü engellenir`
      : 'GERİLEYEN yok — yorgunluk koruması hazır bekler');
  }
  if (!lines.length) lines.push('Güvenli taban — stabil maç gücü, ekstra ceza yok');
  lines.push('Sonraki maçlarda aktif kalır, oyuncu eklemez');
  return lines;
}

export function getSynergyBenefitText(s: SynergyDefinition): string {
  const rewards: string[] = [];
  if (s.perGoalBonus) rewards.push(`Gol başına +${s.perGoalBonus} puan`);
  if (s.perWinBonus) rewards.push(`Galibiyet başına +${s.perWinBonus} puan`);
  if (s.perRoundBonus) rewards.push(`Maç sonrası +${s.perRoundBonus} puan`);
  if (s.perMatchMorale) rewards.push('Moral kazanımı artar');
  if (s.minMorale) rewards.push('Moral tabanı korunur');
  if (s.goalMultiplier) rewards.push('Gol üretimi artar');
  if (s.cleanSheetDefenseBonus) rewards.push('Gol yememe şansı artar');
  if (s.ratingMultiplier) rewards.push('İlk 11 kalitesi sahaya daha iyi yansır');
  if (s.scoreMultiplier) rewards.push('Maç puanı büyür');
  return rewards.length ? rewards.join(' · ') : 'Maç performansını güçlendirir';
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

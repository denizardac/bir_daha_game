import { describe, expect, it } from 'vitest';
import { PLAYER_POOL } from '@/data/players';
import {
  assignPlayersByRules,
  slotAcceptsPlayerForPlacement,
  type PlacementSlotDef,
} from '@/engine/lineupPlacement';
import { assignSquadToFormation } from '@/engine/lineupPreview';
import type { PlayerCard } from '@/types';

const SLOTS_442: PlacementSlotDef[] = [
  { label: 'KL', preferred: ['KL'], zone: 'kaleci' },
  { label: 'SLB', preferred: ['SLB', 'STP'], zone: 'savunma' },
  { label: 'STP', preferred: ['STP'], zone: 'savunma' },
  { label: 'STP', preferred: ['STP'], zone: 'savunma' },
  { label: 'SĞB', preferred: ['SÖB', 'STP'], zone: 'savunma' },
  { label: 'SLK', preferred: ['SLK', 'OOS'], zone: 'hucum' },
  { label: 'DOS', preferred: ['DOS', 'OS'], zone: 'orta' },
  { label: 'OS', preferred: ['OS', 'OOS', 'DOS'], zone: 'orta' },
  { label: 'SĞK', preferred: ['SÖK', 'OOS'], zone: 'hucum' },
  { label: 'SF', preferred: ['SF'], zone: 'hucum' },
  { label: 'SF', preferred: ['SF'], zone: 'hucum' },
];

function p(
  overrides: Partial<PlayerCard> & Pick<PlayerCard, 'id' | 'name' | 'position'>,
): PlayerCard {
  return {
    kind: 'player',
    rating: 70,
    currentRating: 70,
    rarity: 'iyi',
    tags: [],
    ...overrides,
  };
}

function slotOf(squad: PlayerCard[], id: string) {
  const assigned = assignPlayersByRules(SLOTS_442, squad);
  const idx = assigned.findIndex((x) => x?.id === id);
  return idx >= 0 ? SLOTS_442[idx]!.label : null;
}

function maximumPlayableCount(squad: PlayerCard[], formation: string): number {
  const slots = assignSquadToFormation([], formation).map((item) => item.slot);
  const slotMatch = Array<number>(slots.length).fill(-1);

  function augment(playerIndex: number, seen: boolean[]): boolean {
    const player = squad[playerIndex]!;
    for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
      if (seen[slotIndex]) continue;
      const slot = slots[slotIndex]!;
      const accepted = slot.zone === 'kaleci'
        ? player.position === 'KL'
        : player.position !== 'KL' && slotAcceptsPlayerForPlacement(player, slot);
      if (!accepted) continue;
      seen[slotIndex] = true;
      if (slotMatch[slotIndex] === -1 || augment(slotMatch[slotIndex]!, seen)) {
        slotMatch[slotIndex] = playerIndex;
        return true;
      }
    }
    return false;
  }

  let count = 0;
  for (let playerIndex = 0; playerIndex < squad.length; playerIndex++) {
    if (augment(playerIndex, Array<boolean>(slots.length).fill(false))) count++;
  }
  return count;
}

describe('lineupPlacement — genel kurallar', () => {
  it('Yiğit 78 OOS → SĞK (Aktaş düşer, Demir OS’te kalır)', () => {
    const squad = [
      p({ id: 'kl', name: 'KL', position: 'KL', currentRating: 74, rating: 74 }),
      p({ id: 'stp1', name: 'Kaya', position: 'STP', currentRating: 74, rating: 74 }),
      p({ id: 'stp2', name: 'Işık', position: 'STP', currentRating: 69, rating: 69 }),
      p({ id: 'slk', name: 'Karaca', position: 'SLK', currentRating: 67, rating: 67 }),
      p({ id: 'dos', name: 'Weak', position: 'DOS', currentRating: 58, rating: 58 }),
      p({ id: 'oos1', name: 'Demir', position: 'OOS', currentRating: 74, rating: 74 }),
      p({ id: 'oos2', name: 'Aktaş', position: 'OOS', currentRating: 69, rating: 69 }),
      p({ id: 'sf', name: 'Kane', position: 'SF', currentRating: 74, rating: 74 }),
      p({ id: 'yigit', name: 'Yiğit', position: 'OOS', currentRating: 78, rating: 78 }),
    ];
    expect(slotOf(squad, 'yigit')).toBe('SĞK');
    expect(slotOf(squad, 'oos1')).toBe('OS');
    expect(slotOf(squad, 'dos')).toBe('DOS');
  });

  it('native OS varken OOS boş SĞK’ya oturur (OS’i gasp etmez)', () => {
    const squad = [
      p({ id: 'kl', name: 'KL', position: 'KL', currentRating: 70, rating: 70 }),
      p({ id: 'weak', name: 'Zayıf OS', position: 'OS', currentRating: 58, rating: 58 }),
      ...['slb', 'stp1', 'stp2', 'sgb', 'dos', 'slk', 'sf1', 'sf2'].map((id, i) =>
        p({
          id,
          name: id,
          position: (['SLB', 'STP', 'STP', 'SÖB', 'DOS', 'SLK', 'SF', 'SF'] as const)[i]!,
          currentRating: 60 + i,
          rating: 60 + i,
        }),
      ),
      p({ id: 'oos', name: 'Gökhan', position: 'OOS', currentRating: 77, rating: 77 }),
    ];
    expect(slotOf(squad, 'oos')).toBe('SĞK');
    expect(slotOf(squad, 'weak')).toBe('OS');
  });

  it('boş SĞK varken OOS kanada kayıp native OS oyuncusuna OS açar', () => {
    const squad = [
      p({ id: 'kl', name: 'E. Yıldız', position: 'KL', currentRating: 65, rating: 65 }),
      p({ id: 'slb', name: 'A. Kabakçılar', position: 'SLB', currentRating: 74, rating: 74 }),
      p({ id: 'stp', name: 'M. Schmitt', position: 'STP', currentRating: 65, rating: 65 }),
      p({ id: 'slk', name: 'K. Çakır', position: 'SLK', currentRating: 73, rating: 73 }),
      p({ id: 'tosunzade', name: 'P. Tosunzade', position: 'OS', currentRating: 74, rating: 74 }),
      p({ id: 'yilmazcan', name: 'D. Yılmazcan', position: 'OOS', currentRating: 74, rating: 74 }),
      p({ id: 'sf', name: 'B. Aktaş', position: 'SF', currentRating: 72, rating: 72 }),
    ];

    expect(slotOf(squad, 'yilmazcan')).toBe('SĞK');
    expect(slotOf(squad, 'tosunzade')).toBe('OS');
  });

  it('OOS DOS slotuna gitmez', () => {
    const squad = [
      p({ id: 'kl', name: 'KL', position: 'KL', currentRating: 70, rating: 70 }),
      p({ id: 'dos', name: 'Native', position: 'DOS', currentRating: 65, rating: 65 }),
      p({ id: 'oos', name: 'OOS', position: 'OOS', currentRating: 80, rating: 80 }),
      ...['slb', 'stp1', 'stp2', 'sgb', 'os', 'slk', 'sf1', 'sf2'].map((id, i) =>
        p({
          id,
          name: id,
          position: (['SLB', 'STP', 'STP', 'SÖB', 'OS', 'SLK', 'SF', 'SF'] as const)[i]!,
          currentRating: 60 + i,
          rating: 60 + i,
        }),
      ),
    ];
    expect(slotOf(squad, 'oos')).not.toBe('DOS');
  });

  it('zincir: boş SĞK + OS’te 69 OOS → güçlü OS’e, 69 SĞK’ya', () => {
    const squad = [
      p({ id: 'kl', name: 'KL', position: 'KL', currentRating: 70, rating: 70 }),
      p({ id: 'weak', name: 'Zayıf', position: 'OOS', currentRating: 69, rating: 69 }),
      p({ id: 'yigit', name: 'Yiğit', position: 'OOS', currentRating: 78, rating: 78 }),
      p({ id: 'dos', name: 'DOS', position: 'DOS', currentRating: 68, rating: 68 }),
      ...['slb', 'stp1', 'stp2', 'sgb', 'slk', 'sf1', 'sf2'].map((id, i) =>
        p({
          id,
          name: id,
          position: (['SLB', 'STP', 'STP', 'SÖB', 'SLK', 'SF', 'SF'] as const)[i]!,
          currentRating: 60 + i,
          rating: 60 + i,
        }),
      ),
    ];
    const assigned = assignPlayersByRules(SLOTS_442, squad);
    expect(assigned.find((x) => x?.id === 'yigit')).toBeTruthy();
    expect(assigned.find((x) => x?.id === 'yigit') && SLOTS_442[assigned.findIndex((x) => x?.id === 'yigit')]!.label).toBeTruthy();
    const yigitIdx = assigned.findIndex((x) => x?.id === 'yigit');
    const weakIdx = assigned.findIndex((x) => x?.id === 'weak');
    expect(SLOTS_442[yigitIdx]!.label).toBe('OS');
    expect(SLOTS_442[weakIdx]!.label).toBe('SĞK');
  });

  it('SÖK kanatlar doluyken boş SF slotuna oturur (Gökhan senaryosu)', () => {
    const squad = [
      p({ id: 'kl', name: 'Kane', position: 'KL', currentRating: 64, rating: 64 }),
      p({ id: 'stp', name: 'Kaya', position: 'STP', currentRating: 74, rating: 74 }),
      p({ id: 'sgb', name: 'Petrov', position: 'SÖB', currentRating: 63, rating: 63 }),
      p({ id: 'slk', name: 'Çakır', position: 'SLK', currentRating: 73, rating: 73 }),
      p({ id: 'os', name: 'Kaya2', position: 'OS', currentRating: 63, rating: 63 }),
      p({ id: 'oos', name: 'Öztürk', position: 'OOS', currentRating: 68, rating: 68 }),
      p({ id: 'sgk', name: 'Özdemir', position: 'SÖK', currentRating: 74, rating: 74 }),
      p({ id: 'gokhan', name: 'Gökhan Silva', position: 'SÖK', currentRating: 72, rating: 72 }),
    ];
    expect(slotOf(squad, 'gokhan')).toBe('SF');
    expect(slotOf(squad, 'sgk')).toBe('SĞK');
  });

  it('OS 433 — boş DOS varken OS oyuncusu boş ana mevkisinde kalır (Gökhan Taş)', () => {
    const slots433: PlacementSlotDef[] = [
      { label: 'KL', preferred: ['KL'], zone: 'kaleci' },
      { label: 'SLB', preferred: ['SLB', 'STP'], zone: 'savunma' },
      { label: 'STP', preferred: ['STP'], zone: 'savunma' },
      { label: 'STP', preferred: ['STP'], zone: 'savunma' },
      { label: 'SĞB', preferred: ['SÖB', 'STP'], zone: 'savunma' },
      { label: 'DOS', preferred: ['DOS', 'OS'], zone: 'orta' },
      { label: 'OS', preferred: ['OS', 'OOS', 'DOS'], zone: 'orta' },
      { label: 'OOS', preferred: ['OOS', 'OS'], zone: 'orta' },
      { label: 'SLK', preferred: ['SLK'], zone: 'hucum' },
      { label: 'SF', preferred: ['SF'], zone: 'hucum' },
      { label: 'SĞK', preferred: ['SÖK'], zone: 'hucum' },
    ];
    function slot433(squad: PlayerCard[], id: string) {
      const assigned = assignPlayersByRules(slots433, squad);
      const idx = assigned.findIndex((x) => x?.id === id);
      return idx >= 0 ? slots433[idx]!.label : null;
    }
    const squad = [
      p({ id: 'kl', name: 'Arslan', position: 'KL', currentRating: 71, rating: 71 }),
      ...['slb', 'stp1', 'stp2', 'sgb', 'oos', 'slk', 'sf', 'sgk'].map((id, i) =>
        p({
          id,
          name: id,
          position: (['SLB', 'STP', 'STP', 'SÖB', 'OOS', 'SLK', 'SF', 'SÖK'] as const)[i]!,
          currentRating: 63 + i,
          rating: 63 + i,
        }),
      ),
      p({ id: 'gokhan', name: 'Gökhan Taş', position: 'OS', currentRating: 75, rating: 75 }),
    ];
    expect(slot433(squad, 'gokhan')).toBe('OS');
    expect(slot433(squad, 'oos')).toBe('OOS');
  });

  it('3-5-2 — saf SLK/SÖK gerçek formasyonda kanat slotuna oturur', () => {
    // 3-5-2'de kanat slotları kanat-öncelikli ama bek de kabul eder.
    // Saf bir kanat oyuncusu SF'ye düşmemeli, kendi kanat slotuna oturmalı (regresyon).
    function slot352(squad: PlayerCard[], id: string) {
      const lineup = assignSquadToFormation(squad, '352');
      const found = lineup.find((s) => s.player?.id === id);
      return found ? found.slot.label : null;
    }
    const squad = [
      p({ id: 'kl', name: 'KL', position: 'KL', currentRating: 70, rating: 70 }),
      p({ id: 'stp1', name: 'S1', position: 'STP', currentRating: 70, rating: 70 }),
      p({ id: 'stp2', name: 'S2', position: 'STP', currentRating: 70, rating: 70 }),
      p({ id: 'stp3', name: 'S3', position: 'STP', currentRating: 70, rating: 70 }),
      p({ id: 'dos', name: 'D', position: 'DOS', currentRating: 70, rating: 70 }),
      p({ id: 'os', name: 'O', position: 'OS', currentRating: 70, rating: 70 }),
      p({ id: 'oos', name: 'Oo', position: 'OOS', currentRating: 70, rating: 70 }),
      p({ id: 'sf1', name: 'F1', position: 'SF', currentRating: 70, rating: 70 }),
      p({ id: 'sf2', name: 'F2', position: 'SF', currentRating: 70, rating: 70 }),
      p({ id: 'slk', name: 'Sol Kanat', position: 'SLK', currentRating: 72, rating: 72 }),
      p({ id: 'sok', name: 'Sağ Kanat', position: 'SÖK', currentRating: 72, rating: 72 }),
    ];
    expect(slot352(squad, 'slk')).toBe('SLK');
    expect(slot352(squad, 'sok')).toBe('SĞK');
  });

  it('çift SF — ilk SF doluyken SLK boş ikinci SF’ye kayıp native OOS oyuncusuna OOS açar', () => {
    const slots: PlacementSlotDef[] = [
      { label: 'KL', preferred: ['KL'], zone: 'kaleci' },
      { label: 'OS', preferred: ['OS', 'OOS'], zone: 'orta' },
      { label: 'OOS', preferred: ['OOS', 'SLK'], zone: 'orta' },
      { label: 'SF', preferred: ['SF'], zone: 'hucum' },
      { label: 'SF', preferred: ['SF'], zone: 'hucum' },
    ];
    const squad = [
      p({ id: 'kl', name: 'KL', position: 'KL', currentRating: 70, rating: 70 }),
      p({ id: 'oos', name: 'OOS', position: 'OOS', currentRating: 57, rating: 57 }),
      p({ id: 'slk-flex', name: 'SLK Flex', position: 'SLK', currentRating: 61, rating: 61 }),
      p({ id: 'sf', name: 'SF', position: 'SF', currentRating: 80, rating: 80 }),
    ];
    const assigned = assignPlayersByRules(slots, squad);
    const slotFor = (id: string) => slots[assigned.findIndex((x) => x?.id === id)]?.label;

    expect(slotFor('oos')).toBe('OOS');
    expect(slotFor('slk-flex')).toBe('SF');
  });

  it('4-2-3-1 — boş ikinci DOS varken OS kayıp native OOS oyuncusuna OOS açar', () => {
    const squad = [
      p({ id: 'kl', name: 'KL', position: 'KL', currentRating: 70, rating: 70 }),
      p({ id: 'slb1', name: 'SLB1', position: 'SLB', currentRating: 56, rating: 56 }),
      p({ id: 'sok1', name: 'SÖK1', position: 'SÖK', currentRating: 74, rating: 74 }),
      p({ id: 'sok2', name: 'SÖK2', position: 'SÖK', currentRating: 68, rating: 68 }),
      p({ id: 'sok3', name: 'SÖK3', position: 'SÖK', currentRating: 68, rating: 68 }),
      p({ id: 'oos', name: 'OOS', position: 'OOS', currentRating: 70, rating: 70 }),
      p({ id: 'sob1', name: 'SÖB1', position: 'SÖB', currentRating: 63, rating: 63 }),
      p({ id: 'os-strong', name: 'OS Strong', position: 'OS', currentRating: 73, rating: 73 }),
      p({ id: 'sob2', name: 'SÖB2', position: 'SÖB', currentRating: 81, rating: 81 }),
      p({ id: 'slb2', name: 'SLB2', position: 'SLB', currentRating: 73, rating: 73 }),
      p({ id: 'sok4', name: 'SÖK4', position: 'SÖK', currentRating: 77, rating: 77 }),
      p({ id: 'os-flex', name: 'OS Flex', position: 'OS', currentRating: 72, rating: 72 }),
    ];
    const lineup = assignSquadToFormation(squad, '4231');

    expect(lineup.find((s) => s.player?.id === 'oos')?.slot.label).toBe('OOS');
    expect(lineup.find((s) => s.player?.id === 'os-flex')?.slot.label).toBe('DOS');
  });

  it('flexPositions boş = yalnızca ana mevki', () => {
    const squad = [
      p({ id: 'kl', name: 'KL', position: 'KL', currentRating: 70, rating: 70 }),
      p({ id: 'os', name: 'Tek', position: 'OS', currentRating: 75, rating: 75, flexPositions: [] }),
      ...['slb', 'stp1', 'stp2', 'sgb', 'dos', 'slk', 'sgk', 'sf1', 'sf2'].map((id, i) =>
        p({
          id,
          name: id,
          position: (['SLB', 'STP', 'STP', 'SÖB', 'DOS', 'SLK', 'SÖK', 'SF', 'SF'] as const)[i]!,
          currentRating: 60 + i,
          rating: 60 + i,
        }),
      ),
    ];
    expect(slotOf(squad, 'os')).toBe('OS');
  });

  it('Hasan zinciri — native orta saha korunur, zayıf kanat SF’ye kayar ve herkes sahada kalır', () => {
    const squad = [
      p({ id: 'kl', name: 'KL', position: 'KL' }),
      p({ id: 'slb', name: 'SLB', position: 'SLB' }),
      p({ id: 'stp1', name: 'STP1', position: 'STP' }),
      p({ id: 'stp2', name: 'STP2', position: 'STP' }),
      p({ id: 'sgb', name: 'SĞB', position: 'SÖB' }),
      p({ id: 'gokhan', name: 'Gökhan Taş', position: 'SLK', rating: 67, currentRating: 67 }),
      p({ id: 'tuncay', name: 'Tuncay Bilgin', position: 'OS', rating: 68, currentRating: 68 }),
      p({ id: 'vinicius', name: 'İsmail Vinicius', position: 'OOS', rating: 69, currentRating: 69 }),
      p({ id: 'tyler', name: 'Tyler Özcanlar', position: 'SÖK', rating: 75, currentRating: 75 }),
      p({ id: 'sf', name: 'Mevcut SF', position: 'SF', rating: 74, currentRating: 74 }),
      p({ id: 'hasan', name: 'Hasan Demirci', position: 'DOS', rating: 76, currentRating: 76 }),
    ];
    const lineup = assignSquadToFormation(squad, '442');
    const placedAt = (id: string) => lineup.find((slot) => slot.player?.id === id)?.slot.label;

    expect(lineup.filter((slot) => slot.player)).toHaveLength(11);
    expect(placedAt('hasan')).toBe('DOS');
    expect(placedAt('tuncay')).toBe('OS');
    expect(placedAt('vinicius')).toBe('SLK');
    expect(placedAt('tyler')).toBe('SĞK');
    expect(placedAt('gokhan')).toBe('SF');
  });

  it('bütün formasyonlarda oynayabilen maksimum oyuncu sayısına ulaşır', () => {
    const formations = ['442', '433', '352', '532', '4231', '343', 'diamond', '4411', '3412', '451'];

    for (let sample = 0; sample < 120; sample++) {
      const squad = Array.from({ length: 11 }, (_, index) => {
        const source = PLAYER_POOL[(sample * 17 + index * 31) % PLAYER_POOL.length]!;
        return { ...source, id: `${source.id}-matching-${sample}-${index}` };
      });
      for (const formation of formations) {
        const lineup = assignSquadToFormation(squad, formation);
        const actual = lineup.filter((slot) => slot.player).length;
        expect(actual, `${formation} · örnek ${sample}`).toBe(maximumPlayableCount(squad, formation));
      }
    }
  });
});

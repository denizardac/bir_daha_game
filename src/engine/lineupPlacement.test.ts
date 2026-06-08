import { describe, expect, it } from 'vitest';
import { assignPlayersByRules, type PlacementSlotDef } from '@/engine/lineupPlacement';
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
});

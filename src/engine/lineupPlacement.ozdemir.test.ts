import { describe, expect, it } from 'vitest';
import { assignPlayersByRules, type PlacementSlotDef } from '@/engine/lineupPlacement';
import { assignSquadToFormation, getSquadLineupSummary } from '@/engine/lineupPreview';
import type { PlayerCard } from '@/types';

const SLOTS_433: PlacementSlotDef[] = [
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

describe('SÖK → boş OOS flex (Özdemir senaryosu)', () => {
  const squad = [
    p({ id: 'kl', name: 'Arslan', position: 'KL', currentRating: 71, rating: 71 }),
    p({ id: 'petrov', name: 'Petrov', position: 'SÖB', currentRating: 63, rating: 63 }),
    p({ id: 'ozt', name: 'Öztürk', position: 'STP', currentRating: 83, rating: 83 }),
    p({ id: 'kaya', name: 'Kaya', position: 'STP', currentRating: 74, rating: 74 }),
    p({ id: 'bek', name: 'B.', position: 'SÖB', currentRating: 78, rating: 78 }),
    p({ id: 'dos', name: 'Demirci', position: 'DOS', currentRating: 76, rating: 76 }),
    p({ id: 'os', name: 'Taş', position: 'OS', currentRating: 89, rating: 89 }),
    p({ id: 'slk', name: 'Jones', position: 'SLK', currentRating: 77, rating: 77 }),
    p({ id: 'sf', name: 'Mensah', position: 'SF', currentRating: 85, rating: 85 }),
    p({ id: 'alves', name: 'Alves', position: 'SÖK', currentRating: 80, rating: 80 }),
    p({ id: 'flash', name: 'Flash Özdemir', position: 'SÖK', currentRating: 74, rating: 74 }),
  ];

  it('SÖK yedek kanat kesemeyince boş OOS slotuna oturur', () => {
    const assigned = assignPlayersByRules(SLOTS_433, squad);
    const flashIdx = assigned.findIndex((x) => x?.id === 'flash');
    expect(flashIdx).toBeGreaterThanOrEqual(0);
    expect(SLOTS_433[flashIdx]!.label).toBe('OOS');

    const lineup = assignSquadToFormation(squad, '433');
    const summary = getSquadLineupSummary(squad, [{ id: 'tactic_433', name: '4-3-3', description: '4-3-3', attackMod: 0, defenseMod: 0 }]);
    expect(summary.filled).toBe(11);
    expect(summary.benchPlayers.some((b) => b.id === 'flash')).toBe(false);
    expect(lineup.find((s) => s.slot.label === 'OOS')?.player?.id).toBe('flash');
  });

  it('SÖK kanatlar doluyken OOS, SF’den önce (SF boş olsa bile)', () => {
    const squad = [
      p({ id: 'kl', name: 'KL', position: 'KL', currentRating: 70, rating: 70 }),
      ...['slb', 'stp1', 'stp2', 'sgb', 'dos', 'os', 'slk', 'sgk'].map((id, i) =>
        p({
          id,
          name: id,
          position: (['SLB', 'STP', 'STP', 'SÖB', 'DOS', 'OS', 'SLK', 'SÖK'] as const)[i]!,
          currentRating: 70 + i,
          rating: 70 + i,
        }),
      ),
      p({ id: 'flash', name: 'Flash', position: 'SÖK', currentRating: 74, rating: 74 }),
    ];
    const assigned = assignPlayersByRules(SLOTS_433, squad);
    const flashIdx = assigned.findIndex((x) => x?.id === 'flash');
    expect(SLOTS_433[flashIdx]!.label).toBe('OOS');
  });
});

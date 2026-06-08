import { describe, expect, it } from 'vitest';
import { assignPlayersByRules, type PlacementSlotDef } from '@/engine/lineupPlacement';
import { assignSquadToFormation, slotAcceptsPlayer } from '@/engine/lineupPreview';
import { getPlayerPickSummary } from '@/engine/contextPreview';
import type { PlayerCard, Position } from '@/types';

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

function gk(r = 70) {
  return p({ id: 'gk', name: 'KL', position: 'KL', currentRating: r, rating: r });
}

/** Ana slot dolu, flex slot boş — yedek oyuncu flex’e düşmeli */
describe('flex fallback — ana slot dolu, flex boş (442)', () => {
  it('SÖK → SF (kanatlar dolu)', () => {
    const squad = [
      gk(),
      p({ id: 'slk', name: 'SLK', position: 'SLK', currentRating: 74, rating: 74 }),
      p({ id: 'sgk', name: 'SÖK', position: 'SÖK', currentRating: 74, rating: 74 }),
      p({ id: 'test', name: 'Gökhan', position: 'SÖK', currentRating: 72, rating: 72 }),
      p({ id: 'stp', name: 'STP', position: 'STP', currentRating: 70, rating: 70 }),
      p({ id: 'dos', name: 'DOS', position: 'DOS', currentRating: 68, rating: 68 }),
      p({ id: 'os', name: 'OS', position: 'OS', currentRating: 66, rating: 66 }),
      p({ id: 'oos', name: 'OOS', position: 'OOS', currentRating: 65, rating: 65 }),
    ];
    expect(slotOf(squad, 'test')).toBe('SF');
  });

  it('SLK → SF (kanatlar dolu)', () => {
    const squad = [
      gk(),
      p({ id: 'slk', name: 'SLK', position: 'SLK', currentRating: 74, rating: 74 }),
      p({ id: 'sgk', name: 'SÖK', position: 'SÖK', currentRating: 74, rating: 74 }),
      p({ id: 'test', name: 'Sol', position: 'SLK', currentRating: 72, rating: 72 }),
      p({ id: 'stp', name: 'STP', position: 'STP', currentRating: 70, rating: 70 }),
      p({ id: 'dos', name: 'DOS', position: 'DOS', currentRating: 68, rating: 68 }),
      p({ id: 'os', name: 'OS', position: 'OS', currentRating: 66, rating: 66 }),
      p({ id: 'oos', name: 'OOS', position: 'OOS', currentRating: 65, rating: 65 }),
    ];
    expect(slotOf(squad, 'test')).toBe('SF');
  });

  it('SF → SLK (forvetler dolu)', () => {
    const squad = [
      gk(),
      p({ id: 'sf1', name: 'SF1', position: 'SF', currentRating: 74, rating: 74 }),
      p({ id: 'sf2', name: 'SF2', position: 'SF', currentRating: 73, rating: 73 }),
      p({ id: 'test', name: 'Forvet', position: 'SF', currentRating: 72, rating: 72 }),
      p({ id: 'stp', name: 'STP', position: 'STP', currentRating: 70, rating: 70 }),
      p({ id: 'dos', name: 'DOS', position: 'DOS', currentRating: 68, rating: 68 }),
      p({ id: 'os', name: 'OS', position: 'OS', currentRating: 66, rating: 66 }),
      p({ id: 'sgk', name: 'SÖK', position: 'SÖK', currentRating: 65, rating: 65 }),
    ];
    expect(slotOf(squad, 'test')).toBe('SLK');
  });

  it('STP → SLB (stoperler dolu)', () => {
    const squad = [
      gk(),
      p({ id: 'stp1', name: 'STP1', position: 'STP', currentRating: 74, rating: 74 }),
      p({ id: 'stp2', name: 'STP2', position: 'STP', currentRating: 73, rating: 73 }),
      p({ id: 'test', name: 'Stoper', position: 'STP', currentRating: 72, rating: 72 }),
      p({ id: 'sgb', name: 'SÖB', position: 'SÖB', currentRating: 70, rating: 70 }),
      p({ id: 'dos', name: 'DOS', position: 'DOS', currentRating: 68, rating: 68 }),
      p({ id: 'os', name: 'OS', position: 'OS', currentRating: 66, rating: 66 }),
      p({ id: 'sf', name: 'SF', position: 'SF', currentRating: 65, rating: 65 }),
    ];
    expect(slotOf(squad, 'test')).toBe('SLB');
  });

  it('SLB → STP (sol bek dolu)', () => {
    const squad = [
      gk(),
      p({ id: 'slb', name: 'SLB', position: 'SLB', currentRating: 74, rating: 74 }),
      p({ id: 'test', name: 'Bek', position: 'SLB', currentRating: 72, rating: 72 }),
      p({ id: 'sgb', name: 'SÖB', position: 'SÖB', currentRating: 70, rating: 70 }),
      p({ id: 'dos', name: 'DOS', position: 'DOS', currentRating: 68, rating: 68 }),
      p({ id: 'os', name: 'OS', position: 'OS', currentRating: 66, rating: 66 }),
      p({ id: 'slk', name: 'SLK', position: 'SLK', currentRating: 65, rating: 65 }),
      p({ id: 'sf', name: 'SF', position: 'SF', currentRating: 64, rating: 64 }),
    ];
    expect(slotOf(squad, 'test')).toBe('STP');
  });

  it('SÖB → STP (sağ bek dolu)', () => {
    const squad = [
      gk(),
      p({ id: 'sgb', name: 'SÖB', position: 'SÖB', currentRating: 74, rating: 74 }),
      p({ id: 'test', name: 'Sağ', position: 'SÖB', currentRating: 72, rating: 72 }),
      p({ id: 'slb', name: 'SLB', position: 'SLB', currentRating: 70, rating: 70 }),
      p({ id: 'dos', name: 'DOS', position: 'DOS', currentRating: 68, rating: 68 }),
      p({ id: 'os', name: 'OS', position: 'OS', currentRating: 66, rating: 66 }),
      p({ id: 'slk', name: 'SLK', position: 'SLK', currentRating: 65, rating: 65 }),
      p({ id: 'sf', name: 'SF', position: 'SF', currentRating: 64, rating: 64 }),
    ];
    expect(slotOf(squad, 'test')).toBe('STP');
  });

  it('OS → DOS (OS dolu, native)', () => {
    const squad = [
      gk(),
      p({ id: 'os', name: 'OS', position: 'OS', currentRating: 74, rating: 74 }),
      p({ id: 'test', name: 'Orta', position: 'OS', currentRating: 72, rating: 72 }),
      p({ id: 'stp', name: 'STP', position: 'STP', currentRating: 70, rating: 70 }),
      p({ id: 'slb', name: 'SLB', position: 'SLB', currentRating: 69, rating: 69 }),
      p({ id: 'sgb', name: 'SÖB', position: 'SÖB', currentRating: 68, rating: 68 }),
      p({ id: 'slk', name: 'SLK', position: 'SLK', currentRating: 67, rating: 67 }),
      p({ id: 'sf', name: 'SF', position: 'SF', currentRating: 66, rating: 66 }),
    ];
    expect(slotOf(squad, 'test')).toBe('DOS');
  });

  it('DOS → OS (DOS dolu)', () => {
    const squad = [
      gk(),
      p({ id: 'dos', name: 'DOS', position: 'DOS', currentRating: 74, rating: 74 }),
      p({ id: 'test', name: 'Def', position: 'DOS', currentRating: 72, rating: 72 }),
      p({ id: 'stp', name: 'STP', position: 'STP', currentRating: 70, rating: 70 }),
      p({ id: 'slb', name: 'SLB', position: 'SLB', currentRating: 69, rating: 69 }),
      p({ id: 'sgb', name: 'SÖB', position: 'SÖB', currentRating: 68, rating: 68 }),
      p({ id: 'slk', name: 'SLK', position: 'SLK', currentRating: 67, rating: 67 }),
      p({ id: 'sf', name: 'SF', position: 'SF', currentRating: 66, rating: 66 }),
    ];
    expect(slotOf(squad, 'test')).toBe('OS');
  });

  it('OOS → SĞK (native OS varken boş kanat)', () => {
    const squad = [
      gk(),
      p({ id: 'os', name: 'OS', position: 'OS', currentRating: 74, rating: 74 }),
      p({ id: 'slk', name: 'SLK', position: 'SLK', currentRating: 74, rating: 74 }),
      p({ id: 'test', name: 'OOS', position: 'OOS', currentRating: 72, rating: 72 }),
      p({ id: 'stp', name: 'STP', position: 'STP', currentRating: 70, rating: 70 }),
      p({ id: 'dos', name: 'DOS', position: 'DOS', currentRating: 68, rating: 68 }),
      p({ id: 'slb', name: 'SLB', position: 'SLB', currentRating: 67, rating: 67 }),
      p({ id: 'sf', name: 'SF', position: 'SF', currentRating: 66, rating: 66 }),
    ];
    expect(slotOf(squad, 'test')).toBe('SĞK');
  });
});

/** Önizleme metni — boş SF varken SÖK için yanlış “uyuşmuyor” dememeli */
describe('flex fallback — önizleme metni', () => {
  it('SÖK + boş SF: pick summary sahaya alır, SF uyumsuz demez', () => {
    const squad = [
      gk(64),
      p({ id: 'stp', name: 'Kaya', position: 'STP', currentRating: 74, rating: 74 }),
      p({ id: 'sgb', name: 'Petrov', position: 'SÖB', currentRating: 63, rating: 63 }),
      p({ id: 'slk', name: 'Çakır', position: 'SLK', currentRating: 73, rating: 73 }),
      p({ id: 'os', name: 'Kaya2', position: 'OS', currentRating: 63, rating: 63 }),
      p({ id: 'oos', name: 'Öztürk', position: 'OOS', currentRating: 68, rating: 68 }),
      p({ id: 'sgk', name: 'Özdemir', position: 'SÖK', currentRating: 74, rating: 74 }),
    ];
    const incoming = p({ id: 'gokhan', name: 'Gökhan Silva', position: 'SÖK', currentRating: 72, rating: 72 });
    const summary = getPlayerPickSummary(incoming, squad, 11);
    expect(summary.text).toMatch(/SF|İlk 11/);
    expect(summary.text).not.toMatch(/SF.*uyuşmuyor|uyuşmuyor.*SF/);

    const lineup = assignSquadToFormation([...squad, incoming], '442');
    const emptySf = lineup.filter((s) => !s.player && s.slot.label === 'SF');
    expect(emptySf.length).toBeGreaterThan(0);
    expect(emptySf.some((s) => slotAcceptsPlayer(incoming, s.slot))).toBe(true);
  });
});

/** slotAcceptsPlayer — kart flex’i ile slot uyumu (hepsi true olmalı) */
describe('flex fallback — slotAcceptsPlayer matrisi', () => {
  const cases: Array<{ pos: Position; slotLabel: string; preferred: Position[]; expect: boolean }> = [
    { pos: 'SÖK', slotLabel: 'SF', preferred: ['SF'], expect: true },
    { pos: 'SLK', slotLabel: 'SF', preferred: ['SF'], expect: true },
    { pos: 'SF', slotLabel: 'SLK', preferred: ['SLK', 'OOS'], expect: true },
    { pos: 'STP', slotLabel: 'SLB', preferred: ['SLB', 'STP'], expect: true },
    { pos: 'SLB', slotLabel: 'STP', preferred: ['STP'], expect: true },
    { pos: 'SÖB', slotLabel: 'STP', preferred: ['STP'], expect: true },
    { pos: 'OS', slotLabel: 'DOS', preferred: ['DOS', 'OS'], expect: true },
    { pos: 'DOS', slotLabel: 'OS', preferred: ['OS', 'OOS', 'DOS'], expect: true },
    { pos: 'OOS', slotLabel: 'SĞK', preferred: ['SÖK', 'OOS'], expect: true },
    { pos: 'OS', slotLabel: 'SĞK', preferred: ['SÖK'], expect: false },
    { pos: 'DOS', slotLabel: 'SLK', preferred: ['SLK'], expect: false },
  ];

  it.each(cases)('$pos → $slotLabel = $expect', ({ pos, slotLabel, preferred, expect: exp }) => {
    const player = p({ id: 'x', name: 'X', position: pos, currentRating: 70, rating: 70 });
    const slot = { label: slotLabel, preferred, zone: 'hucum' as const };
    expect(slotAcceptsPlayer(player, slot)).toBe(exp);
  });
});

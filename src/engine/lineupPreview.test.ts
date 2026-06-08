import { describe, expect, it } from 'vitest';
import { getStartingSquad } from '@/data/players';
import { applyPlayerToSquad, assignSquadToFormation, getReplacementPlayer } from '@/engine/lineupPreview';
import type { PlayerCard } from '@/types';

function fieldPlayer(overrides: Partial<PlayerCard> & Pick<PlayerCard, 'id' | 'name' | 'position'>): PlayerCard {
  return {
    kind: 'player',
    rating: 70,
    currentRating: 70,
    rarity: 'iyi',
    tags: [],
    ...overrides,
  };
}

describe('bench-aware replacement', () => {
  it('removes bench GK when adding outfield player to full squad', () => {
    const starters = getStartingSquad().slice(0, 10);
    const benchGk = {
      ...getStartingSquad().find((p) => p.position === 'KL')!,
      id: 'bench_gk',
      name: 'Yedek KL',
      currentRating: 60,
      rating: 60,
    };
    const squad = [...starters, benchGk];
    const incoming = {
      kind: 'player' as const,
      id: 'new_wing',
      name: 'Kanat',
      rating: 75,
      currentRating: 75,
      position: 'SÖK' as const,
      rarity: 'iyi' as const,
      tags: ['HIZLI' as const],
    };
    const out = getReplacementPlayer(squad, incoming, 50, []);
    expect(out.id).toBe('bench_gk');
  });

  it('puts primary OS in OS slot before secondary DOS in 4-4-2', () => {
    const gk = fieldPlayer({ id: 'gk', name: 'Kaleci', position: 'KL', currentRating: 80, rating: 80 });
    const acar = fieldPlayer({ id: 'acar', name: 'Deniz Acar', position: 'OS', currentRating: 62, rating: 62 });
    const yilmaz = fieldPlayer({ id: 'yil', name: 'Hakan Yılmaz', position: 'OS', currentRating: 61, rating: 61 });
    const squad = [gk, acar, yilmaz];
    const lineup = assignSquadToFormation(squad, '442');
    const acarSlot = lineup.find((s) => s.player?.id === 'acar');
    const yilmazSlot = lineup.find((s) => s.player?.id === 'yil');
    expect(acarSlot?.slot.label).toBe('OS');
    expect(yilmazSlot?.slot.label).toBe('DOS');
  });

  it('does not put OS midfielder on SĞK wing slot', () => {
    const gk = fieldPlayer({ id: 'gk', name: 'Kaleci', position: 'KL', currentRating: 70, rating: 70 });
    const polat = fieldPlayer({ id: 'efe', name: 'Efe Polat', position: 'OS', currentRating: 76, rating: 76 });
    const wing = fieldPlayer({ id: 'wing', name: 'Kanatçı', position: 'SÖK', currentRating: 67, rating: 67 });
    const fillers = ['stp1', 'stp2', 'slb', 'sgb', 'dos', 'slk', 'sf1', 'sf2'].map((id, i) =>
      fieldPlayer({
        id,
        name: `Oyuncu ${i}`,
        position: (['STP', 'STP', 'SLB', 'SÖB', 'DOS', 'SLK', 'SF', 'SF'] as const)[i]!,
        currentRating: 60 + i,
        rating: 60 + i,
      }),
    );
    const squad = [gk, ...fillers, polat, wing];
    const lineup = assignSquadToFormation(squad, '442');
    const polatSlot = lineup.find((s) => s.player?.id === 'efe');
    expect(polatSlot?.slot.label).not.toBe('SĞK');
  });

  it('promotes higher-rated STP over weaker starter', () => {
    const gk = fieldPlayer({ id: 'gk', name: 'KL', position: 'KL', currentRating: 70, rating: 70 });
    const weak = fieldPlayer({ id: 'weak', name: 'Zayıf', position: 'STP', currentRating: 60, rating: 60 });
    const mid = fieldPlayer({ id: 'mid', name: 'Orta', position: 'STP', currentRating: 63, rating: 63 });
    const ramos = fieldPlayer({ id: 'ramos', name: 'Diego Ramos', position: 'STP', currentRating: 79, rating: 79 });
    const fillers = ['slb', 'sgb', 'dos', 'os', 'slk', 'sgk', 'sf1', 'sf2'].map((id, i) =>
      fieldPlayer({
        id,
        name: `F ${i}`,
        position: (['SLB', 'SÖB', 'DOS', 'OS', 'SLK', 'SÖK', 'SF', 'SF'] as const)[i]!,
        currentRating: 65 + i,
        rating: 65 + i,
      }),
    );
    const squad = [gk, weak, mid, ...fillers, ramos];
    const lineup = assignSquadToFormation(squad, '442');
    const ramosSlot = lineup.find((s) => s.player?.id === 'ramos');
    expect(ramosSlot).toBeTruthy();
    expect(ramosSlot?.slot.label).toBe('STP');
  });

  it('promotes stronger OS over weaker starter when only incompatible slots are empty', () => {
    const gk = fieldPlayer({ id: 'gk', name: 'KL', position: 'KL', currentRating: 70, rating: 70 });
    const defs = (['slb', 'stp1', 'stp2', 'sgb'] as const).map((id, i) =>
      fieldPlayer({
        id,
        name: id,
        position: (['SLB', 'STP', 'STP', 'SÖB'] as const)[i]!,
        currentRating: 65 + i,
        rating: 65 + i,
      }),
    );
    const mids = [
      fieldPlayer({ id: 'dos', name: 'DOS', position: 'DOS', currentRating: 68, rating: 68 }),
      fieldPlayer({ id: 'weak', name: 'Zayıf OS', position: 'OS', currentRating: 58, rating: 58 }),
      fieldPlayer({ id: 'oos', name: 'OOS', position: 'OOS', currentRating: 67, rating: 67 }),
    ];
    const wings = [
      fieldPlayer({ id: 'slk', name: 'SLK', position: 'SLK', currentRating: 66, rating: 66 }),
      fieldPlayer({ id: 'sf', name: 'SF', position: 'SF', currentRating: 70, rating: 70 }),
      fieldPlayer({ id: 'sgk', name: 'SÖK', position: 'SÖK', currentRating: 69, rating: 69 }),
    ];
    const squad = [gk, ...defs, ...mids, ...wings];
    const umut = fieldPlayer({ id: 'umut', name: 'Umut Sarı', position: 'OS', currentRating: 64, rating: 64, tags: ['YERLİ'] });

    const lineup = assignSquadToFormation([...squad, umut], '433');
    expect(lineup.find((s) => s.player?.id === 'umut')?.slot.label).toBe('OS');
    expect(lineup.some((s) => s.player?.id === 'weak')).toBe(false);
  });

  it('promotes stronger DOS over weaker OS on midfield slot', () => {
    const gk = fieldPlayer({ id: 'gk', name: 'KL', position: 'KL', currentRating: 70, rating: 70 });
    const squad = [
      gk,
      fieldPlayer({ id: 'slb', name: 'SLB', position: 'SLB', currentRating: 65, rating: 65 }),
      fieldPlayer({ id: 'stp1', name: 'STP1', position: 'STP', currentRating: 66, rating: 66 }),
      fieldPlayer({ id: 'stp2', name: 'STP2', position: 'STP', currentRating: 64, rating: 64 }),
      fieldPlayer({ id: 'sgb', name: 'SGB', position: 'SÖB', currentRating: 65, rating: 65 }),
      fieldPlayer({ id: 'dos', name: 'DOS', position: 'DOS', currentRating: 70, rating: 70 }),
      fieldPlayer({ id: 'weak', name: 'Zayıf OS', position: 'OS', currentRating: 59, rating: 59 }),
      fieldPlayer({ id: 'oos', name: 'OOS', position: 'OOS', currentRating: 67, rating: 67 }),
      fieldPlayer({ id: 'slk', name: 'SLK', position: 'SLK', currentRating: 66, rating: 66 }),
      fieldPlayer({ id: 'sf', name: 'SF', position: 'SF', currentRating: 68, rating: 68 }),
    ];
    const nikolai = fieldPlayer({ id: 'nik', name: 'Nikolai Kane', position: 'DOS', currentRating: 66, rating: 66 });

    const lineup = assignSquadToFormation([...squad, nikolai], '442');
    const nikSlot = lineup.find((s) => s.player?.id === 'nik');
    expect(nikSlot?.slot.zone).toBe('orta');
    expect(lineup.some((s) => s.player?.id === 'weak')).toBe(false);
  });

  it('adds player when squad not full', () => {
    const squad = getStartingSquad().slice(0, 5);
    const incoming = {
      kind: 'player' as const,
      id: 'new_sf',
      name: 'Forvet',
      rating: 72,
      currentRating: 72,
      position: 'SF' as const,
      rarity: 'iyi' as const,
      tags: ['FİNİŞÖR' as const],
    };
    const next = applyPlayerToSquad(squad, incoming, 11, 50, []);
    expect(next.length).toBe(6);
  });
});

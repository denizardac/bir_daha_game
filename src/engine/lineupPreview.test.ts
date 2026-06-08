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

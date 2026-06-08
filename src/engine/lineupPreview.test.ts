import { describe, expect, it } from 'vitest';
import { getStartingSquad } from '@/data/players';
import { applyPlayerToSquad, getReplacementPlayer } from '@/engine/lineupPreview';

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

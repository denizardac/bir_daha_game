import { describe, expect, it } from 'vitest';
import { createDebugCode, parseDebugCode } from '@/engine/debugCode';
import type { PlayerCard } from '@/types';

const player: PlayerCard = {
  kind: 'player',
  id: 'p1',
  name: 'Test Oyuncu',
  rating: 70,
  currentRating: 72,
  position: 'OS',
  rarity: 'iyi',
  tags: ['YERLİ'],
};

describe('debug code', () => {
  it('round-trips deterministic state without personal score or display name', () => {
    const code = createDebugCode({
      seed: 'seed-1',
      round: 6,
      squad: [player],
      manualLineup: { 4: player.id },
      incomingPlayerId: player.id,
      outgoingPlayerId: 'old',
    });
    const parsed = parseDebugCode(code);

    expect(code.startsWith('BD1.')).toBe(true);
    expect(parsed).toMatchObject({ seed: 'seed-1', round: 6, incoming: 'p1', outgoing: 'old' });
    expect(parsed?.manual).toEqual({ 4: 'p1' });
    expect(code).not.toContain('displayName');
    expect(code).not.toContain('score');
  });

  it('rejects malformed codes', () => {
    expect(parseDebugCode('invalid')).toBeNull();
  });
});

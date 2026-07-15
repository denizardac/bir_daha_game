import { describe, expect, it } from 'vitest';
import { getEventById } from '@/data/events';
import { applyRandomEventTags, resolveEvent } from '@/engine/events';
import type { PlayerCard } from '@/types';

function player(id: string, rating: number, tags: PlayerCard['tags'] = []): PlayerCard {
  return { kind: 'player', id, name: id, rating, currentRating: rating, position: 'OS', rarity: 'iyi', tags };
}

describe('unlock eventleri', () => {
  it('Efsane Dokunuşu tek oyuncuya aynı anda üç uyumlu trait ekler', () => {
    const event = getEventById('evt_unlock_efsane_dokunusu')!;
    const outcome = resolveEvent(event, 'A', { squad: [], morale: 50, score: 0, activeTactics: [] });
    const result = applyRandomEventTags(
      [player('aday', 85), player('dolu', 90, ['HIZLI', 'GÜÇLÜ', 'DAYANIKLI', 'TEKNİK', 'FİNİŞÖR'])],
      outcome.grantRandomTags ?? 0,
      'unlock-event-seed',
      8,
      event.id,
    );

    expect(result.targetPlayerId).toBe('aday');
    expect(result.addedTags).toHaveLength(3);
    expect(result.squad.find((candidate) => candidate.id === 'aday')?.tags).toHaveLength(3);
  });

  it('Soyunma Odası Yemini kaptanlık ve moral ödülünü üretir', () => {
    const event = getEventById('evt_unlock_soyunma_odasi_yemini')!;
    const outcome = resolveEvent(event, 'A', { squad: [], morale: 50, score: 0, activeTactics: [] });

    expect(outcome.grantTag).toBe('KAPİTAN');
    expect(outcome.moraleDelta).toBe(15);
  });
});

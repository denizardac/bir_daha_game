import { pickEventRatingTarget, pickEventRemovalTarget } from '@/engine/eventSubjects';
import type { ActiveTactic, PlayerCard } from '@/types';

/** Olay metnine uygun çıkış hedefi — "en zayıf" yerine bağlama göre seçim */
export function resolveEventRemoval(
  eventId: string,
  choice: 'A' | 'B',
  squad: PlayerCard[],
  activeTactics: ActiveTactic[],
  sellPlayerId?: string,
): PlayerCard | null {
  return pickEventRemovalTarget(eventId, choice, squad, activeTactics, sellPlayerId);
}

export function getEventRatingTarget(
  eventId: string,
  choice: 'A' | 'B',
  squad: PlayerCard[],
): PlayerCard | null {
  return pickEventRatingTarget(eventId, choice, squad);
}

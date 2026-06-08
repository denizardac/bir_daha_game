import { getStartingEleven } from '@/engine/lineupPreview';
import { getWeakestPlayer } from '@/engine/squadLogic';
import type { ActiveTactic, PlayerCard } from '@/types';

function sortByRatingAsc(squad: PlayerCard[]): PlayerCard[] {
  return [...squad].sort((a, b) => a.currentRating - b.currentRating);
}

function sortByRatingDesc(squad: PlayerCard[]): PlayerCard[] {
  return [...squad].sort((a, b) => b.currentRating - a.currentRating);
}

function getStarFieldPlayer(squad: PlayerCard[]): PlayerCard | null {
  const field = squad.filter((p) => p.position !== 'KL');
  if (!field.length) return squad[0] ?? null;
  return sortByRatingDesc(field)[0]!;
}

function getMidTierPlayer(squad: PlayerCard[]): PlayerCard {
  const sorted = sortByRatingAsc(squad);
  const idx = Math.max(0, Math.floor((sorted.length - 1) / 2));
  return sorted[idx]!;
}

/** Olay metnine uygun çıkış hedefi — "en zayıf" yerine bağlama göre seçim */
export function resolveEventRemoval(
  eventId: string,
  choice: 'A' | 'B',
  squad: PlayerCard[],
  activeTactics: ActiveTactic[],
  sellPlayerId?: string,
): PlayerCard | null {
  if (eventId === 'evt_transfer_teklif' && choice === 'A') {
    if (sellPlayerId) return squad.find((p) => p.id === sellPlayerId) ?? getStarFieldPlayer(squad);
    return getStarFieldPlayer(squad);
  }

  if (eventId === 'evt_kavga' && choice === 'A') {
    const argumentative = squad.filter((p) => p.tags.includes('TARTIŞMALI'));
    if (argumentative.length) return sortByRatingDesc(argumentative)[0]!;
    const field = squad.filter((p) => p.position !== 'KL');
    if (field.length >= 2) return sortByRatingDesc(field)[1]!;
    return getWeakestPlayer(squad);
  }

  if (eventId === 'evt_sakatlik' && choice === 'B') {
    const starters = getStartingEleven(squad, activeTactics);
    const starterIds = new Set(starters.map((p) => p.id));
    const injuredPool = squad.filter((p) => starterIds.has(p.id) && p.position !== 'KL');
    return injuredPool.length ? sortByRatingAsc(injuredPool)[0]! : getWeakestPlayer(squad);
  }

  if (eventId === 'evt_emekli' && choice === 'B') {
    const veterans = squad.filter((p) => p.tags.includes('GERİLEYEN') || p.currentRating >= 76);
    return veterans.length ? sortByRatingDesc(veterans)[0]! : getMidTierPlayer(squad);
  }

  if (eventId === 'evt_menajer_krizi' && choice === 'A') {
    return getMidTierPlayer(squad);
  }

  if (eventId === 'evt_aile' && choice === 'B') {
    const starters = getStartingEleven(squad, activeTactics);
    const local = starters.filter((p) => p.tags.includes('YERLİ'));
    if (local.length) return sortByRatingAsc(local)[0]!;
    return starters.length ? sortByRatingAsc(starters)[0]! : getWeakestPlayer(squad);
  }

  if (eventId === 'evt_diger_kulup' && choice === 'A') {
    const protectedPool = squad.filter((p) =>
      !p.tags.some((t) => ['MENTOR', 'LİDER', 'KAPİTAN'].includes(t)),
    );
    return getWeakestPlayer(protectedPool.length ? protectedPool : squad);
  }

  const genericRemove: Record<string, 'A' | 'B'> = {
    evt_sakatlik: 'B',
    evt_diger_kulup: 'A',
    evt_emekli: 'B',
    evt_aile: 'B',
    evt_menajer_krizi: 'A',
  };

  if (genericRemove[eventId] === choice) {
    return getWeakestPlayer(squad);
  }

  return null;
}

export function getEventRatingTarget(
  eventId: string,
  choice: 'A' | 'B',
  squad: PlayerCard[],
): PlayerCard | null {
  if (eventId === 'evt_sakatlik' && choice === 'A') return getStarFieldPlayer(squad);
  if (eventId === 'evt_kaleci_hata' && choice === 'A') {
    return squad.find((p) => p.position === 'KL') ?? null;
  }
  if (eventId === 'evt_kaptan' && choice === 'A') {
    return squad.find((p) => p.tags.includes('KAPİTAN') || p.tags.includes('LİDER')) ?? getStarFieldPlayer(squad);
  }
  return null;
}

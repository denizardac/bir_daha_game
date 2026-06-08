import { EVENT_EFFECTS } from '@/data/eventEffects';
import { PLAYER_POOL, clonePlayer } from '@/data/players';
import { createRng, pickOne } from '@/engine/seed';
import { EVENT_CARDS } from '@/data/events';
import type { EventCard, GameState, PlayerCard, Position } from '@/types';

export function drawEvent(seed: string, round: number, usedIds: string[]): EventCard {
  const rng = createRng(seed, 'event', round);
  const pool = EVENT_CARDS.filter((e) => !usedIds.includes(e.id));
  return pickOne(rng, pool.length > 0 ? pool : EVENT_CARDS);
}

export interface EventOutcome {
  moraleDelta: number;
  scoreDelta: number;
  removeWeakest?: boolean;
  addYouth?: boolean;
  nextMatchRisk?: number;
  nextMatchBonus?: number;
  description: string;
}

export function resolveEvent(
  event: EventCard,
  choice: 'A' | 'B',
  _state: Pick<GameState, 'squad' | 'morale' | 'score'>,
): EventOutcome {
  const pair = EVENT_EFFECTS[event.id];
  if (pair) return choice === 'A' ? pair[0] : pair[1];
  return {
    moraleDelta: choice === 'B' ? 5 : 0,
    scoreDelta: 0,
    description: 'Karar uygulandı.',
  };
}

const LOAN_FIRST = ['Mateo', 'Luca', 'Rafael', 'Kenji', 'Amir', 'Felix', 'Noah', 'Diego', 'Victor', 'James'];
const LOAN_LAST = ['Silva', 'Costa', 'Santos', 'Kane', 'Reed', 'Mensah', 'Dupont', 'Novak', 'Haddad', 'Brooks'];
const LOAN_POSITIONS: Position[] = ['SLK', 'SÖK', 'SF', 'OOS', 'DOS', 'STP', 'SLB', 'SÖB'];

export function previewEventPlayer(seed: string, round: number, eventId: string): PlayerCard {
  if (eventId === 'evt_genc_yetenek') return createYouthPlayer(seed, round);
  if (eventId === 'evt_kiralik' || eventId === 'evt_scout') return createLoanPlayer(seed, round);
  return createYouthPlayer(seed, round);
}

export function createYouthPlayer(seed: string, round: number): PlayerCard {
  const rng = createRng(seed, 'youth', round);
  const rating = 62 + Math.floor(rng() * 6);
  return clonePlayer({
    kind: 'player',
    id: `youth_${round}_${Math.floor(rng() * 9999)}`,
    name: 'Genç Yetenek',
    rating,
    currentRating: rating,
    position: 'OS',
    rarity: 'normal',
    tags: ['POTANSİYEL', 'YERLİ'],
    potentialCeiling: 82,
  });
}

export function createLoanPlayer(seed: string, round: number): PlayerCard {
  const rng = createRng(seed, 'loan', round);
  const fromPool = PLAYER_POOL[Math.floor(rng() * PLAYER_POOL.length)];
  if (fromPool && rng() < 0.35) {
    return clonePlayer({
      ...fromPool,
      id: `loan_${round}_${Math.floor(rng() * 9999)}`,
      name: `${fromPool.name} (Kiralık)`,
    });
  }
  const fi = Math.floor(rng() * LOAN_FIRST.length);
  const li = Math.floor(rng() * LOAN_LAST.length);
  const pos = LOAN_POSITIONS[Math.floor(rng() * LOAN_POSITIONS.length)]!;
  const rating = 68 + Math.floor(rng() * 14);
  return clonePlayer({
    kind: 'player',
    id: `loan_${round}_${Math.floor(rng() * 9999)}`,
    name: `${LOAN_FIRST[fi]} ${LOAN_LAST[li]}`,
    rating,
    currentRating: rating,
    position: pos,
    rarity: rating >= 80 ? 'güçlü' : rating >= 72 ? 'iyi' : 'normal',
    tags: rating >= 78 ? ['FİNİŞÖR'] : rating >= 72 ? ['TEKNİK'] : ['DAYANIKLI'],
  });
}

export const EVENT_CARD_COUNT = EVENT_CARDS.length;

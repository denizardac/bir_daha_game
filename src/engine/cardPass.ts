import { isFinaleRound, isTacticBonusRound } from '@/engine/roundFlow';
import type { GameCard, GamePhase, SkipCard } from '@/types';
import { isPlayerCard } from '@/types';

export function createSkipCard(round: number): SkipCard {
  return {
    kind: 'skip',
    id: `skip-r${round}`,
    name: 'Pas geç',
    description: 'Oyuncu almadan maça devam',
  };
}

export function canPassCardPick(params: {
  phase: GamePhase;
  round: number;
  maxRounds: number;
  squadLength: number;
  maxSquadSize: number;
  currentOffers: GameCard[];
}): boolean {
  if (params.phase !== 'cardSelect') return false;
  if (isTacticBonusRound(params.round, params.maxRounds)) return false;
  if (isFinaleRound(params.round, params.maxRounds)) return false;
  if (params.squadLength < params.maxSquadSize) return false;
  if (!params.currentOffers.length) return false;
  return params.currentOffers.every(isPlayerCard);
}

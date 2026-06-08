import type { PlayerCard, Position } from '@/types';
import { POSITION_BADGE, POSITION_LABELS } from '@/utils/positionStyle';

/** Birincil mevkiye göre oynayabildiği ek slotlar */
export const SECONDARY_POSITIONS: Partial<Record<Position, Position[]>> = {
  OS: ['DOS', 'OOS'],
  OOS: ['OS', 'DOS'],
  DOS: ['OS', 'OOS'],
  SF: ['SLK', 'SÖK'],
  SLK: ['SF', 'SÖK', 'OOS'],
  SÖK: ['SF', 'SLK', 'OOS'],
  STP: ['SLB', 'SÖB'],
  SLB: ['STP', 'SÖB'],
  SÖB: ['STP', 'SLB'],
};

export function getPlayablePositions(player: Pick<PlayerCard, 'position'>): Position[] {
  const extra = SECONDARY_POSITIONS[player.position] ?? [];
  return [player.position, ...extra.filter((p) => p !== player.position)];
}

export function playerPlaysPosition(player: Pick<PlayerCard, 'position'>, target: Position): boolean {
  return getPlayablePositions(player).includes(target);
}

/** Slot tercih listesinde en iyi eşleşme — 0 = ideal, 99 = uyumsuz */
export function slotFitIndex(player: Pick<PlayerCard, 'position'>, preferred: Position[]): number {
  const playable = getPlayablePositions(player);
  let best = 99;
  for (const pos of playable) {
    const idx = preferred.indexOf(pos);
    if (idx >= 0 && idx < best) best = idx;
  }
  return best;
}

export function formatAltPositionsBadge(primary: Position): string | null {
  const alt = SECONDARY_POSITIONS[primary];
  if (!alt?.length) return null;
  return alt.map((p) => POSITION_BADGE[p]).join(' · ');
}

export function formatAltPositionsLabel(primary: Position): string | null {
  const alt = SECONDARY_POSITIONS[primary];
  if (!alt?.length) return null;
  return alt.map((p) => POSITION_LABELS[p]).join(', ');
}

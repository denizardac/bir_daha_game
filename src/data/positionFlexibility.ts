import type { PlayerCard, Position } from '@/types';
import { POSITION_BADGE, POSITION_LABELS } from '@/utils/positionStyle';

/** Varsayılan yan roller — oyuncuda flexPositions yoksa kullanılır */
export const DEFAULT_FLEX_POSITIONS: Partial<Record<Position, Position[]>> = {
  OS: ['DOS', 'OOS'],
  OOS: ['OS', 'SÖK', 'SLK'],
  DOS: ['OS', 'OOS'],
  SF: ['SLK', 'SÖK'],
  SLK: ['SF', 'SÖK', 'OOS'],
  SÖK: ['SF', 'SLK', 'OOS'],
  STP: ['SLB', 'SÖB'],
  SLB: ['STP', 'SÖB'],
  SÖB: ['STP', 'SLB'],
};

/** @deprecated — DEFAULT_FLEX_POSITIONS kullan */
export const SECONDARY_POSITIONS = DEFAULT_FLEX_POSITIONS;

export function getPlayablePositions(player: Pick<PlayerCard, 'position' | 'flexPositions'>): Position[] {
  if (player.flexPositions !== undefined) {
    const extra = player.flexPositions.filter((p) => p !== player.position);
    return extra.length ? [player.position, ...extra] : [player.position];
  }
  const extra = DEFAULT_FLEX_POSITIONS[player.position] ?? [];
  return [player.position, ...extra.filter((p) => p !== player.position)];
}

export function playerPlaysPosition(
  player: Pick<PlayerCard, 'position' | 'flexPositions'>,
  target: Position,
): boolean {
  return getPlayablePositions(player).includes(target);
}

/** Slot tercih listesinde en iyi eşleşme — 0 = ideal, 99 = uyumsuz */
export function slotFitIndex(
  player: Pick<PlayerCard, 'position' | 'flexPositions'>,
  preferred: Position[],
): number {
  const playable = getPlayablePositions(player);
  let best = 99;
  for (const pos of playable) {
    const idx = preferred.indexOf(pos);
    if (idx >= 0 && idx < best) best = idx;
  }
  return best;
}

export type SlotFitTier = 'ideal' | 'flex' | 'forced';

/** ideal = ana mevki; flex = ikincil mevki; forced = uyumsuz */
export function getSlotFitTier(
  player: Pick<PlayerCard, 'position' | 'flexPositions'>,
  preferred: Position[],
): SlotFitTier {
  const fit = slotFitIndex(player, preferred);
  if (fit >= 99) return 'forced';
  const ideal = preferred[0];
  if (ideal && player.position === ideal) return 'ideal';
  return 'flex';
}

export function formatAltPositionsBadge(primary: Position): string | null {
  const alt = DEFAULT_FLEX_POSITIONS[primary];
  if (!alt?.length) return null;
  return alt.map((p) => POSITION_BADGE[p]).join(' · ');
}

export function formatAltPositionsLabel(primary: Position): string | null {
  const alt = DEFAULT_FLEX_POSITIONS[primary];
  if (!alt?.length) return null;
  return alt.map((p) => POSITION_LABELS[p]).join(', ');
}

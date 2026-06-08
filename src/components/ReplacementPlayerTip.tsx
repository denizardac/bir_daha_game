import type { ReactNode } from 'react';
import { HoverTip } from '@/components/HoverTip';
import type { PlayerCard } from '@/types';
import { formatPosition } from '@/utils/positionStyle';

interface Props {
  player: PlayerCard;
  children: ReactNode;
}

export function ReplacementPlayerTip({ player, children }: Props) {
  const tagLine = player.tags.length ? `\nNitelikler: ${player.tags.join(', ')}` : '';
  const tip = `${player.name} · ${formatPosition(player.position)} · ${player.currentRating}${tagLine}\n\nBu oyuncu kadrodan çıkar.`;

  return (
    <HoverTip tip={tip} className="replacement-tip-wrap">
      {children}
    </HoverTip>
  );
}

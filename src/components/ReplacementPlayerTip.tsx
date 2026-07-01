import type { ReactNode } from 'react';
import { HoverTip } from '@/components/HoverTip';
import type { PlayerCard } from '@/types';
import { formatPosition } from '@/utils/positionStyle';

interface Props {
  player: PlayerCard;
  children: ReactNode;
  kind?: 'squad' | 'lineup';
}

export function ReplacementPlayerTip({ player, children, kind = 'squad' }: Props) {
  const action = kind === 'lineup'
    ? 'İlk 11’den çıkar, yedek kalır.'
    : 'Kadrodan çıkar.';
  const tags = player.tags.slice(0, 2).join(', ');
  const tip = `${player.name} · ${formatPosition(player.position)} · ${player.currentRating}${tags ? ` · ${tags}` : ''}\n${action}`;

  return (
    <HoverTip tip={tip} className="replacement-tip-wrap" placement="top">
      {children}
    </HoverTip>
  );
}

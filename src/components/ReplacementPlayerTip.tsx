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
  const tagLine = player.tags.length ? `\nNitelikler: ${player.tags.join(', ')}` : '';
  const action = kind === 'lineup'
    ? 'Bu oyuncu ilk 11\'den çıkar, yedek kalır.'
    : 'Bu oyuncu kadrodan çıkar.';
  const tip = `${player.name} · ${formatPosition(player.position)} · ${player.currentRating}${tagLine}\n\n${action}`;

  return (
    <HoverTip tip={tip} className="replacement-tip-wrap">
      {children}
    </HoverTip>
  );
}

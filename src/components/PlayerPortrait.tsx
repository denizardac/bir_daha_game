import type { CSSProperties } from 'react';
import { PositionGlyph, getPositionZoneColor, getTagAccentColor } from '@/components/PositionGlyph';
import type { PlayerCard } from '@/types';

interface Props {
  player: Pick<PlayerCard, 'position' | 'tags' | 'name'>;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTag?: boolean;
  starter?: boolean;
}

export function PlayerPortrait({ player, size = 'md', showTag = true, starter = false }: Props) {
  const posColor = getPositionZoneColor(player.position);
  const tagColor = getTagAccentColor(player.tags[0]);

  return (
    <div
      className={`player-portrait player-portrait--${size}${starter ? ' player-portrait--starter' : ''}`}
      title={starter ? `${player.name} · İlk 11` : player.name}
      style={
        {
          '--portrait-zone': posColor,
          '--portrait-tag': tagColor ?? posColor,
        } as CSSProperties
      }
    >
      <span className="player-portrait-shine" aria-hidden />
      <PositionGlyph
        position={player.position}
        className="player-portrait-glyph"
        compact={size === 'xs' || size === 'sm'}
      />
      {showTag && tagColor && (
        <span className="player-portrait-tag-dot" aria-hidden title={player.tags[0]} />
      )}
      {starter && (
        <span className="player-portrait-starter" aria-label="İlk 11" title="İlk 11">11</span>
      )}
    </div>
  );
}

import type { CSSProperties } from 'react';
import { UiIcon } from '@/components/UiIcon';
import { TAG_DESCRIPTIONS } from '@/data/tags';
import type { PlayerCard } from '@/types';
import { formationSlotLabel, POSITION_BADGE, POSITION_LABELS, TAG_AVATAR_BG } from '@/utils/positionStyle';
import { iconForTag } from '@/utils/gameIcons';
import type { Tag } from '@/types';

type FitTone = 'ideal' | 'flex' | 'forced' | 'bench';

interface Props {
  player: PlayerCard;
  slotLabel?: string;
  fit?: FitTone;
}

function tagPrimaryColor(tag: Tag): string {
  const bg = TAG_AVATAR_BG[tag] ?? '';
  const colors = [...bg.matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => m[0]);
  return colors[1] ?? colors[0] ?? '#8a948f';
}

export function getLineupPlayerHoverAria(player: PlayerCard, slotLabel?: string, fit: FitTone = 'ideal'): string {
  const slotText = slotLabel ? `${formationSlotLabel(slotLabel)} ${slotLabel}` : 'Yedek';
  const fitText = fit === 'flex' ? 'yan mevki' : fit === 'bench' ? 'yedek' : 'ana mevki';
  return `${player.name}, ${player.currentRating}, ${POSITION_LABELS[player.position]}, ${slotText}, ${fitText}`;
}

export function LineupPlayerHoverCard({ player, slotLabel, fit = 'ideal' }: Props) {
  const isFlex = fit === 'flex' || fit === 'forced';
  const isBench = fit === 'bench';

  return (
    <div className={`lineup-hover-card lineup-hover-card--${fit}`}>
      <div className="lineup-hover-top">
        <div className="lineup-hover-rating-col">
          <span className="lineup-hover-rating">{player.currentRating}</span>
          <span className="lineup-hover-pos-badge">{POSITION_BADGE[player.position]}</span>
        </div>
        <div className="lineup-hover-info">
          <strong className="lineup-hover-name">{player.name}</strong>
          <span className="lineup-hover-pos-label">{POSITION_LABELS[player.position]}</span>
          {slotLabel && (
            <span className="lineup-hover-slot">
              {formationSlotLabel(slotLabel)}
              {isFlex && <span className="lineup-hover-flex-badge">yan mevki</span>}
              {isBench && <span className="lineup-hover-bench-badge">yedek</span>}
            </span>
          )}
        </div>
      </div>

      {player.tags.length > 0 && (
        <div className="lineup-hover-tags">
          {player.tags.slice(0, 4).map((tag) => {
            const color = tagPrimaryColor(tag);
            return (
              <span
                key={tag}
                className="lineup-hover-tag"
                title={TAG_DESCRIPTIONS[tag]}
                style={{ color, background: `${color}18`, border: `1px solid ${color}44` } as CSSProperties}
              >
                <UiIcon name={iconForTag(tag)} />
                {tag}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

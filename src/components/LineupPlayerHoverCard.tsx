import { getPlayablePositions } from '@/data/positionFlexibility';
import { TAG_DESCRIPTIONS, TAG_ICONS } from '@/data/tags';
import type { PlayerCard } from '@/types';
import { formationSlotLabel, POSITION_BADGE, POSITION_LABELS } from '@/utils/positionStyle';

type FitTone = 'ideal' | 'flex' | 'forced' | 'bench';

interface Props {
  player: PlayerCard;
  slotLabel?: string;
  fit?: FitTone;
}

function fitCopy(fit: FitTone, slotLabel?: string): { label: string; detail: string } {
  if (fit === 'bench') {
    return { label: 'Yedek', detail: 'Şu an ilk 11 dışında' };
  }
  if (fit === 'forced') {
    return { label: 'Uyumsuz', detail: `${slotLabel ?? 'Bu slot'} oyuncuya zayıf uyuyor` };
  }
  if (fit === 'flex') {
    return { label: 'Yan mevki', detail: `${slotLabel ?? 'Bu slot'} oynanabilir ama ana mevki değil` };
  }
  return { label: 'Ana mevki', detail: 'Oyuncu doğal rolünde oynuyor' };
}

export function getLineupPlayerHoverAria(player: PlayerCard, slotLabel?: string, fit: FitTone = 'ideal'): string {
  const fitText = fitCopy(fit, slotLabel);
  const slotText = slotLabel ? `${formationSlotLabel(slotLabel)} ${slotLabel}` : 'Yedek';
  return `${player.name}, ${player.currentRating}, ${POSITION_LABELS[player.position]}, ${slotText}, ${fitText.label}`;
}

export function LineupPlayerHoverCard({ player, slotLabel, fit = 'ideal' }: Props) {
  const playable = getPlayablePositions(player);
  const fitText = fitCopy(fit, slotLabel);

  return (
    <div className={`lineup-player-tip-card lineup-player-tip-card--${fit}`}>
      <div className="lineup-player-tip-head">
        <div className="lineup-player-tip-rating">
          <strong>{player.currentRating}</strong>
          <span>{POSITION_BADGE[player.position]}</span>
        </div>
        <div className="lineup-player-tip-title">
          <strong>{player.name}</strong>
          <span>{POSITION_LABELS[player.position]}</span>
        </div>
        <span className="lineup-player-tip-fit">{fitText.label}</span>
      </div>

      <div className="lineup-player-tip-grid">
        <span>Ana mevki</span>
        <strong>{POSITION_LABELS[player.position]} ({POSITION_BADGE[player.position]})</strong>
        <span>{slotLabel ? 'Bu slot' : 'Durum'}</span>
        <strong>{slotLabel ? `${formationSlotLabel(slotLabel)} (${slotLabel})` : 'Yedek'}</strong>
        <span>Oynayabildiği</span>
        <strong>{playable.map((pos) => POSITION_BADGE[pos]).join(' · ')}</strong>
      </div>

      <p className="lineup-player-tip-note">{fitText.detail}</p>

      {player.tags.length > 0 ? (
        <div className="lineup-player-tip-tags">
          {player.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="lineup-player-tip-tag" title={TAG_DESCRIPTIONS[tag]}>
              <span aria-hidden>{TAG_ICONS[tag]}</span>
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <p className="lineup-player-tip-empty">Tag yok</p>
      )}
    </div>
  );
}

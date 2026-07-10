import type { GameCard, PlayerCard } from '@/types';
import { PlayerPortrait } from '@/components/PlayerPortrait';
import { formatPosition } from '@/utils/positionStyle';
import { UiIcon } from '@/components/UiIcon';

interface Props {
  selection: GameCard | null;
  subtitle?: string;
  size?: 'md' | 'lg';
}

export function PlayerHero({ selection, subtitle, size = 'lg' }: Props) {
  if (!selection) return null;

  if (selection.kind === 'player') {
    const card = selection as PlayerCard;
    const large = size === 'lg';
    return (
      <div className="player-hero text-center">
        <div className="mx-auto w-fit">
          <PlayerPortrait player={card} size={large ? 'lg' : 'md'} />
        </div>
        <p className={`mt-4 font-extrabold ${large ? 'text-3xl' : 'text-xl'}`}>{card.name}</p>
        <p className={`mt-1 font-bold text-neutral-300 ${large ? 'text-xl' : 'text-base'}`}>
          {formatPosition(card.position)} · <span className="text-white">{card.currentRating}</span>
        </p>
        {card.tags.length > 0 && (
          <p className="mt-2 text-sm text-amber-300">{card.tags.join(' · ')}</p>
        )}
        {subtitle && <p className="mt-3 text-sm leading-relaxed text-neutral-400">{subtitle}</p>}
      </div>
    );
  }

  if (selection.kind === 'tactic') {
    return (
      <div className="player-hero text-center">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl border border-purple-500/50 bg-purple-950/40 text-5xl shadow-lg">
          <UiIcon name="clipboard" />
        </div>
        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-purple-400">Taktik · Sistem</p>
        <p className="text-3xl font-extrabold">{selection.name}</p>
        <p className="mt-1 text-base text-neutral-400">{selection.effectSummary}</p>
        {subtitle && <p className="mt-3 text-sm leading-relaxed text-neutral-400">{subtitle}</p>}
      </div>
    );
  }

  return null;
}

interface MiniProps {
  player: PlayerCard;
  label?: string;
  strikethrough?: boolean;
  highlight?: 'loss' | 'gain';
  extra?: string;
}

export function PlayerHeroMini({ player, label, strikethrough, highlight, extra }: MiniProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight === 'loss'
          ? 'border-red-500/60 bg-red-950/30'
          : highlight === 'gain'
            ? 'border-emerald-500/40 bg-emerald-950/20'
            : 'border-neutral-700 bg-neutral-900'
      }`}
    >
      {label && (
        <p className={`mb-2 text-xs font-bold uppercase ${highlight === 'loss' ? 'text-red-400' : 'text-neutral-500'}`}>
          {label}
        </p>
      )}
      <div className="flex items-center gap-4">
        <PlayerPortrait player={player} size="md" />
        <div className="min-w-0 flex-1 text-left">
          <p className={`text-2xl font-extrabold ${strikethrough ? 'line-through decoration-red-500 decoration-2' : ''}`}>
            {player.name}
          </p>
          <p className="text-base text-neutral-400">
            {formatPosition(player.position)} · <span className="font-bold text-white">{player.currentRating}</span>
          </p>
          {extra && <p className="mt-1 text-sm text-neutral-500">{extra}</p>}
        </div>
      </div>
    </div>
  );
}

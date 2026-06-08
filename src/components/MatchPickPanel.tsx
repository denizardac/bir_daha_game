import { getTagBite } from '@/data/biteTips';
import { PlayerPortrait } from '@/components/PlayerPortrait';
import type { GameCard } from '@/types';
import { isPlayerCard, isSkipCard, isTacticCard } from '@/types';
import type { OpponentStyle } from '@/types';
import { formatPosition } from '@/utils/positionStyle';

const OPPONENT_STYLE_META: Record<
  OpponentStyle,
  { icon: string; label: string; desc: string; className: string }
> = {
  savunmacı: {
    icon: '🛡️',
    label: 'Savunmacı',
    desc: 'Rakip oyun tarzı — az gol yer, kontra bekler',
    className: 'opponent-style-badge--defensive',
  },
  saldırgan: {
    icon: '⚔️',
    label: 'Saldırgan',
    desc: 'Rakip oyun tarzı — yüksek baskı, savunma açık',
    className: 'opponent-style-badge--aggressive',
  },
  dengeli: {
    icon: '⚖️',
    label: 'Dengeli',
    desc: 'Rakip oyun tarzı — standart tempo',
    className: 'opponent-style-badge--balanced',
  },
};

export function OpponentStyleBadge({ style }: { style: OpponentStyle }) {
  const meta = OPPONENT_STYLE_META[style];
  return (
    <div className={`opponent-style-badge ${meta.className}`} title={meta.desc}>
      <span className="opponent-style-icon" aria-hidden>{meta.icon}</span>
      <div className="opponent-style-text">
        <span className="opponent-style-kicker">Rakip tarzı</span>
        <span className="opponent-style-label">{meta.label}</span>
      </div>
    </div>
  );
}

interface Props {
  selection: GameCard;
  subtitle: string;
}

export function MatchPickPanel({ selection, subtitle }: Props) {
  if (isPlayerCard(selection)) {
    return (
      <div className="match-pick-panel">
        <p className="match-panel-label">Seçimin</p>
        <div className="match-pick-row">
          <PlayerPortrait player={selection} size="lg" />
          <div className="match-pick-info">
            <h3 className="match-pick-name">{selection.name}</h3>
            <p className="match-pick-meta">
              {formatPosition(selection.position)} · {selection.currentRating}
            </p>
            {selection.tags.length > 0 && (
              <div className="match-pick-tag-bites">
                {selection.tags.map((t) => (
                  <div key={t} className="match-pick-tag-bite">
                    <span className="match-pick-tag">{t}</span>
                    <span className="match-pick-tag-desc">{getTagBite(t)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="match-pick-sub">{subtitle}</p>
      </div>
    );
  }

  if (isTacticCard(selection)) {
    return (
      <div className="match-pick-panel match-pick-panel--tactic">
        <p className="match-panel-label">Taktik seçtin</p>
        <div className="match-pick-tactic-icon">📋</div>
        <h3 className="match-pick-name">{selection.name}</h3>
        <p className="match-pick-meta">{selection.effectSummary}</p>
        <p className="match-pick-tactic-desc">{selection.description}</p>
        <p className="match-pick-sub">{subtitle}</p>
      </div>
    );
  }

  if (isSkipCard(selection)) {
    return (
      <div className="match-pick-panel match-pick-panel--skip">
        <p className="match-panel-label">Seçimin</p>
        <div className="match-pick-skip-icon" aria-hidden>⏭</div>
        <h3 className="match-pick-name">{selection.name}</h3>
        <p className="match-pick-meta">{selection.description}</p>
        <p className="match-pick-sub">{subtitle}</p>
      </div>
    );
  }

  return null;
}

export function MatchTeamCard({
  label,
  rating,
  meta,
  side,
  squadSize,
  maxSquadSize,
  opponentStyle,
}: {
  label: string;
  rating: number;
  meta?: string;
  side: 'home' | 'away';
  squadSize?: number;
  maxSquadSize?: number;
  opponentStyle?: OpponentStyle;
}) {
  const pct = Math.min(100, Math.round((rating / 95) * 100));
  const understrength = squadSize !== undefined && maxSquadSize !== undefined && squadSize < maxSquadSize;

  return (
    <div className={`match-team-card match-team-card--${side}`}>
      <p className="match-team-label">{label}</p>
      <p className="match-team-rating">{rating}</p>
      <div className="match-team-bar">
        <div className="match-team-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      {side === 'home' && squadSize !== undefined && maxSquadSize !== undefined && (
        <p className={`match-team-squad-size ${understrength ? 'match-team-squad-size--warn' : ''}`}>
          {squadSize}/{maxSquadSize} oyuncu
          {understrength && ' · eksik kadro'}
        </p>
      )}
      {meta && <p className="match-team-meta">{meta}</p>}
      {opponentStyle && <OpponentStyleBadge style={opponentStyle} />}
    </div>
  );
}

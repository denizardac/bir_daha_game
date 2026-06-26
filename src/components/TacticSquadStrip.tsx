import type { CSSProperties } from 'react';
import { getTagAccentColor } from '@/components/PositionGlyph';
import { TAG_ICONS } from '@/data/tags';
import { getTacticBeneficiaryPlayers } from '@/engine/tacticVisual';
import type { PlayerCard, TacticCard } from '@/types';
import { POSITION_BADGE, formatPosition } from '@/utils/positionStyle';

interface Props {
  card: TacticCard;
  squad: PlayerCard[];
  /** Alt uyarı metni üst blokta gösteriliyorsa şeritte tekrar etme */
  hideHint?: boolean;
}

export function TacticSquadStrip({ card, squad, hideHint }: Props) {
  const { players, tag, label, reason, scope } = getTacticBeneficiaryPlayers(card, squad);

  return (
    <div className={`tactic-squad-strip tactic-squad-strip--${scope}`}>
      <div className="tactic-squad-strip-head">
        <p className="tactic-squad-strip-label">{scope === 'team' ? 'Etki kapsamı' : 'Kadrodan etkilenenler'}</p>
        {tag && (
          <div
            className="tactic-squad-tag-badge"
            style={{ '--tag-accent': getTagAccentColor(tag) ?? '#fbbf24' } as CSSProperties}
          >
            <span className="tactic-squad-tag-dot" aria-hidden />
            <span>{tag}</span>
          </div>
        )}
      </div>
      {players.length > 0 ? (
        <div className="tactic-squad-player-list">
          {players.map((p) => (
            <div key={p.id} className="tactic-squad-player-row" title={`${p.name} · ${formatPosition(p.position)}`}>
              <div className="tactic-squad-player-rating">
                <strong>{p.currentRating}</strong>
                <span>{POSITION_BADGE[p.position]}</span>
              </div>
              <div className="tactic-squad-player-body">
                <span className="tactic-squad-player-name">{p.name}</span>
                {p.tags.length > 0 && (
                  <span className="tactic-squad-player-tags">
                    {p.tags.slice(0, 3).map((t) => (
                      <span key={t} className="tactic-squad-player-tag">
                        <span aria-hidden>{TAG_ICONS[t]}</span>
                        {t}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="tactic-squad-team-effect">
          <span className="tactic-squad-team-icon" aria-hidden>{tag ? '!' : '↔'}</span>
          <span>{label}</span>
        </div>
      )}
      <p className="tactic-squad-strip-reason">{reason}</p>
      {!hideHint && <p className="tactic-squad-strip-hint">{label}</p>}
    </div>
  );
}

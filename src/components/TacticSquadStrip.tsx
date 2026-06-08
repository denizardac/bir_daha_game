import type { CSSProperties } from 'react';
import { getTagAccentColor } from '@/components/PositionGlyph';
import { PlayerPortrait } from '@/components/PlayerPortrait';
import { getTacticBeneficiaryPlayers } from '@/engine/tacticVisual';
import type { PlayerCard, TacticCard } from '@/types';
import { formatPosition } from '@/utils/positionStyle';

interface Props {
  card: TacticCard;
  squad: PlayerCard[];
  /** Alt uyarı metni üst blokta gösteriliyorsa şeritte tekrar etme */
  hideHint?: boolean;
}

export function TacticSquadStrip({ card, squad, hideHint }: Props) {
  const { players, tag, label } = getTacticBeneficiaryPlayers(card, squad);

  return (
    <div className="tactic-squad-strip">
      <p className="tactic-squad-strip-label">Kadrodan etkilenenler</p>
      <div className="tactic-squad-strip-row">
        {players.length > 0 ? (
          players.map((p) => (
            <div key={p.id} className="tactic-squad-portrait" title={`${p.name} · ${formatPosition(p.position)}`}>
              <PlayerPortrait player={p} size="xs" />
              <span className="tactic-squad-portrait-rating">{p.currentRating}</span>
            </div>
          ))
        ) : (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="tactic-squad-portrait tactic-squad-portrait--empty">
                <div className="tactic-squad-portrait-avatar">?</div>
              </div>
            ))}
          </>
        )}
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
      {!hideHint && <p className="tactic-squad-strip-hint">{label}</p>}
    </div>
  );
}

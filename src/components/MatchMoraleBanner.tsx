import { getMoraleEffect } from '@/engine/contextPreview';
import { UiIcon } from '@/components/UiIcon';

interface Props {
  morale: number;
}

export function MatchMoraleBanner({ morale }: Props) {
  const fx = getMoraleEffect(morale);

  return (
    <div className="match-morale-banner match-morale-banner--unified">
      <div className="match-morale-unified-row">
        <div className="match-morale-unified-moral">
          <UiIcon name="heart" className="match-morale-unified-icon" />
          <div className="match-morale-unified-moral-body">
            <div className="match-morale-unified-head">
              <span className="match-morale-unified-label">Moral</span>
              <span className="match-morale-unified-value">{morale}</span>
              <span className="match-morale-unified-tier">{fx.label}</span>
            </div>
            <div className="match-morale-unified-bar">
              <div className="match-morale-unified-bar-fill" style={{ width: `${morale}%` }} />
            </div>
          </div>
        </div>

        <div className="match-morale-unified-fx">
          <p className="match-morale-unified-fx-mult">{fx.multiplier}</p>
          <p className="match-morale-unified-fx-desc">maç gücü · {fx.detail}</p>
        </div>
      </div>
    </div>
  );
}

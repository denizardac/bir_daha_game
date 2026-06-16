import { MORALE_CHANGE_TIPS } from '@/data/moraleTips';
import { getMoraleEffect } from '@/engine/contextPreview';
import { HoverTip } from '@/components/HoverTip';

interface Props {
  morale: number;
}

export function MatchMoraleBanner({ morale }: Props) {
  const fx = getMoraleEffect(morale);

  return (
    <div className="match-morale-banner match-morale-banner--unified">
      <div className="match-morale-unified-row">
        <div className="match-morale-unified-moral">
          <span className="match-morale-unified-icon" aria-hidden>❤️</span>
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

        <div className="match-morale-unified-bridge" aria-hidden>
          <span className="match-morale-unified-bridge-text">bu maçta</span>
        </div>

        <div className="match-morale-unified-fx">
          <p className="match-morale-unified-fx-mult">{fx.multiplier}</p>
          <p className="match-morale-unified-fx-desc">maç gücü çarpanı · {fx.detail}</p>
        </div>

        <div className="match-morale-unified-tips">
          {MORALE_CHANGE_TIPS.map((t) => (
            <HoverTip key={t.label} tip={t.tip} placement="bottom">
              <span className="match-morale-tip-chip">
                <span aria-hidden>{t.icon}</span>
                <span>{t.label}</span>
                <span className="match-morale-tip-chip-delta">{t.delta}</span>
              </span>
            </HoverTip>
          ))}
        </div>
      </div>
    </div>
  );
}

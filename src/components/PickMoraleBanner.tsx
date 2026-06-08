import { MORALE_CHANGE_TIPS } from '@/data/moraleTips';
import { getMoraleEffect } from '@/engine/contextPreview';
import { HoverTip } from '@/components/HoverTip';

interface Props {
  morale: number;
}

/** Kart seçim ekranı — üstte belirgin moral bandı */
export function PickMoraleBanner({ morale }: Props) {
  const fx = getMoraleEffect(morale);

  return (
    <div className="pick-morale-banner">
      <div className="pick-morale-main">
        <span className="pick-morale-icon" aria-hidden>❤️</span>
        <div className="pick-morale-stats">
          <div className="pick-morale-head">
            <span className="pick-morale-label">Moral</span>
            <span className="pick-morale-value">{morale}</span>
            <span className="pick-morale-fx">{fx.label} · {fx.multiplier}</span>
          </div>
          <div className="pick-morale-bar">
            <div className="pick-morale-bar-fill" style={{ width: `${morale}%` }} />
          </div>
          <p className="pick-morale-detail">{fx.detail}</p>
        </div>
      </div>
      <div className="pick-morale-tips">
        {MORALE_CHANGE_TIPS.map((t) => (
          <HoverTip key={t.label} tip={t.tip} placement="bottom">
            <span className="pick-morale-tip">
              <span aria-hidden>{t.icon}</span>
              <span>{t.label}</span>
              <span className="pick-morale-tip-delta">{t.delta}</span>
            </span>
          </HoverTip>
        ))}
      </div>
    </div>
  );
}

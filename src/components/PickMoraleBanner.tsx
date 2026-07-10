import { MORALE_CHANGE_TIPS } from '@/data/moraleTips';
import { getMoraleEffect } from '@/engine/contextPreview';
import { HoverTip } from '@/components/HoverTip';
import { UiIcon } from '@/components/UiIcon';
import { iconForEmoji } from '@/utils/gameIcons';

interface Props {
  morale: number;
  /** Kart seçim ekranı — tek satır, kompakt */
  compact?: boolean;
}

/** Kart seçim ekranı — üstte belirgin moral bandı */
export function PickMoraleBanner({ morale, compact }: Props) {
  const fx = getMoraleEffect(morale);

  if (compact) {
    return (
      <div className="pick-morale-banner pick-morale-banner--compact">
        <div className="pick-morale-compact-row">
          <div className="pick-morale-compact-core">
            <span className="pick-morale-icon" aria-hidden><UiIcon name="heart" /></span>
            <div className="pick-morale-compact-stats">
              <div className="pick-morale-compact-head">
                <span className="pick-morale-label">Moral</span>
                <span className="pick-morale-value">{morale}</span>
                <span className="pick-morale-compact-tier">{fx.label}</span>
              </div>
              <div className="pick-morale-bar pick-morale-bar--compact">
                <div className="pick-morale-bar-fill" style={{ width: `${morale}%` }} />
              </div>
            </div>
            <div className="pick-morale-compact-bridge" aria-hidden>→</div>
            <div className="pick-morale-compact-fx">
              <span className="pick-morale-compact-mult">{fx.multiplier}</span>
              <span className="pick-morale-compact-fx-label">maç gücü · {fx.detail}</span>
            </div>
          </div>
          <div className="pick-morale-compact-tips">
            {MORALE_CHANGE_TIPS.map((t) => (
              <HoverTip key={t.label} tip={t.tip} placement="bottom">
                <span className="pick-morale-tip pick-morale-tip--compact">
                  <span aria-hidden><UiIcon name={iconForEmoji(t.icon)} /></span>
                  <span>{t.label}</span>
                  <span className="pick-morale-tip-delta">{t.delta}</span>
                </span>
              </HoverTip>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pick-morale-banner">
      <div className="pick-morale-main">
        <span className="pick-morale-icon" aria-hidden><UiIcon name="heart" /></span>
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
              <span aria-hidden><UiIcon name={iconForEmoji(t.icon)} /></span>
              <span>{t.label}</span>
              <span className="pick-morale-tip-delta">{t.delta}</span>
            </span>
          </HoverTip>
        ))}
      </div>
    </div>
  );
}

import { getMoraleEffect } from '@/engine/contextPreview';

interface Props {
  morale: number;
  compact?: boolean;
  inline?: boolean;
}

export function MoralePanel({ morale, compact, inline }: Props) {
  const fx = getMoraleEffect(morale);
  const fullDetail = `${fx.detail}. Galibiyet +10, beraberlik -5, mağlubiyet -20 moral.`;

  if (inline) {
    return (
      <div className="morale-panel morale-panel--inline" title={fullDetail}>
        <span className="morale-panel-label">Moral</span>
        <div className="morale-panel-bar morale-panel-bar--inline">
          <div className="morale-panel-bar-fill" style={{ width: `${morale}%` }} />
        </div>
        <span className="morale-panel-inline-value">{morale}</span>
        <span className="morale-panel-inline-fx">{fx.label} · {fx.multiplier}</span>
      </div>
    );
  }

  return (
    <div className={`morale-panel ${compact ? 'morale-panel--compact' : ''}`} title={compact ? fullDetail : undefined}>
      <div className="morale-panel-head">
        <span className="morale-panel-label">Moral</span>
        <span className="morale-panel-value">{morale}/100</span>
      </div>
      <div className="morale-panel-bar">
        <div className="morale-panel-bar-fill" style={{ width: `${morale}%` }} />
      </div>
      <p className="morale-panel-effect">
        {fx.label} · {fx.multiplier}
      </p>
      {!compact && (
        <>
          <p className="morale-panel-micro">
            Düşük moral = zayıf maç · maç gücünü ~%±20 etkiler (×0.75–×1.15)
          </p>
          <p className="morale-panel-detail">{fullDetail}</p>
        </>
      )}
    </div>
  );
}

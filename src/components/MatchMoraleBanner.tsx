import { MORALE_CHANGE_TIPS } from '@/data/moraleTips';
import { getMoraleEffect } from '@/engine/contextPreview';
import { HoverTip } from '@/components/HoverTip';
import { MoralePanel } from '@/components/MoralePanel';

interface Props {
  morale: number;
}

export function MatchMoraleBanner({ morale }: Props) {
  const fx = getMoraleEffect(morale);

  return (
    <div className="match-morale-banner">
      <div className="match-morale-banner-main">
        <MoralePanel morale={morale} />
        <div className="match-morale-banner-fx">
          <p className="match-morale-banner-label">Maç etkisi</p>
          <p className="match-morale-banner-mult">{fx.multiplier}</p>
          <p className="match-morale-banner-detail">{fx.detail}</p>
        </div>
      </div>
      <div className="match-morale-tips">
        <p className="match-morale-tips-title">Moral nasıl değişir?</p>
        <div className="match-morale-tips-row">
          {MORALE_CHANGE_TIPS.map((t) => (
            <HoverTip key={t.label} tip={t.tip} className="match-morale-tip">
              <span className="match-morale-tip-inner">
                <span aria-hidden>{t.icon}</span>
                <span className="match-morale-tip-label">{t.label}</span>
                <span className="match-morale-tip-delta">{t.delta}</span>
              </span>
            </HoverTip>
          ))}
        </div>
      </div>
    </div>
  );
}

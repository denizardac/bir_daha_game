import { MORALE_CHANGE_TIPS } from '@/data/moraleTips';
import { getMoraleEffect } from '@/engine/contextPreview';
import type { NearSynergyProgress } from '@/engine/squadInsights';
import { HoverTip } from '@/components/HoverTip';
import { UiIcon } from '@/components/UiIcon';
import type { SynergyDefinition } from '@/types';
import type { ReactNode } from 'react';

export type CardPickMode = 'cards' | 'training';

interface Props {
  morale: number;
  pickMode: CardPickMode;
  onPickModeChange: (mode: CardPickMode) => void;
  trainingAvailable: boolean;
  title: string;
  subtitle: string;
  actions: ReactNode;
  activeSynergies?: SynergyDefinition[];
  nearSynergies?: NearSynergyProgress[];
  rerollsRemaining?: number;
}

export function CardSelectCommandBar({
  morale,
  pickMode,
  onPickModeChange,
  trainingAvailable,
  title,
  subtitle,
  actions,
  rerollsRemaining = 0,
}: Props) {
  const fx = getMoraleEffect(morale);
  const turnKicker = title;

  return (
    <div
      className={`card-select-command-bar ${pickMode === 'training' ? 'card-select-command-bar--training' : ''} ${trainingAvailable ? 'card-select-command-bar--has-mode' : ''}`}
    >
      <div className="card-select-command-left">
        <div className="card-select-moral-top">
          <UiIcon name="heart" className="pick-morale-icon" />
          <div className="card-select-command-moral">
            <div className="pick-morale-compact-head card-select-moral-head">
              <span className="pick-morale-label">Moral</span>
              <span className="pick-morale-value">{morale}</span>
              <span className="pick-morale-compact-tier">{fx.label}</span>
            </div>
            <div className="pick-morale-bar pick-morale-bar--compact card-select-moral-bar">
              <div className="pick-morale-bar-fill" style={{ width: `${morale}%` }} />
            </div>
          </div>
          <div className="card-select-moral-fx">
            <span className="card-select-command-mult">{fx.multiplier}</span>
            <span className="card-select-moral-fx-label">maç gücü</span>
          </div>
        </div>

        <div className="card-select-command-tips">
          {MORALE_CHANGE_TIPS.map((t) => (
            <HoverTip key={t.label} tip={t.tip} placement="bottom" className="card-select-tip-wrap">
              <span className={`pick-morale-tip pick-morale-tip--compact card-select-tip-chip card-select-tip-chip--${t.theme}`}>
                <span className="card-select-tip-icon" aria-hidden>{t.icon}</span>
                <span className="card-select-tip-label">{t.label}</span>
                <span className="pick-morale-tip-delta card-select-tip-delta">{t.delta}</span>
              </span>
            </HoverTip>
          ))}
        </div>
      </div>

      <section className="card-select-turn-card" aria-label={turnKicker}>
        <div className="card-select-turn-kicker">
          <span className="card-select-turn-dot" aria-hidden />
          <span>{turnKicker}</span>
        </div>

        {trainingAvailable && (
          <div className="card-pick-mode-block">
            <div className="card-pick-mode-switch card-pick-mode-switch--tabs" role="group" aria-label="Tur seçimi">
              <button
                type="button"
                className={`card-pick-mode-btn card-pick-mode-btn--tab card-pick-mode-btn--cards ${pickMode === 'cards' ? 'card-pick-mode-btn--active' : ''}`}
                onClick={() => onPickModeChange('cards')}
              >
                <UiIcon name="circle-dot" className="card-pick-mode-btn-icon" />
                <span className="card-pick-mode-btn-copy">
                  <span className="card-pick-mode-btn-text">Oyuncu Kartı</span>
                  <span className="card-pick-mode-btn-desc">3 tekliften birini kadroya al</span>
                </span>
              </button>
              <button
                type="button"
                className={`card-pick-mode-btn card-pick-mode-btn--tab card-pick-mode-btn--training ${pickMode === 'training' ? 'card-pick-mode-btn--active' : ''}`}
                onClick={() => onPickModeChange('training')}
              >
                <UiIcon name="graduation-cap" className="card-pick-mode-btn-icon" />
                <span className="card-pick-mode-btn-copy">
                  <span className="card-pick-mode-btn-text">Antrenman</span>
                  <span className="card-pick-mode-btn-desc">Bir oyuncuya tag kazandır</span>
                </span>
              </button>
            </div>
          </div>
        )}

        <p className="card-select-turn-summary">{subtitle}</p>

        <div className="card-select-turn-reroll" title="Kartların sağ üstündeki yenileme ikonlarıyla teklifleri tek tek değiştirebilirsin">
          <UiIcon name="refresh" />
          <strong>{rerollsRemaining}</strong>
          <span>yenileme hakkı</span>
        </div>
      </section>

      <div className="card-select-command-actions">
        {actions}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { MORALE_CHANGE_TIPS } from '@/data/moraleTips';
import { getMoraleEffect } from '@/engine/contextPreview';
import type { NearSynergyProgress } from '@/engine/squadInsights';
import { HoverTip } from '@/components/HoverTip';
import { GameIcon } from '@/components/GameIcon';
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
  const [helpOpen, setHelpOpen] = useState(false);
  const fx = getMoraleEffect(morale);
  const turnKicker = title.toLocaleLowerCase('tr-TR').includes('ikisinden')
    ? 'Bu tur'
    : title;
  const turnTitle = title.toLocaleLowerCase('tr-TR').includes('ikisinden')
    ? '3 oyuncudan birini seç'
    : subtitle;

  return (
    <div
      className={`card-select-command-bar ${pickMode === 'training' ? 'card-select-command-bar--training' : ''} ${trainingAvailable ? 'card-select-command-bar--has-mode' : ''}`}
    >
      <section className="card-select-turn-card" aria-label={turnKicker}>
        <div className="card-select-turn-kicker">
          <span className="card-select-turn-dot" aria-hidden />
          <span>{turnKicker}</span>
        </div>

        <p className="card-select-turn-title">{turnTitle}</p>
        <p className="card-select-turn-summary">{subtitle}</p>

        {trainingAvailable && (
          <div className="card-pick-mode-block">
            <div className="card-pick-mode-switch card-pick-mode-switch--tabs" role="group" aria-label="Tur seçimi">
              <button
                type="button"
                className={`card-pick-mode-btn card-pick-mode-btn--tab card-pick-mode-btn--cards ${pickMode === 'cards' ? 'card-pick-mode-btn--active' : ''}`}
                onClick={() => onPickModeChange('cards')}
              >
                <span className="card-pick-mode-btn-icon" aria-hidden><GameIcon name="users" size={18} /></span>
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
                <span className="card-pick-mode-btn-icon" aria-hidden><GameIcon name="training" size={18} /></span>
                <span className="card-pick-mode-btn-copy">
                  <span className="card-pick-mode-btn-text">Antrenman</span>
                  <span className="card-pick-mode-btn-desc">Bir oyuncuya tag kazandır</span>
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="card-select-action-row">
          <div className="card-select-turn-reroll" title="Kartların sağ üstündeki yenileme ikonlarıyla teklifleri tek tek değiştirebilirsin">
            <GameIcon name="refresh" size={15} />
            <strong>{rerollsRemaining}</strong>
            <span>yenileme</span>
          </div>
          <button type="button" className="card-select-help-btn" onClick={() => setHelpOpen(true)} aria-label="Moral ve tur etkilerini göster">
            <GameIcon name="help" size={17} />
          </button>
        </div>
      </section>

      <div className="card-select-command-actions">
        {actions}
      </div>

      {helpOpen && (
        <div className="ui-modal-backdrop" role="presentation" onClick={() => setHelpOpen(false)}>
          <div className="ui-modal ui-modal--compact-help" role="dialog" aria-modal="true" aria-label="Moral etkileri" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="ui-modal-close" aria-label="Kapat" onClick={() => setHelpOpen(false)}>x</button>
            <h2>Moral ve tur etkileri</h2>
            <div className="card-select-help-morale">
              <GameIcon name="heart" size={18} />
              <div>
                <strong>Moral {morale} · {fx.label}</strong>
                <span>{fx.multiplier} maç gücü</span>
              </div>
            </div>
            <div className="card-select-help-tips">
              {MORALE_CHANGE_TIPS.map((t) => (
                <HoverTip key={t.label} tip={t.tip} placement="bottom" className="card-select-tip-wrap">
                  <span className={`pick-morale-tip pick-morale-tip--compact card-select-tip-chip card-select-tip-chip--${t.theme}`}>
                    <span className="card-select-tip-icon" aria-hidden><GameIcon legacyIcon={t.icon} size={16} /></span>
                    <span className="card-select-tip-label">{t.label}</span>
                    <span className="pick-morale-tip-delta card-select-tip-delta">{t.delta}</span>
                  </span>
                </HoverTip>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

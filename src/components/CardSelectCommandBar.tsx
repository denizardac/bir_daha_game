import { MORALE_CHANGE_TIPS } from '@/data/moraleTips';
import { getMoraleEffect } from '@/engine/contextPreview';
import type { NearSynergyProgress } from '@/engine/squadInsights';
import { HoverTip } from '@/components/HoverTip';
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

/** Kart seçim — moral (sol) + tur aksiyonları (sağ) tek şerit */
export function CardSelectCommandBar({
  morale,
  pickMode,
  onPickModeChange,
  trainingAvailable,
  title,
  subtitle,
  actions,
  activeSynergies = [],
  nearSynergies = [],
  rerollsRemaining = 0,
}: Props) {
  const fx = getMoraleEffect(morale);

  return (
    <div
      className={`card-select-command-bar ${pickMode === 'training' ? 'card-select-command-bar--training' : ''} ${trainingAvailable ? 'card-select-command-bar--has-mode' : ''}`}
    >
      <div className="card-select-command-left">
        <div className="card-select-moral-top">
          <span className="pick-morale-icon" aria-hidden>❤️</span>
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
        <div className="card-select-synergy-row">
          <span className="card-select-synergy-label">
            {activeSynergies.length > 0 ? 'Aktif sinerjiler' : 'Sinerji durumu'}
          </span>
          <div className="card-select-synergy-chips">
            {activeSynergies.length > 0 ? (
              activeSynergies.map((s) => (
                <HoverTip key={s.id} tip={s.description} className="card-select-synergy-wrap" placement="bottom">
                  <span className="card-select-synergy-chip card-select-synergy-chip--active">
                    <span aria-hidden>{s.icon}</span>
                    <span>{s.name}</span>
                  </span>
                </HoverTip>
              ))
            ) : nearSynergies.length > 0 ? (
              nearSynergies.map(({ synergy, progress }) => (
                <HoverTip
                  key={synergy.id}
                  tip={`${synergy.description}\nİlerleme: ${progress.current}/${progress.required}${progress.note ? `\n${progress.note}` : ''}`}
                  className="card-select-synergy-wrap"
                  placement="bottom"
                >
                  <span className="card-select-synergy-chip card-select-synergy-chip--near">
                    <span aria-hidden>{synergy.icon}</span>
                    <span>{synergy.name}</span>
                    <span className="card-select-synergy-progress">{progress.current}/{progress.required}</span>
                  </span>
                </HoverTip>
              ))
            ) : (
              <span className="card-select-synergy-empty">Henüz aktif sinerji yok — aynı tag&apos;leri topla</span>
            )}
          </div>
        </div>
      </div>

      <div className="card-select-command-divider" aria-hidden />

      <div className="card-select-command-right">
        {trainingAvailable && (
          <div className="card-pick-mode-switch" role="group" aria-label="Tur seçimi">
            <button
              type="button"
              className={`card-pick-mode-btn ${pickMode === 'cards' ? 'card-pick-mode-btn--active' : ''}`}
              onClick={() => onPickModeChange('cards')}
            >
              <span className="card-pick-mode-btn-icon" aria-hidden>🃏</span>
              <span className="card-pick-mode-btn-text">Oyuncu kartı seç</span>
            </button>
            <button
              type="button"
              className={`card-pick-mode-btn ${pickMode === 'training' ? 'card-pick-mode-btn--active' : ''}`}
              onClick={() => onPickModeChange('training')}
            >
              <span className="card-pick-mode-btn-icon" aria-hidden>🎓</span>
              <span className="card-pick-mode-btn-text">Özel antrenman</span>
            </button>
          </div>
        )}

        <div className="card-select-command-pick-block">
          <h2 className="card-pick-title card-pick-title--inline">{title}</h2>
          <p className="card-pick-subtitle card-pick-subtitle--inline">{subtitle}</p>
          {trainingAvailable && (
            <p className={`card-pick-mode-banner ${pickMode === 'training' ? 'card-pick-mode-banner--training' : 'card-pick-mode-banner--cards'}`}>
              {pickMode === 'training'
                ? 'Antrenman modu aktif — kartlar kilitli, bir oyuncuya nitelik ekleyeceksin.'
                : 'Kart modu aktif — antrenman için yukarıdaki sekmeye geç.'}
            </p>
          )}
        </div>

        <div className="card-select-command-actions">
          <div className="card-pick-reroll-hint-bar" title="Her kartın sağ üstündeki 🔄 ile tek tek yenile">
            <span className={`card-pick-reroll-count ${rerollsRemaining <= 0 ? 'card-pick-reroll-count--empty' : ''}`}>
              🔄 {rerollsRemaining} yenileme hakkı
            </span>
            <span className="card-pick-reroll-tip">Kart başına yenile — sağ üst 🔄</span>
          </div>
          {actions}
        </div>
      </div>
    </div>
  );
}

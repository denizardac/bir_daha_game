import { motion } from 'framer-motion';
import { TacticBoardVisual } from '@/components/TacticBoardVisual';
import { TacticSquadStrip } from '@/components/TacticSquadStrip';
import { getTacticCardInsight, getTacticEffectLines } from '@/engine/cardInsights';
import { getTacticBeneficiaryPlayers, getTacticRequirementSummary } from '@/engine/tacticVisual';
import type { ActiveTactic, PlayerCard, TacticCard as TacticCardType } from '@/types';

interface Props {
  card: TacticCardType;
  squad: PlayerCard[];
  activeTactics?: ActiveTactic[];
  onSelect?: () => void;
  selected?: boolean;
  expanded?: boolean;
}

export function TacticCard({ card, squad, activeTactics = [], onSelect, selected, expanded = false }: Props) {
  const insight = getTacticCardInsight(card, squad, activeTactics);
  const baseEffects = getTacticEffectLines(card);
  const beneficiary = getTacticBeneficiaryPlayers(card, squad);
  const requirement = getTacticRequirementSummary(card, squad);
  const passiveWarning = beneficiary.label.includes('pasif') ? beneficiary.label : null;
  const isFormation = card.category === 'formasyon';

  const cardHead = (
    <div className="tactic-card-head">
      <p className="tactic-card-category">TAKTİK · {card.category.toUpperCase()}</p>
      <h3 className="tactic-card-name">{card.name}</h3>
      <div className="tactic-guide-chips">
        <span className="tactic-guide-chip">{card.effectSummary}</span>
      </div>
      <p className="tactic-card-summary">{insight.pitch}</p>
    </div>
  );

  const selectInsight = (
    <div className="card-insight card-insight--tactic card-pick-core">
      <p className="card-insight-title">Oyuna etkisi</p>
      <p className="card-insight-line card-insight-line--lead">{insight.onSelect}</p>
    </div>
  );

  const whyInsight = (
    <div className="card-insight card-insight--why">
      <p className="card-insight-title">Planın artısı ve riski</p>
      {insight.whyPick.map((line) => (
        <p key={line} className="card-insight-line card-insight-line--bullet">✓ {line}</p>
      ))}
    </div>
  );

  const effectsInsight = (
    <div className="card-insight card-insight--effects">
      <div className="card-insight-head-row">
        <p className="card-insight-title">Bu kadroda</p>
        <span className={`tactic-fit tactic-fit--${insight.fit}`}>{insight.fitLabel}</span>
      </div>
      {expanded && (
        <div className={`tactic-requirement tactic-requirement--${requirement.tone}`}>
          <span>{requirement.label}</span>
          <strong>{requirement.requirement}</strong>
          <small>{requirement.current}</small>
        </div>
      )}
      {insight.effects.map((line) => (
        <p key={line} className="card-insight-line">{line}</p>
      ))}
      {passiveWarning && <p className="tactic-warning-line">{passiveWarning}</p>}
      <div className="tactic-base-effects">
        {baseEffects.map((line) => (
          <span key={line} className="tactic-effect-chip">{line}</span>
        ))}
      </div>
    </div>
  );

  if (expanded) {
    return (
      <motion.div
        className={`card-fut tactic-card tactic-card--expanded tactic-card--${isFormation ? 'formation' : 'system'}`}
      >
        <header className="tactic-detail-hero">
          <div className="tactic-detail-visual" aria-hidden="true">
            <TacticBoardVisual card={card} preview />
          </div>
          <div className="tactic-detail-heading">
            <p className="tactic-detail-kicker">
              {isFormation ? 'SAHA PLANI' : 'MAÇ DOKTRİNİ'}
            </p>
            <h3 className="tactic-detail-name">{card.name}</h3>
            <p className="tactic-detail-summary">{insight.pitch}</p>
            <span className={`tactic-fit tactic-fit--${insight.fit}`}>{insight.fitLabel}</span>
          </div>
        </header>

        {isFormation ? (
          <div className="tactic-detail-formation">
            <section className="tactic-detail-panel tactic-detail-panel--structure">
              <p className="tactic-detail-label">DİZİLİŞ</p>
              <strong>{requirement.requirement}</strong>
              <p>İlk 11 bu saha planına göre yeniden yerleşir.</p>
            </section>
            <section className="tactic-detail-panel tactic-detail-panel--impact">
              <p className="tactic-detail-label">MAÇ ETKİSİ</p>
              <div className="tactic-detail-effects">
                {baseEffects.map((line) => (
                  <span key={line} className="tactic-effect-chip">{line}</span>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="tactic-detail-system">
            <section className={`tactic-detail-panel tactic-detail-panel--activation tactic-detail-panel--${requirement.tone}`}>
              <div className="tactic-detail-panel-head">
                <p className="tactic-detail-label">AKTİVASYON</p>
                <span>{requirement.tone === 'ready' ? 'HAZIR' : requirement.tone === 'missing' ? 'EKSİK' : 'MAÇTA'}</span>
              </div>
              <strong>{requirement.requirement}</strong>
              <p>{requirement.current}</p>
            </section>
            <section className="tactic-detail-panel tactic-detail-panel--reward">
              <p className="tactic-detail-label">MAÇ ÖDÜLÜ</p>
              <div className="tactic-detail-effects">
                {baseEffects.map((line) => (
                  <span key={line} className="tactic-effect-chip">{line}</span>
                ))}
              </div>
            </section>
            {beneficiary.players.length > 0 && (
              <section className="tactic-detail-supporters">
                <p className="tactic-detail-label">PLANI TAŞIYANLAR</p>
                <div className="tactic-detail-player-list">
                  {beneficiary.players.map((player) => (
                    <span key={player.id} className="tactic-detail-player">
                      <strong>{player.name}</strong>
                      <small>{player.position}</small>
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (!onSelect) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-label={onSelect ? `Taktik: ${card.name}` : undefined}
      aria-pressed={onSelect ? Boolean(selected) : undefined}
      className={`card-fut card-fut--pick tactic-card relative flex w-full flex-col text-left ${selected ? 'tactic-card--selected' : ''}`}
    >
      <div className="tactic-card-top">
        <div className="tactic-card-accent" />
        <TacticBoardVisual card={card} />
      </div>

      <div className="card-body tactic-card-body">
        <div
          className="card-pick-body-scroll"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="card-pick-scroll tactic-card-scroll">
            {cardHead}
            {selectInsight}

            <div className="card-pick-extra tactic-card-blocks">
              {whyInsight}
              {effectsInsight}

              <TacticSquadStrip card={card} squad={squad} hideHint={Boolean(passiveWarning)} />
            </div>
          </div>
        </div>
      </div>

      {onSelect && (
        <div className="card-pick-footer">
          <p className="select-cta">{selected ? '✓ SEÇİLİ' : 'SEÇ'}</p>
        </div>
      )}
    </motion.div>
  );
}

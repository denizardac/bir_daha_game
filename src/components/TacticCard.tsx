import { motion } from 'framer-motion';
import { TacticBoardVisual } from '@/components/TacticBoardVisual';
import { TacticSquadStrip } from '@/components/TacticSquadStrip';
import { getTacticCardInsight, getTacticEffectLines } from '@/engine/cardInsights';
import { getTacticBeneficiaryPlayers } from '@/engine/tacticVisual';
import type { ActiveTactic, PlayerCard, TacticCard as TacticCardType } from '@/types';

interface Props {
  card: TacticCardType;
  squad: PlayerCard[];
  activeTactics?: ActiveTactic[];
  onSelect?: () => void;
}

export function TacticCard({ card, squad, activeTactics = [], onSelect }: Props) {
  const insight = getTacticCardInsight(card, squad, activeTactics);
  const baseEffects = getTacticEffectLines(card);
  const beneficiary = getTacticBeneficiaryPlayers(card, squad);
  const passiveWarning = beneficiary.label.includes('pasif') ? beneficiary.label : null;

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
      className="card-fut card-fut--pick tactic-card relative flex w-full flex-col text-left"
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
            <div className="tactic-card-head">
              <p className="tactic-card-category">TAKTİK · {card.category.toUpperCase()}</p>
              <h3 className="tactic-card-name">{card.name}</h3>
              <div className="tactic-guide-chips">
                <span className="tactic-guide-chip">{card.effectSummary}</span>
              </div>
              <p className="tactic-card-summary">{insight.pitch}</p>
            </div>
            <div className="card-insight card-insight--tactic card-pick-core">
              <p className="card-insight-title">Seçince ne olur?</p>
              <p className="card-insight-line card-insight-line--lead">{insight.onSelect}</p>
            </div>

            <div className="card-pick-extra tactic-card-blocks">
              <div className="card-insight card-insight--why">
                <p className="card-insight-title">Neden seç?</p>
                {insight.whyPick.map((line) => (
                  <p key={line} className="card-insight-line card-insight-line--bullet">✓ {line}</p>
                ))}
              </div>

              <div className="card-insight card-insight--effects">
                <div className="card-insight-head-row">
                  <p className="card-insight-title">Kadrona etkisi</p>
                  <span className={`tactic-fit tactic-fit--${insight.fit}`}>{insight.fitLabel}</span>
                </div>
                {insight.effects.map((line) => (
                  <p key={line} className="card-insight-line">{line}</p>
                ))}
                {passiveWarning && (
                  <p className="tactic-warning-line">{passiveWarning}</p>
                )}
                <div className="tactic-base-effects">
                  {baseEffects.map((line) => (
                    <span key={line} className="tactic-effect-chip">{line}</span>
                  ))}
                </div>
              </div>

              <TacticSquadStrip card={card} squad={squad} hideHint={Boolean(passiveWarning)} />
            </div>
          </div>
        </div>
      </div>

      {onSelect && (
        <div className="card-pick-footer">
          <p className="select-cta">SEÇ</p>
        </div>
      )}
    </motion.div>
  );
}

import {
  getFormationDots,
  getSystemBoardVariant,
  getTacticHeroCopy,
} from '@/engine/tacticVisual';
import type { TacticCard } from '@/types';
import { UiIcon } from '@/components/UiIcon';

interface Props {
  card: TacticCard;
  /** Kadro seçiminde sadece saha görseli — metin yok */
  preview?: boolean;
}

export function TacticBoardVisual({ card, preview = false }: Props) {
  const dots = getFormationDots(card.id);
  const variant = getSystemBoardVariant(card.id);
  const hero = getTacticHeroCopy(card);

  if (preview) {
    return (
      <div className="tactic-board-wrap tactic-board-wrap--preview">
        <div className={`tactic-board tactic-board--preview ${dots ? 'tactic-board--formation' : `tactic-board--${variant}`}`}>
          <div className="tactic-board-grass" />
          <div className="tactic-board-lines">
            <div className="tactic-board-center" />
            <div className="tactic-board-box tactic-board-box--top" />
            <div className="tactic-board-box tactic-board-box--bottom" />
          </div>

          {dots ? (
            dots.map((dot, i) => (
              <span
                key={i}
                className={`tactic-board-dot ${dot.role === 'gk' ? 'tactic-board-dot--gk' : ''}`}
                style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
              />
            ))
          ) : (
            <div className="tactic-board-system">
              <div className="tactic-board-chalk tactic-board-chalk--1" />
              <div className="tactic-board-chalk tactic-board-chalk--2" />
              <div className="tactic-board-arrow tactic-board-arrow--1" />
              <div className="tactic-board-arrow tactic-board-arrow--2" />
              <span className="tactic-board-clipboard"><UiIcon name="clipboard" /></span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="tactic-board-wrap">
      <div className={`tactic-board ${dots ? 'tactic-board--formation' : `tactic-board--${variant}`}`}>
        <div className="tactic-board-grass" />
        <div className="tactic-board-lines">
          <div className="tactic-board-center" />
          <div className="tactic-board-box tactic-board-box--top" />
          <div className="tactic-board-box tactic-board-box--bottom" />
        </div>

        {dots ? (
          dots.map((dot, i) => (
            <span
              key={i}
              className={`tactic-board-dot ${dot.role === 'gk' ? 'tactic-board-dot--gk' : ''}`}
              style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
            />
          ))
        ) : (
          <div className="tactic-board-system">
            <div className="tactic-board-chalk tactic-board-chalk--1" />
            <div className="tactic-board-chalk tactic-board-chalk--2" />
            <div className="tactic-board-arrow tactic-board-arrow--1" />
            <div className="tactic-board-arrow tactic-board-arrow--2" />
            <span className="tactic-board-clipboard"><UiIcon name="clipboard" /></span>
          </div>
        )}
      </div>

      <div className="tactic-board-caption">
        <p className="tactic-board-caption-title">{hero.title}</p>
        <ul className="tactic-board-caption-list">
          {hero.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

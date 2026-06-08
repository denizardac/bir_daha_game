import { getFormationDots } from '@/engine/tacticVisual';

interface Props {
  tacticId?: string;
  category?: 'formasyon' | 'sistem';
  empty?: boolean;
  size?: 'sm' | 'md';
}

export function MiniTacticBoard({ tacticId, category, empty, size = 'sm' }: Props) {
  const dots = tacticId ? getFormationDots(tacticId) : null;

  return (
    <div className={`mini-tactic-board mini-tactic-board--${size} ${empty ? 'mini-tactic-board--empty' : ''}`}>
      <div className="mini-tactic-board-grass" />
      {!empty && dots ? (
        dots.map((d, i) => (
          <span
            key={i}
            className={`mini-tactic-board-dot ${d.role === 'gk' ? 'mini-tactic-board-dot--gk' : ''}`}
            style={{ left: `${d.x}%`, top: `${d.y}%` }}
          />
        ))
      ) : !empty && category === 'sistem' ? (
        <div className="mini-tactic-board-system">
          <span className="mini-tactic-board-arrow" />
          <span className="mini-tactic-board-arrow mini-tactic-board-arrow--2" />
        </div>
      ) : (
        <span className="mini-tactic-board-empty-icon">+</span>
      )}
    </div>
  );
}

export function getTacticCategoryLabel(cat: 'formasyon' | 'sistem') {
  return cat === 'formasyon' ? 'Formasyon' : 'Oyun Sistemi';
}

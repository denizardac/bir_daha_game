import { useGameStore } from '@/store/gameStore';
import type { RoundResult } from '@/types';

const OUTCOME_META = {
  win: { label: 'G', title: 'Galibiyet', className: 'match-history-dot--win' },
  draw: { label: 'B', title: 'Beraberlik', className: 'match-history-dot--draw' },
  loss: { label: 'M', title: 'Mağlubiyet', className: 'match-history-dot--loss' },
} as const;

function matchRows(history: RoundResult[]) {
  return history.filter((r) => r.matchResult);
}

export function MatchHistoryStrip() {
  const roundHistory = useGameStore((s) => s.roundHistory);
  const matches = matchRows(roundHistory);

  if (matches.length === 0) return null;

  const wins = matches.filter((r) => r.matchResult?.outcome === 'win').length;
  const draws = matches.filter((r) => r.matchResult?.outcome === 'draw').length;
  const losses = matches.filter((r) => r.matchResult?.outcome === 'loss').length;
  const recent = matches.slice(-10);

  return (
    <div className="match-history-strip" aria-label="Geçmiş maç sonuçları">
      <div className="match-history-dots" role="list">
        {recent.map((r) => {
          const outcome = r.matchResult!.outcome;
          const meta = OUTCOME_META[outcome];
          const score = `${r.matchResult!.goalsFor}-${r.matchResult!.goalsAgainst}`;
          return (
            <span
              key={r.round}
              role="listitem"
              className={`match-history-dot ${meta.className}`}
              title={`R${r.round} · ${meta.title} · ${score}`}
            >
              {meta.label}
            </span>
          );
        })}
      </div>
      <span className="match-history-summary">
        <span className="match-history-stat match-history-stat--win">{wins}G</span>
        <span className="match-history-stat match-history-stat--draw">{draws}B</span>
        <span className="match-history-stat match-history-stat--loss">{losses}M</span>
      </span>
    </div>
  );
}

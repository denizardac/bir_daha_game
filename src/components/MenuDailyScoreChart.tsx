import { formatScore } from '@/engine/scoring';
import { getDailyList } from '@/engine/leaderboard';
import { buildDailyScoreBuckets } from '@/engine/scoreDistribution';
import { getPersistedStats } from '@/store/gameStore';

export function MenuDailyScoreChart() {
  const stats = getPersistedStats();
  const daily = getDailyList(stats);
  const buckets = buildDailyScoreBuckets(daily);
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const yourScore = stats.todayScore;

  return (
    <div className="menu-score-chart">
      <p className="menu-score-chart-title">Bugünkü Skor Dağılımı</p>
      <div className="menu-score-chart-bars" role="img" aria-label="Bugünkü oyuncu skor dağılımı">
        {buckets.map((b) => {
          const heightPct = b.count > 0 ? (b.count / maxCount) * 100 : 0;
          const inBucket =
            yourScore === 0
              ? b.label === '0'
              : b.label === '8K+'
                ? yourScore >= 8001
                : b.label === '1–2K'
                  ? yourScore >= 1 && yourScore <= 2000
                  : b.label === '2–5K'
                    ? yourScore >= 2001 && yourScore <= 5000
                    : b.label === '5–8K'
                      ? yourScore >= 5001 && yourScore <= 8000
                      : false;
          return (
            <div key={b.label} className="menu-score-bar-col">
              <span className="menu-score-bar-count">{b.count || ''}</span>
              <div className="menu-score-bar-track">
                {b.count > 0 && (
                  <div
                    className={`menu-score-bar-fill ${inBucket ? 'menu-score-bar-fill--you' : ''}`}
                    style={{ height: `${Math.max(heightPct, 8)}%` }}
                  />
                )}
              </div>
              <span className={`menu-score-bar-label ${inBucket ? 'menu-score-bar-label--you' : ''}`}>{b.label}</span>
            </div>
          );
        })}
      </div>
      {yourScore > 0 && (
        <p className="menu-score-chart-you">Sen: {formatScore(yourScore)}</p>
      )}
    </div>
  );
}

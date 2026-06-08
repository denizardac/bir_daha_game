import { LineupPreviewSidebar } from '@/components/LineupPreview';
import { formatAltPositionsBadge } from '@/data/positionFlexibility';
import { HoverTip } from '@/components/HoverTip';
import { PlayerPortrait } from '@/components/PlayerPortrait';
import { TAG_DESCRIPTIONS, TAG_ICONS } from '@/data/tags';
import { getSquadLineupSummary } from '@/engine/lineupPreview';
import { sortSquadByRating } from '@/engine/squadLogic';
import type { ActiveTactic, PlayerCard as PlayerCardType, Tag } from '@/types';
import { POSITION_LABELS, POSITION_BADGE } from '@/utils/positionStyle';

interface Props {
  squad: PlayerCardType[];
  maxSquadSize: number;
  round: number;
  maxRounds: number;
  activeTactics?: ActiveTactic[];
  onShowLineup?: () => void;
}

function SquadTagChip({ tag }: { tag: Tag }) {
  return (
    <HoverTip tip={TAG_DESCRIPTIONS[tag]} className="syn-tag-chip-wrap" placement="left">
      <span className={`syn-tag-chip syn-tag-chip--squad syn-tag-chip--${tag.replace(/\s+/g, '-')}`}>
        <span className="syn-tag-icon" aria-hidden>{TAG_ICONS[tag]}</span>
        <span className="syn-tag-label">{tag}</span>
      </span>
    </HoverTip>
  );
}

export function SquadPanel({ squad, maxSquadSize, round, maxRounds, activeTactics = [], onShowLineup }: Props) {
  const empty = maxSquadSize - squad.length;
  const sortedSquad = sortSquadByRating(squad);
  const avg = squad.length ? Math.round(squad.reduce((s, p) => s + p.currentRating, 0) / squad.length) : 0;
  const summary = getSquadLineupSummary(squad, activeTactics);
  const lineupIds = new Set(summary.lineup.filter((s) => s.player).map((s) => s.player!.id));

  return (
    <div className="panel squad-panel">
      <div className="squad-panel-head">
        <div className="squad-panel-head-main">
          <h2 className="text-lg font-extrabold uppercase tracking-wide">Kadro</h2>
          <div className="round-progress round-progress--inline">
            {Array.from({ length: maxRounds }, (_, i) => (
              <div
                key={i}
                className={`round-dot ${i + 1 < round ? 'done' : i + 1 === round ? 'current' : ''}`}
              />
            ))}
          </div>
        </div>
        <span className="squad-panel-stat">
          {summary.squadSize}/{maxSquadSize} kadro · {summary.filled}/11 saha · Ort. {avg}
        </span>
      </div>

      <LineupPreviewSidebar squad={squad} activeTactics={activeTactics} onShow={onShowLineup} />

      <div className="squad-panel-scroll">
        <div className="squad-panel-list squad-panel-list--roomy">
          {sortedSquad.map((player) => {
            const altPos = formatAltPositionsBadge(player.position);
            const onPitch = lineupIds.has(player.id);
            const isBenchGk = player.position === 'KL' && !onPitch;
            return (
            <div
              key={player.id}
              className={`squad-row squad-row--filled squad-row--roomy ${!onPitch ? 'squad-row--bench' : ''} ${isBenchGk ? 'squad-row--bench-gk' : ''}`}
            >
              <PlayerPortrait player={player} size="sm" starter={onPitch} />
              <div className="squad-row-info">
                <div className="squad-row-head">
                  <p className="squad-row-name" title={player.name}>{player.name}</p>
                  <span className="squad-row-rating">{player.currentRating}</span>
                </div>
                {player.tags.length > 0 && (
                  <div className="squad-row-tags squad-row-tags--below">
                    {player.tags.map((t) => (
                      <SquadTagChip key={t} tag={t} />
                    ))}
                  </div>
                )}
                <div className="squad-row-sub">
                  <span className="squad-row-pos" title={POSITION_LABELS[player.position]}>
                    {POSITION_BADGE[player.position]}
                  </span>
                  {altPos && (
                    <HoverTip tip={`Ek mevkiler: ${altPos.replace(/ · /g, ', ')}`} className="squad-row-alt-wrap" placement="left">
                      <span className="squad-row-alt-pos">+{altPos}</span>
                    </HoverTip>
                  )}
                  {!onPitch && (
                    <span className="squad-row-bench-badge">{isBenchGk ? 'Yedek KL' : 'Yedek'}</span>
                  )}
                </div>
              </div>
            </div>
            );
          })}
          {empty > 0 && (
            <p className="squad-empty-slots">{empty} boş slot — oyuncu kartı ile doldur</p>
          )}
        </div>
      </div>
    </div>
  );
}

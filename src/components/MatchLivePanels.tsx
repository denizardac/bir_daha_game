import { motion, AnimatePresence } from 'framer-motion';
import { getActiveSynergies } from '@/data/synergies';
import { getMoraleEffect } from '@/engine/contextPreview';
import {
  getContextualMatchTip,
  getLiveCommentary,
  getMatchMomentum,
  getSquadSnapshotLines,
} from '@/engine/matchLiveContent';
import { formatScore } from '@/engine/scoring';
import type { MatchAnimState } from '@/engine/matchAnimSchedule';
import { HoverTip } from '@/components/HoverTip';
import { MatchPickPanel } from '@/components/MatchPickPanel';
import type { ActiveTactic, GameCard, MatchResult, PlayerCard } from '@/types';

interface LeftProps {
  selection: GameCard;
  subtitle: string;
  squad: PlayerCard[];
  morale: number;
  activeTactics: ActiveTactic[];
  squadAvg: number;
  opponentRating: number;
}

export function MatchLeftPanel({
  selection,
  subtitle,
  squad,
  morale,
  activeTactics,
  squadAvg,
  opponentRating,
}: LeftProps) {
  const moraleFx = getMoraleEffect(morale);
  const synergies = getActiveSynergies(squad, morale, { activeTactics });
  const stars = getSquadSnapshotLines(squad, 4);
  const powerPct = Math.min(100, Math.round((squadAvg / Math.max(opponentRating, 1)) * 50));

  return (
    <div className="match-left-stack">
      <MatchPickPanel selection={selection} subtitle={subtitle} />

      <HoverTip
        tip="Kadro ortalaması vs rakip — yüksek moral çarpanı maç gücünü artırır"
        className="match-side-block-wrap"
      >
        <div className="match-side-block">
          <p className="match-panel-label">Maç gücü</p>
          <div className="match-power-compare">
            <span className="match-power-label">Kadro {squadAvg}</span>
            <div className="match-power-track">
              <div className="match-power-fill match-power-fill--home" style={{ width: `${powerPct}%` }} />
            </div>
            <span className="match-power-label">Rakip {opponentRating}</span>
          </div>
          <p className="match-side-hint">
            {squadAvg >= opponentRating ? '✓ Ortalama üstünsün' : '⚠ Rakip daha güçlü'}
            {squad.length < 11 ? ` · ${squad.length}/11 kadro` : ''}
          </p>
        </div>
      </HoverTip>

      {synergies.length > 0 && (
        <div className="match-side-block match-side-block--synergies">
          <p className="match-panel-label">Aktif sinerji ({synergies.length})</p>
          <ul className="match-synergy-live-list">
            {synergies.map((s) => (
              <li key={s.id} className="match-synergy-live-item">
                <HoverTip tip={`${s.description}\n\n${s.perGoalBonus ? `Gol başına +${s.perGoalBonus}` : s.perWinBonus ? `Galibiyet +${s.perWinBonus}` : 'Maç bonusu'}`} className="match-synergy-tip-wrap">
                  <span className="match-synergy-live-inner">
                    <span>{s.icon}</span> {s.name}
                  </span>
                </HoverTip>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="match-side-block match-side-block--grow">
        <p className="match-panel-label">Yıldızlar</p>
        <ul className="match-star-list">
          {stars.map((p) => (
            <li key={p.name} className="match-star-row">
              <span className="match-star-name">{p.name}</span>
              <span className="match-star-meta">{p.pos} · {p.rating}</span>
            </li>
          ))}
        </ul>
      </div>

      {activeTactics.length > 0 && (
        <div className="match-active-tactics">
          <p className="match-panel-label">Aktif taktik</p>
          {activeTactics.map((t) => (
            <p key={t.id} className="match-tactic-line">📋 {t.name}</p>
          ))}
        </div>
      )}

      <div className="match-side-block match-side-block--morale-mini">
        <p className="match-panel-label">Moral · {moraleFx.label}</p>
        <p className="match-side-line">{moraleFx.multiplier}</p>
        <p className="match-side-hint">{moraleFx.detail}</p>
      </div>
    </div>
  );
}

interface RightProps {
  anim: MatchAnimState;
  currentMatch: MatchResult;
  squad: PlayerCard[];
  morale: number;
  squadAvg: number;
  activeTactics: ActiveTactic[];
  streak: number;
  outcomeLabel?: string;
  outcomeColor?: string;
  resultExplain?: string;
}

export function MatchRightPanel({
  anim,
  currentMatch,
  squad,
  morale,
  squadAvg,
  activeTactics,
  streak,
  outcomeLabel,
  outcomeColor,
  resultExplain,
}: RightProps) {
  const momentum = getMatchMomentum(anim.goalsFor, anim.goalsAgainst, anim.minute);
  const tip = getContextualMatchTip(
    squad,
    morale,
    currentMatch.opponent.rating,
    squadAvg,
    activeTactics,
    anim.minute,
    currentMatch.opponent.style,
  );
  const latestComment = anim.latestEvent ? getLiveCommentary(anim.latestEvent) : null;
  const ended = !anim.playing;

  return (
    <div className="match-live-panel">
      {anim.showResult && outcomeLabel ? (
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="match-live-result-header"
        >
          <p className={`match-outcome-title ${outcomeColor ?? ''}`}>{outcomeLabel}</p>
          {resultExplain && <p className="match-outcome-explain">{resultExplain}</p>}
          <p className="match-live-final-score">
            Skor <strong>{anim.goalsFor} – {anim.goalsAgainst}</strong> · {anim.minute}&apos;
          </p>
          {currentMatch.roundPoints > 0 && (
            <motion.div
              className="match-score-burst"
              initial={{ opacity: 0, y: 14, scale: 0.86 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 360, damping: 18, delay: 0.12 }}
            >
              <span className="match-score-burst-label">Skor artışı</span>
              <strong>+{formatScore(currentMatch.roundPoints)}</strong>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <div className="match-live-header">
          <span className={`match-live-pulse ${ended ? 'match-live-pulse--off' : ''}`} aria-hidden />
          <p className="match-live-title">{anim.playing ? 'CANLI ANLATIM' : 'MAÇ BİTTİ'}</p>
          <span className="match-live-clock">{anim.minute}&apos;</span>
        </div>
      )}

      {(anim.playing || anim.showResult) && (
        <div className="match-momentum">
          <div className="match-momentum-labels">
            <span>Kadron</span>
            <span>Rakip</span>
          </div>
          <div className="match-momentum-track">
            <div className="match-momentum-home" style={{ width: `${momentum}%` }} />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {latestComment && anim.playing && (
          <motion.p
            key={latestComment}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`match-live-banner ${
              anim.latestEvent?.type === 'goal_for'
                ? 'match-live-banner--goal'
                : anim.latestEvent?.type === 'goal_against'
                  ? 'match-live-banner--concede'
                  : ''
            }`}
          >
            {latestComment}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="match-live-feed match-live-feed--sticky">
        <p className="match-panel-label">Maç özeti</p>
        {anim.eventFeed.length === 0 ? (
          <p className="match-side-hint">Maç başladı — ilk pozisyonlar geliyor…</p>
        ) : (
          <ul className="match-live-feed-list">
            {[...anim.eventFeed].reverse().map((ev, i) => (
              <li key={`${ev.minute}-${ev.type}-${i}`} className="match-live-feed-item">
                <span className="match-live-feed-min">{ev.minute}&apos;</span>
                {getLiveCommentary(ev)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {anim.playing && (
        <div className="match-tip-card">
          <p className="match-tip-kicker">💡 Maç ipucu</p>
          <p className="match-tip-text">{tip}</p>
        </div>
      )}

      {streak >= 2 && anim.playing && (
        <p className="match-streak-chip">🔥 {streak} maçlık seri — galibiyet çarpanı aktif</p>
      )}

      {anim.halftime && (
        <p className="match-halftime-chip">⏸️ Devre arası — taktikler konuşuluyor</p>
      )}
    </div>
  );
}

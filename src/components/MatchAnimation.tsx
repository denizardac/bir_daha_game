import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MatchEvent, MatchOutcome, OpponentStyle } from '@/types';
import { UiIcon } from '@/components/UiIcon';

export type PitchDot = { x: number; y: number; gk?: boolean };

interface Props {
  minute: number;
  goalsFor: number;
  goalsAgainst: number;
  latestEvent?: MatchEvent | null;
  eventFeed: MatchEvent[];
  playing: boolean;
  halftime?: boolean;
  outcome?: MatchOutcome;
  wide?: boolean;
  /** @deprecated use pitchDots */
  squadCount?: number;
  pitchDots?: PitchDot[];
  filledCount?: number;
}

/** 4-4-2 diziliş — ev sahibi soldan sağa hücum (GK dahil 11 slot) */
const HOME_FORMATION = [
  { x: 8, y: 50, gk: true },
  { x: 20, y: 15 }, { x: 20, y: 38 }, { x: 20, y: 62 }, { x: 20, y: 85 },
  { x: 34, y: 18 }, { x: 34, y: 40 }, { x: 34, y: 60 }, { x: 34, y: 82 },
  { x: 46, y: 36 }, { x: 46, y: 64 },
];

const AWAY_442 = HOME_FORMATION.map((p) => ({ ...p, x: 100 - p.x }));

const AWAY_433: PitchDot[] = [
  { x: 92, y: 50, gk: true },
  { x: 80, y: 15 }, { x: 80, y: 38 }, { x: 80, y: 62 }, { x: 80, y: 85 },
  { x: 66, y: 28 }, { x: 66, y: 50 }, { x: 66, y: 72 },
  { x: 54, y: 22 }, { x: 50, y: 50 }, { x: 54, y: 78 },
];

const AWAY_532: PitchDot[] = [
  { x: 92, y: 50, gk: true },
  { x: 80, y: 12 }, { x: 80, y: 30 }, { x: 80, y: 50 }, { x: 80, y: 70 }, { x: 80, y: 88 },
  { x: 66, y: 35 }, { x: 66, y: 50 }, { x: 66, y: 65 },
  { x: 54, y: 38 }, { x: 54, y: 62 },
];

function getAwayFormation(style: OpponentStyle, round: number): PitchDot[] {
  const aggressive = round % 2 === 0 ? AWAY_433 : AWAY_442;
  const defensive = round % 2 === 0 ? AWAY_532 : AWAY_442;
  if (style === 'saldırgan') return aggressive;
  if (style === 'savunmacı') return defensive;
  return round % 3 === 0 ? AWAY_433 : AWAY_442;
}

function eventLabel(ev: MatchEvent): string {
  switch (ev.type) {
    case 'goal_for':
      return ev.assistName ? `GOL! ${ev.playerName}` : `GOL! ${ev.playerName}`;
    case 'goal_against':
      return `YEDİK — ${ev.playerName}`;
    case 'yellow_for':
      return `SARI — ${ev.playerName}`;
    case 'red_for':
      return `KIRMIZI — ${ev.playerName}`;
    case 'yellow_against':
      return `Sarı (rakip)`;
    default:
      return ev.playerName;
  }
}

function eventClass(ev: MatchEvent): string {
  switch (ev.type) {
    case 'goal_for':
      return 'match-event--goal-for';
    case 'goal_against':
      return 'match-event--goal-against';
    case 'yellow_for':
    case 'yellow_against':
      return 'match-event--yellow';
    case 'red_for':
      return 'match-event--red';
    default:
      return '';
  }
}

type BallPhase =
  | 'mid'
  | 'home-build'
  | 'home-attack'
  | 'home-wide'
  | 'away-build'
  | 'away-attack'
  | 'away-wide'
  | 'home-goal'
  | 'away-goal';

function getBallPhase(latest: MatchEvent | null | undefined, playing: boolean, minute: number): BallPhase {
  if (!playing) return 'mid';
  if (latest?.type === 'goal_for') return 'home-goal';
  if (latest?.type === 'goal_against') return 'away-goal';
  if (latest?.type === 'yellow_for' || latest?.type === 'red_for') return 'home-attack';
  if (latest?.type === 'yellow_against') return 'away-attack';

  const cycle: BallPhase[] = ['home-build', 'home-attack', 'home-wide', 'mid', 'away-build', 'away-attack', 'away-wide'];
  return cycle[minute % cycle.length] ?? 'mid';
}

const BALL_POS: Record<BallPhase, { left: string; top: string }> = {
  mid: { left: '50%', top: '50%' },
  'home-build': { left: '35%', top: '48%' },
  'home-attack': { left: '70%', top: '42%' },
  'home-wide': { left: '78%', top: '68%' },
  'away-build': { left: '65%', top: '52%' },
  'away-attack': { left: '30%', top: '38%' },
  'away-wide': { left: '22%', top: '62%' },
  'home-goal': { left: '92%', top: '50%' },
  'away-goal': { left: '8%', top: '50%' },
};

export function MatchAnimation({
  minute,
  goalsFor,
  goalsAgainst,
  latestEvent,
  eventFeed,
  playing,
  halftime,
  outcome,
  wide,
  squadCount = 11,
  pitchDots,
  filledCount,
  opponentStyle = 'dengeli',
  round = 1,
}: Props & { opponentStyle?: OpponentStyle; round?: number }) {
  const flashClass =
    latestEvent?.type === 'goal_for'
      ? 'match-pitch-flash--win'
      : latestEvent?.type === 'goal_against'
        ? 'match-pitch-flash--loss'
        : latestEvent?.type === 'red_for'
          ? 'match-pitch-flash--red'
          : '';

  const ballPhase = getBallPhase(latestEvent, playing, minute);
  const ballPos = BALL_POS[ballPhase];
  const homePress = ballPhase.startsWith('home');
  const awayPress = ballPhase.startsWith('away');

  const homePlayers = useMemo(() => {
    if (pitchDots?.length) return pitchDots;
    const count = Math.max(1, Math.min(squadCount, HOME_FORMATION.length));
    return HOME_FORMATION.slice(0, count);
  }, [pitchDots, squadCount]);

  const awayPlayers = useMemo(
    () => getAwayFormation(opponentStyle, round),
    [opponentStyle, round],
  );

  const highlightHomeIdx = useMemo(() => {
    if (latestEvent?.type === 'goal_for') return Math.min(homePlayers.length - 1, 9);
    if (latestEvent?.type === 'yellow_for' || latestEvent?.type === 'red_for') return Math.min(homePlayers.length - 1, 5);
    return -1;
  }, [latestEvent, homePlayers.length]);

  const showPitchOutcome = !playing && outcome && !halftime;

  const feedLines = eventFeed.length > 0 ? (
    eventFeed.slice(-3).map((ev, i) => (
      <p key={`${ev.minute}-${ev.type}-${i}`} className={`match-pitch-feed-line ${eventClass(ev)}`}>
        <span className="match-pitch-feed-min">{ev.minute}&apos;</span>
        {eventLabel(ev)}
      </p>
    ))
  ) : null;

  const pitchEl = (
    <div className={`match-pitch match-pitch--v2 ${wide ? 'match-pitch--wide' : ''} ${flashClass} ${!playing ? 'match-pitch--ended' : ''}`}>
      <div className="match-pitch-grass match-pitch-grass--stripes" aria-hidden />
      <div className="match-pitch-overlay" aria-hidden />
      <div className="match-pitch-lines" aria-hidden />
      <div className="match-pitch-box match-pitch-box--left" aria-hidden />
      <div className="match-pitch-box match-pitch-box--right" aria-hidden />
      <div className="match-pitch-circle" aria-hidden />
      <div className="match-pitch-half match-pitch-half--left" aria-hidden />
      <div className="match-pitch-half match-pitch-half--right" aria-hidden />

      {homePress && playing && <div className="match-pitch-wave match-pitch-wave--home" aria-hidden />}
      {awayPress && playing && <div className="match-pitch-wave match-pitch-wave--away" aria-hidden />}

      {playing && ballPhase !== 'mid' && (
        <div
          className={`match-pitch-pass-line match-pitch-pass-line--${homePress ? 'home' : 'away'}`}
          aria-hidden
        />
      )}

      <span className="match-pitch-live">
        <span className="match-pitch-live-dot" /> {playing ? 'CANLI' : 'BİTTİ'}
      </span>
      <span className="match-pitch-minute">{minute}&apos;</span>

      <p className="match-pitch-score">
        {goalsFor} - {goalsAgainst}
      </p>

      {showPitchOutcome && (
        <p className={`match-pitch-outcome match-pitch-outcome--top match-pitch-outcome--${outcome}`}>
          {outcome === 'win' ? 'GALİBİYET' : outcome === 'loss' ? 'MAĞLUBİYET' : 'BERABERE'}
        </p>
      )}

      {halftime && <p className="match-pitch-halftime">DEVRE ARASI</p>}

      <AnimatePresence>
        {latestEvent && playing && (
          <motion.p
            key={`${latestEvent.minute}-${latestEvent.type}`}
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`match-pitch-popup ${eventClass(latestEvent)}`}
          >
            {(latestEvent.type === 'goal_for' || latestEvent.type === 'goal_against') && <UiIcon name="circle-dot" className="match-pitch-popup-icon" />}
            {(latestEvent.type === 'yellow_for' || latestEvent.type === 'yellow_against') && <UiIcon name="square" className="match-pitch-popup-icon match-pitch-popup-icon--yellow" />}
            {latestEvent.type === 'red_for' && <UiIcon name="square" className="match-pitch-popup-icon match-pitch-popup-icon--red" />}
            {eventLabel(latestEvent)}
            {latestEvent.assistName && latestEvent.type === 'goal_for' && (
              <span className="match-pitch-popup-assist"> · Asist: {latestEvent.assistName}</span>
            )}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="match-pitch-team match-pitch-team--home" aria-hidden>
        {homePlayers.map((p, i) => (
          <span
            key={i}
            className={`match-pitch-player match-pitch-player--home ${p.gk ? 'match-pitch-player--gk' : ''} ${
              i === highlightHomeIdx ? 'match-pitch-player--highlight' : ''
            } ${homePress && !p.gk ? 'match-pitch-player--press' : ''}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          />
        ))}
        {(filledCount ?? squadCount) < 11 && (
          <span className="match-pitch-squad-count">{filledCount ?? squadCount}/11</span>
        )}
      </div>
      <div className="match-pitch-team match-pitch-team--away" aria-hidden>
        {awayPlayers.map((p, i) => (
          <span
            key={i}
            className={`match-pitch-player match-pitch-player--away ${p.gk ? 'match-pitch-player--gk' : ''} ${
              awayPress && !p.gk ? 'match-pitch-player--press' : ''
            }`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          />
        ))}
      </div>

      <motion.div
        className={`match-pitch-ball ${playing ? 'match-pitch-ball--live' : 'match-pitch-ball--idle-end'}`}
        aria-hidden
        animate={{ left: ballPos.left, top: ballPos.top }}
        transition={{ type: 'spring', stiffness: playing ? 140 : 80, damping: playing ? 16 : 22 }}
      >
        <UiIcon name="circle-dot" className="match-pitch-ball-icon" />
      </motion.div>

      {!wide && feedLines && (
        <div className="match-pitch-feed">
          {feedLines}
        </div>
      )}
    </div>
  );

  if (wide) {
    return (
      <div className="match-arena-stack">
        {pitchEl}
        {feedLines && (
          <div className="match-pitch-feed match-pitch-feed--below" aria-label="Maç olayları">
            {feedLines}
          </div>
        )}
      </div>
    );
  }

  return pitchEl;
}

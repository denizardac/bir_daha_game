import {
  MATCH_ANIM_MAX_SEGMENT_MS,
  MATCH_ANIM_MIN_EVENT_GAP,
  MATCH_ANIM_MS_PER_MINUTE,
} from '@/constants/game';
import type { MatchEvent } from '@/types';

const MS_PER_MINUTE = MATCH_ANIM_MS_PER_MINUTE;
const MIN_EVENT_GAP = MATCH_ANIM_MIN_EVENT_GAP;
const MAX_SEGMENT_MS = MATCH_ANIM_MAX_SEGMENT_MS;
const KICKOFF_DELAY = 280;
const HALFTIME_PAUSE = 520;
const FULLTIME_PAUSE = 480;
const POPUP_DURATION = 560;

export interface MatchAnimState {
  minute: number;
  goalsFor: number;
  goalsAgainst: number;
  eventFeed: MatchEvent[];
  latestEvent: MatchEvent | null;
  playing: boolean;
  halftime: boolean;
  showResult: boolean;
  showHighlights: boolean;
}

function segmentMs(from: number, to: number): number {
  return Math.min(Math.max((to - from) * MS_PER_MINUTE, MIN_EVENT_GAP), MAX_SEGMENT_MS);
}

export function buildMatchAnimSchedule(
  events: MatchEvent[],
  finalGoalsFor: number,
  finalGoalsAgainst: number,
  onUpdate: (partial: Partial<MatchAnimState>) => void,
  onGoalSound: () => void,
  onWhistleSound: () => void,
  speed = 1,
): ReturnType<typeof setTimeout>[] {
  const timers: ReturnType<typeof setTimeout>[] = [];
  const spd = speed > 0 ? speed : 1;
  let t = KICKOFF_DELAY;
  let gf = 0;
  let ga = 0;
  let prevMinute = 0;
  let halftimeShown = false;
  const feed: MatchEvent[] = [];

  const schedule = (delay: number, fn: () => void) => {
    timers.push(setTimeout(fn, delay / spd));
  };

  schedule(0, () => {
    onUpdate({
      minute: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      playing: true,
      eventFeed: [],
      latestEvent: null,
      halftime: false,
      showResult: false,
      showHighlights: false,
    });
  });

  for (const ev of events) {
    if (!halftimeShown && ev.minute >= 45) {
      const htAt = t + segmentMs(prevMinute, 45);
      schedule(htAt, () => onUpdate({ minute: 45, halftime: true, latestEvent: null }));
      t = htAt + HALFTIME_PAUSE;
      schedule(t, () => onUpdate({ halftime: false, minute: 46 }));
      prevMinute = 46;
      halftimeShown = true;
    }

    const gap = segmentMs(prevMinute, ev.minute);
    t += gap;
    const at = t;

    schedule(at, () => {
      feed.push(ev);
      if (ev.type === 'goal_for' || ev.type === 'goal_against') onGoalSound();
      if (ev.type === 'goal_for') gf += 1;
      else if (ev.type === 'goal_against') ga += 1;
      onUpdate({
        minute: ev.minute,
        goalsFor: gf,
        goalsAgainst: ga,
        eventFeed: [...feed],
        latestEvent: ev,
      });
    });

    schedule(at + POPUP_DURATION, () => onUpdate({ latestEvent: null }));
    prevMinute = ev.minute;
  }

  if (!halftimeShown) {
    t += segmentMs(prevMinute, 45);
    schedule(t, () => onUpdate({ minute: 45, halftime: true, latestEvent: null }));
    t += HALFTIME_PAUSE;
    schedule(t, () => onUpdate({ halftime: false, minute: 46 }));
    prevMinute = 46;
  }

  t += segmentMs(prevMinute, 90);
  schedule(t, () => {
    onWhistleSound();
    onUpdate({
      minute: 90,
      playing: false,
      goalsFor: finalGoalsFor,
      goalsAgainst: finalGoalsAgainst,
      latestEvent: null,
      halftime: false,
    });
  });

  schedule(t + FULLTIME_PAUSE, () => onUpdate({ showResult: true }));
  schedule(t + FULLTIME_PAUSE + 1400, () => onUpdate({ showHighlights: true }));

  return timers;
}

/** Hız değişiminde maçı sıfırlamadan kalan olayları yeniden planla */
export function buildMatchAnimScheduleResume(
  events: MatchEvent[],
  finalGoalsFor: number,
  finalGoalsAgainst: number,
  fromMinute: number,
  currentGoalsFor: number,
  currentGoalsAgainst: number,
  currentFeed: MatchEvent[],
  onUpdate: (partial: Partial<MatchAnimState>) => void,
  onGoalSound: () => void,
  onWhistleSound: () => void,
  speed = 1,
): ReturnType<typeof setTimeout>[] {
  const timers: ReturnType<typeof setTimeout>[] = [];
  const spd = speed > 0 ? speed : 1;
  let t = 120;
  let gf = currentGoalsFor;
  let ga = currentGoalsAgainst;
  let prevMinute = fromMinute;
  let halftimeShown = fromMinute >= 45;
  const feed = [...currentFeed];

  const schedule = (delay: number, fn: () => void) => {
    timers.push(setTimeout(fn, delay / spd));
  };

  const remaining = events.filter((ev) => ev.minute > fromMinute);

  for (const ev of remaining) {
    if (!halftimeShown && ev.minute >= 45 && fromMinute < 45) {
      const htAt = t + segmentMs(prevMinute, 45);
      schedule(htAt, () => onUpdate({ minute: 45, halftime: true, latestEvent: null }));
      t = htAt + HALFTIME_PAUSE;
      schedule(t, () => onUpdate({ halftime: false, minute: 46 }));
      prevMinute = 46;
      halftimeShown = true;
    }

    const gap = segmentMs(prevMinute, ev.minute);
    t += gap;
    const at = t;

    schedule(at, () => {
      feed.push(ev);
      if (ev.type === 'goal_for' || ev.type === 'goal_against') onGoalSound();
      if (ev.type === 'goal_for') gf += 1;
      else if (ev.type === 'goal_against') ga += 1;
      onUpdate({
        minute: ev.minute,
        goalsFor: gf,
        goalsAgainst: ga,
        eventFeed: [...feed],
        latestEvent: ev,
      });
    });

    schedule(at + POPUP_DURATION, () => onUpdate({ latestEvent: null }));
    prevMinute = ev.minute;
  }

  if (!halftimeShown && fromMinute < 45) {
    t += segmentMs(prevMinute, 45);
    schedule(t, () => onUpdate({ minute: 45, halftime: true, latestEvent: null }));
    t += HALFTIME_PAUSE;
    schedule(t, () => onUpdate({ halftime: false, minute: 46 }));
    prevMinute = 46;
  }

  if (fromMinute < 90) {
    t += segmentMs(prevMinute, 90);
    schedule(t, () => {
      onWhistleSound();
      onUpdate({
        minute: 90,
        playing: false,
        goalsFor: finalGoalsFor,
        goalsAgainst: finalGoalsAgainst,
        latestEvent: null,
        halftime: false,
      });
    });

    schedule(t + FULLTIME_PAUSE, () => onUpdate({ showResult: true }));
    schedule(t + FULLTIME_PAUSE + 1400, () => onUpdate({ showHighlights: true }));
  }

  return timers;
}

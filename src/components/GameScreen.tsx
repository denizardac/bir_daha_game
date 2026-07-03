import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  CardSelectScreen,
  EventScreen,
  MatchScreen,
  LossScreen,
  RunEndScreen,
} from '@/components/GameScreens';
import { MilestoneToastStack } from '@/components/MilestoneToast';
import { TutorialCoach } from '@/components/TutorialCoach';

export function GameScreen() {
  const phase = useGameStore((s) => s.phase);
  const runEndStep = useGameStore((s) => s.runEndStep);

  useEffect(() => {
    if (!window.matchMedia('(max-width: 959px)').matches) {
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [phase, runEndStep]);

  return (
    <div className="game-viewport">
      <TutorialCoach />
      <MilestoneToastStack />
      {phase === 'event' && <EventScreen />}
      {phase === 'match' && <MatchScreen />}
      {phase === 'loss' && <LossScreen />}
      {phase === 'runEnd' && <RunEndScreen />}
      {phase === 'cardSelect' && <CardSelectScreen />}
    </div>
  );
}

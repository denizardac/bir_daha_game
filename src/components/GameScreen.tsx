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
  const tickTimer = useGameStore((s) => s.tickTimer);

  useEffect(() => {
    const id = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(id);
  }, [tickTimer]);

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

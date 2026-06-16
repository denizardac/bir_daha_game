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

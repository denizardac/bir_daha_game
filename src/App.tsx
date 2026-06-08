import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { MainMenu } from '@/components/MainMenu';
import { GameScreen } from '@/components/GameScreen';
import { SynergiesScreen } from '@/components/SynergiesScreen';
import { LeaderboardScreen } from '@/components/LeaderboardScreen';
import { HowToPlayScreen } from '@/components/HowToPlayScreen';
import { HallOfFameScreen } from '@/components/HallOfFameScreen';
import { SettingsScreen } from '@/components/SettingsScreen';
import { GameGuideScreen } from '@/components/GameGuideScreen';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const init = useGameStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  switch (screen) {
    case 'game':
      return <GameScreen />;
    case 'synergies':
      return <SynergiesScreen />;
    case 'leaderboard':
      return <LeaderboardScreen />;
    case 'hallOfFame':
      return <HallOfFameScreen />;
    case 'howToPlay':
      return <HowToPlayScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'gameGuide':
      return <GameGuideScreen />;
    default:
      return <MainMenu />;
  }
}

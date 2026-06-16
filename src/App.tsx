import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { MainMenu } from '@/components/MainMenu';
import { GameScreen } from '@/components/GameScreen';
import { SynergiesScreen } from '@/components/SynergiesScreen';
import { LeaderboardScreen } from '@/components/LeaderboardScreen';
import { HallOfFameScreen } from '@/components/HallOfFameScreen';
import { SettingsScreen } from '@/components/SettingsScreen';
import { GameGuideScreen } from '@/components/GameGuideScreen';
import { CollectionScreen } from '@/components/CollectionScreen';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const init = useGameStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const flush = () => useGameStore.getState().saveCurrentRun();
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
    };
  }, []);

  switch (screen) {
    case 'game':
      return <GameScreen />;
    case 'synergies':
      return <SynergiesScreen />;
    case 'leaderboard':
      return <LeaderboardScreen />;
    case 'hallOfFame':
      return <HallOfFameScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'gameGuide':
      return <GameGuideScreen />;
    case 'collection':
      return <CollectionScreen />;
    default:
      return <MainMenu />;
  }
}

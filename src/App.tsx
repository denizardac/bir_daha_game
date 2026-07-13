import { lazy, Suspense, useEffect } from 'react';
import { parseChallengeFromSearch, stripChallengeParams } from '@/engine/challenge';
import { useGameStore } from '@/store/gameStore';
import { MainMenu } from '@/components/MainMenu';
import { PwaUpdateToast } from '@/components/PwaUpdateToast';

const GameScreen = lazy(() => import('@/components/GameScreen').then((module) => ({ default: module.GameScreen })));
const SynergiesScreen = lazy(() => import('@/components/SynergiesScreen').then((module) => ({ default: module.SynergiesScreen })));
const LeaderboardScreen = lazy(() => import('@/components/LeaderboardScreen').then((module) => ({ default: module.LeaderboardScreen })));
const HallOfFameScreen = lazy(() => import('@/components/HallOfFameScreen').then((module) => ({ default: module.HallOfFameScreen })));
const SettingsScreen = lazy(() => import('@/components/SettingsScreen').then((module) => ({ default: module.SettingsScreen })));
const GameGuideScreen = lazy(() => import('@/components/GameGuideScreen').then((module) => ({ default: module.GameGuideScreen })));
const CollectionScreen = lazy(() => import('@/components/CollectionScreen').then((module) => ({ default: module.CollectionScreen })));

function ScreenLoading() {
  return <div className="game-shell page-screen app-screen-loading" role="status">Ekran hazırlanıyor…</div>;
}

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const init = useGameStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  // Meydan okuma linki: ?seed=...&score=...&by=... → menüde banner, sonra URL temizlenir
  useEffect(() => {
    const challenge = parseChallengeFromSearch(window.location.search);
    if (!challenge) return;
    useGameStore.getState().setChallenge(challenge);
    window.history.replaceState({}, '', stripChallengeParams(window.location.href));
  }, []);

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

  let content;
  switch (screen) {
    case 'game':
      content = <GameScreen />;
      break;
    case 'synergies':
      content = <SynergiesScreen />;
      break;
    case 'leaderboard':
      content = <LeaderboardScreen />;
      break;
    case 'hallOfFame':
      content = <HallOfFameScreen />;
      break;
    case 'settings':
      content = <SettingsScreen />;
      break;
    case 'gameGuide':
      content = <GameGuideScreen />;
      break;
    case 'collection':
      content = <CollectionScreen />;
      break;
    default:
      return <><MainMenu /><PwaUpdateToast /></>;
  }
  return <><Suspense fallback={<ScreenLoading />}>{content}</Suspense><PwaUpdateToast /></>;
}

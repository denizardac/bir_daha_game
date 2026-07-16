import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { installChunkLoadRecovery } from '@/pwa/chunkRecovery';
import {
  announceServiceWorkerUpdate,
  getServiceWorkerUpdateVersion,
} from '@/pwa/updatePrompt';
import { useGameStore } from '@/store/gameStore';
import './index.css';
import './styles/eventScenes.css';

installChunkLoadRecovery({
  saveCurrentRun: () => useGameStore.getState().saveCurrentRun(),
});

if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      void getServiceWorkerUpdateVersion().then((version) => {
        announceServiceWorkerUpdate({
          apply: async () => {
            useGameStore.getState().saveCurrentRun();
            await updateSW(true);
          },
          version,
        });
      });
    },
    onRegisteredSW(_url, registration) {
      if (registration) {
        void registration.update();
        setInterval(() => registration.update(), 15 * 60 * 1000);
      }
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);

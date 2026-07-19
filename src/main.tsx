import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { FeedbackProvider } from '@/components/FeedbackCenter';
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
        // An update() rejection (e.g. after another tab unregisters this worker)
        // must never surface as an unhandled rejection: its message used to trip
        // the boot-recovery watchdog and reload the page in a loop.
        setInterval(() => {
          registration.update().catch(() => {});
        }, 15 * 60 * 1000);
      }
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <FeedbackProvider>
        <App />
      </FeedbackProvider>
    </AppErrorBoundary>
  </StrictMode>,
);

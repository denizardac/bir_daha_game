import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { installChunkLoadRecovery } from '@/pwa/chunkRecovery';
import { getServiceWorkerUpdateVersion } from '@/pwa/updatePrompt';
import { useGameStore } from '@/store/gameStore';
import './index.css';
import './styles/eventScenes.css';

installChunkLoadRecovery({
  saveCurrentRun: () => useGameStore.getState().saveCurrentRun(),
});

if ('serviceWorker' in navigator) {
  let updatePromptAnnounced = false;
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      if (updatePromptAnnounced) return;
      updatePromptAnnounced = true;
      void getServiceWorkerUpdateVersion().then((version) => {
        window.dispatchEvent(new CustomEvent('bir-daha-update-ready', {
          detail: { apply: () => updateSW(true), version },
        }));
      });
    },
    onRegisteredSW(_url, registration) {
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
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

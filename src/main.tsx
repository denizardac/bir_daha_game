import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { installChunkLoadRecovery } from '@/pwa/chunkRecovery';
import { useGameStore } from '@/store/gameStore';
import './index.css';
import './styles/eventScenes.css';

installChunkLoadRecovery({
  saveCurrentRun: () => useGameStore.getState().saveCurrentRun(),
});

if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedReload() {
      try {
        useGameStore.getState().saveCurrentRun();
      } finally {
        window.location.reload();
      }
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

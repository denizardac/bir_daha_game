import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { getServiceWorkerUpdateVersion } from '@/pwa/updatePrompt';
import './index.css';
import './styles/eventScenes.css';

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
    <App />
  </StrictMode>,
);

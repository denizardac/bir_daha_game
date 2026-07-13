import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';
import './styles/eventScenes.css';

if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent('bir-daha-update-ready', {
        detail: { apply: () => updateSW(true) },
      }));
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

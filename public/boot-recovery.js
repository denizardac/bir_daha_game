(function installBootRecovery() {
  'use strict';

  var ATTEMPT_KEY = 'bir-daha-pre-react-recovery-attempted';
  var LEGACY_UPDATE_MIGRATION_KEY = 'bir-daha-pwa-prompt-migration-v1';
  var WATCHDOG_MS = 8000;
  var recoveryStarted = false;

  function getRoot() {
    return document.getElementById('root');
  }

  function appMounted() {
    var root = getRoot();
    return Boolean(root && root.childElementCount > 0);
  }

  function clearAttempt() {
    try {
      window.sessionStorage.removeItem(ATTEMPT_KEY);
    } catch {
      // Privacy modes may block storage. A mounted app is already healthy.
    }
  }

  function markLegacyMigrationComplete() {
    window.localStorage.setItem(LEGACY_UPDATE_MIGRATION_KEY, '1');
  }

  function waitForInstall(worker) {
    if (!worker || worker.state === 'installed' || worker.state === 'activated' || worker.state === 'redundant') {
      return Promise.resolve();
    }
    return new Promise(function waitForStateChange(resolve) {
      worker.addEventListener('statechange', function onStateChange() {
        if (worker.state === 'installed' || worker.state === 'activated' || worker.state === 'redundant') resolve();
      });
    });
  }

  async function migrateLegacyAutoUpdateWorker() {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;

    try {
      if (window.localStorage.getItem(LEGACY_UPDATE_MIGRATION_KEY) === '1') return;
    } catch {
      // Without persistent guarding, an automatic migration could reload repeatedly.
      return;
    }

    try {
      var registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        markLegacyMigrationComplete();
        return;
      }

      await registration.update();
      if (!registration.waiting && registration.installing) {
        await waitForInstall(registration.installing);
      }

      var waitingWorker = registration.waiting;
      markLegacyMigrationComplete();
      if (!waitingWorker) return;

      var reloadStarted = false;
      navigator.serviceWorker.addEventListener('controllerchange', function onControllerChange() {
        if (reloadStarted) return;
        reloadStarted = true;
        window.location.reload();
      }, { once: true });
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } catch {
      // A failed update check leaves the current working version untouched and retries next boot.
    }
  }

  function showManualFallback() {
    var root = getRoot();
    if (!root) return;
    root.replaceChildren();

    var main = document.createElement('main');
    var title = document.createElement('h1');
    var copy = document.createElement('p');
    var button = document.createElement('button');

    main.setAttribute('role', 'alert');
    main.style.cssText = 'min-height:100vh;display:grid;place-content:center;gap:16px;padding:24px;background:#020807;color:#f4f7f5;font-family:system-ui,sans-serif;text-align:center';
    title.textContent = 'Yeni sürüme geçelim';
    copy.textContent = 'Oyun kaydın güvende. Son güncellemeyi tamamlamak için tekrar deneyebilirsin.';
    button.textContent = 'Tekrar dene';
    button.style.cssText = 'justify-self:center;padding:12px 20px;border:0;border-radius:10px;background:#e83b5b;color:white;font-weight:800;cursor:pointer';
    button.addEventListener('click', function retry() {
      try {
        window.sessionStorage.removeItem(ATTEMPT_KEY);
      } catch {
        // Continue with a normal reload when storage is unavailable.
      }
      window.location.reload();
    });

    main.append(title, copy, button);
    root.append(main);
  }

  async function repairStaleDeployment() {
    if (recoveryStarted || appMounted()) return;
    recoveryStarted = true;

    try {
      if (window.sessionStorage.getItem(ATTEMPT_KEY) === '1') {
        showManualFallback();
        return;
      }
      window.sessionStorage.setItem(ATTEMPT_KEY, '1');
    } catch {
      showManualFallback();
      return;
    }

    try {
      if ('serviceWorker' in navigator) {
        var registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(function unregister(registration) {
          return registration.unregister();
        }));
      }

      if ('caches' in window) {
        var cacheNames = await window.caches.keys();
        await Promise.all(cacheNames.map(function removeCache(cacheName) {
          return window.caches.delete(cacheName);
        }));
      }
    } finally {
      // Cache Storage contains application bundles only. localStorage and IndexedDB,
      // where run progress lives, are deliberately left untouched.
      window.location.reload();
    }
  }

  function observeAppMount() {
    var root = getRoot();
    if (!root || !('MutationObserver' in window)) return;
    var observer = new MutationObserver(function onRootChanged() {
      if (!appMounted()) return;
      clearAttempt();
      observer.disconnect();
    });
    observer.observe(root, { childList: true });
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', observeAppMount, { once: true });
  } else {
    observeAppMount();
  }

  window.addEventListener('error', function onBootError(event) {
    var target = event.target;
    var scriptFailed = target && target.tagName === 'SCRIPT';
    var moduleFailed = /chunk|module|import|script/i.test(String(event.message || ''));
    if (scriptFailed || moduleFailed) void repairStaleDeployment();
  }, true);

  window.addEventListener('unhandledrejection', function onBootRejection(event) {
    var reason = event.reason instanceof Error ? event.reason.message : String(event.reason || '');
    if (/chunk|module|import|script|fetch/i.test(reason)) void repairStaleDeployment();
  });

  window.setTimeout(function verifyBoot() {
    if (appMounted()) clearAttempt();
    else void repairStaleDeployment();
  }, WATCHDOG_MS);

  void migrateLegacyAutoUpdateWorker();
}());

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const projectFile = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('PWA deployment safety contract', () => {
  it('never edge-caches the worker, HTML shell, or pre-React recovery script', () => {
    const headers = projectFile('public/_headers');
    const vercel = JSON.parse(projectFile('vercel.json')) as {
      headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    };

    for (const path of ['/sw.js', '/index.html', '/boot-recovery.js']) {
      expect(headers).toMatch(new RegExp(`${path.replace('.', '\\.') }[\\s\\S]*?Cache-Control: no-store, no-cache, must-revalidate`));
      const rule = vercel.headers?.find((candidate) => candidate.source === path);
      expect(rule?.headers).toContainEqual({
        key: 'Cache-Control',
        value: 'no-store, no-cache, must-revalidate',
      });
    }
    expect(headers).toMatch(/\/assets\/\*[\s\S]*?Cache-Control: public, max-age=31536000, immutable/);
  });

  it('keeps a new worker waiting for user approval and loads recovery before the hashed app entry', () => {
    const viteConfig = projectFile('vite.config.ts');
    const main = projectFile('src/main.tsx');
    const html = projectFile('index.html');
    const recoveryIndex = html.indexOf('/boot-recovery.js');
    const appIndex = html.indexOf('/src/main.tsx');

    expect(viteConfig).toContain("registerType: 'prompt'");
    expect(viteConfig).toContain('clientsClaim: false');
    expect(viteConfig).toContain('skipWaiting: false');
    expect(main).toContain('onNeedRefresh()');
    expect(main).toContain('announceServiceWorkerUpdate({');
    expect(main).not.toContain('onNeedReload()');
    expect(viteConfig).toContain("globIgnores: ['boot-recovery.js']");
    expect(recoveryIndex).toBeGreaterThan(-1);
    expect(appIndex).toBeGreaterThan(recoveryIndex);
  });

  it('ships a pre-React watchdog that repairs an empty root without deleting saves', () => {
    const recovery = projectFile('public/boot-recovery.js');

    expect(recovery).toContain("document.getElementById('root')");
    expect(recovery).toContain('navigator.serviceWorker.getRegistrations()');
    expect(recovery).toContain('registration.unregister()');
    expect(recovery).toContain('window.location.reload()');
    expect(recovery).not.toContain('localStorage.clear');
    expect(recovery).not.toContain('indexedDB.deleteDatabase');
  });

  it('unregisters stale workers and purges only Cache Storage when boot stays empty', async () => {
    const recovery = projectFile('public/boot-recovery.js');
    const unregister = vi.fn(async () => true);
    const deleteCache = vi.fn(async () => true);
    const reload = vi.fn();
    const timers: Array<() => void> = [];
    const storage = new Map<string, string>();
    const root = {
      childElementCount: 0,
      replaceChildren: vi.fn(),
      append: vi.fn(),
    };
    class FakeMutationObserver {
      observe() { /* the watchdog drives this scenario */ }
      disconnect() { /* no mounted app to observe */ }
    }
    const sessionStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    };
    const serviceWorker = { getRegistrations: vi.fn(async () => [{ unregister }]) };
    const caches = { keys: vi.fn(async () => ['workbox-precache-v1']), delete: deleteCache };
    const windowObject = {
      sessionStorage,
      location: { reload },
      serviceWorker,
      caches,
      MutationObserver: FakeMutationObserver,
      addEventListener: vi.fn(),
      setTimeout: (callback: () => void) => { timers.push(callback); },
    };

    runInNewContext(recovery, {
      window: windowObject,
      document: {
        getElementById: () => root,
        readyState: 'complete',
        createElement: () => ({ setAttribute: vi.fn(), style: {}, addEventListener: vi.fn(), append: vi.fn() }),
      },
      navigator: { serviceWorker },
      MutationObserver: FakeMutationObserver,
      Error,
      Promise,
    });

    expect(timers).toHaveLength(1);
    timers[0]();
    await new Promise((resolveTick) => setTimeout(resolveTick, 0));

    expect(unregister).toHaveBeenCalledOnce();
    expect(deleteCache).toHaveBeenCalledWith('workbox-precache-v1');
    expect(reload).toHaveBeenCalledOnce();
  });

  it('moves a legacy controlled tab to the waiting prompt worker exactly once', async () => {
    const recovery = projectFile('public/boot-recovery.js');
    const storage = new Map<string, string>();
    const reload = vi.fn();
    const postMessage = vi.fn();
    const update = vi.fn(async () => undefined);
    let onControllerChange: (() => void) | undefined;
    const localStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    };
    const serviceWorker = {
      controller: {},
      getRegistration: vi.fn(async () => ({
        update,
        waiting: { postMessage },
        installing: null,
      })),
      getRegistrations: vi.fn(async () => []),
      addEventListener: vi.fn((name: string, listener: () => void) => {
        if (name === 'controllerchange') onControllerChange = listener;
      }),
    };
    const root = { childElementCount: 1 };
    const context = {
      window: {
        localStorage,
        sessionStorage: localStorage,
        location: { reload },
        serviceWorker,
        caches: { keys: vi.fn(async () => []), delete: vi.fn(async () => true) },
        addEventListener: vi.fn(),
        setTimeout: vi.fn(),
      },
      document: {
        getElementById: () => root,
        readyState: 'complete',
      },
      navigator: { serviceWorker },
      MutationObserver: class {
        observe() { /* mounted app */ }
        disconnect() { /* mounted app */ }
      },
      Error,
      Promise,
    };

    runInNewContext(recovery, context);
    await new Promise((resolveTick) => setTimeout(resolveTick, 0));

    expect(update).toHaveBeenCalledOnce();
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    onControllerChange?.();
    expect(reload).toHaveBeenCalledOnce();

    runInNewContext(recovery, context);
    await new Promise((resolveTick) => setTimeout(resolveTick, 0));

    expect(update).toHaveBeenCalledOnce();
    expect(reload).toHaveBeenCalledOnce();
  });
});

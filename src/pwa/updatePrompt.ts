const DISMISSED_VERSION_KEY = 'bir-daha-pwa-dismissed-version';
const DISMISSED_SESSION_KEY = 'bir-daha-pwa-dismissed-session';
export const UPDATE_READY_EVENT = 'bir-daha-update-ready';

export interface PendingServiceWorkerUpdate {
  apply: () => Promise<void>;
  version?: string;
}

let pendingServiceWorkerUpdate: PendingServiceWorkerUpdate | null = null;

export function announceServiceWorkerUpdate(update: PendingServiceWorkerUpdate): void {
  pendingServiceWorkerUpdate = update;
  window.dispatchEvent(new CustomEvent(UPDATE_READY_EVENT, { detail: update }));
}

export function getPendingServiceWorkerUpdate(): PendingServiceWorkerUpdate | null {
  return pendingServiceWorkerUpdate;
}

export function clearPendingServiceWorkerUpdate(): void {
  pendingServiceWorkerUpdate = null;
}

function fingerprint(content: string): string {
  let hash = 2166136261;
  for (let index = 0; index < content.length; index += 1) {
    hash ^= content.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `sw-${(hash >>> 0).toString(36)}`;
}

export async function getServiceWorkerUpdateVersion(): Promise<string | undefined> {
  try {
    const swUrl = new URL('sw.js', document.baseURI);
    const response = await fetch(swUrl, { cache: 'no-store' });
    if (!response.ok) return undefined;
    return fingerprint(await response.text());
  } catch {
    return undefined;
  }
}

export function isUpdatePromptDismissed(version?: string): boolean {
  try {
    if (version) return localStorage.getItem(DISMISSED_VERSION_KEY) === version;
    return sessionStorage.getItem(DISMISSED_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissUpdatePrompt(version?: string): void {
  try {
    if (version) {
      localStorage.setItem(DISMISSED_VERSION_KEY, version);
      return;
    }
    sessionStorage.setItem(DISMISSED_SESSION_KEY, '1');
  } catch {
    // Storage can be unavailable in privacy modes; hiding still works for this mount.
  }
}

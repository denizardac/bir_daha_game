// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installChunkLoadRecovery } from '@/pwa/chunkRecovery';

describe('installChunkLoadRecovery', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('saves the run and reloads once when a deployed chunk is no longer available', () => {
    const saveCurrentRun = vi.fn();
    const reload = vi.fn();
    const removeListener = installChunkLoadRecovery({ saveCurrentRun, reload });

    const firstFailure = new Event('vite:preloadError', { cancelable: true });
    window.dispatchEvent(firstFailure);

    expect(saveCurrentRun).toHaveBeenCalledOnce();
    expect(firstFailure.defaultPrevented).toBe(true);
    expect(reload).toHaveBeenCalledOnce();

    const secondFailure = new Event('vite:preloadError', { cancelable: true });
    window.dispatchEvent(secondFailure);

    expect(saveCurrentRun).toHaveBeenCalledTimes(2);
    expect(secondFailure.defaultPrevented).toBe(false);
    expect(reload).toHaveBeenCalledOnce();

    removeListener();
  });
});

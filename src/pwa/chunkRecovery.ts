const CHUNK_RELOAD_ATTEMPT_KEY = 'bir-daha-chunk-reload-attempted';

type RecoveryStorage = Pick<Storage, 'getItem' | 'setItem'>;

interface ChunkLoadRecoveryOptions {
  saveCurrentRun: () => void;
  reload?: () => void;
  storage?: RecoveryStorage;
}

export function installChunkLoadRecovery({
  saveCurrentRun,
  reload = () => window.location.reload(),
  storage = window.sessionStorage,
}: ChunkLoadRecoveryOptions): () => void {
  const recoverFromStaleChunk = (event: Event) => {
    try {
      saveCurrentRun();
    } catch {
      // A failed emergency save must not hide the recovery action.
    }

    try {
      if (storage.getItem(CHUNK_RELOAD_ATTEMPT_KEY) === '1') return;
      storage.setItem(CHUNK_RELOAD_ATTEMPT_KEY, '1');
    } catch {
      // Without a durable guard, reloading could create an infinite loop.
      return;
    }

    event.preventDefault();
    reload();
  };

  window.addEventListener('vite:preloadError', recoverFromStaleChunk);
  return () => window.removeEventListener('vite:preloadError', recoverFromStaleChunk);
}

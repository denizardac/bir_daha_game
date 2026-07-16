// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PwaUpdateToast } from '@/components/PwaUpdateToast';
import {
  announceServiceWorkerUpdate,
  clearPendingServiceWorkerUpdate,
} from '@/pwa/updatePrompt';
import { useGameStore } from '@/store/gameStore';

beforeAll(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

function announceUpdate(version: string, apply = vi.fn(async () => undefined)) {
  act(() => {
    announceServiceWorkerUpdate({ apply, version });
  });
  return apply;
}

describe('PwaUpdateToast', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearPendingServiceWorkerUpdate();
    useGameStore.setState({ screen: 'menu', phase: 'cardSelect', lineupEditorOpen: false });
  });

  afterEach(cleanup);

  it('keeps a dismissed worker version hidden but shows a genuinely newer one', async () => {
    const user = userEvent.setup();
    render(<PwaUpdateToast />);

    announceUpdate('worker-v1');
    expect(screen.getByText('Yeni sürüm hazır')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Sonra' }));
    expect(screen.queryByText('Yeni sürüm hazır')).toBeNull();

    announceUpdate('worker-v1');
    expect(screen.queryByText('Yeni sürüm hazır')).toBeNull();

    announceUpdate('worker-v2');
    expect(screen.getByText('Yeni sürüm hazır')).toBeTruthy();
  });

  it('shows an update that was found before the toast mounted', () => {
    announceUpdate('worker-ready-before-react');

    render(<PwaUpdateToast />);

    expect(screen.getByRole('button', { name: 'Sonra' })).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { useGameStore } from '@/store/gameStore';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  });
});

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/?seed=free-friend-seed-123&score=11706&by=felacity');
  useGameStore.setState({ screen: 'menu', showContinuePrompt: false, pendingChallenge: null });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});

describe('Meydan okuma bağlantısı', () => {
  it('arkadaşı isim girişinden aynı seed ile serbest runa başlatır', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole('status', { name: /felacity sana meydan okuyor/i })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Kabul et' }));
    fireEvent.change(screen.getByLabelText('Teknik direktör adı'), { target: { value: 'Arkadas' } });
    await user.click(screen.getByRole('button', { name: 'Aynı seed ile başla' }));

    const state = useGameStore.getState();
    expect(state.seed).toBe('free-friend-seed-123');
    expect(state.displayName).toBe('Arkadas');
    expect(state.isDailySeed).toBe(false);
  });
});

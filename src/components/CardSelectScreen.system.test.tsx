// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardSelectScreen } from '@/components/GameScreens';
import { PLAYER_POOL } from '@/data/players';
import { getTacticEffect } from '@/data/tactics';
import { useGameStore } from '@/store/gameStore';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  });
});

beforeEach(() => {
  localStorage.clear();
  useGameStore.setState({
    screen: 'game',
    phase: 'cardSelect',
    round: 1,
    maxRounds: 15,
    squad: PLAYER_POOL.slice(0, 11),
    currentOffers: PLAYER_POOL.slice(12, 15),
    activeTactics: [getTacticEffect('tactic_442'), getTacticEffect('tactic_topla_oyn')],
    manualLineup: {},
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('Kart seçimindeki aktif oyun sistemi', () => {
  it('tıklanınca tam sistem detayını açar', async () => {
    const user = userEvent.setup();
    render(<CardSelectScreen />);

    await user.click(screen.getByRole('button', { name: /Oyun sistemi.*Topla Oynama.*detaylarını aç/i }));

    const dialog = screen.getByRole('dialog', { name: 'Oyun sistemi detayı' });
    expect(within(dialog).getAllByText('Topla Oynama').length).toBeGreaterThan(0);
    expect(within(dialog).getByText('Seçince ne olur?')).toBeTruthy();
    expect(within(dialog).getByText('Kadrona etkisi')).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RunEndScreen } from '@/components/GameScreens';
import { useGameStore } from '@/store/gameStore';

beforeEach(() => {
  localStorage.clear();
  useGameStore.setState({
    phase: 'runEnd',
    runEndStep: 0,
    score: 11706,
    round: 15,
    displayName: 'felacity',
    roundHistory: [],
    squad: [],
    lossesCount: 2,
    discoveredSynergies: [],
    runEndAnalysis: null,
    newAchievements: [],
    newContentUnlocks: [],
    isDailySeed: false,
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('Run sonu akışı', () => {
  it('ayrı bir sıralama ara ekranı olmadan sade teknik rapora geçer', async () => {
    const user = userEvent.setup();
    render(<RunEndScreen />);

    await user.click(screen.getByRole('button', { name: 'Run raporu' }));

    expect(screen.getByRole('heading', { name: 'Teknik rapor' })).toBeTruthy();
    expect(screen.queryByText('Serbest Mod özeti')).toBeNull();
    expect(screen.getByText(/Bu run çalışan sinerjiler/i)).toBeTruthy();

    const share = screen.getByRole('region', { name: 'Paylaşım' });
    expect(within(share).getAllByRole('button').length).toBeLessThanOrEqual(2);
    expect(screen.queryByText('Görseli kopyala')).toBeNull();
    expect(screen.queryByText('Metni kopyala')).toBeNull();
  });
});

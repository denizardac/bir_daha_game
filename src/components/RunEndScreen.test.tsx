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
    seed: 'free-friend-seed-123',
    roundHistory: [],
    squad: [],
    lossesCount: 2,
    discoveredSynergies: [],
    runEndAnalysis: {
      rank: 1,
      totalPlayers: 1,
      rankPercent: 50,
      bestDecision: null,
      worstMistake: null,
      synergyStats: [{ id: 'test-synergy', name: 'Pas Ustası', icon: 'zap', activations: 4, points: 220 }],
      badges: [],
      scoreRecord: { isLeaderboardBest: true, isHallOfFameBest: false },
    },
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
    const synergiesToggle = screen.getByRole('button', { name: /Çalışan sinerjiler.*1/i });
    expect(screen.queryByText('Pas Ustası')).toBeNull();
    await user.click(synergiesToggle);
    expect(screen.getByText('Pas Ustası')).toBeTruthy();

    const share = screen.getByRole('region', { name: 'Paylaşım' });
    expect(within(share).getByText(/Bağlantıyı açan arkadaşın adını girip aynı seed/i)).toBeTruthy();
    expect(within(share).getByRole('button', { name: /Meydan okuma linkini kopyala/i })).toBeTruthy();
    expect(within(share).getAllByRole('button').length).toBeLessThanOrEqual(2);
    expect(screen.queryByText('Görseli kopyala')).toBeNull();
    expect(screen.queryByText('Metni kopyala')).toBeNull();
  });
});

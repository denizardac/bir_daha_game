// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MainMenu } from '@/components/MainMenu';
import { getTodayKey } from '@/engine/leaderboard';
import { savePartial } from '@/utils/storage';

const remoteRunCount = vi.hoisted(() => ({
  resolve: undefined as undefined | ((count: number | null) => void),
}));

const fetchTodayRunStartCount = vi.hoisted(() => vi.fn(() => new Promise<number | null>((resolve) => {
  remoteRunCount.resolve = resolve;
})));

vi.mock('@/api/leaderboardRemote', () => ({
  fetchTodayRunStartCount,
  isRemoteLeaderboardEnabled: () => true,
}));

beforeAll(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

describe('MainMenu topluluk run sayısı', () => {
  beforeEach(() => {
    localStorage.clear();
    remoteRunCount.resolve = undefined;
    fetchTodayRunStartCount.mockClear();
    savePartial({ todayRuns: 2, todayRunsDate: getTodayKey() });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('uzak toplam gelene kadar yerel sayıyı topluluk toplamı gibi göstermez', async () => {
    render(<MainMenu />);

    const runStat = screen.getByText(/Ranked run ba.lad./).parentElement!;
    expect(runStat.querySelector('.menu-stat-value')?.textContent).toBe('…');

    await waitFor(() => expect(fetchTodayRunStartCount).toHaveBeenCalledOnce());
    await act(async () => remoteRunCount.resolve?.(13));

    expect(runStat.querySelector('.menu-stat-value')?.textContent).toBe('13');
  });
});

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MainMenu } from '@/components/MainMenu';
import { useGameStore } from '@/store/gameStore';
import { loadPersisted } from '@/utils/storage';

beforeEach(() => {
  localStorage.clear();
  useGameStore.getState().startRun(false, 'QA Menajeri');
  useGameStore.setState({ screen: 'menu', showContinuePrompt: true });
});

afterEach(() => {
  cleanup();
  useGameStore.getState().abandonRun();
  localStorage.clear();
});

describe('MainMenu devam eden Run', () => {
  it('Menajer onay verince mevcut Runı silip normal ana menüye döner', async () => {
    const user = userEvent.setup();
    render(<MainMenu />);

    await user.click(screen.getByRole('button', { name: 'Mevcut runı terk et' }));
    expect(loadPersisted().currentRun).not.toBeNull();
    expect(screen.getByText('Bu runın ilerlemesi silinecek.')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Evet, runı terk et' }));
    expect(loadPersisted().currentRun).toBeNull();
    expect(screen.getByRole('button', { name: /Ranked Run Başlat/i })).toBeTruthy();
  });
});

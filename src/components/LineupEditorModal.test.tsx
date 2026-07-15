// @vitest-environment jsdom
import { useState } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LineupEditorModal } from '@/components/LineupEditorModal';
import type { PlayerCard, Position, Tag } from '@/types';

function player(id: string, position: Position, rating: number, tags: Tag[] = []): PlayerCard {
  return { kind: 'player', id, name: id, rating, currentRating: rating, position, rarity: 'iyi', tags };
}

const original = [
  player('gk', 'KL', 74),
  player('lb-local', 'SLB', 72, ['YERLİ']),
  player('cb-local', 'STP', 73, ['YERLİ']),
  player('cb-foreign', 'STP', 72),
  player('rb', 'SÖB', 72),
  player('lw-local', 'SLK', 74, ['YERLİ']),
  player('mid-local', 'OS', 55, ['YERLİ']),
  player('mid-strong', 'OS', 76),
  player('rw', 'SÖK', 74),
  player('striker-a', 'SF', 76),
  player('striker-b', 'SF', 75),
];
const incoming = player('incoming-local', 'OS', 86, ['YERLİ']);

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

afterEach(cleanup);

function Harness({ onCancel = vi.fn() }: { onCancel?: () => void }) {
  const [outgoing, setOutgoing] = useState('mid-local');
  return (
    <LineupEditorModal
      open
      squad={[...original, incoming]}
      activeTactics={[]}
      morale={50}
      discoveredSynergies={[]}
      manualLineup={{}}
      highlightId={incoming.id}
      outgoingId={outgoing}
      maxSquadSize={11}
      onChange={vi.fn()}
      onOutgoingChange={setOutgoing}
      onReset={vi.fn()}
      onConfirm={vi.fn()}
      onCancel={onCancel}
    />
  );
}

function BenchHarness() {
  return (
    <LineupEditorModal
      open
      squad={[...original, incoming]}
      activeTactics={[]}
      morale={50}
      discoveredSynergies={[]}
      manualLineup={{}}
      maxSquadSize={11}
      onChange={vi.fn()}
      onOutgoingChange={vi.fn()}
      onReset={vi.fn()}
      onConfirm={vi.fn()}
    />
  );
}

describe('LineupEditorModal critical flow', () => {
  it('shows only the negative synergy impact caused by the selected departure', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const decision = screen.getByRole('region', { name: 'Kadrodan ayrılacak oyuncu' });
    expect(within(decision).getByText('mid-local')).toBeTruthy();
    expect(within(decision).getByText('YERLİ KADRO')).toBeTruthy();
    expect(within(decision).getByText('Kapanır')).toBeTruthy();
    expect(within(decision).queryByText('Açılır')).toBeNull();

    await user.click(within(decision).getByRole('button', { name: 'Değiştir' }));
    await user.click(screen.getByRole('option', { name: '75striker-bSF' }));

    expect(within(decision).getByText('striker-b')).toBeTruthy();
    expect(within(decision).queryByText('YERLİ KADRO')).toBeNull();
    expect(within(decision).queryByText('Açılır')).toBeNull();
    expect(screen.getAllByText('mid-local').length).toBeGreaterThan(0);
  });

  it('exposes player chips and empty slots as keyboard controls and cancellation restores the choice screen', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<Harness onCancel={onCancel} />);

    const chips = screen.getAllByRole('button', { name: /Taşımak için seç/ });
    expect(chips.length).toBeGreaterThan(0);
    chips[0]!.focus();
    await user.keyboard('{Enter}');
    expect(screen.getAllByRole('button', { name: /Seçildi; hedef slotu seç/ }).length).toBe(1);

    await user.click(screen.getByRole('button', { name: 'İptal et — kart seçimine dön' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('surfaces bench players before the starting XI and explains the placement step', async () => {
    const user = userEvent.setup();
    render(<BenchHarness />);

    const benchFocus = screen.getByRole('region', { name: 'Yedekten sahaya al' });
    expect(within(benchFocus).getByText('Yedekten oyuna al')).toBeTruthy();
    expect(within(benchFocus).getByText(/Oyuncuyu seç.*Sahadaki hedefe dokun/)).toBeTruthy();
    expect(within(benchFocus).getByText('Yedeğe düştü')).toBeTruthy();
    expect(within(benchFocus).getByText('YERLİ')).toBeTruthy();

    const action = within(benchFocus).getByRole('button', { name: /oyuncusunu sahaya al/ });
    await user.click(action);

    expect(within(benchFocus).getByRole('button', { name: /seçildi; hedef mevkiyi seç/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('SAHADAKİLER')).toBeTruthy();
  });
});

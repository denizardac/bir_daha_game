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

describe('LineupEditorModal critical flow', () => {
  it('keeps the outgoing player visible and updates live synergy impact after changing departure', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const decision = screen.getByRole('region', { name: 'Kadrodan ayrılacak oyuncu' });
    expect(within(decision).getByText('mid-local')).toBeTruthy();
    expect(within(decision).queryByText('YERLİ KADRO')).toBeNull();

    await user.click(within(decision).getByRole('button', { name: 'Değiştir' }));
    await user.click(screen.getByRole('option', { name: '75striker-bSF' }));

    expect(within(decision).getByText('striker-b')).toBeTruthy();
    expect(within(decision).getByText('YERLİ KADRO')).toBeTruthy();
    expect(within(decision).getByText('Açılır')).toBeTruthy();
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
});

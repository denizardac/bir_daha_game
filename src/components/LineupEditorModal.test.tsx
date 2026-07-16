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

function Harness({ onCancel = vi.fn(), onConfirm = vi.fn() }: { onCancel?: () => void; onConfirm?: () => void }) {
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
      onConfirm={onConfirm}
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
  it('selects the departing player directly and separates the squad decision from lineup placement', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);

    const decision = screen.getByRole('region', { name: 'Transfer tahtası' });
    expect(within(decision).getByText('İLK 11')).toBeTruthy();
    expect(within(decision).getAllByText('mid-local').length).toBeGreaterThan(0);
    expect(within(decision).getByText('YERLİ KADRO')).toBeTruthy();
    expect(within(decision).getByText('Kapanır')).toBeTruthy();
    expect(within(decision).queryByText('Açılır')).toBeNull();

    const decisionSlip = within(decision).getByRole('region', { name: 'Ayrılık kararı' });
    expect(within(decisionSlip).getByText(/Şu an · İlk 11/i)).toBeTruthy();
    expect(within(decisionSlip).getByText(/Ana mevki · OS/i)).toBeTruthy();
    expect(within(decisionSlip).getByText('YERLİ')).toBeTruthy();
    expect(within(decisionSlip).getByText(/Yerine/i)).toBeTruthy();
    expect(within(decision).queryByRole('button', { name: 'Değiştir' })).toBeNull();

    await user.click(within(decision).getByRole('option', { name: /striker-b.*ayrılacak oyuncu olarak seç/i }));

    expect(within(decision).getAllByText('striker-b').length).toBeGreaterThan(0);
    expect(within(decision).queryByText('YERLİ KADRO')).toBeNull();
    expect(within(decision).queryByText('Açılır')).toBeNull();
    expect(within(decision).getAllByText('AYRILIYOR').length).toBeGreaterThan(0);
    expect(within(decision).getByRole('region', { name: 'Ayrılık kararı' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /striker-b ayrılıyor.*İlk 11'i kur/ }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('region', { name: 'Kesinleşen kadro kararı' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ayrılık kararını değiştir' })).toBeTruthy();
  });

  it('exposes player chips and empty slots as keyboard controls and cancellation restores the choice screen', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<Harness onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: /mid-local ayrılıyor.*İlk 11'i kur/ }));

    const chips = screen.getAllByRole('button', { name: /Taşımak için seç/ });
    expect(chips.length).toBeGreaterThan(0);
    chips[0]!.focus();
    await user.keyboard('{Enter}');
    expect(screen.getAllByRole('button', { name: /Seçildi; hedef slotu seç/ }).length).toBe(1);

    await user.click(screen.getByRole('button', { name: 'İptal et — kart seçimine dön' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('surfaces bench players before the starting XI without calling every substitute newly benched', async () => {
    const user = userEvent.setup();
    render(<BenchHarness />);

    const benchFocus = screen.getByRole('region', { name: 'İlk 11 değişikliği' });
    expect(within(benchFocus).getByText("İlk 11'i kur")).toBeTruthy();
    expect(within(benchFocus).getByText(/Oyuncuyu seç.*Sahadaki hedefe dokun/)).toBeTruthy();
    expect(within(benchFocus).getByText('Yedek')).toBeTruthy();
    expect(within(benchFocus).queryByText('Yedeğe düşüyor')).toBeNull();
    expect(within(benchFocus).getByText('YERLİ')).toBeTruthy();
    const traitRail = within(benchFocus).getByRole('group', { name: /traitleri/i });
    expect(traitRail.classList.contains('le-squad-traits-rail')).toBe(true);
    expect(within(traitRail).getByText('YERLİ')).toBeTruthy();
    expect(within(benchFocus).getByText('Yedek').closest('.le-squad-name-row')).toBeTruthy();

    const action = within(benchFocus).getByRole('button', { name: /oyuncusunu sahaya al/ });
    await user.click(action);

    expect(within(benchFocus).getByRole('button', { name: /seçildi; hedef mevkiyi seç/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('SAHADAKİLER')).toBeTruthy();
  });
});

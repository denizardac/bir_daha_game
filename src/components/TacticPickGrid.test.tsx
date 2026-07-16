// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TacticPickGrid } from '@/components/TacticPickGrid';
import { getTacticCard, getTacticEffect } from '@/data/tactics';

afterEach(cleanup);

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  });
});

describe('Taktik günü aktif plan', () => {
  it('aktif formasyon ve sistem kartlarını tıklayınca tam detaylarını gösterir', async () => {
    const user = userEvent.setup();
    const formation = getTacticCard('tactic_442')!;
    const system = getTacticCard('tactic_direkt')!;

    render(
      <TacticPickGrid
        offers={[formation, system]}
        squad={[]}
        activeTactics={[getTacticEffect(formation.id), getTacticEffect(system.id)]}
        draft={{ formationId: null, systemId: null }}
        sound={false}
        onSelect={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Aktif plan.*Direkt Futbol.*detay/i }));

    const dialog = screen.getByRole('dialog', { name: /Direkt Futbol.*taktik detayı/i });
    expect(within(dialog).getByText('Seçince ne olur?')).toBeTruthy();
    expect(within(dialog).getByText('Kadrona etkisi')).toBeTruthy();
    expect(within(dialog).getByText('Aktif planda')).toBeTruthy();
    expect(within(dialog).queryByRole('button', { name: 'Bu kartı seç' })).toBeNull();
  });
});

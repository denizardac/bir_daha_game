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
  it('explains a conditional system with its exact requirement and current squad status', async () => {
    const user = userEvent.setup();
    const gegenpress = getTacticCard('tactic_gegenpress')!;

    render(
      <TacticPickGrid
        offers={[gegenpress]}
        squad={[]}
        activeTactics={[]}
        draft={{ formationId: null, systemId: null }}
        sound={false}
        onSelect={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Gegenpress.*detayları aç/i }));

    const dialog = screen.getByRole('dialog', { name: /Gegenpress.*taktik detayı/i });
    expect(within(dialog).getByText('MAÇ DOKTRİNİ')).toBeTruthy();
    expect(within(dialog).getByText('AKTİVASYON')).toBeTruthy();
    expect(within(dialog).getByText('En az 2 HIZLI + 2 SAVAŞÇI/GÜÇLÜ')).toBeTruthy();
    expect(within(dialog).getByText('Şu an: 0 HIZLI · 0 fiziksel presçi')).toBeTruthy();
    expect(within(dialog).getByText('EKSİK')).toBeTruthy();
    expect(within(dialog).getByText('MAÇ ÖDÜLÜ')).toBeTruthy();
    expect(within(dialog).getByText('+45 puan / gol')).toBeTruthy();
    expect(within(dialog).queryByText('Planın artısı ve riski')).toBeNull();
  });

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
    expect(within(dialog).getByText('MAÇ DOKTRİNİ')).toBeTruthy();
    expect(within(dialog).getByText('AKTİVASYON')).toBeTruthy();
    expect(within(dialog).getByText('MAÇ ÖDÜLÜ')).toBeTruthy();
    expect(within(dialog).getByText('Aktif planda')).toBeTruthy();
    expect(within(dialog).queryByRole('button', { name: 'Bu kartı seç' })).toBeNull();

    await user.click(within(dialog).getAllByRole('button', { name: 'Kapat' })[1]);
    await user.click(screen.getByRole('button', { name: /Aktif plan.*4-4-2.*detay/i }));

    const formationDialog = screen.getByRole('dialog', { name: /4-4-2.*taktik detayı/i });
    expect(within(formationDialog).getByText('SAHA PLANI')).toBeTruthy();
    expect(within(formationDialog).getByText('DİZİLİŞ')).toBeTruthy();
    expect(within(formationDialog).getByText('MAÇ ETKİSİ')).toBeTruthy();
    expect(within(formationDialog).queryByText('Formasyon Kartı')).toBeNull();
  });
});

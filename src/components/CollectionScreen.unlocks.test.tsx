// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollectionScreen } from '@/components/CollectionScreen';
import { createInitialUnlockState, UNLOCK_CATALOG } from '@/engine/unlocks';
import { loadPersisted, savePersisted } from '@/utils/storage';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function saveUnlocks(mutator: (unlocks: ReturnType<typeof createInitialUnlockState>) => void) {
  const unlocks = createInitialUnlockState();
  mutator(unlocks);
  savePersisted({ ...loadPersisted(), unlocks });
}

describe('CollectionScreen unlock progression', () => {
  it('yeni kayıtta kesin koşullarla Kilitli İçerik sekmesini açar', () => {
    render(<CollectionScreen />);
    expect(screen.getByRole('button', { name: /Kilitli İçerik/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByRole('article')).toHaveLength(UNLOCK_CATALOG.length);
    expect(screen.getByText("Tek Run'da 5.000 skor yap.")).toBeTruthy();
  });

  it('kısmi ilerlemeyi ve skor zinciri engelini ayrı gösterir', () => {
    saveUnlocks((unlocks) => {
      unlocks.stats.bestScore = 12_000;
      unlocks.unlockedIds = ['score_5k_gokhan'];
    });
    render(<CollectionScreen />);

    const etebo = screen.getByRole('heading', { name: 'Orta Saha Gücü' }).closest('article')!;
    const guiza = screen.getByRole('heading', { name: 'Riskli Bitirici' }).closest('article')!;
    expect(within(etebo).getByText('10000 / 10000')).toBeTruthy();
    expect(within(guiza).getByText('Önce: Orta Saha Gücü')).toBeTruthy();
  });

  it('aynı anda açılan birden fazla ödülü tamamlanmış gösterir', () => {
    saveUnlocks((unlocks) => {
      unlocks.unlockedIds = ['traits_5_legend_touch', 'locals_7_neighborhood_captain'];
    });
    render(<CollectionScreen />);

    for (const name of ['Trait Ustası', 'Bizim Çocuklar']) {
      const card = screen.getByRole('heading', { name }).closest('article')!;
      expect(within(card).getByText('Açıldı')).toBeTruthy();
    }
  });

  it('tüm içerik açıldığında sekmeler klavyeyle erişilebilir kalır', async () => {
    saveUnlocks((unlocks) => {
      unlocks.unlockedIds = UNLOCK_CATALOG.map((unlock) => unlock.id);
    });
    const user = userEvent.setup();
    render(<CollectionScreen />);

    const legendsTab = screen.getByRole('button', { name: /Efsaneler/i });
    legendsTab.focus();
    await user.keyboard('{Enter}');
    expect(legendsTab.getAttribute('aria-pressed')).toBe('true');
  });
});

// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';

beforeAll(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function BrokenScreen(): never {
  throw new Error('Failed to fetch dynamically imported module');
}

describe('AppErrorBoundary', () => {
  it('replaces a crashed screen with a working reload action', async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    const saveCurrentRun = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <AppErrorBoundary reload={reload} saveCurrentRun={saveCurrentRun}>
        <BrokenScreen />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: 'Yeni s\u00fcr\u00fcme ge\u00e7elim' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '\u015eimdi yenile' }));

    expect(saveCurrentRun).toHaveBeenCalledOnce();
    expect(reload).toHaveBeenCalledOnce();
  });
});

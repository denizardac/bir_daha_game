import { describe, expect, it } from 'vitest';
import { validateFeedback } from '@/api/feedbackRemote';

describe('validateFeedback', () => {
  it('accepts a useful feedback message', () => {
    expect(validateFeedback({
      category: 'bug',
      message: 'Kartı seçince ekran boş kalıyor.',
      contact: '',
    })).toBeNull();
  });

  it('rejects messages that are too short', () => {
    expect(validateFeedback({ category: 'suggestion', message: 'Güzel', contact: '' }))
      .toContain('10 karakter');
  });

  it('rejects oversized contact details', () => {
    expect(validateFeedback({
      category: 'other',
      message: 'Bu yeterince uzun bir geri bildirim.',
      contact: 'x'.repeat(161),
    })).toContain('160 karakter');
  });
});

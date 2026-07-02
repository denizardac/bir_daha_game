import { describe, expect, it } from 'vitest';
import { formatTooltipSentence, joinTooltipLines } from '@/utils/tooltipText';

describe('tooltip text formatting', () => {
  it('capitalizes and punctuates short synergy notes', () => {
    expect(formatTooltipSentence('forvet/kanatta FİNİŞÖR topla')).toBe('Forvet/kanatta FİNİŞÖR topla.');
  });

  it('keeps existing punctuation and joins lines with newlines', () => {
    expect(joinTooltipLines([
      'Bu seçim sinerjiyi açar.',
      'Gol üretimi artar',
    ])).toBe('Bu seçim sinerjiyi açar.\nGol üretimi artar.');
  });
});

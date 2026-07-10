import { describe, expect, it } from 'vitest';
import { EVENT_CARDS } from '@/data/events';
import { EVENT_PRESENTATIONS } from '@/data/eventVisuals';
import { SYNERGIES } from '@/data/synergies';
import { TAG_ICONS } from '@/data/tags';
import { hasIconForEmoji, iconForEmoji, iconForSynergy } from '@/utils/gameIcons';

/** Veri katmanında UI'ya akan tüm emoji alanları */
function collectDataEmoji(): string[] {
  const out: string[] = [];
  for (const e of EVENT_CARDS) out.push(e.icon);
  for (const s of SYNERGIES) out.push(s.icon);
  for (const icon of Object.values(TAG_ICONS)) out.push(icon);
  for (const p of Object.values(EVENT_PRESENTATIONS)) {
    out.push(...p.props, p.choiceA.icon, p.choiceB.icon);
  }
  return out;
}

describe('iconForEmoji', () => {
  it('veri katmanındaki her emoji için bir ikon tanımlı', () => {
    const unmapped = [...new Set(collectDataEmoji())].filter((e) => !hasIconForEmoji(e));
    expect(unmapped, `Haritada olmayan emoji: ${unmapped.join(' ')}`).toEqual([]);
  });

  it('bilinmeyen emoji fallback döner, patlamaz', () => {
    expect(iconForEmoji('🫥')).toBe('circle-dot');
    expect(iconForEmoji('🫥', 'shield')).toBe('shield');
    expect(iconForEmoji(undefined)).toBe('circle-dot');
    expect(iconForEmoji('')).toBe('circle-dot');
  });

  it('variation selector içeren emoji de çözülür', () => {
    expect(iconForEmoji('🛡️')).toBe('shield');
    expect(iconForEmoji('🛡')).toBe('shield');
  });

  it('sinerji ikonları çözülür', () => {
    for (const s of SYNERGIES) {
      expect(iconForSynergy(s.icon), `${s.name} (${s.icon})`).toBeTruthy();
    }
  });
});

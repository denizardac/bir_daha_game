import { describe, expect, it } from 'vitest';
import {
  FORMATION_SLOT_LABELS,
  POSITION_BADGE,
  POSITION_LABELS,
  formatLineupPlayerTip,
  formationSlotLabel,
} from '@/utils/positionStyle';

describe('position labels', () => {
  it('maps each position code to a distinct full name', () => {
    expect(POSITION_LABELS.DOS).toBe('Defansif Orta Saha');
    expect(POSITION_LABELS.OS).toBe('Orta Saha');
    expect(POSITION_LABELS.OOS).toBe('Ofansif Orta Saha');
    expect(POSITION_LABELS.SF).toBe('Santrafor');
  });

  it('maps formation slot codes including SĞB/SĞK', () => {
    expect(formationSlotLabel('SĞB')).toBe('Sağ Bek');
    expect(formationSlotLabel('SĞK')).toBe('Sağ Kanat');
    expect(FORMATION_SLOT_LABELS.OS).toBe('Orta Saha');
    expect(FORMATION_SLOT_LABELS.DOS).toBe('Defansif Orta Saha');
  });

  it('does not confuse player badge with slot code in lineup tip', () => {
    const tip = formatLineupPlayerTip(
      { name: 'Hakan Yılmaz', currentRating: 61, position: 'DOS' },
      'OS',
      { playableBadges: 'DOS · OS · OOS', tagLine: 'Tag yok', outOfPosition: false },
    );
    expect(tip).toContain('Ana mevki: Defansif Orta Saha (DOS)');
    expect(tip).toContain('Bu slotta: Orta Saha (OS)');
    expect(tip).not.toMatch(/Defansif Orta \(OS\)/);
    expect(POSITION_BADGE.DOS).toBe('DOS');
    expect(POSITION_BADGE.OS).toBe('OS');
  });
});

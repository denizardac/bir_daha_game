import { describe, expect, it } from 'vitest';
import { EVENT_CARDS } from '@/data/events';
import { EVENT_PRESENTATIONS, getEventPresentation } from '@/data/eventVisuals';

describe('eventVisuals', () => {
  it('covers every event card with scene, narrative and choice visuals', () => {
    expect(Object.keys(EVENT_PRESENTATIONS)).toHaveLength(EVENT_CARDS.length);

    for (const event of EVENT_CARDS) {
      const p = getEventPresentation(event.id);
      expect(p.scene, event.id).toBeTruthy();
      expect(p.atmosphere.length, event.id).toBeGreaterThan(8);
      expect(p.narrative.length, event.id).toBeGreaterThan(40);
      expect(p.props).toHaveLength(3);
      expect(p.choiceA.icon, event.id).toBeTruthy();
      expect(p.choiceB.icon, event.id).toBeTruthy();
      expect(p.choiceA.flavor.length, event.id).toBeGreaterThan(4);
      expect(p.choiceB.flavor.length, event.id).toBeGreaterThan(4);
      expect(p.choiceA.scene.startsWith('choice-'), event.id).toBe(true);
      expect(p.choiceB.scene.startsWith('choice-'), event.id).toBe(true);
    }
  });
});

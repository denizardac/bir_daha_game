import { getEventPresentation } from '@/data/eventVisuals';
import type { EventCard } from '@/types';

interface Props {
  event: EventCard;
}

export function EventSceneVisual({ event }: Props) {
  const presentation = getEventPresentation(event.id);

  return (
    <div
      className={`event-scene event-scene--${presentation.scene} event-scene--cat-${event.category}`}
      role="img"
      aria-label={`${event.title} — ${presentation.atmosphere}`}
    >
      <div className="event-scene-sky" aria-hidden />
      <div className="event-scene-ground" aria-hidden />
      <div className="event-scene-pitch-lines" aria-hidden>
        <span className="event-scene-pitch-center" />
        <span className="event-scene-pitch-box event-scene-pitch-box--top" />
        <span className="event-scene-pitch-box event-scene-pitch-box--bottom" />
      </div>
      <div className="event-scene-vignette" aria-hidden />
      <div className="event-scene-scanlines" aria-hidden />

      {presentation.props.map((prop, i) => (
        <span key={`${event.id}-prop-${i}`} className={`event-scene-prop event-scene-prop--${i}`} aria-hidden>
          {prop}
        </span>
      ))}

      <div className="event-scene-hero-wrap" aria-hidden>
        <span className="event-scene-hero-ring" />
        <span className="event-scene-hero-ring event-scene-hero-ring--inner" />
        <span className="event-scene-hero-icon">{event.icon}</span>
      </div>

      <p className="event-scene-atmosphere">{presentation.atmosphere}</p>
    </div>
  );
}

interface ChoiceVisualProps {
  scene: string;
  icon: string;
  flavor: string;
  choice: 'A' | 'B';
}

export function EventChoiceVisual({ scene, icon, flavor, choice }: ChoiceVisualProps) {
  return (
    <div className={`event-choice-visual event-choice-visual--${scene} event-choice-visual--pick-${choice.toLowerCase()}`} aria-hidden>
      <span className="event-choice-deco event-choice-deco--left">{choice === 'A' ? '◀' : '▶'}</span>
      <span className="event-choice-visual-icon">{icon}</span>
      <span className="event-choice-deco event-choice-deco--right">⚽</span>
      <p className="event-choice-visual-caption">{flavor}</p>
      <span className="event-choice-visual-glow" />
      <span className="event-choice-visual-grain" />
    </div>
  );
}

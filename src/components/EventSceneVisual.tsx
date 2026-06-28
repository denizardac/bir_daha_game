import { getEventPresentation } from '@/data/eventVisuals';
import { UiIcon, type UiIconName } from '@/components/UiIcon';
import type { EventCard } from '@/types';

interface Props {
  event: EventCard;
}

function iconForEventCategory(category: EventCard['category']): UiIconName {
  if (category === 'transfer') return 'arrow-right';
  if (category === 'taktik') return 'clipboard';
  if (category === 'moral') return 'heart';
  if (category === 'fiziksel') return 'shield';
  return 'sparkles';
}

function iconForChoiceScene(scene: string): UiIconName {
  if (/(cash|pay|gift|save|bonus|sponsor)/.test(scene)) return 'chart';
  if (/(sign|plan|standard|study|trap|normal)/.test(scene)) return 'clipboard';
  if (/(unity|support|deal|balance|home|talk|fans)/.test(scene)) return 'heart';
  if (/(defend|hold|lock|keep|wall|closed|gk|calm)/.test(scene)) return 'shield';
  if (/(attack|fire|blitz|train|practice|field|camp|run|extra|power|hard)/.test(scene)) return 'zap';
  if (/(celebrate|star|pressure|party|tv|photo)/.test(scene)) return 'sparkles';
  if (/(wait|rest|light|easy|skip|accept|no)/.test(scene)) return 'circle-dot';
  return 'arrow-right';
}

export function EventSceneVisual({ event }: Props) {
  const presentation = getEventPresentation(event.id);
  const categoryIcon = iconForEventCategory(event.category);
  const propIcons: UiIconName[] = [categoryIcon, 'circle-dot', 'sparkles'];

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
          <UiIcon name={propIcons[i] ?? categoryIcon} title={prop} />
        </span>
      ))}

      <div className="event-scene-hero-wrap" aria-hidden>
        <span className="event-scene-hero-ring" />
        <span className="event-scene-hero-ring event-scene-hero-ring--inner" />
        <UiIcon name={categoryIcon} className="event-scene-hero-icon" title={event.title} />
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
      <span className="event-choice-deco event-choice-deco--left">
        <UiIcon name="arrow-right" />
      </span>
      <UiIcon name={iconForChoiceScene(scene)} className="event-choice-visual-icon" title={icon} />
      <span className="event-choice-deco event-choice-deco--right">
        <UiIcon name="circle-dot" />
      </span>
      <p className="event-choice-visual-caption">{flavor}</p>
      <span className="event-choice-visual-glow" />
      <span className="event-choice-visual-grain" />
    </div>
  );
}

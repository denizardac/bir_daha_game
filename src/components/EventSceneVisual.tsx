import { getEventPresentation } from '@/data/eventVisuals';
import { UiIcon, type UiIconName } from '@/components/UiIcon';
import type { EventCard } from '@/types';

interface Props {
  event: EventCard;
}

function iconForEventCategory(category: EventCard['category']): UiIconName {
  if (category === 'transfer') return 'chart';
  if (category === 'taktik') return 'clipboard';
  if (category === 'moral') return 'heart';
  if (category === 'fiziksel') return 'shield';
  return 'sparkles';
}

function iconForChoiceScene(scene: string): UiIconName {
  if (/^choice-check$/.test(scene)) return 'check';
  if (/(gamble|risk)/.test(scene)) return 'dice';
  if (/(cash|pay|gift|save|bonus|sponsor)/.test(scene)) return 'chart';
  if (/(sign|plan|standard|study|trap|normal)/.test(scene)) return 'clipboard';
  if (/(unity|support|deal|balance|home|fans)/.test(scene)) return 'heart';
  if (/(chat|speak|silent|mute|talk|spy|honor)/.test(scene)) return 'info';
  if (/(defend|hold|lock|keep|wall|closed|gk|calm|cold|fear)/.test(scene)) return 'shield';
  if (/(attack|fire|blitz|train|practice|field|camp|run|rush|extra|power|hard|derby)/.test(scene)) return 'zap';
  if (/(celebrate|pressure|party|tv|photo|vip|touch|fresh)/.test(scene)) return 'sparkles';
  if (/(wait|rest|light|easy|skip|accept|no|quick|slow|focus|ball)/.test(scene)) return 'circle-dot';
  if (/(sick|push)/.test(scene)) return 'heart-crack';
  if (/heal/.test(scene)) return 'heart';
  if (/(shift|rotate|swap|limp)/.test(scene)) return 'refresh';
  if (/(listen|star)/.test(scene)) return 'graduation-cap';
  if (/(protest|punish|critique|appeal)/.test(scene)) return 'alert-triangle';
  if (/(door|exit|leave|release|empty)/.test(scene)) return 'x';
  if (/(heat|warm)/.test(scene)) return 'flame';
  if (/^choice-in$/.test(scene)) return 'circle-dot';
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

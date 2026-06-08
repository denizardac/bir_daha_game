import { HoverTip } from '@/components/HoverTip';
import { TAG_DESCRIPTIONS, TAG_ICONS } from '@/data/tags';
import type { Tag } from '@/types';

interface Props {
  tags: Tag[];
  compact?: boolean;
  tipPlacement?: 'left' | 'right' | 'auto';
}

export function TagTraitBadges({ tags, compact = false, tipPlacement = 'auto' }: Props) {
  if (!tags.length) return null;

  return (
    <div className={`tag-trait-badges ${compact ? 'tag-trait-badges--compact' : ''}`}>
      {tags.map((tag) => (
        <HoverTip key={tag} tip={TAG_DESCRIPTIONS[tag]} className="tag-trait-badge-wrap" placement={tipPlacement}>
          <span
            className={`tag-trait-badge tag-trait-badge--${tag.replace(/\s+/g, '-')}`}
          >
            <span className="tag-trait-icon" aria-hidden>{TAG_ICONS[tag]}</span>
            {!compact && <span className="tag-trait-name">{tag}</span>}
          </span>
        </HoverTip>
      ))}
    </div>
  );
}

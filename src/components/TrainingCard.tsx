import { motion } from 'framer-motion';
import { HoverTip } from '@/components/HoverTip';
import { UiIcon } from '@/components/UiIcon';
import { TAG_DESCRIPTIONS } from '@/data/tags';
import { iconForTag } from '@/utils/gameIcons';
import type { TrainingCard as TrainingCardType } from '@/types';

interface Props {
  card: TrainingCardType;
  onSelect?: () => void;
}

export function TrainingCard({ card, onSelect }: Props) {
  return (
    <motion.div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (!onSelect) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className="card-fut card-fut--pick training-card relative flex w-full flex-col text-left"
    >
      <div className="training-card-top">
        <span className="training-card-icon" aria-hidden>
          <UiIcon name="graduation-cap" />
        </span>
        <div>
          <p className="training-card-category">ANTRENMAN KARTI</p>
          <p className="training-card-brief">Bir oyuncuya kalıcı nitelik ekle.</p>
        </div>
      </div>

      <div className="card-body training-card-body">
        <div
          className="card-pick-body-scroll"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="card-pick-scroll training-card-scroll">
            <div className="training-card-head">
              <p className="training-card-kind">TAKTİK BONUSU · ANTRENMAN</p>
              <h3 className="training-card-name">{card.name}</h3>
              <p className="training-card-summary">Önce oyuncu, sonra eklenecek tag seçilir. Bu tur maç oynanmaz.</p>
            </div>
            <div className="card-insight card-insight--training card-pick-core">
              <p className="card-insight-title">Seçersen</p>
              <p className="card-insight-line card-insight-line--lead">
                Kalıcı tag kazanırsın. Sinerjileri tamamlamak için kullan.
              </p>
            </div>

            <div className="card-pick-extra training-card-tags">
              <p className="card-insight-title">Sunulan nitelikler</p>
              <div className="training-tag-strip">
                {card.offeredTags.map((tag) => (
                  <HoverTip key={tag} tip={TAG_DESCRIPTIONS[tag]} placement="top" className="training-tag-tip">
                    <span className="training-tag-chip">
                      <UiIcon name={iconForTag(tag)} />
                      {tag}
                    </span>
                  </HoverTip>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {onSelect && (
        <div className="card-pick-footer">
          <p className="select-cta select-cta--training">SEÇ</p>
        </div>
      )}
    </motion.div>
  );
}

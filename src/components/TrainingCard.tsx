import { motion } from 'framer-motion';
import { TAG_DESCRIPTIONS } from '@/data/tags';
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
        <span className="training-card-icon" aria-hidden>🏋️</span>
        <div>
          <p className="training-card-category">ANTRENMAN KARTI</p>
          <ul className="training-card-bullets">
            <li>Kadrodan bir oyuncu seç</li>
            <li>Nitelik ekle — kalıcı buff</li>
            <li>Maç yok · +35 puan · +8 moral</li>
          </ul>
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
              <p className="training-card-summary">{card.description}</p>
            </div>
            <div className="card-insight card-insight--training card-pick-core">
              <p className="card-insight-title">Seçince ne olur?</p>
              <p className="card-insight-line card-insight-line--lead">
                Önce kadrodan oyuncu, sonra aşağıdaki niteliklerden birini seçersin.
              </p>
            </div>

            <div className="card-pick-extra training-card-tags">
              <p className="card-insight-title">Sunulan nitelikler</p>
              {card.offeredTags.map((tag) => (
                <div key={tag} className="training-tag-row">
                  <span className="training-tag-chip">{tag}</span>
                  <p className="training-tag-desc">{TAG_DESCRIPTIONS[tag]}</p>
                </div>
              ))}
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

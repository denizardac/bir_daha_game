import { motion, AnimatePresence } from 'framer-motion';
import { PlayerCardMini } from '@/components/PlayerCard';
import { TagTraitBadges } from '@/components/TagTraitBadges';
import { MAX_PLAYER_TAGS } from '@/data/training';
import { TAG_DESCRIPTIONS } from '@/data/tags';
import type { PlayerCard, Tag } from '@/types';

interface Props {
  squad: PlayerCard[];
  offeredTags: Tag[];
  step: 'player' | 'tag';
  selectedPlayerId?: string;
  onPickPlayer: (playerId: string) => void;
  onPickTag: (tag: Tag) => void;
  onClose: () => void;
  onBack: () => void;
}

export function TrainingPickModal({
  squad,
  offeredTags,
  step,
  selectedPlayerId,
  onPickPlayer,
  onPickTag,
  onClose,
  onBack,
}: Props) {
  const selected = squad.find((p) => p.id === selectedPlayerId);

  return (
    <div className="training-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="training-modal-title">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="training-modal panel"
      >
        <div className="training-modal-head">
          <span className="training-modal-icon" aria-hidden>🏋️</span>
          <div>
            <h2 id="training-modal-title" className="training-modal-title">Özel Antrenman</h2>
            <p className="training-modal-sub">
              {step === 'player'
                ? 'Nitelik eklemek istediğin oyuncuyu seç'
                : `${selected?.name} için nitelik seç`}
            </p>
          </div>
          <button type="button" className="training-modal-close" onClick={onClose} aria-label="İptal">
            ✕
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'player' ? (
            <motion.div key="players" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="training-modal-list">
              {squad.map((p) => {
                const full = p.tags.length >= MAX_PLAYER_TAGS;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`training-player-btn ${full ? 'training-player-btn--full' : ''}`}
                    disabled={full}
                    onClick={() => onPickPlayer(p.id)}
                  >
                    <PlayerCardMini card={p} />
                    {full && <span className="training-full-badge">Nitelik dolu</span>}
                  </button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div key="tags" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {selected && (
                <div className="training-selected-player">
                  <PlayerCardMini card={selected} />
                </div>
              )}
              <div className="training-tag-pick-grid">
                {offeredTags.map((tag) => {
                  const hasTag = selected?.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      className={`training-tag-pick ${hasTag ? 'training-tag-pick--owned' : ''}`}
                      disabled={hasTag}
                      onClick={() => onPickTag(tag)}
                    >
                      <TagTraitBadges tags={[tag]} />
                      <p className="training-tag-pick-desc">{TAG_DESCRIPTIONS[tag]}</p>
                      {hasTag && <span className="training-tag-owned">Zaten var</span>}
                    </button>
                  );
                })}
              </div>
              <button type="button" className="btn-secondary training-back-btn" onClick={onBack}>
                ← Oyuncu değiştir
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

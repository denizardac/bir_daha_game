import type { CSSProperties } from 'react';
import { useState } from 'react';
import { SYNERGIES } from '@/data/synergies';
import { HoverTip } from '@/components/HoverTip';
import { UiIcon } from '@/components/UiIcon';
import { canAddTag } from '@/data/tagConflicts';
import { MAX_PLAYER_TAGS } from '@/data/training';
import { TAG_DESCRIPTIONS } from '@/data/tags';
import { iconForTag } from '@/utils/gameIcons';
import { TAG_AVATAR_BG, POSITION_BADGE, getPositionRoleColor } from '@/utils/positionStyle';
import type { PlayerCard, Tag } from '@/types';

function tagPrimaryColor(tag: Tag): string {
  const bg = TAG_AVATAR_BG[tag] ?? '';
  const colors = [...bg.matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => m[0]);
  return colors[1] ?? colors[0] ?? '#8a948f';
}

function getSynergyHintsForTag(tag: Tag): string[] {
  return SYNERGIES
    .filter((s) => s.description.toLocaleUpperCase('tr-TR').includes(tag.toLocaleUpperCase('tr-TR')))
    .map((s) => s.name)
    .slice(0, 2);
}

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
}: Props) {
  const [pendingTag, setPendingTag] = useState<Tag | null>(null);
  const selected = squad.find((p) => p.id === selectedPlayerId);

  return (
    <div className="training-inline">
      <div className="training-inline-left">
        <div className="training-inline-list-head">
          <span className="training-inline-label"><b>1</b> Oyuncu Seç</span>
          <span className="training-inline-count">{squad.length} oyuncu</span>
        </div>
        <div className="training-inline-player-list">
          {squad.map((p) => {
            const full = p.tags.length >= MAX_PLAYER_TAGS;
            const isSelected = p.id === selectedPlayerId;
            return (
              <button
                key={p.id}
                type="button"
                className={`training-player-row ${isSelected ? 'training-player-row--selected' : ''} ${full ? 'training-player-row--full' : ''}`}
                disabled={full}
                onClick={() => { onPickPlayer(p.id); setPendingTag(null); }}
              >
                <span className="training-player-row-rating">{p.currentRating}</span>
                <span className="training-player-row-name">{p.name}</span>
                <span className="training-player-row-tags">
                  <span
                    className="training-player-row-pos"
                    style={{ background: getPositionRoleColor(p.position) } as CSSProperties}
                  >
                    {POSITION_BADGE[p.position]}
                  </span>
                  {p.tags.map((tag) => {
                    const c = tagPrimaryColor(tag);
                    return (
                      <HoverTip key={tag} tip={TAG_DESCRIPTIONS[tag]} placement="top">
                        <span
                          className="training-player-row-tag"
                          style={{ color: c, background: `${c}18`, border: `1px solid ${c}44` } as CSSProperties}
                        >
                          {tag}
                        </span>
                      </HoverTip>
                    );
                  })}
                  {full && <span className="training-player-row-full">Dolu</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="training-inline-right">
        {selected && step === 'tag' ? (
          <>
            <div className="training-inline-right-head">
              <span className="training-inline-label"><b>2</b> Tag Seç <strong>{selected.name}</strong></span>
              <span className="training-inline-right-sub">Üç oyun özelliğinden birini kazandır.</span>
            </div>
            <div className="training-tag-cards">
              {offeredTags.map((tag) => {
                const hasTag = selected.tags.includes(tag);
                const conflicts = !canAddTag(tag, selected.tags);
                const disabled = hasTag || conflicts;
                const color = tagPrimaryColor(tag);
                const gradBg = TAG_AVATAR_BG[tag] ?? `linear-gradient(145deg, ${color}, ${color})`;
                const synergies = getSynergyHintsForTag(tag);
                const isPending = pendingTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`training-tag-card ${disabled ? 'training-tag-card--disabled' : ''} ${isPending ? 'training-tag-card--active' : ''}`}
                    disabled={disabled}
                    onClick={() => setPendingTag(isPending ? null : tag)}
                  >
                    <div className="training-tag-card-icon" style={{ background: gradBg } as CSSProperties}>
                      <UiIcon name={iconForTag(tag)} />
                    </div>
                    <div className="training-tag-card-name" style={{ color } as CSSProperties}>
                      <UiIcon name={iconForTag(tag)} />
                      {tag}
                    </div>
                    <p className="training-tag-card-desc">{TAG_DESCRIPTIONS[tag]}</p>
                    {synergies.length > 0 && (
                      <span className="training-tag-card-syn" style={{ color } as CSSProperties}>
                        +{synergies.join(' / ')} →
                      </span>
                    )}
                    {hasTag && <span className="training-tag-card-badge">Zaten var</span>}
                    {!hasTag && conflicts && <span className="training-tag-card-badge">Çelişiyor</span>}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="training-apply-btn"
              disabled={pendingTag === null}
              onClick={() => { if (pendingTag) onPickTag(pendingTag); }}
            >
              Antrenmanı Uygula
            </button>
          </>
        ) : (
          <div className="training-inline-empty">
            <div className="training-inline-empty-mark" aria-hidden>
              <UiIcon name="graduation-cap" className="training-inline-empty-icon" />
            </div>
            <span className="training-inline-empty-kicker">ANTRENMAN PLANI</span>
            <h3>Önce bir oyuncu seç</h3>
            <p>Oyuncunun mevcut tag’lerine göre üç uyumlu gelişim seçeneği hazırlayacağız.</p>
            <div className="training-inline-empty-steps" aria-hidden>
              <span className="is-current"><b>1</b> Oyuncu</span>
              <i>→</i>
              <span><b>2</b> Tag</span>
              <i>→</i>
              <span><b>3</b> Uygula</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

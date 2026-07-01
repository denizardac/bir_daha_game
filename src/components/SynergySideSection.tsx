import type { CSSProperties } from 'react';
import { HoverTip } from '@/components/HoverTip';
import { UiIcon, type UiIconName } from '@/components/UiIcon';
import { ALL_TAGS } from '@/data/tags';
import { TAG_DESCRIPTIONS } from '@/data/tags';
import {
  getSynergyBenefitText,
  getSquadTagCounts,
  type NearSynergyProgress,
} from '@/engine/squadInsights';
import { iconForSynergy, iconForTag } from '@/utils/gameIcons';
import { TAG_AVATAR_BG } from '@/utils/positionStyle';
import type { PlayerCard, SynergyDefinition } from '@/types';
import type { Tag } from '@/types';

interface Props {
  squad: PlayerCard[];
  activeSynergies: SynergyDefinition[];
  near: NearSynergyProgress[];
}

function ProgressRing({ pct, icon, active }: { pct: number; icon: UiIconName; active?: boolean }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div
      className={`syn-ring ${active ? 'syn-ring--active' : ''}`}
      style={{ '--syn-pct': `${clamped}` } as CSSProperties}
      aria-hidden
    >
      <div className="syn-ring-inner">
        <UiIcon name={icon} className="syn-ring-icon" />
      </div>
    </div>
  );
}

function DotProgress({ current, required }: { current: number; required: number }) {
  const dots = Math.min(required, 8);
  const filled = Math.min(current, dots);
  return (
    <div className="syn-dots" aria-label={`${current}/${required}`}>
      {Array.from({ length: dots }, (_, i) => (
        <span key={i} className={`syn-dot ${i < filled ? 'syn-dot--on' : ''}`} />
      ))}
      {required > 8 && <span className="syn-dots-more">+{required - 8}</span>}
    </div>
  );
}

function shortLine(text: string, max = 72) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function getTagPrimaryColor(tag: Tag): string {
  const bg = TAG_AVATAR_BG[tag] ?? '';
  const colors = [...bg.matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => m[0]);
  return colors[1] ?? colors[0] ?? '#8a948f';
}

function countTagInSquad(squad: PlayerCard[], tag: Tag): number {
  return squad.reduce((total, player) => total + (player.tags.includes(tag) ? 1 : 0), 0);
}

function mergeNeedChips(chips: Array<{ tag: Tag; count: number }>): Array<{ tag: Tag; count: number }> {
  const map = new Map<Tag, number>();
  for (const chip of chips) {
    if (chip.count <= 0) continue;
    map.set(chip.tag, Math.max(map.get(chip.tag) ?? 0, chip.count));
  }
  return [...map.entries()].map(([tag, count]) => ({ tag, count }));
}

function parseRequiredTagChips(
  note: string | undefined,
  description: string,
  need: number,
  squad: PlayerCard[],
): Array<{ tag: Tag; count: number }> {
  if (note) {
    const tokens = [...note.matchAll(/([A-ZÇĞİÖŞÜ0-9 ]+?)\s+(\d+)\/(\d+)/g)];
    const chips = tokens.flatMap((m) => {
      const rawLabel = m[1]!.trim().replace(/\s+/g, ' ');
      const current = Number(m[2]);
      const required = Number(m[3]);
      const missing = Math.max(0, required - current);
      if (missing <= 0) return [] as Array<{ tag: Tag; count: number }>;
      const tag = ALL_TAGS.find((t) => t === rawLabel || rawLabel.startsWith(t));
      return tag ? [{ tag, count: missing }] : ([] as Array<{ tag: Tag; count: number }>);
    });
    if (chips.length > 0) return mergeNeedChips(chips);

    const upperNote = note.toLocaleUpperCase('tr-TR');
    const numericChips = ALL_TAGS.flatMap((tag) => {
      const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = upperNote.match(new RegExp(`(?:^|[^0-9])([0-9]+)\\s+${escaped}`));
      if (!match) return [] as Array<{ tag: Tag; count: number }>;
      const required = Number(match[1]);
      const missing = Math.max(0, required - countTagInSquad(squad, tag));
      return missing > 0 ? [{ tag, count: missing }] : [];
    });
    if (numericChips.length > 0) return mergeNeedChips(numericChips);

    const namedChips = ALL_TAGS.flatMap((tag) => {
      if (!upperNote.includes(tag)) return [] as Array<{ tag: Tag; count: number }>;
      return countTagInSquad(squad, tag) === 0 ? [{ tag, count: 1 }] : [];
    });
    if (namedChips.length > 0) return mergeNeedChips(namedChips);
  }
  const upper = description.toLocaleUpperCase('tr-TR');
  const tag = ALL_TAGS.find((t) => upper.includes(t));
  if (tag) return [{ tag, count: need }];
  return [];
}

function parseMissingFromNote(note: string | undefined) {
  if (!note) return '';
  const progressTokens = [...note.matchAll(/([A-ZÇĞİÖŞÜ0-9 /+.-]+?)\s+(\d+)\/(\d+)/g)]
    .map((m) => {
      const label = m[1]!.trim().replace(/\s+/g, ' ');
      const current = Number(m[2]);
      const required = Number(m[3]);
      const missing = Math.max(0, required - current);
      return missing > 0 && label ? `${missing} ${label}` : '';
    })
    .filter(Boolean);
  if (progressTokens.length > 0) return `${progressTokens.join(' · ')} lazım`;

  const clean = note.replace(/^⚠\s*/u, '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (/gerekiyor|olmalı|topla|lazım/i.test(clean)) return clean;
  return `${clean} lazım`;
}

function parseMissingFromDescription(description: string, need: number) {
  const upper = description.toLocaleUpperCase('tr-TR');
  const tag = ALL_TAGS.find((t) => upper.includes(t));
  if (tag) return `${need} ${tag} daha lazım`;

  const positionMatch = description.match(/(kaleci|stoper|bek|kanat|orta saha|hücum|forvet|efsane|imza)/i);
  if (positionMatch) return `${need} ${positionMatch[1]!.toLocaleLowerCase('tr-TR')} daha lazım`;

  return '';
}

function formatNeededText(synergy: SynergyDefinition, note: string | undefined, offerHint: string | null | undefined, need: number) {
  if (offerHint) {
    const hintUpper = offerHint.toLocaleUpperCase('tr-TR');
    const sourceUpper = `${synergy.description} ${note ?? ''}`.toLocaleUpperCase('tr-TR');
    const hintedTag = ALL_TAGS.find((t) => hintUpper.includes(t));
    if (!hintedTag || sourceUpper.includes(hintedTag)) {
      return shortLine(offerHint.replace(/^Tekliflerde /i, 'Teklifte '), 74);
    }
  }
  const fromNote = parseMissingFromNote(note);
  if (fromNote) return shortLine(fromNote, 74);
  const fromDescription = parseMissingFromDescription(synergy.description, need);
  if (fromDescription) return shortLine(fromDescription, 74);
  return need > 0 ? `${need} rol daha lazım` : 'Açılmaya hazır';
}

function ActiveSynergyTile({ synergy }: { synergy: SynergyDefinition }) {
  const benefit = shortLine(getSynergyBenefitText(synergy), 68);
  return (
    <div className="syn-tile-wrap">
      <div className="syn-tile syn-tile--active">
        <ProgressRing pct={100} icon={iconForSynergy(synergy.icon)} active />
        <div className="syn-tile-body">
          <div className="syn-tile-head">
            <HoverTip tip={`${synergy.description}\n${benefit}`} placement="top" className="syn-tile-name-tip">
              <span className="syn-tile-name">{synergy.name}</span>
            </HoverTip>
            <span className="syn-tile-badge syn-tile-badge--live">Aktif</span>
          </div>
          <p className="syn-tile-reward">{benefit}</p>
        </div>
      </div>
    </div>
  );
}

function NearSynergyTile({
  synergy,
  current,
  required,
  note,
  offerHint,
  squad,
}: {
  synergy: SynergyDefinition;
  current: number;
  required: number;
  note?: string;
  offerHint?: string | null;
  squad: PlayerCard[];
}) {
  const pct = (current / required) * 100;
  const almost = pct >= 66;

  const need = required - current;
  const benefit = shortLine(getSynergyBenefitText(synergy), 62);
  const neededText = formatNeededText(synergy, note, offerHint, need);
  const tagChips = parseRequiredTagChips(note, synergy.description, need, squad);
  return (
    <div className="syn-tile-wrap">
      <div className={`syn-tile syn-tile--near ${almost ? 'syn-tile--almost' : ''}`}>
        <ProgressRing pct={pct} icon={iconForSynergy(synergy.icon)} />
        <div className="syn-tile-body">
          <div className="syn-tile-head">
            <HoverTip tip={`${synergy.description}\n${benefit}`} placement="top" className="syn-tile-name-tip">
              <span className="syn-tile-name">{synergy.name}</span>
            </HoverTip>
            <span className="syn-tile-count">{current}/{required}</span>
          </div>
          <DotProgress current={current} required={required} />
          {tagChips.length > 0 ? (
            <div className="syn-tile-need syn-tile-need--chips">
              <span>Gereken</span>
              {tagChips.map(({ tag, count }) => {
                const color = getTagPrimaryColor(tag);
                return (
                  <HoverTip key={tag} tip={TAG_DESCRIPTIONS[tag]} placement="top">
                    <span
                      className="syn-need-chip"
                      style={{
                        color,
                        background: `${color}1a`,
                        border: `1px solid ${color}55`,
                      }}
                    >
                      <UiIcon name={iconForTag(tag)} className="syn-need-chip-icon" />
                      {count > 1 && <strong>{count}</strong>}
                      {tag}
                    </span>
                  </HoverTip>
                );
              })}
            </div>
          ) : (
            <p className="syn-tile-need"><span>Gereken</span>{neededText}</p>
          )}
          <p className="syn-tile-hint">{need > 0 ? `${need} eksik · ` : 'Hazır · '}{benefit}</p>
        </div>
      </div>
    </div>
  );
}

function TagChip({ tag, count }: { tag: Tag; count: number }) {
  return (
    <HoverTip tip={TAG_DESCRIPTIONS[tag]} className="syn-tag-chip-wrap" placement="top">
      <span className="syn-tag-chip">
        <UiIcon name={iconForTag(tag)} className="syn-tag-icon" />
        <span className="syn-tag-label">{tag}</span>
        {count > 1 && <span className="syn-tag-count">{count}</span>}
      </span>
    </HoverTip>
  );
}

type FullPanelProps = Props;

export function SynergyFullPanel({ squad, activeSynergies, near }: FullPanelProps) {
  const tagCounts = getSquadTagCounts(squad);

  return (
    <div className="syn-full-panel">
      {activeSynergies.length > 0 && (
        <section className="syn-full-section">
          <div className="syn-full-section-head">
            <span className="syn-full-section-label">Aktif Sinerjiler</span>
            <span className="syn-full-badge syn-full-badge--active">{activeSynergies.length} aktif</span>
          </div>
          {activeSynergies.map((s) => {
            const benefit = shortLine(getSynergyBenefitText(s), 72);
            return (
              <div key={s.id} className="syn-full-row syn-full-row--active">
                <div className="syn-full-row-icon syn-full-row-icon--active">
                  <UiIcon name={iconForSynergy(s.icon)} />
                </div>
                <div className="syn-full-row-body">
                  <div className="syn-full-row-top">
                    <span className="syn-full-row-name">{s.name}</span>
                    <span className="syn-full-badge syn-full-badge--live">Aktif</span>
                  </div>
                  <p className="syn-full-row-benefit">{benefit}</p>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {near.length > 0 && (
        <section className="syn-full-section">
          <div className="syn-full-section-head">
            <span className="syn-full-section-label">Sinerjiler</span>
            <span className="syn-full-badge syn-full-badge--near">{near.length} yakın</span>
          </div>
          {near.map(({ synergy, progress, offerHint }) => {
            const need = progress.required - progress.current;
            const benefit = shortLine(getSynergyBenefitText(synergy), 72);
            const tagChips = parseRequiredTagChips(progress.note, synergy.description, need, squad);
            const neededText = formatNeededText(synergy, progress.note, offerHint, need);
            return (
              <div key={synergy.id} className="syn-full-row">
                <div className="syn-full-row-icon">
                  <UiIcon name={iconForSynergy(synergy.icon)} />
                </div>
                <div className="syn-full-row-body">
                  <div className="syn-full-row-top">
                    <span className="syn-full-row-name">{synergy.name}</span>
                    <span className="syn-full-row-count">{progress.current}/{progress.required}</span>
                  </div>
                  <div className="syn-full-row-progress">
                    <DotProgress current={progress.current} required={progress.required} />
                    {tagChips.length > 0 ? (
                      <div className="syn-full-row-needed">
                        <span className="syn-full-needed-label">Gereken</span>
                        {tagChips.map(({ tag, count }) => {
                          const color = getTagPrimaryColor(tag);
                          return (
                            <span
                              key={tag}
                              className="syn-full-need-chip"
                              style={{ color, background: `${color}18`, border: `1px solid ${color}44` }}
                            >
                              <UiIcon name={iconForTag(tag)} />
                              {count > 1 && <strong>{count}</strong>}
                              {tag}
                            </span>
                          );
                        })}
                        {offerHint?.includes('teklifte') && (
                          <span className="syn-full-offer-hint">· teklifte var</span>
                        )}
                      </div>
                    ) : (
                      <span className="syn-full-needed-text">{neededText}</span>
                    )}
                  </div>
                  <p className="syn-full-row-benefit">{benefit}</p>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {tagCounts.length > 0 && (
        <section className="syn-full-section">
          <div className="syn-full-section-head">
            <span className="syn-full-section-label">Kadrodaki Tag'ler</span>
          </div>
          <div className="syn-full-tag-chips">
            {tagCounts.map(({ tag, count }) => {
              const color = getTagPrimaryColor(tag);
              return (
                <span
                  key={tag}
                  className="syn-full-tag-chip"
                  title={TAG_DESCRIPTIONS[tag]}
                  style={{ color, background: `${color}18`, border: `1px solid ${color}44` }}
                >
                  <UiIcon name={iconForTag(tag)} />
                  {tag}
                  {count > 1 && <strong>{count}</strong>}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {activeSynergies.length === 0 && near.length === 0 && (
        <div className="syn-full-empty">
          <UiIcon name="tag" />
          <p>Tag'ler birleşince sinerji açılır — tekliflerde uygun kart aramaya devam et.</p>
        </div>
      )}
    </div>
  );
}

export function SynergySideSection({ squad, activeSynergies, near }: Props) {
  const tagCounts = getSquadTagCounts(squad);
  const hasContent = activeSynergies.length > 0 || near.length > 0;

  return (
    <div className="side-panel-section syn-panel">
      <div className="syn-panel-head">
        <h2 className="side-panel-title side-panel-title--gold">Sinerjiler</h2>
        {hasContent && (
          <span className="syn-panel-stats">
            {activeSynergies.length > 0 && (
              <span className="syn-stat syn-stat--live">{activeSynergies.length} aktif</span>
            )}
            {near.length > 0 && (
              <span className="syn-stat syn-stat--near">{near.length} yakın</span>
            )}
          </span>
        )}
      </div>

      {!hasContent ? (
        <div className="syn-empty">
          <UiIcon name="tag" className="syn-empty-icon" />
          <p className="syn-empty-text">Tag&apos;ler birleşince sinerji açılır — tekliflerde uygun kart aramaya devam et.</p>
        </div>
      ) : (
        <>
          <div className="syn-tile-list">
            {activeSynergies.map((s) => (
              <ActiveSynergyTile key={s.id} synergy={s} />
            ))}
            {near.map(({ synergy, progress, offerHint }) => (
              <NearSynergyTile
                key={synergy.id}
                synergy={synergy}
                current={progress.current}
                required={progress.required}
                note={progress.note}
                offerHint={offerHint}
                squad={squad}
              />
            ))}
          </div>
        </>
      )}

      {tagCounts.length > 0 && (
        <div className="syn-tag-cloud">
          <p className="syn-tag-cloud-label">Kadrodaki tag&apos;ler</p>
          <div className="syn-tag-cloud-chips">
            {tagCounts.slice(0, 8).map(({ tag, count }) => (
              <TagChip key={tag} tag={tag} count={count} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

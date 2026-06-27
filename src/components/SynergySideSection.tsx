import type { CSSProperties } from 'react';
import { GameIcon } from '@/components/GameIcon';
import { HoverTip } from '@/components/HoverTip';
import { BITE } from '@/data/biteTips';
import { SYNERGIES } from '@/data/synergies';
import { TAG_DESCRIPTIONS, TAG_ICONS } from '@/data/tags';
import {
  getSidePanelNearSynergies,
  getSynergyBenefitText,
  getSquadTagCounts,
} from '@/engine/squadInsights';
import type { GameCard, PlayerCard, SynergyDefinition } from '@/types';
import type { Tag } from '@/types';

interface Props {
  squad: PlayerCard[];
  morale: number;
  discoveredSynergies: string[];
  currentOffers?: GameCard[];
}

function ProgressRing({ pct, icon, active }: { pct: number; icon: string; active?: boolean }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div
      className={`syn-ring ${active ? 'syn-ring--active' : ''}`}
      style={{ '--syn-pct': `${clamped}` } as CSSProperties}
      aria-hidden
    >
      <div className="syn-ring-inner">
        <span className="syn-ring-icon"><GameIcon legacyIcon={icon} size={16} /></span>
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

function ActiveSynergyTile({ synergy }: { synergy: SynergyDefinition }) {
  return (
    <HoverTip tip={`${synergy.description}\n\n${getSynergyBenefitText(synergy)}`} className="syn-tile-wrap" placement="right">
    <div className="syn-tile syn-tile--active">
      <ProgressRing pct={100} icon={synergy.icon} active />
      <div className="syn-tile-body">
        <div className="syn-tile-head">
          <span className="syn-tile-name">{synergy.name}</span>
          <span className="syn-tile-badge syn-tile-badge--live">Aktif</span>
        </div>
        <p className="syn-tile-desc">{synergy.description}</p>
        <p className="syn-tile-reward">{getSynergyBenefitText(synergy)}</p>
      </div>
    </div>
    </HoverTip>
  );
}

function NearSynergyTile({
  synergy,
  current,
  required,
  note,
  offerHint,
}: {
  synergy: SynergyDefinition;
  current: number;
  required: number;
  note?: string;
  offerHint?: string | null;
}) {
  const pct = (current / required) * 100;
  const almost = pct >= 66;

  const need = required - current;
  const tip = `${synergy.description}\n\n${getSynergyBenefitText(synergy)}${note ? `\n\n${note}` : ''}${need > 0 ? `\n\nAçmak için: ${need} eksik` : ''}${offerHint ? `\n\n${offerHint}` : ''}`;

  return (
    <HoverTip tip={tip} className="syn-tile-wrap" placement="right">
      <div className={`syn-tile syn-tile--near ${almost ? 'syn-tile--almost' : ''}`}>
        <ProgressRing pct={pct} icon={synergy.icon} />
        <div className="syn-tile-body">
          <div className="syn-tile-head">
            <span className="syn-tile-name">{synergy.name}</span>
            <span className="syn-tile-count">{current}/{required}</span>
          </div>
          <DotProgress current={current} required={required} />
          {note && <p className="syn-tile-note">{note}</p>}
          {offerHint ? (
            <p className="syn-tile-offer-hint">{offerHint}</p>
          ) : (
            <p className="syn-tile-hint">{need > 0 ? `${need} eksik · ` : ''}{getSynergyBenefitText(synergy)}</p>
          )}
          {offerHint && (
            <p className="syn-tile-hint syn-tile-hint--sub">{getSynergyBenefitText(synergy)}</p>
          )}
        </div>
      </div>
    </HoverTip>
  );
}

function TagChip({ tag, count }: { tag: Tag; count: number }) {
  return (
    <HoverTip tip={TAG_DESCRIPTIONS[tag]} className="syn-tag-chip-wrap" placement="right">
      <span className="syn-tag-chip">
        <span className="syn-tag-icon" aria-hidden><GameIcon legacyIcon={TAG_ICONS[tag]} size={13} /></span>
        <span className="syn-tag-label">{tag}</span>
        {count > 1 && <span className="syn-tag-count">{count}</span>}
      </span>
    </HoverTip>
  );
}

export function SynergySideSection({ squad, morale, discoveredSynergies, currentOffers }: Props) {
  const activeSynergies = SYNERGIES.filter((s) => s.check(squad, morale));
  const near = getSidePanelNearSynergies(squad, morale, discoveredSynergies, currentOffers, 4);
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
          <span className="syn-empty-icon" aria-hidden><GameIcon name="tags" size={20} /></span>
          <p className="syn-empty-text">Tag&apos;ler birleşince sinerji açılır — tekliflerde uygun kart aramaya devam et.</p>
        </div>
      ) : (
        <>
          <p className="syn-panel-bite">{BITE.synergyIntro}</p>
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

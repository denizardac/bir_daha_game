import { useState, type ReactNode } from 'react';
import { EVENT_CARDS, EVENT_ROUNDS } from '@/data/events';
import {
  GUIDE_EVENT_INFO,
  GUIDE_OVERVIEW,
  GUIDE_PLAYER_RULES,
  GUIDE_POSITION_EXPLANATION,
  GUIDE_POSITION_ZONES,
  GUIDE_RARITIES,
  GUIDE_SECTIONS,
  formatGuidePosition,
  type GuideSectionId,
} from '@/data/gameGuide';
import { getSynergyGuideTags, getSynergyGuideTeaser } from '@/data/synergyGuideHints';
import { SYNERGIES, TOTAL_SYNERGIES } from '@/data/synergies';
import { TACTIC_CARDS } from '@/data/tactics';
import { ALL_TAGS, TAG_DESCRIPTIONS } from '@/data/tags';
import { getSynergyBenefitText } from '@/engine/squadInsights';
import { useGameStore } from '@/store/gameStore';
import { loadPersisted } from '@/utils/storage';
import { RARITY_COLORS } from '@/types';
import { POSITION_BADGE } from '@/utils/positionStyle';

function SectionNav({
  active,
  onChange,
}: {
  active: GuideSectionId;
  onChange: (id: GuideSectionId) => void;
}) {
  return (
    <nav className="guide-nav" aria-label="Rehber bölümleri">
      {GUIDE_SECTIONS.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`guide-nav-btn ${active === s.id ? 'guide-nav-btn--active' : ''}`}
          onClick={() => onChange(s.id)}
        >
          <span className="guide-nav-icon" aria-hidden>{s.icon}</span>
          {s.label}
        </button>
      ))}
    </nav>
  );
}

function GuideCard({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`guide-card ${className}`}>
      {title && <h3 className="guide-card-title">{title}</h3>}
      {children}
    </div>
  );
}

function GeneralSection() {
  return (
    <div className="guide-section">
      <p className="guide-lead">
        Bir Daha, kart seçimli bir futbol roguelite&apos;idir. Her run farklı kararlarla şekillenir.
      </p>
      <div className="guide-grid guide-grid--2">
        {GUIDE_OVERVIEW.map((block) => (
          <GuideCard key={block.title} title={block.title}>
            <p className="guide-text">{block.text}</p>
          </GuideCard>
        ))}
      </div>
    </div>
  );
}

function PlayersSection() {
  return (
    <div className="guide-section">
      <GuideCard title="Oyuncu kartları">
        <ul className="guide-list">
          {GUIDE_PLAYER_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </GuideCard>

      <GuideCard title="Mevkiler">
        <p className="guide-text guide-text--highlight">{GUIDE_POSITION_EXPLANATION}</p>
        <div className="guide-pos-zones">
          {GUIDE_POSITION_ZONES.map((zone) => (
            <div key={zone.id} className="guide-pos-zone-block">
              <p className="guide-pos-zone-title">{zone.label}</p>
              <p className="guide-text">{zone.desc}</p>
              <div className="guide-pos-zone-chips">
                {zone.positions.map((pos) => (
                  <span key={pos} className="guide-pos-chip guide-pos-chip--inline">
                    <span className="guide-pos-badge">{POSITION_BADGE[pos]}</span>
                    <span className="guide-pos-name">{formatGuidePosition(pos)}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GuideCard>

      <GuideCard title="Nadirlik">
        <div className="guide-rarity-list">
          {GUIDE_RARITIES.map(({ rarity, label, desc }) => (
            <div key={rarity} className="guide-rarity-row">
              <span className="guide-rarity-dot" style={{ background: RARITY_COLORS[rarity] }} />
              <div>
                <p className="guide-rarity-label">{label}</p>
                <p className="guide-text">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </GuideCard>
    </div>
  );
}

function TagsSection() {
  return (
    <div className="guide-section">
      <p className="guide-lead">
        Tag&apos;ler oyuncu kartlarında görünür. Aynı tag&apos;ler bir araya gelince sinerji açılır; taktik kartları da belirli tag&apos;lerden bonus alır.
      </p>
      <div className="guide-tag-grid">
        {ALL_TAGS.map((tag) => (
          <div key={tag} className={`guide-tag-item tag-chip tag-chip--${tag.replace(/\s+/g, '-')}`}>
            <p className="guide-tag-name">{tag}</p>
            <p className="guide-tag-desc">{TAG_DESCRIPTIONS[tag]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TacticsSection() {
  const formations = TACTIC_CARDS.filter((t) => t.category === 'formasyon');
  const systems = TACTIC_CARDS.filter((t) => t.category === 'sistem');

  return (
    <div className="guide-section">
      <p className="guide-lead">
        Taktik kartları oyuncu eklemez. Formasyon slotuna veya oyun sistemi slotuna yerleşir; sonraki maçlarda aktif kalır.
      </p>

      <GuideCard title="Formasyonlar" className="guide-card--purple">
        <div className="guide-tactic-list">
          {formations.map((t) => (
            <div key={t.id} className="guide-tactic-row">
              <p className="guide-tactic-name">{t.name}</p>
              <p className="guide-text">{t.description}</p>
              <span className="guide-tactic-chip">{t.effectSummary}</span>
            </div>
          ))}
        </div>
      </GuideCard>

      <GuideCard title="Oyun sistemleri" className="guide-card--cyan">
        <div className="guide-tactic-list">
          {systems.map((t) => (
            <div key={t.id} className="guide-tactic-row">
              <p className="guide-tactic-name">{t.name}</p>
              <p className="guide-text">{t.description}</p>
              <span className="guide-tactic-chip">{t.effectSummary}</span>
            </div>
          ))}
        </div>
      </GuideCard>
    </div>
  );
}

function SynergiesSection() {
  const discovered = loadPersisted().discoveredSynergies;
  const hiddenCount = SYNERGIES.filter((s) => s.hidden).length;
  const revealedCount = SYNERGIES.filter((s) => !s.hidden || discovered.includes(s.id)).length;

  return (
    <div className="guide-section">
      <p className="guide-lead">
        {TOTAL_SYNERGIES} sinerji kombinasyonu var. {hiddenCount} tanesi gizli — run sırasında keşfedilir.
        Açık sinerjilerin tam koşulları burada; gizliler için sadece ipucu verilir.
      </p>
      <div className="guide-synergy-legend">
        <span className="guide-synergy-legend-item guide-synergy-legend-item--open">Açık — tam koşul</span>
        <span className="guide-synergy-legend-item guide-synergy-legend-item--hidden">Gizli — ipucu</span>
        <span className="guide-synergy-legend-item guide-synergy-legend-item--found">Keşfedilen — tam detay</span>
      </div>
      <p className="guide-synergy-progress">
        Rehberde görünen detay: <strong>{revealedCount}/{TOTAL_SYNERGIES}</strong>
        {discovered.length > 0 && ` · Run’larda keşfettiklerin: ${discovered.length}`}
      </p>
      <div className="guide-synergy-list">
        {SYNERGIES.map((s) => {
          const isDiscovered = discovered.includes(s.id);
          const showFull = !s.hidden || isDiscovered;

          return (
            <div
              key={s.id}
              className={`guide-synergy-item ${s.hidden ? 'guide-synergy-item--hidden' : 'guide-synergy-item--open'} ${isDiscovered ? 'guide-synergy-item--found' : ''}`}
            >
              <div className="guide-synergy-head">
                <span className="guide-synergy-icon" aria-hidden>{showFull ? s.icon : '❓'}</span>
                <div className="guide-synergy-head-text">
                  <p className="guide-synergy-name">{showFull ? s.name : 'Gizli sinerji'}</p>
                  <div className="guide-synergy-badges">
                    {s.hidden && !isDiscovered && <span className="guide-badge guide-badge--hidden">Gizli</span>}
                    {isDiscovered && <span className="guide-badge guide-badge--found">Keşfedildi</span>}
                    {!s.hidden && <span className="guide-badge guide-badge--open">Açık</span>}
                  </div>
                </div>
              </div>

              {showFull ? (
                <>
                  <p className="guide-text">{s.description}</p>
                  <p className="guide-synergy-reward">Bonus: {getSynergyBenefitText(s)}</p>
                </>
              ) : (
                <>
                  <p className="guide-synergy-hint">
                    <span className="guide-synergy-hint-label">İpucu</span>
                    {getSynergyGuideTeaser(s.id)}
                  </p>
                  {getSynergyGuideTags(s.id).length > 0 && (
                    <div className="guide-synergy-tag-hints">
                      {getSynergyGuideTags(s.id).map((tag) => (
                        <span key={tag} className="guide-synergy-tag-hint">{tag}</span>
                      ))}
                    </div>
                  )}
                  <p className="guide-synergy-locked-note">Tam koşul ve bonus — run sırasında keşfedilince açılır.</p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventsSection() {
  const samples = EVENT_CARDS.slice(0, 8);

  return (
    <div className="guide-section">
      <GuideCard title="Ne zaman gelir?">
        <p className="guide-text">{GUIDE_EVENT_INFO.rounds}</p>
        <p className="guide-text guide-text--highlight">
          Olay round&apos;ları: {EVENT_ROUNDS.map((r) => `Round ${r}`).join(' · ')}
        </p>
      </GuideCard>

      <GuideCard title="Olay türleri">
        <div className="guide-grid guide-grid--2">
          {GUIDE_EVENT_INFO.categories.map((c) => (
            <div key={c.name} className="guide-event-cat">
              <p className="guide-event-cat-name">{c.name}</p>
              <p className="guide-text">{c.desc}</p>
            </div>
          ))}
        </div>
      </GuideCard>

      <GuideCard title="Örnek olaylar">
        <div className="guide-event-list">
          {samples.map((e) => (
            <div key={e.id} className="guide-event-row">
              <span className="guide-event-icon" aria-hidden>{e.icon}</span>
              <div className="guide-event-body">
                <p className="guide-event-title">{e.title}</p>
                <p className="guide-text">{e.description}</p>
                <p className="guide-event-options">
                  <span>A: {e.optionA.description}</span>
                  <span>B: {e.optionB.description}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="guide-footnote">+ {EVENT_CARDS.length - samples.length} farklı olay daha run sırasında çıkabilir.</p>
      </GuideCard>
    </div>
  );
}

const SECTION_CONTENT: Record<GuideSectionId, () => ReactNode> = {
  genel: GeneralSection,
  oyuncular: PlayersSection,
  tagler: TagsSection,
  taktikler: TacticsSection,
  sinerjiler: SynergiesSection,
  olaylar: EventsSection,
};

export function GameGuideScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const [section, setSection] = useState<GuideSectionId>('genel');
  const active = GUIDE_SECTIONS.find((s) => s.id === section)!;
  const Content = SECTION_CONTENT[section];

  return (
    <div className="game-shell guide-screen">
      <div className="guide-shell">
        <header className="guide-header">
          <button type="button" className="btn-secondary guide-back" onClick={() => setScreen('menu')}>
            ← Ana Menü
          </button>
          <div className="guide-header-text">
            <h1 className="guide-title">Oyun Rehberi</h1>
            <p className="guide-subtitle">Sistem, tag, taktik, sinerji ve olaylar hakkında detaylı bilgi</p>
          </div>
        </header>

        <div className="guide-layout">
          <SectionNav active={section} onChange={setSection} />
          <main className="guide-main">
            <div className="guide-main-head">
              <span className="guide-main-icon" aria-hidden>{active.icon}</span>
              <h2 className="guide-main-title">{active.label}</h2>
            </div>
            <Content />
          </main>
        </div>
      </div>
    </div>
  );
}

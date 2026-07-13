import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TacticCard } from '@/components/TacticCard';
import { TacticBoardVisual } from '@/components/TacticBoardVisual';
import { LineupPreviewInline } from '@/components/LineupPreview';
import { HoverTip } from '@/components/HoverTip';
import { UiIcon } from '@/components/UiIcon';
import { getTacticCard, getTacticCategory, getTacticEffect } from '@/data/tactics';
import { playSound } from '@/utils/sound';
import type { ActiveTactic, GameCard, PlayerCard, TacticCard as TacticCardType } from '@/types';
import { isTacticCard } from '@/types';
import type { TacticDraft } from '@/engine/runPersistence';
import type { ManualLineup } from '@/engine/lineupPreview';

interface Props {
  offers: GameCard[];
  squad: PlayerCard[];
  activeTactics: ActiveTactic[];
  draft: TacticDraft;
  manualLineup?: ManualLineup;
  sound: boolean;
  onSelect: (card: GameCard) => void;
  onConfirm: () => void;
  onRerollFormation?: () => void;
  onRerollSystem?: () => void;
  formationRerollUsed?: boolean;
  systemRerollUsed?: boolean;
}

function TacticExpandModal({
  card,
  squad,
  activeTactics,
  selected,
  canDeselect,
  sound,
  onSelect,
  onClose,
}: {
  card: TacticCardType;
  squad: PlayerCard[];
  activeTactics: ActiveTactic[];
  selected: boolean;
  canDeselect: boolean;
  sound: boolean;
  onSelect: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPad = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPad;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (window.matchMedia('(pointer: fine)').matches) {
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    }
    return () => trigger?.focus();
  }, []);

  return createPortal(
    <>
      <div className="tactic-expand-backdrop" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        className="tactic-expand-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${card.name} — taktik detayı`}
      >
        <div className="tactic-expand-modal-head">
          <p className="tactic-expand-modal-kicker">
            {getTacticCategory(card.id) === 'formasyon' ? 'Formasyon kartı' : 'Oyun sistemi kartı'}
          </p>
          <button ref={closeButtonRef} type="button" className="lineup-preview-close" onClick={onClose} aria-label="Kapat">
            <UiIcon name="x" />
          </button>
        </div>
        <div className="tactic-expand-modal-body">
          <div className="tactic-expand-modal-card-wrap">
            <TacticCard
              card={card}
              squad={squad}
              activeTactics={activeTactics}
              selected={selected}
              expanded
            />
          </div>
        </div>
        <div className="tactic-expand-modal-foot">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Kapat
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              playSound('tick', sound);
              onSelect();
              onClose();
            }}
          >
            {selected && canDeselect ? 'Seçimi kaldır' : selected ? '✓ Seçili' : 'Bu kartı seç'}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}

function TacticPickCard({
  card,
  selected,
  canDeselect,
  onSelect,
  onExpand,
}: {
  card: TacticCardType;
  selected: boolean;
  canDeselect: boolean;
  onSelect: () => void;
  onExpand: () => void;
}) {
  const isFormation = getTacticCategory(card.id) === 'formasyon';

  return (
    <article className={`tactic-pick-card ${isFormation ? 'tactic-pick-card--formation' : 'tactic-pick-card--system'} ${selected ? 'tactic-pick-card--selected' : ''}`}>
      <button
        type="button"
        className="tactic-pick-card-hero"
        onClick={onExpand}
        aria-label={`${card.name} — detayları aç`}
      >
        <div className={`tactic-pick-card-visual ${isFormation ? 'tactic-pick-card-visual--formation' : 'tactic-pick-card-visual--system'}`}>
          <TacticBoardVisual card={card} preview />
        </div>
        <div className="tactic-pick-card-shade" aria-hidden />
        <div className="tactic-pick-card-meta">
          <span className="tactic-pick-card-cat">
            {isFormation ? 'Formasyon' : 'Oyun sistemi'}
          </span>
          <h3 className="tactic-pick-card-name">{card.name}</h3>
          <p className="tactic-pick-card-effect">{card.effectSummary}</p>
          <p className="tactic-pick-card-detail-hint">
            <UiIcon name="info" /> Detayı incele
          </p>
        </div>
        {selected && <span className="tactic-pick-card-badge" aria-hidden>✓</span>}
      </button>
      <button
        type="button"
        className={`tactic-pick-card-select ${selected ? 'tactic-pick-card-select--on' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {selected && canDeselect ? 'Seçimi kaldır' : selected ? '✓ Seçildi' : 'Seç'}
      </button>
    </article>
  );
}

function TacticPickRow({
  label,
  step,
  done,
  reroll,
  children,
}: {
  label: string;
  step: string;
  done: boolean;
  reroll?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="tactic-pick-row">
      <header className="tactic-pick-row-head">
        <span className={`tactic-pick-step ${done ? 'tactic-pick-step--done' : ''}`}>
          {done ? '✓' : step}
        </span>
        <h2 className="tactic-pick-row-title">{label}</h2>
        {reroll}
      </header>
      <div className="tactic-pick-row-cards">
        {children}
      </div>
    </section>
  );
}

export function TacticPickGrid({ offers, squad, activeTactics, draft, manualLineup = {}, sound, onSelect, onConfirm, onRerollFormation, onRerollSystem, formationRerollUsed = false, systemRerollUsed = false }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const tactics = offers.filter(isTacticCard);
  const formations = tactics.filter((o) => getTacticCategory(o.id) === 'formasyon');
  const systems = tactics.filter((o) => getTacticCategory(o.id) === 'sistem');
  // İlk taktik turu değilse (zaten aktif formasyon + sistem varsa) seçim zorunlu değil.
  const hasActiveFormation = activeTactics.some((t) => getTacticCategory(t.id) === 'formasyon');
  const hasActiveSystem = activeTactics.some((t) => getTacticCategory(t.id) === 'sistem');
  const optional = hasActiveFormation && hasActiveSystem;
  const effectiveFormation = Boolean(draft.formationId) || hasActiveFormation;
  const effectiveSystem = Boolean(draft.systemId) || hasActiveSystem;
  const ready = optional ? true : Boolean(draft.formationId && draft.systemId);
  const changed = Boolean(draft.formationId || draft.systemId);
  const expanded = expandedId ? tactics.find((t) => t.id === expandedId) : undefined;
  const previewTactics = [
    ...activeTactics.filter((t) => {
      const cat = getTacticCategory(t.id);
      if (draft.formationId && cat === 'formasyon') return false;
      if (draft.systemId && cat === 'sistem') return false;
      return true;
    }),
    ...(draft.formationId ? [getTacticEffect(draft.formationId)] : []),
    ...(draft.systemId ? [getTacticEffect(draft.systemId)] : []),
  ];
  const previewManualLineup = draft.formationId ? {} : manualLineup ?? {};
  const selectedFormationName = draft.formationId
    ? tactics.find((t) => t.id === draft.formationId)?.name
    : activeTactics.find((t) => getTacticCategory(t.id) === 'formasyon')?.name;
  const activeFormation = activeTactics.find((t) => getTacticCategory(t.id) === 'formasyon');
  const activeSystem = activeTactics.find((t) => getTacticCategory(t.id) === 'sistem');
  const selectedFormationCard = draft.formationId ? getTacticCard(draft.formationId) : undefined;
  const selectedSystemCard = draft.systemId ? getTacticCard(draft.systemId) : undefined;
  const currentPlanItems = [
    {
      key: 'formation',
      label: 'Formasyon',
      name: selectedFormationCard?.name ?? activeFormation?.name ?? 'Seçilmedi',
      detail: selectedFormationCard?.effectSummary ?? activeFormation?.description ?? 'Bu turda bir formasyon seç.',
      tip: selectedFormationCard?.description ?? activeFormation?.description,
      active: Boolean(selectedFormationCard || activeFormation),
      draft: Boolean(selectedFormationCard),
    },
    {
      key: 'system',
      label: 'Oyun sistemi',
      name: selectedSystemCard?.name ?? activeSystem?.name ?? 'Seçilmedi',
      detail: selectedSystemCard?.effectSummary ?? activeSystem?.description ?? 'Bu turda bir oyun sistemi seç.',
      tip: selectedSystemCard?.description ?? activeSystem?.description,
      active: Boolean(selectedSystemCard || activeSystem),
      draft: Boolean(selectedSystemCard),
    },
  ];

  return (
    <div className="tactic-pick-stage">
      <header className="tactic-pick-stage-head">
        <div className="tactic-pick-stage-head-text">
          <p className="tactic-pick-stage-kicker">Taktik günü · maç yok</p>
          <p className="tactic-pick-stage-sub">
            {optional
              ? 'İstersen değiştir; istemezsen mevcut taktik kalır.'
              : 'Bir formasyon ve bir oyun sistemi seç.'}
          </p>
        </div>
      </header>

      <div className="tactic-pick-body-grid">
        <div className="tactic-pick-stage-grid">
          <TacticPickRow
            label="Formasyon seç"
            step="1"
            done={effectiveFormation}
            reroll={onRerollFormation && (
              <button
                type="button"
                className="btn-secondary tactic-pick-reroll"
                disabled={formationRerollUsed}
                title={formationRerollUsed ? 'Bu run formasyon yenileme hakkını kullandın' : 'Formasyon tekliflerini bir kez yenile (run boyu tek hak)'}
                onClick={() => { playSound('tick', sound); onRerollFormation(); }}
              >
                {formationRerollUsed ? 'Yenilendi' : 'Yenile'}
              </button>
            )}
          >
            {formations.map((card) => (
              <TacticPickCard
                key={card.id}
                card={card}
                selected={draft.formationId === card.id}
                canDeselect={optional}
                onExpand={() => setExpandedId(card.id)}
                onSelect={() => { playSound('tick', sound); onSelect(card); }}
              />
            ))}
          </TacticPickRow>

          <TacticPickRow
            label="Oyun sistemi seç"
            step="2"
            done={effectiveSystem}
            reroll={onRerollSystem && (
              <button
                type="button"
                className="btn-secondary tactic-pick-reroll"
                disabled={systemRerollUsed}
                title={systemRerollUsed ? 'Bu run oyun sistemi yenileme hakkını kullandın' : 'Oyun sistemi tekliflerini bir kez yenile (run boyu tek hak)'}
                onClick={() => { playSound('tick', sound); onRerollSystem(); }}
              >
                {systemRerollUsed ? 'Yenilendi' : 'Yenile'}
              </button>
            )}
          >
            {systems.map((card) => (
              <TacticPickCard
                key={card.id}
                card={card}
                selected={draft.systemId === card.id}
                canDeselect={optional}
                onExpand={() => setExpandedId(card.id)}
                onSelect={() => { playSound('tick', sound); onSelect(card); }}
              />
            ))}
          </TacticPickRow>
        </div>

        <aside className="tactic-pick-lineup-panel">
          <div className="tactic-pick-current-panel">
            <div className="tactic-pick-current-head">
              <span>Aktif plan</span>
              <strong>{ready ? 'Hazır' : 'Eksik'}</strong>
            </div>
            <div className="tactic-pick-current-list">
              {currentPlanItems.map((item) => {
                const row = (
                  <div
                    className={`tactic-pick-current-item ${item.active ? 'tactic-pick-current-item--active' : ''} ${item.draft ? 'tactic-pick-current-item--draft' : ''}`}
                  >
                    <span>{item.label}</span>
                    <strong>{item.name}</strong>
                    <small>{item.detail}</small>
                  </div>
                );
                return item.tip ? (
                  <HoverTip key={item.key} tip={item.tip} placement="left">
                    {row}
                  </HoverTip>
                ) : (
                  <div key={item.key}>{row}</div>
                );
              })}
            </div>
          </div>
          <LineupPreviewInline
            squad={squad}
            activeTactics={previewTactics}
            manualLineup={previewManualLineup}
            title={selectedFormationName ? `${selectedFormationName} önizleme` : 'Diziliş önizleme'}
            headline="Mevcut Kadro"
          />
          <div className="tactic-pick-bonus-card">
            <span>Taktik bonusu</span>
            <strong>
              {ready ? 'Sonraki maçlarda aktif olur' : 'Formasyon ve sistem seç'}
            </strong>
          </div>
          <footer className="tactic-pick-stage-foot">
            <button
              type="button"
              className="btn-primary tactic-pick-confirm"
              disabled={!ready}
              onClick={() => { playSound('tick', sound); onConfirm(); }}
            >
              <span className="tactic-pick-confirm-label">
                {optional && !changed
                  ? 'Geç · mevcut taktik kalsın'
                  : ready
                    ? 'Onayla ve devam et'
                    : 'Önce formasyon ve sistem seç'}
              </span>
              <span className="tactic-pick-confirm-hint">
                {optional && !changed
                  ? 'Aktif formasyon ve sistemin korunur · sonraki maçlarda geçerli'
                  : ready
                    ? 'Sonraki maçlarda aktif olur'
                    : `${effectiveFormation ? '✓ Formasyon' : '○ Formasyon'} · ${effectiveSystem ? '✓ Sistem' : '○ Sistem'}`}
              </span>
            </button>
          </footer>
        </aside>
      </div>

      {expanded && (
        <TacticExpandModal
          card={expanded}
          squad={squad}
          activeTactics={activeTactics}
          selected={
            (getTacticCategory(expanded.id) === 'formasyon' && draft.formationId === expanded.id)
            || (getTacticCategory(expanded.id) === 'sistem' && draft.systemId === expanded.id)
          }
          canDeselect={optional}
          sound={sound}
          onSelect={() => onSelect(expanded)}
          onClose={() => setExpandedId(null)}
        />
      )}
    </div>
  );
}

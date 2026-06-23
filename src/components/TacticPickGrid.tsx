import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TacticCard } from '@/components/TacticCard';
import { TacticBoardVisual } from '@/components/TacticBoardVisual';
import { getTacticCategory } from '@/data/tactics';
import { playSound } from '@/utils/sound';
import type { ActiveTactic, GameCard, PlayerCard, TacticCard as TacticCardType } from '@/types';
import { isTacticCard } from '@/types';
import type { TacticDraft } from '@/engine/runPersistence';

interface Props {
  offers: GameCard[];
  squad: PlayerCard[];
  activeTactics: ActiveTactic[];
  draft: TacticDraft;
  sound: boolean;
  onSelect: (card: GameCard) => void;
  onConfirm: () => void;
}

function TacticExpandModal({
  card,
  squad,
  activeTactics,
  selected,
  sound,
  onSelect,
  onClose,
}: {
  card: TacticCardType;
  squad: PlayerCard[];
  activeTactics: ActiveTactic[];
  selected: boolean;
  sound: boolean;
  onSelect: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

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
          <button type="button" className="lineup-preview-close" onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </div>
        <div className="tactic-expand-modal-body">
          <div className="tactic-expand-modal-card-wrap">
            <TacticCard
              card={card}
              squad={squad}
              activeTactics={activeTactics}
              selected={selected}
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
            {selected ? '✓ Seçili' : 'Bu kartı seç'}
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
  onSelect,
  onExpand,
}: {
  card: TacticCardType;
  selected: boolean;
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
            <span aria-hidden>🔍</span> Detay için tıkla
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
        {selected ? '✓ Seçildi' : 'Seç'}
      </button>
    </article>
  );
}

function TacticPickRow({
  label,
  step,
  done,
  children,
}: {
  label: string;
  step: string;
  done: boolean;
  children: ReactNode;
}) {
  return (
    <section className="tactic-pick-row">
      <header className="tactic-pick-row-head">
        <span className={`tactic-pick-step ${done ? 'tactic-pick-step--done' : ''}`}>
          {done ? '✓' : step}
        </span>
        <h2 className="tactic-pick-row-title">{label}</h2>
      </header>
      <div className="tactic-pick-row-cards">
        {children}
      </div>
    </section>
  );
}

export function TacticPickGrid({ offers, squad, activeTactics, draft, sound, onSelect, onConfirm }: Props) {
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

  return (
    <div className="tactic-pick-stage">
      <header className="tactic-pick-stage-head">
        <p className="tactic-pick-stage-kicker">Taktik günü · maç yok</p>
        <p className="tactic-pick-stage-sub">
          {optional
            ? 'İstersen formasyon/sistem değiştir — değiştirmezsen mevcut taktiğin kalır · +35 puan · +8 moral'
            : 'Üstten bir formasyon, alttan bir oyun sistemi seç · +35 puan · +8 moral'}
        </p>
      </header>

      <div className="tactic-pick-stage-grid">
        <TacticPickRow label="Formasyon seç" step="1" done={effectiveFormation}>
          {formations.map((card) => (
            <TacticPickCard
              key={card.id}
              card={card}
              selected={draft.formationId === card.id}
              onExpand={() => setExpandedId(card.id)}
              onSelect={() => { playSound('tick', sound); onSelect(card); }}
            />
          ))}
        </TacticPickRow>

        <TacticPickRow label="Oyun sistemi seç" step="2" done={effectiveSystem}>
          {systems.map((card) => (
            <TacticPickCard
              key={card.id}
              card={card}
              selected={draft.systemId === card.id}
              onExpand={() => setExpandedId(card.id)}
              onSelect={() => { playSound('tick', sound); onSelect(card); }}
            />
          ))}
        </TacticPickRow>
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
                ? 'Seçtiklerin slota yerleşir · sonraki maçlarda aktif'
                : `${effectiveFormation ? '✓ Formasyon' : '○ Formasyon'} · ${effectiveSystem ? '✓ Sistem' : '○ Sistem'}`}
          </span>
        </button>
      </footer>

      {expanded && (
        <TacticExpandModal
          card={expanded}
          squad={squad}
          activeTactics={activeTactics}
          selected={
            (getTacticCategory(expanded.id) === 'formasyon' && draft.formationId === expanded.id)
            || (getTacticCategory(expanded.id) === 'sistem' && draft.systemId === expanded.id)
          }
          sound={sound}
          onSelect={() => onSelect(expanded)}
          onClose={() => setExpandedId(null)}
        />
      )}
    </div>
  );
}

import { MiniTacticBoard } from '@/components/MiniTacticBoard';
import { SynergySideSection } from '@/components/SynergySideSection';
import { EVENT_ROUNDS, getEventById } from '@/data/events';
import { getTacticCategory } from '@/data/tactics';
import { HoverTip } from '@/components/HoverTip';
import { explainActiveTactic } from '@/engine/squadInsights';
import type { ActiveTactic, GameCard, PlayerCard, TacticCard } from '@/types';
import { isTacticCard } from '@/types';

interface Props {
  squad: PlayerCard[];
  morale: number;
  activeTactics: ActiveTactic[];
  usedEventIds: string[];
  round: number;
  currentOffers?: GameCard[];
  discoveredSynergies: string[];
}

function activeInCategory(activeTactics: ActiveTactic[], category: 'formasyon' | 'sistem') {
  return activeTactics.find((t) => getTacticCategory(t.id) === category);
}

function offerInCategory(offers: GameCard[] | undefined, category: 'formasyon' | 'sistem'): TacticCard | undefined {
  return offers?.find((o): o is TacticCard => isTacticCard(o) && o.category === category);
}

function TacticSlot({
  label,
  category,
  active,
  preview,
  squad,
}: {
  label: string;
  category: 'formasyon' | 'sistem';
  active?: ActiveTactic;
  preview?: TacticCard;
  squad: PlayerCard[];
}) {
  const filled = Boolean(active);
  const replacing = filled && preview && preview.id !== active?.id;
  const showPreview = Boolean(preview && (!filled || replacing));
  const name = active?.name ?? preview?.name;
  const hoverTip = active
    ? explainActiveTactic(active, squad).join('\n')
  : preview
    ? `Seçersen ${label.toLowerCase()} slotuna yerleşir.\n${preview.name}`
    : `${label} slotu boş — taktik kartı seç`;

  return (
    <HoverTip tip={hoverTip} className="tactic-slot-wrap">
    <div
      className={`tactic-slot ${filled ? 'tactic-slot--filled' : 'tactic-slot--empty'} ${showPreview ? 'tactic-slot--preview' : ''}`}
    >
      <MiniTacticBoard
        tacticId={active?.id ?? preview?.id}
        category={category}
        empty={!filled && !showPreview}
        size="md"
      />
      <div className="tactic-slot-body">
        <p className="tactic-slot-label">{label}</p>
        {filled && !replacing ? (
          <>
            <p className="tactic-slot-name">{active!.name}</p>
            <p className="tactic-slot-detail tactic-slot-detail--active">Aktif — sonraki maçlarda geçerli</p>
            {explainActiveTactic(active!, squad).slice(0, 1).map((line) => (
              <p key={line} className="tactic-slot-detail">{line}</p>
            ))}
          </>
        ) : showPreview && replacing ? (
          <>
            <p className="tactic-slot-name tactic-slot-name--preview">{preview!.name}</p>
            <p className="tactic-slot-detail tactic-slot-detail--warn">
              {active!.name} yerine geçer — mevcut sistem değişir
            </p>
          </>
        ) : showPreview ? (
          <>
            <p className="tactic-slot-name tactic-slot-name--preview">{name}</p>
            <p className="tactic-slot-detail">Seçersen bu slota yerleşir</p>
          </>
        ) : (
          <p className="tactic-slot-empty">Boş — taktik kartı seç</p>
        )}
      </div>
    </div>
    </HoverTip>
  );
}

function EventSlot({
  eventRound,
  eventId,
  isPast,
  isCurrent,
}: {
  eventRound: number;
  eventId?: string;
  isPast: boolean;
  isCurrent: boolean;
}) {
  const event = eventId ? getEventById(eventId) : undefined;

  return (
    <div
      className={`event-slot ${event ? 'event-slot--filled' : 'event-slot--empty'} ${isCurrent ? 'event-slot--current' : ''}`}
    >
      <div className="event-slot-icon-wrap">
        {event ? (
          <span className="event-slot-icon">{event.icon}</span>
        ) : (
          <span className="event-slot-icon event-slot-icon--empty">?</span>
        )}
      </div>
      <div className="event-slot-body">
        <p className="event-slot-round">Round {eventRound}</p>
        {event ? (
          <>
            <p className="event-slot-name">{event.title}</p>
            <p className="event-slot-detail">{isPast ? 'Karar verildi' : event.description}</p>
          </>
        ) : isCurrent ? (
          <p className="event-slot-empty">Bu round — olay kartı geliyor</p>
        ) : isPast ? (
          <p className="event-slot-empty">Henüz boş</p>
        ) : (
          <p className="event-slot-empty">Henüz boş</p>
        )}
      </div>
    </div>
  );
}

export function SidePanel({
  squad,
  morale,
  activeTactics,
  usedEventIds,
  round,
  currentOffers,
  discoveredSynergies,
}: Props) {
  const formation = activeInCategory(activeTactics, 'formasyon');
  const system = activeInCategory(activeTactics, 'sistem');
  const previewFormation = offerInCategory(currentOffers, 'formasyon');
  const previewSystem = offerInCategory(currentOffers, 'sistem');

  return (
    <div className="panel side-panel">
      <div className="side-panel-body">
        <div className="side-panel-section">
          <h2 className="side-panel-title side-panel-title--cyan">Taktik Slotları</h2>
          <p className="side-panel-slot-hint">Formasyon + oyun sistemi ayrı slot — biri diğerini silmez</p>
          <div className="tactic-slots">
            <TacticSlot
              label="Formasyon"
              category="formasyon"
              active={formation}
              preview={previewFormation}
              squad={squad}
            />
            <TacticSlot
              label="Oyun Sistemi"
              category="sistem"
              active={system}
              preview={previewSystem}
              squad={squad}
            />
          </div>
        </div>

        <div className="side-panel-section">
          <h2 className="side-panel-title side-panel-title--orange">Olaylar</h2>
          <div className="event-slots">
            {EVENT_ROUNDS.map((eventRound, i) => (
              <EventSlot
                key={eventRound}
                eventRound={eventRound}
                eventId={usedEventIds[i]}
                isPast={round > eventRound}
                isCurrent={round === eventRound}
              />
            ))}
          </div>
        </div>

        <SynergySideSection
          squad={squad}
          morale={morale}
          discoveredSynergies={discoveredSynergies}
          currentOffers={currentOffers}
        />
      </div>
    </div>
  );
}

import { EVENT_EFFECTS } from '@/data/eventEffects';
import { PLAYER_POOL, clonePlayer } from '@/data/players';
import { drawEvent as pickContextEvent, type EventDrawContext } from '@/engine/eventDraw';
import { getStarFieldPlayer } from '@/engine/eventSubjects';
import { createRng } from '@/engine/seed';
import type { EventCard, GameState, PlayerCard, Position, Tag } from '@/types';

export type { EventDrawContext } from '@/engine/eventDraw';
export { getEventDrawWeight, isEventEligible, filterEventsForDraw } from '@/engine/eventDraw';

export function drawEvent(
  seed: string,
  round: number,
  usedIds: string[],
  ctx: EventDrawContext,
): EventCard {
  return pickContextEvent(seed, round, usedIds, ctx);
}

export interface EventOutcome {
  moraleDelta: number;
  scoreDelta: number;
  removeWeakest?: boolean;
  sellPlayerId?: string;
  sellPlayerName?: string;
  addYouth?: boolean;
  grantRerolls?: number;
  nextMatchRisk?: number;
  nextMatchBonus?: number;
  /** Bir sonraki maç için geçici rating değişimi (ör. −5) */
  tempRatingDelta?: number;
  /** Kadro tag'lerine göre hesaplanan sonraki maç bonusu (tag-koşullu seçim) */
  conditionalBonus?: { tags: Tag[]; perTag: number; base?: number; cap?: number };
  /** Bir oyuncuya kalıcı tag kazandırır (benzersiz olay mekaniği) */
  grantTag?: Tag;
  description: string;
}

function countSquadTags(squad: PlayerCard[], tags: Tag[]): number {
  return squad.reduce((n, p) => n + (tags.some((t) => p.tags.includes(t)) ? 1 : 0), 0);
}

export function resolveEvent(
  event: EventCard,
  choice: 'A' | 'B',
  state: Pick<GameState, 'squad' | 'morale' | 'score' | 'activeTactics'>,
): EventOutcome {
  const pair = EVENT_EFFECTS[event.id];
  if (pair) {
    const outcome = choice === 'A' ? { ...pair[0] } : { ...pair[1] };

    // Tag-koşullu bonus → gerçek sonraki-maç bonusuna çevir (sahte seçim değil)
    if (outcome.conditionalBonus) {
      const { tags, perTag, base = 0, cap } = outcome.conditionalBonus;
      const matchCount = countSquadTags(state.squad, tags);
      let bonus = base + matchCount * perTag;
      if (cap !== undefined) bonus = Math.min(cap, bonus);
      outcome.nextMatchBonus = (outcome.nextMatchBonus ?? 0) + bonus;
      const tagLabel = tags.join('/');
      outcome.description = matchCount > 0
        ? `${matchCount} ${tagLabel} oyuncu öne çıktı — sonraki maç +${bonus}.`
        : `Kadroda ${tagLabel} az — sonraki maç +${bonus}.`;
    }

    if (event.id === 'evt_transfer_teklif' && choice === 'A') {
      const star = getStarFieldPlayer(state.squad);
      if (star) {
        outcome.sellPlayerId = star.id;
        outcome.sellPlayerName = star.name;
        outcome.description = `${star.name} (${star.currentRating}) yüksek bonservisle satıldı — +${outcome.scoreDelta} puan ve ${outcome.grantRerolls ?? 0} ekstra çek hakkı.`;
      }
    }
    return outcome;
  }
  return {
    moraleDelta: choice === 'B' ? 5 : 0,
    scoreDelta: 0,
    description: 'Karar uygulandı.',
  };
}

const LOAN_FIRST = ['Mateo', 'Luca', 'Rafael', 'Kenji', 'Amir', 'Felix', 'Noah', 'Diego', 'Victor', 'James'];
const LOAN_LAST = ['Silva', 'Costa', 'Santos', 'Kane', 'Reed', 'Mensah', 'Dupont', 'Novak', 'Haddad', 'Brooks'];
const LOAN_POSITIONS: Position[] = ['SLK', 'SÖK', 'SF', 'OOS', 'DOS', 'STP', 'SLB', 'SÖB'];

export function previewEventPlayer(seed: string, round: number, eventId: string): PlayerCard {
  if (eventId === 'evt_genc_yetenek') return createYouthPlayer(seed, round);
  if (eventId === 'evt_kiralik' || eventId === 'evt_scout') return createLoanPlayer(seed, round);
  return createYouthPlayer(seed, round);
}

export function createYouthPlayer(seed: string, round: number): PlayerCard {
  const rng = createRng(seed, 'youth', round);
  const rating = 62 + Math.floor(rng() * 6);
  return clonePlayer({
    kind: 'player',
    id: `youth_${round}_${Math.floor(rng() * 9999)}`,
    name: 'Genç Yetenek',
    rating,
    currentRating: rating,
    position: 'OS',
    rarity: 'normal',
    tags: ['POTANSİYEL', 'YERLİ'],
    potentialCeiling: 82,
  });
}

export function createLoanPlayer(seed: string, round: number): PlayerCard {
  const rng = createRng(seed, 'loan', round);
  const fromPool = PLAYER_POOL[Math.floor(rng() * PLAYER_POOL.length)];
  if (fromPool && rng() < 0.35) {
    return clonePlayer({
      ...fromPool,
      id: `loan_${round}_${Math.floor(rng() * 9999)}`,
      name: `${fromPool.name} (Kiralık)`,
    });
  }
  const fi = Math.floor(rng() * LOAN_FIRST.length);
  const li = Math.floor(rng() * LOAN_LAST.length);
  const pos = LOAN_POSITIONS[Math.floor(rng() * LOAN_POSITIONS.length)]!;
  const rating = 68 + Math.floor(rng() * 14);
  return clonePlayer({
    kind: 'player',
    id: `loan_${round}_${Math.floor(rng() * 9999)}`,
    name: `${LOAN_FIRST[fi]} ${LOAN_LAST[li]}`,
    rating,
    currentRating: rating,
    position: pos,
    rarity: rating >= 80 ? 'güçlü' : rating >= 72 ? 'iyi' : 'normal',
    tags: rating >= 78 ? ['FİNİŞÖR'] : rating >= 72 ? ['TEKNİK'] : ['DAYANIKLI'],
  });
}

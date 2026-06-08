import { getStartingEleven } from '@/engine/lineupPreview';
import { previewEventPlayer } from '@/engine/events';
import { getWeakestPlayer } from '@/engine/squadLogic';
import type { ActiveTactic, PlayerCard } from '@/types';

export type EventSubject = {
  player: PlayerCard;
  label: string;
  /** Yeni gelen oyuncu — tam kart göster */
  incoming?: boolean;
  variant?: 'join' | 'leave' | 'focus' | 'pair';
};

function sortByRatingAsc(squad: PlayerCard[]): PlayerCard[] {
  return [...squad].sort((a, b) => a.currentRating - b.currentRating);
}

function sortByRatingDesc(squad: PlayerCard[]): PlayerCard[] {
  return [...squad].sort((a, b) => b.currentRating - a.currentRating);
}

export function getStarFieldPlayer(squad: PlayerCard[]): PlayerCard | null {
  const field = squad.filter((p) => p.position !== 'KL');
  if (!field.length) return squad[0] ?? null;
  return sortByRatingDesc(field)[0]!;
}

function getMidTierPlayer(squad: PlayerCard[]): PlayerCard {
  const sorted = sortByRatingAsc(squad);
  const idx = Math.max(0, Math.floor((sorted.length - 1) / 2));
  return sorted[idx]!;
}

export function getCaptainPlayer(squad: PlayerCard[]): PlayerCard | null {
  return (
    squad.find((p) => p.tags.includes('KAPİTAN'))
    ?? squad.find((p) => p.tags.includes('LİDER'))
    ?? null
  );
}

function getGoalkeeper(squad: PlayerCard[]): PlayerCard | null {
  return squad.find((p) => p.position === 'KL') ?? null;
}

function getRetiringPlayer(squad: PlayerCard[]): PlayerCard {
  const captain = getCaptainPlayer(squad);
  if (captain) return captain;
  const veterans = squad.filter((p) => p.tags.includes('GERİLEYEN') || p.currentRating >= 76);
  if (veterans.length) return sortByRatingDesc(veterans)[0]!;
  return getMidTierPlayer(squad);
}

function getFightPair(squad: PlayerCard[]): PlayerCard[] {
  const argumentative = sortByRatingDesc(squad.filter((p) => p.tags.includes('TARTIŞMALI')));
  if (argumentative.length >= 2) return [argumentative[0]!, argumentative[1]!];
  if (argumentative.length === 1) {
    const other = sortByRatingDesc(squad.filter((p) => p.id !== argumentative[0]!.id && p.position !== 'KL'))[0];
    return other ? [argumentative[0]!, other] : [argumentative[0]!];
  }
  const field = sortByRatingDesc(squad.filter((p) => p.position !== 'KL'));
  if (field.length >= 2) return [field[0]!, field[1]!];
  return field.length ? [field[0]!] : squad.slice(0, 1);
}

function getYouthMistakePlayer(squad: PlayerCard[]): PlayerCard {
  const youth = squad.filter((p) => p.tags.includes('POTANSİYEL'));
  if (youth.length) return sortByRatingAsc(youth)[0]!;
  const field = squad.filter((p) => p.position !== 'KL');
  return field.length ? sortByRatingAsc(field)[0]! : squad[0]!;
}

function getFamilyIssuePlayer(squad: PlayerCard[], activeTactics: ActiveTactic[]): PlayerCard {
  const starters = getStartingEleven(squad, activeTactics);
  const local = starters.filter((p) => p.tags.includes('YERLİ'));
  if (local.length) return sortByRatingAsc(local)[0]!;
  return starters.length ? sortByRatingAsc(starters)[0]! : getWeakestPlayer(squad);
}

function getSaleCandidate(squad: PlayerCard[], sellPlayerId?: string): PlayerCard | null {
  if (sellPlayerId) return squad.find((p) => p.id === sellPlayerId) ?? null;
  return getStarFieldPlayer(squad);
}

function getWeakDepartCandidate(squad: PlayerCard[]): PlayerCard {
  const protectedPool = squad.filter((p) =>
    !p.tags.some((t) => ['MENTOR', 'LİDER', 'KAPİTAN'].includes(t)),
  );
  return getWeakestPlayer(protectedPool.length ? protectedPool : squad);
}

function getTiredStarters(squad: PlayerCard[], activeTactics: ActiveTactic[], count = 3): PlayerCard[] {
  const starters = getStartingEleven(squad, activeTactics).filter((p) => p.position !== 'KL');
  return sortByRatingAsc(starters).slice(0, count);
}

function getPoisonedPair(squad: PlayerCard[], activeTactics: ActiveTactic[]): PlayerCard[] {
  const starters = getStartingEleven(squad, activeTactics).filter((p) => p.position !== 'KL');
  return sortByRatingAsc(starters).slice(0, 2);
}

const INCOMING_EVENTS = new Set(['evt_genc_yetenek', 'evt_kiralik', 'evt_scout', 'evt_eksik_kadro']);

/** Olay ekranında gösterilecek oyuncular — metinde geçen isimler kadrodan seçilir */
export function getEventSubjects(
  eventId: string,
  squad: PlayerCard[],
  activeTactics: ActiveTactic[],
  opts: { seed: string; round: number; sellPlayerId?: string },
): EventSubject[] {
  const subjects: EventSubject[] = [];

  if (INCOMING_EVENTS.has(eventId)) {
    const player = previewEventPlayer(opts.seed, opts.round, eventId);
    const label = eventId === 'evt_eksik_kadro'
      ? 'Acil transfer teklifi (B seçeneği)'
      : eventId === 'evt_kiralik'
        ? 'Kiralık teklif'
        : eventId === 'evt_scout'
          ? 'Scout önerisi'
          : 'Genç yetenek teklifi';
    subjects.push({ player, label, incoming: true, variant: 'join' });
    return subjects;
  }

  switch (eventId) {
    case 'evt_transfer_teklif': {
      const star = getSaleCandidate(squad, opts.sellPlayerId);
      if (star) subjects.push({ player: star, label: 'Teklif alan oyuncu', variant: 'leave' });
      break;
    }
    case 'evt_kavga': {
      const pair = getFightPair(squad);
      pair.forEach((player, i) => {
        subjects.push({
          player,
          label: pair.length > 1 ? `Kavga eden ${i + 1}` : 'Kavga eden oyuncu',
          variant: 'pair',
        });
      });
      break;
    }
    case 'evt_kaptan':
    case 'evt_dogum_gunu': {
      const captain = getCaptainPlayer(squad) ?? getStarFieldPlayer(squad);
      if (captain) {
        subjects.push({
          player: captain,
          label: eventId === 'evt_dogum_gunu' ? 'Doğum günü olan kaptan' : 'Kaptan',
          variant: 'focus',
        });
      }
      break;
    }
    case 'evt_emekli': {
      const retiring = getRetiringPlayer(squad);
      subjects.push({ player: retiring, label: 'Emekli olan oyuncu', variant: 'leave' });
      break;
    }
    case 'evt_sakatlik': {
      const star = getStarFieldPlayer(squad);
      if (star) subjects.push({ player: star, label: 'Sakatlanan yıldız', variant: 'focus' });
      break;
    }
    case 'evt_yildiz_sozlesme': {
      const star = getStarFieldPlayer(squad);
      if (star) subjects.push({ player: star, label: 'Prim isteyen yıldız', variant: 'focus' });
      break;
    }
    case 'evt_acemi_hata': {
      subjects.push({
        player: getYouthMistakePlayer(squad),
        label: 'Hata yapan genç oyuncu',
        variant: 'focus',
      });
      break;
    }
    case 'evt_menajer_krizi': {
      subjects.push({
        player: getMidTierPlayer(squad),
        label: 'Transfer baskısı yapan oyuncu',
        variant: 'leave',
      });
      break;
    }
    case 'evt_aile': {
      subjects.push({
        player: getFamilyIssuePlayer(squad, activeTactics),
        label: 'Ailevi sorun yaşayan oyuncu',
        variant: 'focus',
      });
      break;
    }
    case 'evt_diger_kulup': {
      subjects.push({
        player: getWeakDepartCandidate(squad),
        label: 'Gözlem altındaki oyuncu (A: ayrılabilir)',
        variant: 'leave',
      });
      break;
    }
    case 'evt_kaleci_hata':
    case 'evt_yedek_kaleci': {
      const gk = getGoalkeeper(squad);
      if (gk) {
        subjects.push({
          player: gk,
          label: eventId === 'evt_yedek_kaleci' ? 'Sakatlanan kaleci' : 'Kaleci',
          variant: 'focus',
        });
      }
      break;
    }
    case 'evt_yorgunluk': {
      getTiredStarters(squad, activeTactics).forEach((player, i) => {
        subjects.push({ player, label: `Yorgun oyuncu ${i + 1}`, variant: 'focus' });
      });
      break;
    }
    case 'evt_zehir': {
      getPoisonedPair(squad, activeTactics).forEach((player, i) => {
        subjects.push({ player, label: `Etkilenen oyuncu ${i + 1}`, variant: 'focus' });
      });
      break;
    }
    default:
      break;
  }

  return subjects;
}

/** resolveEventRemoval ile aynı hedef — emeklilik için kaptan önceliği */
export function pickEventRemovalTarget(
  eventId: string,
  choice: 'A' | 'B',
  squad: PlayerCard[],
  activeTactics: ActiveTactic[],
  sellPlayerId?: string,
): PlayerCard | null {
  if (eventId === 'evt_transfer_teklif' && choice === 'A') {
    return getSaleCandidate(squad, sellPlayerId) ?? getStarFieldPlayer(squad);
  }

  if (eventId === 'evt_kavga' && choice === 'A') {
    const argumentative = squad.filter((p) => p.tags.includes('TARTIŞMALI'));
    if (argumentative.length) return sortByRatingDesc(argumentative)[0]!;
    const field = squad.filter((p) => p.position !== 'KL');
    if (field.length >= 2) return sortByRatingDesc(field)[1]!;
    return getWeakestPlayer(squad);
  }

  if (eventId === 'evt_sakatlik' && choice === 'B') {
    const starters = getStartingEleven(squad, activeTactics);
    const starterIds = new Set(starters.map((p) => p.id));
    const injuredPool = squad.filter((p) => starterIds.has(p.id) && p.position !== 'KL');
    return injuredPool.length ? sortByRatingAsc(injuredPool)[0]! : getWeakestPlayer(squad);
  }

  if (eventId === 'evt_emekli' && choice === 'B') {
    return getRetiringPlayer(squad);
  }

  if (eventId === 'evt_menajer_krizi' && choice === 'A') {
    return getMidTierPlayer(squad);
  }

  if (eventId === 'evt_aile' && choice === 'B') {
    return getFamilyIssuePlayer(squad, activeTactics);
  }

  if (eventId === 'evt_diger_kulup' && choice === 'A') {
    return getWeakDepartCandidate(squad);
  }

  const genericRemove: Record<string, 'A' | 'B'> = {
    evt_sakatlik: 'B',
    evt_diger_kulup: 'A',
    evt_emekli: 'B',
    evt_aile: 'B',
    evt_menajer_krizi: 'A',
  };

  if (genericRemove[eventId] === choice) {
    return getWeakestPlayer(squad);
  }

  return null;
}

export function pickEventRatingTarget(
  eventId: string,
  choice: 'A' | 'B',
  squad: PlayerCard[],
): PlayerCard | null {
  if (eventId === 'evt_sakatlik' && choice === 'A') return getStarFieldPlayer(squad);
  if (eventId === 'evt_kaleci_hata' && choice === 'A') return getGoalkeeper(squad);
  if (eventId === 'evt_kaptan' && choice === 'A') {
    return getCaptainPlayer(squad) ?? getStarFieldPlayer(squad);
  }
  return null;
}

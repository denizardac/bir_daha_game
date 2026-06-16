import { EVENT_CARDS } from '@/data/events';
import type { EventCard } from '@/types';
import { createRng, pickOne } from '@/engine/seed';

export type EventDrawContext = {
  streak: number;
  morale: number;
  lossesCount: number;
  squadSize: number;
  maxSquadSize: number;
  round: number;
};

/** Her zaman uygun — filtre boş kalırsa bunlardan seçilir */
const FALLBACK_EVENT_IDS = new Set([
  'evt_formasyon',
  'evt_saha',
  'evt_yagmur',
  'evt_soguk_hava',
  'evt_sicak_hava',
  'evt_deplasman',
  'evt_penalti_antrenman',
  'evt_korner_taktik',
  'evt_ofsayt',
  'evt_kontratak',
  'evt_kirmizi_forma',
  'evt_antrenman_camp',
  'evt_fizyoterapist',
  'evt_doktor',
  'evt_sponsor',
  'evt_tesis',
  'evt_var',
  'evt_hakem_korkusu',
  'evt_rakip_ispiyon',
  'evt_kupa',
  'evt_uzatma',
  'evt_ceza_sahasi',
  'evt_tv_program',
  'evt_derbi',
  'evt_yildiz_sozlesme',
  'evt_sakatlik',
  'evt_yorgunluk',
  'evt_kaleci_hata',
]);

function pickWeighted(rng: () => number, items: EventCard[], weights: number[]): EventCard {
  const total = weights.reduce((s, w) => s + w, 0);
  if (total <= 0) return pickOne(rng, items);
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

/** Olayın mevcut run durumuna göre ağırlığı — 0 = bu turda çıkmaz */
export function getEventDrawWeight(eventId: string, ctx: EventDrawContext): number {
  const { streak, morale, lossesCount, squadSize, maxSquadSize, round } = ctx;
  const squadRoom = squadSize < maxSquadSize;

  switch (eventId) {
    // Düşüş / baskı — galibiyet serisinde anlamsız
    case 'evt_psikolog':
      if (streak >= 2) return 0;
      if (morale < 45) return 3;
      if (streak === 0 && lossesCount >= 1) return 2.5;
      if (morale < 58) return 1.5;
      return 0;

    case 'evt_basin':
      if (streak >= 3) return 0;
      if (streak >= 2 && morale >= 55) return 0;
      if (morale < 50) return 2.5;
      if (lossesCount >= 2) return 2;
      if (streak === 0) return 1.5;
      return 0.6;

    case 'evt_sessiz_stadyum':
      if (streak >= 2) return 0;
      if (morale < 45) return 1.8;
      return 0.7;

    case 'evt_social_media':
      if (streak >= 3) return 0.5;
      if (morale < 50 || streak === 0) return 1.8;
      return 1;

    case 'evt_taraftar':
      if (streak === 0 && morale < 45) return 2;
      if (streak >= 1) return 1.2;
      return 1;

    // Yükseliş / moral — seri varken mantıklı
    case 'evt_bonus':
      if (streak >= 3) return 3;
      if (streak >= 2) return 2.5;
      if (streak >= 1) return 1.8;
      return 0.4;

    case 'evt_taraftar_koreografi':
      if (streak >= 3) return 3;
      if (streak >= 2) return 2;
      return 0.5;

    case 'evt_sampiyonluk_baskisi':
      if (streak >= 4) return 3;
      if (streak >= 2 && round >= 8) return 2;
      if (streak >= 3) return 2;
      return 0;

    case 'evt_efsane_konusma':
      if (streak >= 3) return 2.5;
      if (morale >= 70) return 2;
      if (streak >= 2) return 1.5;
      return 1;

    case 'evt_legend_ziyaret':
      if (streak >= 2 || morale >= 65) return 2;
      return 1;

    case 'evt_moral_boost':
      if (morale < 50) return 2.5;
      if (streak === 0) return 2;
      if (streak >= 3) return 0.6;
      return 1;

    case 'evt_dogum_gunu':
      return streak >= 2 ? 2 : 1;

    // Kadro boyutu
    case 'evt_genc_yetenek':
    case 'evt_scout':
    case 'evt_kiralik':
      return squadRoom ? 2.5 : 0;

    case 'evt_eksik_kadro':
      return squadSize <= maxSquadSize - 2 ? 2 : 0.4;

    case 'evt_transfer_teklif':
      return squadSize >= 7 ? 1.5 : 0.8;

    default:
      return 1;
  }
}

export function filterEventsForDraw(
  events: EventCard[],
  ctx: EventDrawContext,
): { events: EventCard[]; weights: number[] } {
  const weighted = events
    .map((e) => ({ event: e, weight: getEventDrawWeight(e.id, ctx) }))
    .filter((x) => x.weight > 0);

  if (!weighted.length) {
    const fallback = events.filter((e) => FALLBACK_EVENT_IDS.has(e.id));
    const pool = fallback.length ? fallback : events;
    return {
      events: pool,
      weights: pool.map(() => 1),
    };
  }

  return {
    events: weighted.map((x) => x.event),
    weights: weighted.map((x) => x.weight),
  };
}

export function drawEvent(
  seed: string,
  round: number,
  usedIds: string[],
  ctx: EventDrawContext,
): EventCard {
  const rng = createRng(seed, 'event', round);
  let pool = EVENT_CARDS.filter((e) => !usedIds.includes(e.id));
  if (!pool.length) pool = [...EVENT_CARDS];

  const { events, weights } = filterEventsForDraw(pool, ctx);
  return pickWeighted(rng, events, weights);
}

/** Önizleme / test — olayın bu bağlamda çıkıp çıkmayacağı */
export function isEventEligible(eventId: string, ctx: EventDrawContext): boolean {
  return getEventDrawWeight(eventId, ctx) > 0;
}

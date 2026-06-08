import { redCardChanceMultiplier } from '@/engine/tagMechanics';
import type { MatchEvent, PlayerCard } from '@/types';

const OPP_SCORERS = ['Rakip #9', 'Rakip #11', 'Rakip #7', 'Rakip #10', 'Rakip #8'];

function scorerWeight(p: PlayerCard): number {
  let w = p.currentRating;
  if (p.tags.includes('FİNİŞÖR')) w += 18;
  if (['SF', 'OOS', 'SLK', 'SÖK'].includes(p.position)) w += 10;
  if (p.tags.includes('HIZLI')) w += 6;
  return w;
}

function pickGoalMinutes(rng: () => number, count: number): number[] {
  if (count === 0) return [];
  const slots = [12, 18, 24, 31, 38, 44, 52, 58, 67, 74, 81, 88];
  const picked: number[] = [];
  const pool = [...slots];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(rng() * pool.length);
    picked.push(pool.splice(idx, 1)[0]!);
  }
  while (picked.length < count) {
    picked.push(Math.floor(rng() * 85) + 5);
  }
  return picked.sort((a, b) => a - b);
}

function pickWeightedPlayer(rng: () => number, squad: PlayerCard[], exclude?: string): PlayerCard {
  const pool = squad.filter((p) => p.id !== exclude);
  if (!pool.length) return squad[0]!;
  const weights = pool.map(scorerWeight);
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return pool[i]!;
  }
  return pool[pool.length - 1]!;
}

function pickAssist(rng: () => number, squad: PlayerCard[], scorerId: string): string | undefined {
  const pool = squad.filter(
    (p) =>
      p.id !== scorerId &&
      (p.tags.includes('ASİSTÇİ') || p.tags.includes('TEKNİK') || ['OS', 'OOS', 'SLK', 'SÖK'].includes(p.position)),
  );
  if (!pool.length || rng() > 0.62) return undefined;
  return pool[Math.floor(rng() * pool.length)]!.name;
}

/** Maç animasyonu için olay zaman çizelgesi — kırmızı kart cezalı duruma düşürmez */
export function generateMatchEvents(
  rng: () => number,
  squad: PlayerCard[],
  goalsFor: number,
  goalsAgainst: number,
): MatchEvent[] {
  const events: MatchEvent[] = [];
  if (!squad.length) return events;

  const ourMinutes = pickGoalMinutes(rng, goalsFor);
  const theirMinutes = pickGoalMinutes(rng, goalsAgainst);

  for (const minute of ourMinutes) {
    const scorer = pickWeightedPlayer(rng, squad);
    events.push({
      minute,
      type: 'goal_for',
      playerName: scorer.name,
      assistName: pickAssist(rng, squad, scorer.id),
    });
  }

  for (let i = 0; i < goalsAgainst; i++) {
    events.push({
      minute: theirMinutes[i] ?? 30 + i * 15,
      type: 'goal_against',
      playerName: OPP_SCORERS[i % OPP_SCORERS.length]!,
    });
  }

  if (rng() < 0.45) {
    const p = squad[Math.floor(rng() * squad.length)]!;
    events.push({
      minute: Math.floor(rng() * 75) + 8,
      type: 'yellow_for',
      playerName: p.name,
    });
  }

  const redPool = squad.flatMap((p) => {
    const w = redCardChanceMultiplier(p.tags.includes('KIRMIZI KART'));
    return Array.from({ length: w }, () => p);
  });
  if (redPool.length && rng() < 0.12) {
    const p = redPool[Math.floor(rng() * redPool.length)]!;
    events.push({
      minute: Math.floor(rng() * 55) + 25,
      type: 'red_for',
      playerName: p.name,
    });
  }

  if (rng() < 0.35) {
    events.push({
      minute: Math.floor(rng() * 80) + 5,
      type: 'yellow_against',
      playerName: `Rakip #${Math.floor(rng() * 11) + 1}`,
    });
  }

  return events.sort((a, b) => a.minute - b.minute || a.type.localeCompare(b.type));
}

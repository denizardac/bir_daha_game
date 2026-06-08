import type { EventOutcome } from '@/engine/events';

export type EventChoiceTone = 'risky' | 'safe' | 'neutral';

function riskScore(outcome: EventOutcome): number {
  let score = 0;
  if (outcome.nextMatchRisk) score += outcome.nextMatchRisk * 120;
  if (outcome.moraleDelta && outcome.moraleDelta < 0) score += Math.abs(outcome.moraleDelta) * 3;
  if (outcome.removeWeakest) score += 35;
  if (outcome.scoreDelta && outcome.scoreDelta < 0) score += 25;
  return score;
}

function safeScore(outcome: EventOutcome): number {
  let score = 0;
  if (outcome.moraleDelta && outcome.moraleDelta > 0) score += outcome.moraleDelta * 2;
  if (outcome.scoreDelta && outcome.scoreDelta > 0) score += Math.min(outcome.scoreDelta / 10, 15);
  if (!outcome.nextMatchRisk && !outcome.removeWeakest) score += 8;
  return score;
}

export function getEventChoiceTones(previews: { a: EventOutcome; b: EventOutcome }): {
  a: EventChoiceTone;
  b: EventChoiceTone;
} {
  const ra = riskScore(previews.a) - safeScore(previews.a) * 0.5;
  const rb = riskScore(previews.b) - safeScore(previews.b) * 0.5;
  const delta = ra - rb;

  if (Math.abs(delta) < 8) {
    return { a: 'neutral', b: 'neutral' };
  }
  if (delta > 0) return { a: 'risky', b: 'safe' };
  return { a: 'safe', b: 'risky' };
}

export function eventChoiceClass(tone: EventChoiceTone, selected: boolean, dimmed: boolean): string {
  const base = 'event-choice-btn';
  const toneClass = tone === 'risky' ? 'event-choice-btn--risky' : tone === 'safe' ? 'event-choice-btn--safe' : 'event-choice-btn--neutral';
  const stateClass = selected ? ' event-choice-btn--selected' : dimmed ? ' event-choice-btn--dimmed' : '';
  return `${base} ${toneClass}${stateClass}`;
}

export const MATCH_RISK_EXPLAINER =
  'Risk, sonraki maçta rakibin gücünü artırır. Yüksek risk = kaybetme ihtimali yükselir; genelde karşılığında bonus güç veya puan gelir.';

export function formatMatchRiskDelta(risk: number): string {
  const pct = Math.round(risk * 100);
  return `Risk +${pct}% — rakip ~%${pct} güçlenir, sonraki maç zorlaşır`;
}

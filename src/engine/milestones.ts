import type { MatchOutcome } from '@/types';

export interface Milestone {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
}

export function detectMatchMilestones(params: {
  round: number;
  streak: number;
  outcome: MatchOutcome;
  lossesCount: number;
  flawless: boolean;
  maxRounds: number;
  isRunComplete: boolean;
}): Milestone[] {
  const m: Milestone[] = [];
  const { round, streak, outcome, lossesCount, flawless, maxRounds, isRunComplete } = params;

  if (outcome === 'win' && round === 1) {
    m.push({ id: 'ilk_galibiyet', icon: '🏆', title: 'İLK GALİBİYET', subtitle: '+200 puan bonus · Moral +10' });
  }
  if (outcome === 'win' && streak >= 3) {
    m.push({ id: 'serit_3', icon: '⚡', title: 'ŞERİT ×3', subtitle: 'Seri bonusu aktif — galibiyetler daha çok puan' });
  }
  if (outcome === 'win' && streak >= 5) {
    m.push({ id: 'serit_5', icon: '🔥', title: 'EFSANE SERİ', subtitle: '5+ galibiyet serisi — maksimum çarpan' });
  }
  if (isRunComplete && round >= maxRounds) {
    m.push({ id: 'dayanma', icon: '💪', title: 'SÜPER RUN', subtitle: '15 round tamamlandı — DAYANMA bonusu' });
  }
  if (isRunComplete && flawless && lossesCount === 0) {
    m.push({ id: 'namaglup', icon: '🛡️', title: 'NAMAĞLUP', subtitle: 'Hiç oyuncu kaybetmeden bitirdin!' });
  }
  return m;
}

export function mergeMilestones(existing: Milestone[], incoming: Milestone[]): Milestone[] {
  const ids = new Set(existing.map((x) => x.id));
  return [...existing, ...incoming.filter((x) => !ids.has(x.id))];
}

import { buildChallengeUrl } from '@/engine/challenge';
import { formatScore } from '@/engine/scoring';
import type { PlayerCard, RunEndAnalysis } from '@/types';

export type ShareTier = 'gold' | 'silver' | 'bronze' | 'default';

const TIER_LABELS: Record<ShareTier, string> = {
  gold: 'ELİT',
  silver: 'GÜÇLÜ',
  bronze: 'İSTİKRARLI',
  default: 'YOLDA',
};

export function getShareTier(rankPercent: number): ShareTier {
  if (rankPercent >= 90) return 'gold';
  if (rankPercent >= 75) return 'silver';
  if (rankPercent >= 50) return 'bronze';
  return 'default';
}

export function getShareTierLabel(tier: ShareTier): string {
  return TIER_LABELS[tier];
}

export interface ShareCardStats {
  wins: number;
  losses: number;
  synergiesFound: number;
  squadAvg: number;
}

export interface ShareCardOptions {
  score: number;
  analysis: RunEndAnalysis | null;
  displayName: string;
  flawless?: boolean;
  roundsCompleted: number;
  squad?: PlayerCard[];
  stats?: ShareCardStats;
  seed?: string;
  isDailySeed?: boolean;
}

export function buildShareText(opts: ShareCardOptions, challengeUrl?: string): string {
  const hook = opts.score > 0
    ? `${formatScore(opts.score)} puan yaptım. Aynı seed'de geçebilir misin?`
    : `${opts.roundsCompleted} round hayatta kaldım. Aynı seed'de daha iyisini yapabilir misin?`;
  const rankLine = opts.analysis && opts.analysis.totalPlayers > 1
    ? `Sıra: #${opts.analysis.rank}/${opts.analysis.totalPlayers}`
    : 'Skor kaydedildi';
  return ['BİR DAHA', hook, rankLine, challengeUrl ?? '', '#BirDaha']
    .filter(Boolean)
    .join('\n');
}

export function buildChallengeLink(opts: ShareCardOptions, origin = window.location.origin): string | null {
  if (!opts.seed) return null;
  return buildChallengeUrl(origin, { seed: opts.seed, score: opts.score, by: opts.displayName });
}

export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

import type { PlayerCard, RunEndAnalysis } from '@/types';
import { formatScore } from '@/engine/scoring';

export type ShareTier = 'gold' | 'silver' | 'bronze' | 'default';

export function getShareTier(rankPercent: number): ShareTier {
  if (rankPercent >= 90) return 'gold';
  if (rankPercent >= 75) return 'silver';
  if (rankPercent >= 50) return 'bronze';
  return 'default';
}

const TIER_COLORS: Record<ShareTier, { bg: string; accent: string; border: string }> = {
  gold: { bg: '#1a1508', accent: '#fbbf24', border: '#f59e0b' },
  silver: { bg: '#141418', accent: '#d1d5db', border: '#9ca3af' },
  bronze: { bg: '#1a1008', accent: '#d97706', border: '#b45309' },
  default: { bg: '#0a0a0a', accent: '#ef4444', border: '#444' },
};

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
}

function drawPitchSilhouette(ctx: CanvasRenderingContext2D, height: number) {
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.strokeRect(60, height - 320, 480, 260);
  ctx.beginPath();
  ctx.arc(300, height - 190, 50, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(300, height - 320);
  ctx.lineTo(300, height - 60);
  ctx.stroke();
  ctx.restore();
}

export function renderShareCardToCanvas(opts: ShareCardOptions): HTMLCanvasElement {
  const { score, analysis, displayName, flawless, roundsCompleted, squad = [], stats } = opts;
  const rankPercent = analysis?.rankPercent ?? 50;
  const tier = getShareTier(rankPercent);
  const colors = TIER_COLORS[tier];

  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, 600, 720);
  drawPitchSilhouette(ctx, 720);

  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 16, 568, 688);

  ctx.fillStyle = colors.accent;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('BİR DAHA', 40, 56);

  ctx.fillStyle = '#d4d4d4';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('GÜNLÜK SEED MEYDAN OKUMASI', 40, 84);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 68px system-ui, sans-serif';
  ctx.fillText(formatScore(score), 40, 150);

  ctx.fillStyle = '#a3a3a3';
  ctx.font = '19px system-ui, sans-serif';
  if (analysis) {
    ctx.fillText(`Sıra: #${analysis.rank} / ${analysis.totalPlayers}`, 40, 190);
    if (score > 0) {
      const rankLine = analysis.totalPlayers > 1
        ? `Listedeki skorların %${analysis.rankPercent}'ini geçtin`
        : 'Yerel kayıt · canlı sıralama yok';
      ctx.fillText(rankLine, 40, 218);
    } else {
      ctx.fillText(`${roundsCompleted} round hayatta kaldın`, 40, 218);
    }
  } else {
    ctx.fillText(`${displayName} · ${roundsCompleted} round`, 40, 190);
  }

  let y = 264;
  ctx.fillStyle = colors.accent;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('ÖZET', 40, y);
  y += 28;

  ctx.fillStyle = '#e5e5e5';
  ctx.font = '17px system-ui, sans-serif';

  if (analysis?.bestDecision) {
    ctx.fillText(`En iyi: R${analysis.bestDecision.round} ${analysis.bestDecision.cardName}`, 40, y);
    y += 24;
  }
  if (analysis?.synergyStats[0]) {
    const s = analysis.synergyStats[0];
    ctx.fillText(`Sinerji: ${s.icon} ${s.name}${s.points > 0 ? ` (+${s.points})` : ''}`, 40, y);
    y += 24;
  }
  if (flawless) {
    ctx.fillText('Namağlup run', 40, y);
    y += 24;
  }

  if (stats) {
    y += 8;
    ctx.fillStyle = colors.accent;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('İSTATİSTİK', 40, y);
    y += 26;
    ctx.fillStyle = '#d4d4d4';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`${stats.wins} galibiyet · ${stats.losses} kayıp · Ort. ${stats.squadAvg}`, 40, y);
    y += 22;
    ctx.fillText(`${stats.synergiesFound} aktif sinerji · ${roundsCompleted} round`, 40, y);
    y += 28;
  }

  if (squad.length > 0) {
    ctx.fillStyle = colors.accent;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('KADRO', 40, y);
    y += 26;
    ctx.fillStyle = '#e5e5e5';
    ctx.font = '15px system-ui, sans-serif';
    const top = [...squad].sort((a, b) => b.currentRating - a.currentRating).slice(0, 5);
    for (const p of top) {
      ctx.fillText(`${p.position} ${p.name} · ${p.currentRating}`, 40, y);
      y += 22;
    }
    if (squad.length > 5) {
      ctx.fillStyle = '#737373';
      ctx.fillText(`+${squad.length - 5} oyuncu daha`, 40, y);
      y += 22;
    }
  }

  ctx.fillStyle = '#525252';
  ctx.font = 'italic 14px system-ui, sans-serif';
  ctx.fillText('Aynı seed. Farklı sen.', 40, 660);

  ctx.fillStyle = colors.accent;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('BENİ GEÇEBİLİR MİSİN?', 40, 692);

  return canvas;
}

export async function downloadShareCard(opts: ShareCardOptions, filename = 'bir-daha-skor.png'): Promise<void> {
  const canvas = renderShareCardToCanvas(opts);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))), 'image/png');
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyShareCardImage(opts: ShareCardOptions): Promise<boolean> {
  if (!navigator.clipboard?.write) return false;
  const canvas = renderShareCardToCanvas(opts);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))), 'image/png');
  });
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  return true;
}

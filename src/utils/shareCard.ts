import type { PlayerCard, RunEndAnalysis } from '@/types';
import { formatScore } from '@/engine/scoring';
import { buildChallengeUrl } from '@/engine/challenge';
import { POSITION_BADGE } from '@/utils/positionStyle';

export type ShareTier = 'gold' | 'silver' | 'bronze' | 'default';

export function getShareTier(rankPercent: number): ShareTier {
  if (rankPercent >= 90) return 'gold';
  if (rankPercent >= 75) return 'silver';
  if (rankPercent >= 50) return 'bronze';
  return 'default';
}

/** Arayüzde gösterilecek Türkçe tier etiketi ("DEFAULT" yerine "YOLDA") */
export function getShareTierLabel(tier: ShareTier): string {
  return TIER[tier].label;
}

type TierPalette = {
  accent: string;
  accentSoft: string;
  ribbon: string;
  label: string;
};

const TIER: Record<ShareTier, TierPalette> = {
  gold: { accent: '#f6cf6a', accentSoft: 'rgba(246,207,106,0.16)', ribbon: '#a07d2c', label: 'ELİT' },
  silver: { accent: '#d8dee9', accentSoft: 'rgba(216,222,233,0.14)', ribbon: '#7c8794', label: 'GÜÇLÜ' },
  bronze: { accent: '#e0913f', accentSoft: 'rgba(224,145,63,0.14)', ribbon: '#8a5622', label: 'İSTİKRARLI' },
  default: { accent: '#2dd4bf', accentSoft: 'rgba(45,212,191,0.14)', ribbon: '#1c6f66', label: 'YOLDA' },
};

const W = 640;
const H = 800;
const PAD = 40;
const SCALE = 2;

const DISPLAY = "'Barlow Condensed', 'Arial Narrow', system-ui, sans-serif";
const BODY = "'Barlow', system-ui, -apple-system, 'Segoe UI', sans-serif";

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
  /** Kartın altına basılacak meydan okuma seed'i (link üretimi için) */
  seed?: string;
  isDailySeed?: boolean;
}

/** Web fontları yüklenmeden çizersek sistem fontuna düşer — önce bekle */
export async function ensureShareFonts(): Promise<void> {
  try {
    await document.fonts?.ready;
  } catch {
    /* font API yoksa sorun değil, fallback stack devreye girer */
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

/** Etiketli küçük rozet — metin genişliğine göre kutu çizer, toplam genişliği döner */
function drawChip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
  bg: string,
): number {
  ctx.font = `600 15px ${BODY}`;
  const textWidth = ctx.measureText(text).width;
  const w = textWidth + 26;
  const h = 30;
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, 15);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 13, y + h / 2 + 1);
  ctx.textBaseline = 'alphabetic';
  return w;
}

function drawBackground(ctx: CanvasRenderingContext2D, palette: TierPalette) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0d1512');
  bg.addColorStop(0.55, '#0a0f0e');
  bg.addColorStop(1, '#070a0a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Tier ışıması — üst köşeden yumuşak parlama
  const glow = ctx.createRadialGradient(W * 0.78, -40, 20, W * 0.78, -40, 420);
  glow.addColorStop(0, palette.accentSoft);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Saha çizgileri (çok soluk) — alt bant metinlerinin ÜSTÜNE taşmamalı
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = '#7dd3a0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(W / 2, H + 170, 210, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, H - 160);
  ctx.lineTo(W, H - 160);
  ctx.stroke();
  ctx.restore();

  // Çerçeve
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 2;
  roundRect(ctx, 10, 10, W - 20, H - 20, 22);
  ctx.stroke();
}

function drawStatCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  accent: string,
) {
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.font = `600 12px ${BODY}`;
  ctx.fillText(label.toUpperCase(), x + 14, y + 24);

  ctx.fillStyle = accent;
  ctx.font = `800 30px ${DISPLAY}`;
  ctx.fillText(truncate(ctx, value, w - 28), x + 14, y + 58);
}

export function renderShareCardToCanvas(opts: ShareCardOptions): HTMLCanvasElement {
  const { score, analysis, displayName, flawless, roundsCompleted, squad = [], stats } = opts;
  const rankPercent = analysis?.rankPercent ?? 50;
  const tier = getShareTier(rankPercent);
  const palette = TIER[tier];

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = 'alphabetic';

  drawBackground(ctx, palette);

  // ---- Başlık şeridi
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 30px ${DISPLAY}`;
  ctx.fillText('BİR DAHA', PAD, 62);

  ctx.fillStyle = palette.accent;
  ctx.font = `700 13px ${BODY}`;
  const modeLabel = opts.isDailySeed === false ? 'SERBEST MOD' : 'GÜNLÜK SEED';
  const modeWidth = ctx.measureText(modeLabel).width;
  ctx.globalAlpha = 0.9;
  ctx.fillText(modeLabel, W - PAD - modeWidth, 62);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, 82);
  ctx.lineTo(W - PAD, 82);
  ctx.stroke();

  // ---- Oyuncu + skor
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.font = `600 12px ${BODY}`;
  ctx.fillText('TEKNİK DİREKTÖR', PAD, 118);

  ctx.fillStyle = '#ffffff';
  ctx.font = `700 32px ${DISPLAY}`;
  // Türkçe büyütme: "Anonim" → "ANONİM" (JS varsayılanı "ANONIM" verir)
  ctx.fillText(truncate(ctx, displayName.toLocaleUpperCase('tr-TR'), W - PAD * 2 - 120), PAD, 150);

  // Tier rozeti sağ üstte
  const tierChipW = (() => {
    ctx.font = `600 15px ${BODY}`;
    return ctx.measureText(palette.label).width + 26;
  })();
  drawChip(ctx, W - PAD - tierChipW, 124, palette.label, palette.accent, palette.accentSoft);

  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.font = `600 12px ${BODY}`;
  ctx.fillText('FİNAL SKOR', PAD, 190);

  ctx.fillStyle = '#ffffff';
  ctx.font = `800 88px ${DISPLAY}`;
  ctx.fillText(formatScore(score), PAD, 256);

  // Skorun altında tier şeridi
  ctx.fillStyle = palette.ribbon;
  roundRect(ctx, PAD, 270, 96, 5, 3);
  ctx.fill();

  // ---- Sıralama + yüzdelik
  let y = 308;
  if (analysis && analysis.totalPlayers > 1) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `600 16px ${BODY}`;
    ctx.fillText(`Sıra #${analysis.rank} / ${analysis.totalPlayers}`, PAD, y);

    // "en iyi %X" yalnızca gerçekten üst yarıdaysa — aksi halde övgü yanıltıcı olur
    if (rankPercent >= 50) {
      const pctText = `en iyi %${Math.max(1, 100 - rankPercent)}`;
      ctx.fillStyle = palette.accent;
      const pw = ctx.measureText(pctText).width;
      ctx.fillText(pctText, W - PAD - pw, y);
    }

    // yüzdelik bar
    const barY = y + 14;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, PAD, barY, W - PAD * 2, 6, 3);
    ctx.fill();
    ctx.fillStyle = palette.accent;
    roundRect(ctx, PAD, barY, Math.max(10, ((W - PAD * 2) * rankPercent) / 100), 6, 3);
    ctx.fill();
    y = barY + 34;
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `600 16px ${BODY}`;
    ctx.fillText(`${roundsCompleted} round tamamlandı`, PAD, y);
    y += 34;
  }

  // ---- Rozetler (namağlup / süper run / elit skor)
  const badges = [...(analysis?.badges ?? [])];
  if (flawless && !badges.includes('NAMAĞLUP')) badges.unshift('NAMAĞLUP');
  if (badges.length) {
    let bx = PAD;
    for (const badge of badges.slice(0, 3)) {
      const bw = drawChip(ctx, bx, y, badge, palette.accent, 'rgba(255,255,255,0.04)');
      bx += bw + 8;
      if (bx > W - PAD - 80) break;
    }
    y += 44;
  }

  // ---- İstatistik ızgarası (2x2)
  const cellW = (W - PAD * 2 - 12) / 2;
  const cellH = 70;
  const g = stats;
  drawStatCell(ctx, PAD, y, cellW, cellH, 'Karne', `${g?.wins ?? 0}G ${g?.losses ?? 0}M`, '#ffffff');
  drawStatCell(ctx, PAD + cellW + 12, y, cellW, cellH, 'Round', String(roundsCompleted), '#ffffff');
  y += cellH + 12;
  drawStatCell(ctx, PAD, y, cellW, cellH, 'Kadro ortalaması', String(g?.squadAvg ?? '-'), '#ffffff');
  drawStatCell(ctx, PAD + cellW + 12, y, cellW, cellH, 'Aktif sinerji', String(g?.synergiesFound ?? 0), palette.accent);
  y += cellH + 24;

  // Alt bant çizgisi burada — içerik bunun üstünde kalmalı
  const footerTop = H - 96;

  // ---- Öne çıkan an
  const highlight = analysis?.bestDecision
    ? `R${analysis.bestDecision.round} · ${analysis.bestDecision.cardName}`
    : analysis?.synergyStats.find((s) => s.activations > 0)?.name ?? null;
  if (highlight && y + 34 <= footerTop) {
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.font = `600 12px ${BODY}`;
    ctx.fillText(analysis?.bestDecision ? 'EN İYİ KARAR' : 'ÖNE ÇIKAN SİNERJİ', PAD, y);
    ctx.fillStyle = '#e8ede9';
    ctx.font = `600 19px ${BODY}`;
    ctx.fillText(truncate(ctx, highlight, W - PAD * 2), PAD, y + 26);
    y += 48;
  }

  // ---- Kadro şeridi (yalnızca alt banda çarpmıyorsa)
  const chipH = 56;
  const top = [...squad].sort((a, b) => b.currentRating - a.currentRating).slice(0, 4);
  if (top.length && y + 16 + chipH <= footerTop - 8) {
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.font = `600 12px ${BODY}`;
    ctx.fillText('KADRONUN BELKEMİĞİ', PAD, y);
    y += 16;

    const chipW = (W - PAD * 2 - 18) / 4;
    for (let i = 0; i < top.length; i++) {
      const p = top[i]!;
      const cx = PAD + i * (chipW + 6);
      ctx.fillStyle = 'rgba(255,255,255,0.035)';
      roundRect(ctx, cx, y, chipW, chipH, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = palette.accent;
      ctx.font = `800 21px ${DISPLAY}`;
      ctx.fillText(String(p.currentRating), cx + 10, y + 26);

      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = `600 11px ${BODY}`;
      ctx.fillText(POSITION_BADGE[p.position] ?? p.position, cx + 42, y + 25);

      ctx.fillStyle = '#cfd8d2';
      ctx.font = `500 12px ${BODY}`;
      ctx.fillText(truncate(ctx, p.name, chipW - 20), cx + 10, y + 45);
    }
  }

  // ---- Alt bant
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, H - 96);
  ctx.lineTo(W - PAD, H - 96);
  ctx.stroke();

  ctx.fillStyle = palette.accent;
  ctx.font = `800 26px ${DISPLAY}`;
  ctx.fillText('BENİ GEÇEBİLİR MİSİN?', PAD, H - 58);

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = `500 14px ${BODY}`;
  ctx.fillText('Aynı seed. Farklı sen.', PAD, H - 34);

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = `600 14px ${BODY}`;
  const site = 'birdaha.tech';
  ctx.fillText(site, W - PAD - ctx.measureText(site).width, H - 34);

  return canvas;
}

async function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))), 'image/png');
  });
}

/** Paylaşım metni — meydan okuma linki dahil */
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

export async function downloadShareCard(opts: ShareCardOptions, filename = 'bir-daha-skor.png'): Promise<void> {
  await ensureShareFonts();
  const blob = await toBlob(renderShareCardToCanvas(opts));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyShareCardImage(opts: ShareCardOptions): Promise<boolean> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') return false;
  await ensureShareFonts();
  const blob = await toBlob(renderShareCardToCanvas(opts));
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  return true;
}

export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export type ShareResult = 'shared' | 'cancelled' | 'unsupported' | 'failed';

/**
 * Mobil native paylaşım: önce görsel + metin, dosya paylaşımı desteklenmiyorsa
 * yalnızca metin + link. Kullanıcı iptal ederse 'cancelled' döner (hata değil).
 */
export async function shareShareCard(opts: ShareCardOptions): Promise<ShareResult> {
  if (!canNativeShare()) return 'unsupported';

  const challengeUrl = buildChallengeLink(opts) ?? undefined;
  const text = buildShareText(opts, challengeUrl);

  try {
    await ensureShareFonts();
    const blob = await toBlob(renderShareCardToCanvas(opts));
    const file = new File([blob], 'bir-daha-skor.png', { type: 'image/png' });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text, title: 'Bir Daha' });
      return 'shared';
    }

    await navigator.share({ text, title: 'Bir Daha', url: challengeUrl });
    return 'shared';
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
    return 'failed';
  }
}

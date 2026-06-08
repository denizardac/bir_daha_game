import type { CSSProperties } from 'react';
import type { Position, Rarity } from '@/types';

export type PlayerCardTheme = {
  key: string;
  background: string;
  border: string;
  glow: string;
  accent: string;
  positionAccent: string;
  labelColor: string;
  insightBg: string;
  insightBorder: string;
};

/** Rarity sınıfı — kartın üst katman tonu */
const RARITY_PROFILE: Record<Rarity, { hue: number; sat: number; light: number; accent: string; label: string }> = {
  normal: { hue: 220, sat: 10, light: 11, accent: '#71717a', label: '#a1a1aa' },
  iyi: { hue: 205, sat: 28, light: 13, accent: '#94a3b8', label: '#e2e8f0' },
  güçlü: { hue: 38, sat: 72, light: 14, accent: '#f59e0b', label: '#fde68a' },
  efsane: { hue: 350, sat: 82, light: 15, accent: '#ef4444', label: '#fecaca' },
};

/** Mevki hattı — kartın alt/yan katman tonu */
const POSITION_PROFILE: Record<Position, { hue: number; sat: number; accent: string }> = {
  KL: { hue: 48, sat: 62, accent: '#eab308' },
  STP: { hue: 217, sat: 64, accent: '#3b82f6' },
  SLB: { hue: 231, sat: 58, accent: '#6366f1' },
  SÖB: { hue: 244, sat: 54, accent: '#818cf8' },
  DOS: { hue: 142, sat: 52, accent: '#22c55e' },
  OS: { hue: 172, sat: 56, accent: '#14b8a6' },
  SLK: { hue: 6, sat: 68, accent: '#ef4444' },
  SÖK: { hue: 26, sat: 66, accent: '#f97316' },
  OOS: { hue: 318, sat: 58, accent: '#ec4899' },
  SF: { hue: 346, sat: 72, accent: '#e11d48' },
};

export const ALL_RARITIES: Rarity[] = ['normal', 'iyi', 'güçlü', 'efsane'];

export const ALL_POSITIONS: Position[] = [
  'KL', 'STP', 'SLB', 'SÖB', 'DOS', 'OS', 'SLK', 'SÖK', 'OOS', 'SF',
];

function mixHue(r: number, p: number, rWeight = 0.44): number {
  const a = (r * Math.PI) / 180;
  const b = (p * Math.PI) / 180;
  const x = rWeight * Math.cos(a) + (1 - rWeight) * Math.cos(b);
  const y = rWeight * Math.sin(a) + (1 - rWeight) * Math.sin(b);
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return ((deg % 360) + 360) % 360;
}

function buildComboTheme(rarity: Rarity, position: Position): PlayerCardTheme {
  const r = RARITY_PROFILE[rarity];
  const p = POSITION_PROFILE[position];
  const hue = Math.round(mixHue(r.hue, p.hue));
  const sat = Math.round(Math.min(78, r.sat * 0.5 + p.sat * 0.5));
  const light = r.light;

  const background = [
    `linear-gradient(152deg,`,
    `hsla(${Math.round(r.hue)}, ${Math.min(r.sat + 18, 75)}%, ${light + 4}%, 0.55) 0%,`,
    `hsla(${Math.round(p.hue)}, ${Math.min(p.sat + 12, 72)}%, ${light + 2}%, 0.42) 42%,`,
    `hsla(${hue}, ${sat}%, ${Math.max(5, light - 6)}%, 0.35) 68%,`,
    `#080808 100%)`,
  ].join(' ');

  const border = `hsla(${hue}, ${Math.min(sat + 8, 70)}%, ${light + 22}%, 0.55)`;
  const glow = `hsla(${hue}, ${sat}%, ${light + 10}%, 0.28)`;

  return {
    key: `${rarity}-${position}`,
    background,
    border,
    glow,
    accent: r.accent,
    positionAccent: p.accent,
    labelColor: r.label,
    insightBg: `hsla(${hue}, ${sat * 0.6}%, 6%, 0.72)`,
    insightBorder: `hsla(${hue}, ${sat * 0.45}%, 22%, 0.35)`,
  };
}

/** 4 rarity × 10 mevki = 40 benzersiz tema */
export const PLAYER_CARD_THEMES: Record<Rarity, Record<Position, PlayerCardTheme>> = ALL_RARITIES.reduce(
  (acc, rarity) => {
    acc[rarity] = ALL_POSITIONS.reduce((inner, position) => {
      inner[position] = buildComboTheme(rarity, position);
      return inner;
    }, {} as Record<Position, PlayerCardTheme>);
    return acc;
  },
  {} as Record<Rarity, Record<Position, PlayerCardTheme>>,
);

export function getPlayerCardTheme(rarity: Rarity, position: Position): PlayerCardTheme {
  return PLAYER_CARD_THEMES[rarity][position];
}

export function getPlayerCardThemeVars(rarity: Rarity, position: Position): CSSProperties {
  const t = getPlayerCardTheme(rarity, position);
  return {
    '--pc-bg': t.background,
    '--pc-border': t.border,
    '--pc-glow': t.glow,
    '--pc-accent': t.accent,
    '--pc-pos-accent': t.positionAccent,
    '--pc-label': t.labelColor,
    '--pc-insight-bg': t.insightBg,
    '--pc-insight-border': t.insightBorder,
  } as CSSProperties;
}

export function getPlayerCardThemeClass(rarity: Rarity, position: Position): string {
  const pos = position.replace('Ö', 'O');
  return `player-pick-card--${rarity}-${pos}`;
}

export const PLAYER_CARD_THEME_COUNT = ALL_RARITIES.length * ALL_POSITIONS.length;

export function getRarityProfile(rarity: Rarity) {
  return RARITY_PROFILE[rarity];
}

export function getPositionProfile(position: Position) {
  return POSITION_PROFILE[position];
}

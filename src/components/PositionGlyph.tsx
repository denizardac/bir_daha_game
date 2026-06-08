import type { Position, Tag } from '@/types';
import { POSITION_COLORS } from '@/utils/positionStyle';

const TAG_ACCENT: Partial<Record<Tag, string>> = {
  HIZLI: '#f97316',
  GÜÇLÜ: '#ef4444',
  TEKNİK: '#22d3ee',
  FİNİŞÖR: '#f43f5e',
  ASİSTÇİ: '#34d399',
  YERLİ: '#4ade80',
  POTANSİYEL: '#2dd4bf',
  LİDER: '#fbbf24',
  DAYANIKLI: '#60a5fa',
  MENTOR: '#c084fc',
};

type Zone = 'kaleci' | 'savunma' | 'orta' | 'hucum';

const POSITION_ZONE: Record<Position, Zone> = {
  KL: 'kaleci',
  STP: 'savunma',
  SLB: 'savunma',
  SÖB: 'savunma',
  DOS: 'orta',
  OS: 'orta',
  OOS: 'orta',
  SLK: 'hucum',
  SÖK: 'hucum',
  SF: 'hucum',
};

interface Props {
  position: Position;
  className?: string;
  /** xs/sm portrelerde sade forma — üstüne sembol yok */
  compact?: boolean;
}

function zoneStripes(zone: Zone): { y: number; w: number }[] {
  switch (zone) {
    case 'kaleci':
      return [{ y: 17, w: 10 }];
    case 'savunma':
      return [
        { y: 14.5, w: 11 },
        { y: 17.5, w: 11 },
      ];
    case 'orta':
      return [{ y: 16, w: 9 }];
    case 'hucum':
      return [{ y: 15, w: 8 }];
    default:
      return [];
  }
}

/** Temiz forma silueti — mevki rengi + bölge çizgileri, üstüne sembol yok */
export function PositionGlyph({ position, className = '', compact = false }: Props) {
  const color = POSITION_COLORS[position];
  const zone = POSITION_ZONE[position];
  const stripes = zoneStripes(zone);
  const gradId = `jersey-${position}`;

  return (
    <svg
      className={`position-glyph ${className}`}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="16" y1="5" x2="16" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="55%" stopColor={color} stopOpacity="0.88" />
          <stop offset="100%" stopColor={color} stopOpacity="0.62" />
        </linearGradient>
        <linearGradient id={`${gradId}-shade`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000" stopOpacity="0.22" />
          <stop offset="35%" stopColor="#000" stopOpacity="0" />
          <stop offset="65%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
      </defs>

      {/* Forma gövdesi */}
      <path
        d="M11.5 7.5 C11.5 7.5 13.2 5.8 16 5.8 C18.8 5.8 20.5 7.5 20.5 7.5 L22.8 10.2 L23.5 12.2 L21.8 13.2 V24.2 H10.2 V13.2 L8.5 12.2 L9.2 10.2 Z"
        fill={`url(#${gradId})`}
        stroke={color}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />

      {/* Yan gölge — derinlik */}
      <path
        d="M11.5 7.5 C11.5 7.5 13.2 5.8 16 5.8 C18.8 5.8 20.5 7.5 20.5 7.5 L22.8 10.2 L23.5 12.2 L21.8 13.2 V24.2 H10.2 V13.2 L8.5 12.2 L9.2 10.2 Z"
        fill={`url(#${gradId}-shade)`}
      />

      {/* V yaka */}
      <path
        d="M13.2 8.2 L16 11.2 L18.8 8.2"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Kol kıvrımı */}
      <path d="M8.5 12.2 L10.2 13.2" stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M23.5 12.2 L21.8 13.2" stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" strokeLinecap="round" />

      {/* Bölge çizgileri — forma deseni, ayrı sembol değil */}
      {!compact &&
        stripes.map(({ y, w }) => (
          <line
            key={y}
            x1={16 - w / 2}
            y1={y}
            x2={16 + w / 2}
            y2={y}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        ))}

      {/* Kaleci: omuz vurgusu */}
      {zone === 'kaleci' && (
        <>
          <path d="M9.2 10.2 L11.5 7.5" stroke="rgba(255,255,255,0.25)" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M22.8 10.2 L20.5 7.5" stroke="rgba(255,255,255,0.25)" strokeWidth="0.9" strokeLinecap="round" />
        </>
      )}

      {/* Etek çizgisi */}
      <path d="M10.2 24.2 H21.8" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

export function getPositionZoneColor(position: Position): string {
  return POSITION_COLORS[position];
}

export function getTagAccentColor(tag: Tag | undefined): string | null {
  if (!tag) return null;
  return TAG_ACCENT[tag] ?? null;
}

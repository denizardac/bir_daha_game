import type { ReactNode, SVGProps } from 'react';

export type UiIconName =
  | 'alert-triangle'
  | 'archive'
  | 'arrow-left'
  | 'arrow-right'
  | 'ban'
  | 'bell'
  | 'book-open'
  | 'briefcase'
  | 'building'
  | 'bus'
  | 'calendar'
  | 'camera'
  | 'card'
  | 'chart'
  | 'check'
  | 'circle-dot'
  | 'clipboard'
  | 'clock'
  | 'cloud-rain'
  | 'coffee'
  | 'dice'
  | 'door'
  | 'droplet'
  | 'eye'
  | 'flag'
  | 'flame'
  | 'globe'
  | 'graduation-cap'
  | 'heart'
  | 'heart-crack'
  | 'home'
  | 'info'
  | 'lightbulb'
  | 'lock'
  | 'map'
  | 'medal'
  | 'megaphone'
  | 'message'
  | 'minus'
  | 'money'
  | 'moon'
  | 'pen'
  | 'plane'
  | 'play'
  | 'plus'
  | 'refresh'
  | 'ruler'
  | 'scale'
  | 'search'
  | 'settings'
  | 'shield'
  | 'shirt'
  | 'snowflake'
  | 'sparkles'
  | 'square'
  | 'star'
  | 'sun'
  | 'tag'
  | 'target'
  | 'thermometer'
  | 'trending-down'
  | 'trophy'
  | 'tv'
  | 'user'
  | 'users'
  | 'wind'
  | 'x'
  | 'zap';

type UiIconProps = SVGProps<SVGSVGElement> & {
  name: UiIconName;
  title?: string;
};

const paths: Record<UiIconName, ReactNode> = {
  'alert-triangle': (
    <>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  archive: (
    <>
      <path d="M4 7h16" />
      <path d="M6 7v12h12V7" />
      <path d="M8 3h8l2 4H6z" />
      <path d="M10 11h4" />
    </>
  ),
  'arrow-left': (
    <>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </>
  ),
  'arrow-right': (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  ban: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m5.6 5.6 12.8 12.8" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 1 0-12 0c0 6-3 7-3 7h18s-3-1-3-7" />
      <path d="M10.3 21a2 2 0 0 0 3.4 0" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </>
  ),
  building: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" />
    </>
  ),
  bus: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
      <circle cx="7.5" cy="18.5" r="1.5" />
      <circle cx="16.5" cy="18.5" r="1.5" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </>
  ),
  'book-open': (
    <>
      <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20v17H7.5A3.5 3.5 0 0 0 4 22z" />
      <path d="M4 5.5A3.5 3.5 0 0 0 .5 2H4" />
      <path d="M12 2v17" />
      <path d="M16 7h1.5" />
      <path d="M16 11h1.5" />
    </>
  ),
  calendar: (
    <>
      <path d="M7 2v4" />
      <path d="M17 2v4" />
      <rect x="3" y="4" width="18" height="17" rx="3" />
      <path d="M3 9h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <rect x="7" y="11" width="2.8" height="5" rx="1" />
      <rect x="11" y="7" width="2.8" height="9" rx="1" />
      <rect x="15" y="9" width="2.8" height="7" rx="1" />
    </>
  ),
  check: <path d="M5 13l4 4L19 7" />,
  'circle-dot': (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4a3 3 0 0 1 6 0" />
      <path d="M9 8h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  'cloud-rain': (
    <>
      <path d="M17 15a4 4 0 0 0-.9-7.9 5.5 5.5 0 0 0-10.5 1.6A3.5 3.5 0 0 0 6 15" />
      <path d="M8 18v2M12 18v3M16 18v2" />
    </>
  ),
  coffee: (
    <>
      <path d="M4 8h13v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
      <path d="M17 9h2a2.5 2.5 0 0 1 0 5h-2" />
      <path d="M7 3v2M11 3v2" />
    </>
  ),
  dice: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      <circle cx="15" cy="9" r="1" fill="currentColor" />
      <circle cx="9" cy="15" r="1" fill="currentColor" />
      <circle cx="15" cy="15" r="1" fill="currentColor" />
    </>
  ),
  door: (
    <>
      <path d="M5 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17" />
      <path d="M3 21h18" />
      <circle cx="13" cy="12.5" r="1" />
    </>
  ),
  droplet: (
    <path d="M12 3s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10z" />
  ),
  eye: (
    <>
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h11l-1.7 3.3L16 11H5" />
    </>
  ),
  flame: (
    <>
      <path d="M12 22c4.2-1.4 6-4.2 6-7.2 0-3.6-2.2-5.8-4.2-8.1-.7 2.3-2 3.8-3.8 5.1.2-3.4-1.1-5.8-3.2-7.8C5.7 7.5 6 9.9 4.6 12.3 3.7 13.8 3.4 15.7 4 17.5 5 20.4 8.1 22 12 22z" />
      <path d="M12 18c1.5-.7 2.2-1.7 2.2-3 0-1.1-.5-2-1.3-2.9-.5 1-1.1 1.7-2 2.3 0-1.3-.4-2.3-1.2-3.1-.2 1.7-.9 2.8-1.2 3.9-.4 1.5.7 2.6 3.5 2.8z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21" />
      <path d="M12 3c-2.3 2.5-3.5 5.5-3.5 9s1.2 6.5 3.5 9" />
    </>
  ),
  'graduation-cap': (
    <>
      <path d="M3 9 12 4l9 5-9 5z" />
      <path d="M7 12v4c2.8 2 7.2 2 10 0v-4" />
      <path d="M21 9v6" />
    </>
  ),
  heart: (
    <path d="M20.5 8.7c0 5.1-8.5 10.3-8.5 10.3S3.5 13.8 3.5 8.7A4.7 4.7 0 0 1 12 6a4.7 4.7 0 0 1 8.5 2.7z" />
  ),
  'heart-crack': (
    <>
      <path d="M20.5 8.7c0 5.1-8.5 10.3-8.5 10.3S3.5 13.8 3.5 8.7A4.7 4.7 0 0 1 12 6a4.7 4.7 0 0 1 8.5 2.7z" />
      <path d="m12 6-2 4 3 2-2 4" />
    </>
  ),
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </>
  ),
  lightbulb: (
    <>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M8.5 15.5c-1.5-1.2-2.5-3-2.5-5A6 6 0 0 1 18 10.5c0 2-1 3.8-2.5 5-.8.7-.9 1.1-.9 2.5H9.4c0-1.4-.1-1.8-.9-2.5z" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10.5" width="16" height="9.5" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
      <circle cx="12" cy="15.2" r="1" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5z" />
      <path d="M9 4v13M15 6.5v13" />
    </>
  ),
  medal: (
    <>
      <path d="m8 2 4 6 4-6" />
      <path d="M8 2h8" />
      <circle cx="12" cy="14" r="5" />
      <path d="m10.6 14.1 1 1 2-2.2" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 10v4a1 1 0 0 0 1 1h3l8 4V5L8 9H5a1 1 0 0 0-1 1z" />
      <path d="M19 9.5a3 3 0 0 1 0 5" />
    </>
  ),
  message: (
    <>
      <path d="M20 15a2 2 0 0 1-2 2H8l-4 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  money: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 10v4M18 10v4" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />,
  pen: (
    <>
      <path d="M4 20h4l10-10a2.8 2.8 0 0 0-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  plane: (
    <path d="M10.5 21 12 15l7.5 2 1.5-2-7-4.5 1-6.5-2-1-3 6-5.5-1L3 9.5l5 3-.5 5z" />
  ),
  play: <path d="M8 5v14l11-7z" fill="currentColor" stroke="none" />,
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 0 1-13.7 5.7" />
      <path d="M4 12A8 8 0 0 1 17.7 6.3" />
      <path d="M17 2v5h-5" />
      <path d="M7 22v-5h5" />
    </>
  ),
  ruler: (
    <>
      <path d="M3 15 15 3l6 6L9 21z" />
      <path d="m7 11 2 2M10 8l2 2M13 5l2 2" />
    </>
  ),
  scale: (
    <>
      <path d="M12 3v18" />
      <path d="M7 21h10" />
      <path d="M5 7h14" />
      <path d="M5 7 2 13h6z" />
      <path d="M19 7l-3 6h6z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3.4-.2-.1a1.7 1.7 0 0 0-2 .3l-.4.2-3.2-1.9-.1-.5a1.7 1.7 0 0 0-1.7-1.1h-.4l-1.8 3.1-3.4-2 .1-.2a1.7 1.7 0 0 0-.3-2l-.2-.3 1.9-3.2.5-.1a1.7 1.7 0 0 0 1.1-1.7v-.4L4.6 8.6l2-3.4.2.1a1.7 1.7 0 0 0 2-.3l.4-.2 3.2 1.9.1.5a1.7 1.7 0 0 0 1.7 1.1h.4l1.8-3.1 3.4 2-.1.2a1.7 1.7 0 0 0 .3 2l.2.3-1.9 3.2z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 20 6v6c0 4.8-3.3 7.9-8 9-4.7-1.1-8-4.2-8-9V6z" />
      <path d="m9.5 12 1.8 1.8 3.6-4" />
    </>
  ),
  shirt: (
    <path d="M8 3 4 6l2 3 2-1.4V21h8V7.6L18 9l2-3-4-3-1.5 1.5a3 3 0 0 1-5 0z" />
  ),
  snowflake: (
    <>
      <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
      <path d="m9.5 5 2.5 2.5L14.5 5M9.5 19l2.5-2.5 2.5 2.5" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.5 4.3L18 9l-4.5 1.7L12 15l-1.5-4.3L6 9l4.5-1.7z" />
      <path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8z" />
      <path d="m19 15 .6 1.7 1.7.6-1.7.6L19 20l-.6-1.7-1.7-.6 1.7-.6z" />
    </>
  ),
  square: <rect x="5" y="4" width="14" height="16" rx="2" />,
  star: (
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.2-5.4-2.9-5.4 2.9 1-6.2L3.2 9.5l6.1-.9z" />
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  tag: (
    <>
      <path d="M20 13 13 20 4 11V4h7z" />
      <circle cx="8.5" cy="8.5" r="1.3" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  thermometer: (
    <>
      <path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z" />
      <circle cx="12" cy="18" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  'trending-down': (
    <>
      <path d="m22 17-8-8-4 4-7-7" />
      <path d="M16 17h6v-6" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v4a4 4 0 0 1-8 0z" />
      <path d="M8 6H4a3 3 0 0 0 3 5" />
      <path d="M16 6h4a3 3 0 0 1-3 5" />
      <path d="M12 12v5" />
      <path d="M8 21h8" />
      <path d="M9 17h6" />
    </>
  ),
  tv: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="m8 3 4 3 4-3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 5.2a3.5 3.5 0 0 1 0 5.6" />
      <path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
    </>
  ),
  wind: (
    <>
      <path d="M3 8h10a2.5 2.5 0 1 0-2.5-2.5" />
      <path d="M3 12h13a2.5 2.5 0 1 1-2.5 2.5" />
      <path d="M3 16h7" />
    </>
  ),
  x: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  zap: <path d="M13 2 4 14h7l-1 8 10-13h-7z" />,
};

export function UiIcon({ name, className, title, ...props }: UiIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ? `ui-icon ${className}` : 'ui-icon'}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title && <title>{title}</title>}
      {paths[name]}
    </svg>
  );
}

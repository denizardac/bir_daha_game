import type { ReactNode, SVGProps } from 'react';

export type UiIconName =
  | 'alert-triangle'
  | 'archive'
  | 'arrow-right'
  | 'book-open'
  | 'calendar'
  | 'chart'
  | 'check'
  | 'circle-dot'
  | 'clipboard'
  | 'dice'
  | 'flame'
  | 'globe'
  | 'graduation-cap'
  | 'heart'
  | 'heart-crack'
  | 'info'
  | 'lightbulb'
  | 'medal'
  | 'minus'
  | 'play'
  | 'refresh'
  | 'settings'
  | 'shield'
  | 'shirt'
  | 'sparkles'
  | 'tag'
  | 'trending-down'
  | 'trophy'
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
  'arrow-right': (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
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
  dice: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      <circle cx="15" cy="9" r="1" fill="currentColor" />
      <circle cx="9" cy="15" r="1" fill="currentColor" />
      <circle cx="15" cy="15" r="1" fill="currentColor" />
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
  medal: (
    <>
      <path d="m8 2 4 6 4-6" />
      <path d="M8 2h8" />
      <circle cx="12" cy="14" r="5" />
      <path d="m10.6 14.1 1 1 2-2.2" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  play: <path d="M8 5v14l11-7z" fill="currentColor" stroke="none" />,
  refresh: (
    <>
      <path d="M20 12a8 8 0 0 1-13.7 5.7" />
      <path d="M4 12A8 8 0 0 1 17.7 6.3" />
      <path d="M17 2v5h-5" />
      <path d="M7 22v-5h5" />
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
  sparkles: (
    <>
      <path d="m12 3 1.5 4.3L18 9l-4.5 1.7L12 15l-1.5-4.3L6 9l4.5-1.7z" />
      <path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8z" />
      <path d="m19 15 .6 1.7 1.7.6-1.7.6L19 20l-.6-1.7-1.7-.6 1.7-.6z" />
    </>
  ),
  tag: (
    <>
      <path d="M20 13 13 20 4 11V4h7z" />
      <circle cx="8.5" cy="8.5" r="1.3" />
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

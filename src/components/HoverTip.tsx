import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface Props {
  tip: string;
  children: ReactNode;
  className?: string;
  placement?: 'top' | 'bottom' | 'auto';
}

type TipPlace = 'top' | 'bottom';

/** Hover / focus — viewport içinde kalır (portal + fixed) */
export function HoverTip({ tip, children, className = '', placement = 'auto' }: Props) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number; place: TipPlace } | null>(null);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    let place: TipPlace = 'top';
    if (placement === 'bottom') place = 'bottom';
    else if (placement === 'top') place = 'top';
    else place = spaceBelow >= 72 || spaceBelow >= spaceAbove ? 'bottom' : 'top';

    const x = Math.min(Math.max(rect.left + rect.width / 2, 88), window.innerWidth - 88);
    const y = place === 'top' ? rect.top - 8 : rect.bottom + 8;
    setPos({ x, y, place });
  }, [placement]);

  const show = () => {
    updatePosition();
    setVisible(true);
  };

  const hide = () => setVisible(false);

  return (
    <>
      <span
        ref={triggerRef}
        className={`hover-tip ${className}`.trim()}
        tabIndex={0}
        aria-label={tip}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </span>

      {visible && pos && createPortal(
        <span
          className={`hover-tip-popup hover-tip-popup--fixed hover-tip-popup--${pos.place}`}
          style={{
            left: pos.x,
            top: pos.y,
            transform: pos.place === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
          }}
          role="tooltip"
        >
          {tip}
        </span>,
        document.body,
      )}
    </>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface Props {
  tip: ReactNode;
  children: ReactNode;
  className?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  ariaLabel?: string;
  stopPropagation?: boolean;
}

type TipPlace = 'top' | 'bottom' | 'left' | 'right';

/** Hover / focus — viewport içinde kalır (portal + fixed) */
export function HoverTip({ tip, children, className = '', placement = 'auto', ariaLabel, stopPropagation = true }: Props) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number; place: TipPlace } | null>(null);

  const isTouchLike = useCallback(() => (
    typeof window !== 'undefined'
      && window.matchMedia?.('(hover: none), (pointer: coarse)').matches
  ), []);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;

    let place: TipPlace = 'top';
    if (placement === 'bottom') place = 'bottom';
    else if (placement === 'top') place = 'top';
    else if (placement === 'left') place = 'left';
    else if (placement === 'right') place = 'right';
    else {
      const maxSide = Math.max(spaceLeft, spaceRight);
      if (maxSide >= 160 && maxSide >= spaceBelow && maxSide >= spaceAbove) {
        place = spaceRight >= spaceLeft ? 'right' : 'left';
      } else {
        place = spaceBelow >= 72 || spaceBelow >= spaceAbove ? 'bottom' : 'top';
      }
    }

    let x = rect.left + rect.width / 2;
    let y = rect.top + rect.height / 2;
    if (place === 'top') {
      x = Math.min(Math.max(rect.left + rect.width / 2, 88), window.innerWidth - 88);
      y = rect.top - 8;
    } else if (place === 'bottom') {
      x = Math.min(Math.max(rect.left + rect.width / 2, 88), window.innerWidth - 88);
      y = rect.bottom + 8;
    } else if (place === 'left') {
      x = rect.left - 10;
      y = Math.min(Math.max(rect.top + rect.height / 2, 48), window.innerHeight - 48);
    } else {
      x = rect.right + 10;
      y = Math.min(Math.max(rect.top + rect.height / 2, 48), window.innerHeight - 48);
    }
    setPos({ x, y, place });
  }, [placement]);

  const show = () => {
    updatePosition();
    setVisible(true);
  };

  const hide = () => setVisible(false);

  useEffect(() => {
    if (!visible) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || popupRef.current?.contains(target)) return;
      hide();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide();
    };

    const onViewportChange = () => updatePosition();

    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [updatePosition, visible]);

  return (
    <>
      <span
        ref={triggerRef}
        className={`hover-tip ${className}`.trim()}
        tabIndex={0}
        aria-label={ariaLabel ?? (typeof tip === 'string' ? tip : undefined)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          if (!isTouchLike()) return;
          e.preventDefault();
          if (visible) hide();
          else show();
        }}
        onMouseDown={(e) => { if (stopPropagation) e.stopPropagation(); }}
      >
        {children}
      </span>

      {visible && pos && createPortal(
        <div
          ref={popupRef}
          className={`hover-tip-popup hover-tip-popup--fixed hover-tip-popup--${pos.place}`}
          style={{
            left: pos.x,
            top: pos.y,
            transform:
              pos.place === 'top'
                ? 'translate(-50%, -100%)'
                : pos.place === 'bottom'
                  ? 'translate(-50%, 0)'
                  : pos.place === 'left'
                    ? 'translate(-100%, -50%)'
                    : 'translate(0, -50%)',
          }}
          role="tooltip"
        >
          {tip}
        </div>,
        document.body,
      )}
    </>
  );
}

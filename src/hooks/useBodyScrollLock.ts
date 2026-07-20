import { useEffect } from 'react';

let lockCount = 0;
let savedScrollY = 0;
let savedBodyStyles: Pick<CSSStyleDeclaration, 'overflow' | 'position' | 'top' | 'width'> | null = null;
let savedRootOverflow = '';

/** Keeps the page behind dialogs fixed, including iOS Safari's rubber-band scroll. */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    lockCount += 1;
    if (lockCount === 1) {
      savedScrollY = window.scrollY;
      savedBodyStyles = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        top: document.body.style.top,
        width: document.body.style.width,
      };
      savedRootOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.width = '100%';
    }

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount !== 0 || !savedBodyStyles) return;

      document.documentElement.style.overflow = savedRootOverflow;
      document.body.style.overflow = savedBodyStyles.overflow;
      document.body.style.position = savedBodyStyles.position;
      document.body.style.top = savedBodyStyles.top;
      document.body.style.width = savedBodyStyles.width;
      if (!navigator.userAgent.includes('jsdom')) {
        window.scrollTo({ top: savedScrollY, behavior: 'instant' });
      }
      savedBodyStyles = null;
    };
  }, [active]);
}

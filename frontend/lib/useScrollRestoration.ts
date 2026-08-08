'use client';

import { useEffect } from 'react';

const KEY_PREFIX = 'scroll-pos:';

export function useScrollRestoration() {
  useEffect(() => {
    const key = `${KEY_PREFIX}${window.location.pathname}`;
    const saved = Number(sessionStorage.getItem(key) || '0');

    if (saved > 0) {
      requestAnimationFrame(() => {
        window.scrollTo(0, saved);
      });
    }

    const onScroll = () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
}

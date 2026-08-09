'use client';

import { useEffect } from 'react';

const KEY_PREFIX = 'scroll-pos:';

/**
 * Saves scroll position per-pathname and restores it on mount so that
 * "back" navigation resumes where the user left off.
 *
 * The restore is re-applied on subsequent frames because client-side data
 * fetching renders content asynchronously — restoring once too early (before
 * the page has its full height) silently jumps back to the top.
 */
export function useScrollRestoration() {
  useEffect(() => {
    const key = `${KEY_PREFIX}${window.location.pathname}`;
    const saved = Number(sessionStorage.getItem(key) || '0');

    const restore = () => {
      if (saved > 0) {
        window.scrollTo(0, saved);
      }
    };

    // Apply immediately and again on the next few frames once images/content
    // have painted, which is when the real scroll height exists.
    requestAnimationFrame(restore);
    const timers = [1, 2, 3].map((i) => window.setTimeout(restore, i * 250));

    const onScroll = () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);
}

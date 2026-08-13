import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', cb);
      return () => media.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
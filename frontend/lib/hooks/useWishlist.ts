import { useCallback, useSyncExternalStore } from 'react';

export function useWishlist(key: 'properties' | 'roommates') {
  const storageKey = `house_agent_wishlist_${key}`;

  function readStored(): string[] {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored) as string[];
    } catch (e) {
      console.error('Failed to load wishlist', e);
    }
    return [];
  }

  const wishlist = useSyncExternalStore(
    (cb) => {
      window.addEventListener('storage', cb);
      return () => window.removeEventListener('storage', cb);
    },
    readStored,
    () => [] as string[]
  );

  const toggleWishlist = useCallback((id: string) => {
    const next = wishlist.includes(id)
      ? wishlist.filter((itemId) => itemId !== id)
      : [...wishlist, id];

    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to save wishlist', e);
    }
  }, [wishlist, storageKey]);

  const isInWishlist = useCallback((id: string) => wishlist.includes(id), [wishlist]);

  return {
    wishlist,
    toggleWishlist,
    isInWishlist,
    isLoaded: true
  };
}
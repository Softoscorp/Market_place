import { useState, useEffect, useCallback } from 'react';

export function useWishlist(key: 'properties' | 'roommates') {
  const storageKey = `house_agent_wishlist_${key}`;
  
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setWishlist(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load wishlist', e);
    }
    setIsLoaded(true);
  }, [storageKey]);

  const toggleWishlist = useCallback((id: string) => {
    setWishlist(prev => {
      const newWishlist = prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id];
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(newWishlist));
      } catch (e) {
        console.error('Failed to save wishlist', e);
      }
      
      return newWishlist;
    });
  }, [storageKey]);

  const isInWishlist = useCallback((id: string) => wishlist.includes(id), [wishlist]);

  return {
    wishlist,
    toggleWishlist,
    isInWishlist,
    isLoaded
  };
}

import { useState, useEffect } from 'react';

/**
 * Hook to listen for CSS media query changes.
 * SSR-safe - returns false on server, updates on client.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if we're in browser environment
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia === 'undefined'
    ) {
      return;
    }

    const media = window.matchMedia(query);
    // Set initial match state
    setMatches(media.matches);

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]); // Only depend on query, not matches (prevents infinite re-subscription)

  return matches;
}

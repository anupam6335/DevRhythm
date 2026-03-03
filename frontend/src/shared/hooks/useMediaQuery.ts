import { useState, useEffect } from 'react';

/**
 * Hook that listens to a media query and returns whether it matches.
 *
 * @param query - The media query string (e.g., '(max-width: 768px)').
 * @returns Boolean indicating if the media query matches.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);
    const updateMatches = () => setMatches(media.matches);

    // Set initial value
    updateMatches();

    // Listen for changes
    media.addEventListener('change', updateMatches);

    return () => {
      media.removeEventListener('change', updateMatches);
    };
  }, [query]);

  return matches;
}
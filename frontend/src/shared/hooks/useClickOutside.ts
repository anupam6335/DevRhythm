import { useEffect, RefObject } from 'react';

/**
 * Hook that triggers a callback when a click occurs outside the referenced element(s).
 *
 * @param ref - A ref object pointing to the element to watch.
 * @param handler - Function to call when click outside occurs.
 * @param ignoreRefs - Optional array of refs to also ignore (e.g., for nested modals).
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  ignoreRefs: RefObject<HTMLElement>[] = []
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // Do nothing if clicking ref's element or its descendants
      if (!ref.current || ref.current.contains(target)) {
        return;
      }

      // Do nothing if clicking any of the ignoreRefs
      for (const ignoreRef of ignoreRefs) {
        if (ignoreRef.current && ignoreRef.current.contains(target)) {
          return;
        }
      }

      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, ignoreRefs]);
}
import { useEffect, useRef, useState } from 'react';

export function useLazyLoad(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !shouldLoad) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px', ...options } // load 200px before it enters viewport
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [shouldLoad, options]);

  return { ref, shouldLoad };
}
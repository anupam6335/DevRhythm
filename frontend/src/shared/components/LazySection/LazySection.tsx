
'use client';

import { useEffect, useRef, useState } from 'react';

interface LazySectionProps {
  /** Function that returns a dynamic import (e.g., () => import('./HeavyComponent')) */
  loader: () => Promise<{ default: React.ComponentType<any> }>;
  /** Props to pass to the loaded component */
  componentProps?: Record<string, any>;
  /** Skeleton to show while loading (or while not yet in viewport) */
  fallback: React.ReactNode;
  /** Offset in pixels to trigger loading earlier (default: 200px) */
  rootMargin?: string;
  /** Once loaded, keep component mounted (default: true) */
  once?: boolean;
  /** Additional CSS class name for the container div */
  className?: string;
}

export default function LazySection({
  loader,
  componentProps = {},
  fallback,
  rootMargin = '200px',
  once = true,
  className = '',
}: LazySectionProps) {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasBeenVisible) {
          setHasBeenVisible(true);
          loader()
            .then((mod) => setComponent(() => mod.default))
            .catch((err) => console.error('Failed to lazy load component:', err));
          if (once) observer.disconnect();
        }
      },
      { rootMargin, threshold: 0 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [loader, rootMargin, once, hasBeenVisible]);

  return (
    <div ref={containerRef} className={className}>
      {Component ? <Component {...componentProps} /> : fallback}
    </div>
  );
}
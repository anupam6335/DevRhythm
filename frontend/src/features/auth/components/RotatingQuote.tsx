import { useState, useEffect, useRef } from 'react';
import { quotes } from '../constants/quotes';
import styles from './LoginPageWrapper.module.css';

interface RotatingQuoteProps {
  interval?: number; // milliseconds
  className?: string;
}

export const RotatingQuote: React.FC<RotatingQuoteProps> = ({
  interval = 10500,
  className,
}) => {
  const [index, setIndex] = useState(0);
  const [displayQuote, setDisplayQuote] = useState(quotes[0]);
  const [fading, setFading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for reduced motion preference
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % quotes.length);
    }, interval);
    return () => clearInterval(timer);
  }, [interval]);

  useEffect(() => {
    // If reduced motion, update immediately without fade
    if (reducedMotion) {
      setDisplayQuote(quotes[index]);
      setFading(false);
      return;
    }

    setFading(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDisplayQuote(quotes[index]);
      setFading(false);
      timeoutRef.current = null;
    }, 300); // match transition duration

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [index, reducedMotion]);

  return (
    <p
      className={`${className} ${styles.quote} ${
        reducedMotion ? '' : fading ? styles.fadeOut : styles.fadeIn
      }`}
      aria-live="polite" // announces changes to screen readers
    >
      {displayQuote}
    </p>
  );
};
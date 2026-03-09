'use client';

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

  useEffect(() => {
    // Start the rotation timer
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % quotes.length);
    }, interval);
    return () => clearInterval(timer);
  }, [interval]);

  useEffect(() => {
    // When index changes, trigger fade-out
    setFading(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      // After fade-out, update the quote and fade in
      setDisplayQuote(quotes[index]);
      setFading(false);
      timeoutRef.current = null;
    }, 300); // match transition duration
  }, [index]);

  return (
    <p className={`${className} ${styles.quote} ${fading ? styles.fadeOut : styles.fadeIn}`}>
      {displayQuote}
    </p>
  );
};
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Logo.module.css';

export type LogoSize = 'sm' | 'md' | 'lg';
export type LogoLayout = 'horizontal' | 'vertical';

export interface LogoProps {
  size?: LogoSize;
  layout?: LogoLayout;
  className?: string;
  ariaLabel?: string;
  animateOnLoad?: boolean;
  enableScrollFade?: boolean;
  scrollFadeThreshold?: number;
  priority?: boolean;
}

const BRAND_NAME = 'DevRhythm';
const SESSION_STORAGE_KEY = 'devrhythm-logo-animation-played';

export const Logo: React.FC<LogoProps> = ({
  size = 'sm',
  layout = 'horizontal',
  className = '',
  ariaLabel = 'DevRhythm home',
  animateOnLoad = true,
  enableScrollFade = false,
  scrollFadeThreshold = 200,
  priority = false,
}) => {
  const [scrollY, setScrollY] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (!animateOnLoad) return;
    const hasPlayed = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!hasPlayed) {
      setShouldAnimate(true);
      const timer = setTimeout(() => {
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      }, 1100); // 0.3s delay + 0.8s animation = 1.1s
      return () => clearTimeout(timer);
    }
  }, [animateOnLoad]);

  useEffect(() => {
    if (!enableScrollFade) return;
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enableScrollFade]);

  const fadeFactor = enableScrollFade
    ? Math.min(1, Math.max(0, scrollY / scrollFadeThreshold))
    : 0;
  const imageOpacity = 1 - fadeFactor;

  const imageSize = {
    sm: 32,
    md: 40,
    lg: 56,
  }[size];

  return (
    <Link
      href="/"
      className={`${styles.logo} ${styles[layout]} ${styles[size]} ${className}`}
      aria-label={ariaLabel}
    >
      <div className={styles.imageWrapper} style={{ opacity: imageOpacity }}>
        {/* Light mode image */}
        <Image
          src="/images/logos/dr-icon-light-logo.png"
          alt=""
          width={imageSize}
          height={imageSize}
          className={`${styles.image} ${styles.lightImage}`}
          priority={priority}
        />
        {/* Dark mode image */}
        <Image
          src="/images/logos/dr-icon-dark-logo.png"
          alt=""
          width={imageSize}
          height={imageSize}
          className={`${styles.image} ${styles.darkImage}`}
          priority={priority}
        />
      </div>
      <div
        className={`${styles.text} ${shouldAnimate ? styles.animateReveal : ''}`}
        aria-hidden="true"
      >
        {BRAND_NAME.split('').map((char, index) => (
          <span
            key={index}
            className={styles.char}
            style={{ '--char-index': index } as React.CSSProperties}
          >
            {char}
          </span>
        ))}
      </div>
    </Link>
  );
};

export default Logo;
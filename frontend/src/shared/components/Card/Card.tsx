import React from 'react';
import clsx from 'clsx';
import styles from './Card.module.css';

export interface CardProps {
  /** The content to be placed inside the card. */
  children?: React.ReactNode;
  /** Additional CSS class names. */
  className?: string;
  /** Whether to disable the hover effect. */
  noHover?: boolean;
}

/**
 * A card container with a themed background, border, rounded corners, and optional hover effect.
 * It also provides sensible default styles for common content inside the card.
 */
const Card: React.FC<CardProps> = ({ children, className, noHover = false }) => {
  return (
    <div
      className={clsx(
        styles.card,
        noHover && styles.noHover,
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;
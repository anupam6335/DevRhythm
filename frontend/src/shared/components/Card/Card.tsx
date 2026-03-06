import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
  /** The content to be placed inside the card. */
  children?: React.ReactNode;
  /** Additional CSS class names. */
  className?: string;
}

/**
 * A basic card container with a themed background, rounded corners, and padding.
 * It also provides sensible default styles for common content inside the card.
 */
const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div
      className={`${styles.cardContainer} ${className || ''}`.trim()}
    >
      {children}
    </div>
  );
};

export default Card;
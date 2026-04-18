import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';
import type { PatternMastery } from '@/shared/types';
import styles from './PatternHeader.module.css';

interface PatternHeaderProps {
  pattern: PatternMastery;
}

function processPatternName(name: string): {
  shouldAbbreviate: boolean;
  abbreviation: { line1: string; line2: string };
  fullName: string;
  line1?: string;
  line2?: string;
} {
  const words = name.trim().split(/\s+/);
  const wordCount = words.length;
  const wordLengths = words.map(w => w.length);
  const maxWordLength = Math.max(...wordLengths);

  // Single word: never abbreviate – just return the full word (no split lines)
  if (wordCount === 1) {
    return {
      shouldAbbreviate: false,
      abbreviation: { line1: '', line2: '' },
      fullName: name,
      line1: name,
      line2: '',
    };
  }

  // Exactly two words, both ≤ 6 characters → keep original two-line display
  if (wordCount === 2 && wordLengths[0] <= 6 && wordLengths[1] <= 8) {
    return {
      shouldAbbreviate: false,
      abbreviation: { line1: '', line2: '' },
      fullName: name,
      line1: words[0],
      line2: words[1],
    };
  }

  // Otherwise, abbreviate: take first letter of each word
  const abbr = words.map(word => word[0].toUpperCase()).join('');

  // Split long abbreviation into two lines: first 3 chars, then the rest
  let abbrLine1 = abbr;
  let abbrLine2 = '';
  if (abbr.length > 4) {
    abbrLine1 = abbr.slice(0, 3);
    abbrLine2 = abbr.slice(3);
  }

  return {
    shouldAbbreviate: true,
    abbreviation: { line1: abbrLine1, line2: abbrLine2 },
    fullName: name,
  };
}

export default function PatternHeader({ pattern }: PatternHeaderProps) {
  const { patternName, masteryRate, trend } = pattern;
  const improvementRate = trend?.improvementRate || 0;

  const processed = processPatternName(patternName);

  let trendIcon = <FiMinus />;
  let trendClass = styles.trendNeutral;
  if (improvementRate > 0) {
    trendIcon = <FiTrendingUp />;
    trendClass = styles.trendUp;
  } else if (improvementRate < 0) {
    trendIcon = <FiTrendingDown />;
    trendClass = styles.trendDown;
  }

  return (
    <div className={styles.header}>
      {processed.shouldAbbreviate ? (
        <>
          <h1 className={styles.abbreviatedName}>
            <span className={styles.abbrLine1}>{processed.abbreviation.line1}</span>
            {processed.abbreviation.line2 && (
              <span className={styles.abbrLine2}>{processed.abbreviation.line2}</span>
            )}
          </h1>
          <div className={styles.fullName}>{processed.fullName}</div>
        </>
      ) : (
        <h1 className={styles.patternName}>
          <span className={styles.line1}>{processed.line1}</span>
          <span className={styles.line2}>{processed.line2}</span>
        </h1>
      )}
      <div className={styles.badgeRow}>
        <span className={styles.masteryBadge}>
          mastery {masteryRate.toFixed(1)}%
        </span>
        <span className={`${styles.trendBadge} ${trendClass}`}>
          {trendIcon} {Math.abs(improvementRate).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
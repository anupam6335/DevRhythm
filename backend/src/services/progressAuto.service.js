/**
 * Automatically recalculate confidence level and advance status
 * based on engagement metrics.
 *
 * Confidence level 5 is only assigned when the problem is truly mastered:
 * - status is Solved (or already Mastered)
 * - revisionCount ≥ 3
 * - totalTimeSpent ≥ 30 minutes
 * - and the calculated confidence score would be at least 4
 *
 * If those conditions are not met, confidence is capped at 4.
 */
const recalculateProgress = (progress) => {
  const { status, attempts, revisionCount, totalTimeSpent } = progress;
  let changed = false;

  // ----- Compute raw confidence score -----
  const successfulAttempts = (status === 'Solved' || status === 'Mastered' ? 1 : 0) + revisionCount;
  const successRate = attempts.count > 0 ? successfulAttempts / attempts.count : 0;

  let score = 1.0; // base level

  // Solved gives a boost
  if (status === 'Solved' || status === 'Mastered') score += 1.5;

  // Revisions: each adds 0.4, capped at 5
  score += Math.min(revisionCount, 5) * 0.4;

  // High success rate bonuses
  if (successRate >= 0.8) score += 0.5;
  if (successRate >= 0.9) score += 0.5;

  // Time invested bonus: up to +1 for 2+ hours (120 minutes)
  score += Math.min(totalTimeSpent / 60, 2) * 0.5;

  // Raw rounded confidence (1‑5)
  let rawConfidence = Math.min(5, Math.max(1, Math.round(score)));

  // ----- Determine if mastered conditions are met -----
  const meetsMasteredConditions = 
    status === 'Solved' && 
    revisionCount >= 3 && 
    totalTimeSpent >= 30 && 
    rawConfidence >= 4;   // we also require a sufficiently high raw score

  // ----- Apply mastered logic and confidence capping -----
  let newConfidence;
  if (meetsMasteredConditions) {
    // Mastered: set status to Mastered (if not already) and confidence to 5
    if (status !== 'Mastered') {
      progress.status = 'Mastered';
      progress.attempts.masteredAt = new Date();
      changed = true;
    }
    newConfidence = 5;
  } else {
    // Not mastered: confidence cannot be 5
    newConfidence = rawConfidence === 5 ? 4 : rawConfidence;
  }

  if (newConfidence !== progress.confidenceLevel) {
    progress.confidenceLevel = newConfidence;
    changed = true;
  }

  // ----- Other status progressions (only if not already Mastered) -----
  if (progress.status !== 'Mastered') {
    // Not Started → Attempted after first attempt
    if (progress.status === 'Not Started' && attempts.count > 0) {
      progress.status = 'Attempted';
      changed = true;
    }

    // Attempted → Solved once solvedAt is set
    if (progress.status === 'Attempted' && attempts.solvedAt) {
      progress.status = 'Solved';
      changed = true;
    }
  }

  if (changed) progress.updatedAt = new Date();
  return changed;
};

module.exports = { recalculateProgress };
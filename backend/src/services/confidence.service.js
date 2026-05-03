const UserQuestionProgress = require('../models/UserQuestionProgress');

/**
 * Increment confidence level for a specific question by +0.25, capped at 5.
 * Starts from 0 if no progress record exists, or uses current confidence.
 * @param {string} userId - User ObjectId
 * @param {string} questionId - Question ObjectId
 * @param {string} action - Optional action identifier (for logging, not persisted)
 * @returns {Promise<number>} New confidence level
 */
const incrementConfidence = async (userId, questionId, action = 'auto') => {
  // Find existing progress
  let progress = await UserQuestionProgress.findOne({ userId, questionId });
  
  if (!progress) {
    // Create new progress with confidence = 0 (unsolved, no activity)
    progress = await UserQuestionProgress.create({
      userId,
      questionId,
      status: 'Not Started',
      confidenceLevel: 0,
      totalTimeSpent: 0,
      attempts: { count: 0 }
    });
  }
  
  // Starting confidence is 0 if not set or invalid
  let currentConfidence = (typeof progress.confidenceLevel === 'number' && progress.confidenceLevel >= 0) 
    ? progress.confidenceLevel 
    : 0;
  
  // Increment by 0.25, cap at 5
  let newConfidence = currentConfidence + 0.25;
  if (newConfidence > 5) newConfidence = 5;
  
  // Avoid no-op updates (if already at 5, no change)
  if (Math.abs(newConfidence - currentConfidence) < 0.01) {
    return currentConfidence;
  }
  
  progress.confidenceLevel = newConfidence;
  progress.updatedAt = new Date();
  await progress.save();
  
  return newConfidence;
};

module.exports = { incrementConfidence };
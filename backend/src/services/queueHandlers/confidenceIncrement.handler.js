const { incrementConfidence } = require('../confidence.service');

/**
 * Handle confidence.increment job
 * Increments confidence for a user+question by 0.25, capped at 5.
 * @param {Object} job - Bull job object
 * @param {Object} job.data - Contains userId, questionId, action (optional)
 */
const handleConfidenceIncrement = async (job) => {
  const { userId, questionId, action } = job.data;
  
  if (!userId || !questionId) {
    throw new Error('Missing userId or questionId in confidence.increment job');
  }
  
  try {
    const newConfidence = await incrementConfidence(userId, questionId, action);
    console.log(`Confidence incremented: user ${userId}, question ${questionId}, new value: ${newConfidence}`);
  } catch (error) {
    console.error(`Failed to increment confidence:`, error);
    throw error; // Re-throw to allow Bull retry
  }
};

module.exports = { handleConfidenceIncrement };
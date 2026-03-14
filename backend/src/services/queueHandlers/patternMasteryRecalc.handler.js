const { recalculateAllPatternsForUser } = require('../patternMastery.service');

const handlePatternMasteryRecalc = async (job) => {
  const { userId } = job.data;
  if (!userId) {
    throw new Error('Missing userId in job data');
  }
  try {
    await recalculateAllPatternsForUser(userId);
    console.log(`Pattern mastery recalculation completed for user ${userId}`);
  } catch (error) {
    console.error(`Pattern mastery recalculation failed for user ${userId}:`, error);
    throw error;
  }
};

module.exports = { handlePatternMasteryRecalc };
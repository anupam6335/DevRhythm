// src/services/queueHandlers/revisionAutoComplete.handler.js
const revisionActivityService = require('../revisionActivity.service');

const handleRevisionAutoComplete = async (job) => {
  const { userId, questionId, targetDate } = job.data;

  try {
    console.log(`[revision.auto_complete] Triggered for user ${userId}, question ${questionId}, date ${targetDate}`);

    const result = await revisionActivityService.completePastRevision(
      userId,
      questionId,
      new Date(targetDate),
      null,
      true
    );

    if (result.completed) {
      console.log(`[revision.auto_complete] Successfully auto-completed past revision for user ${userId}, question ${questionId}, date ${targetDate}`);
      // No need to remove the job – Bull will clean it up.
    } else {
      console.warn(`[revision.auto_complete] Auto-completion failed: ${result.message}`);
    }
  } catch (error) {
    console.error('[revision.auto_complete] Error processing job:', error);
  }
};

module.exports = { handleRevisionAutoComplete };
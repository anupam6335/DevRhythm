const User = require('../../models/User');
const UserQuestionProgress = require('../../models/UserQuestionProgress');
const { invalidateCache } = require('../../middleware/cache');

const handleRevisionCompleted = async (job) => {
  const { userId, revisionId, questionId, completedAt, revisionIndex, status } = job.data;

  try {
    // Update user's revision count in stats
    const user = await User.findById(userId);
    if (user) {
      user.stats.totalRevisions += 1;
      await user.save();
      await invalidateCache(`user:${userId}:profile`);
    }

    // Optionally update the question progress (revision count)
    const progress = await UserQuestionProgress.findOne({ userId, questionId });
    if (progress) {
      progress.revisionCount += 1;
      progress.lastRevisedAt = completedAt;
      await progress.save();
      await invalidateCache(`progress:*:user:${userId}:*`);
    }

    console.log(`Revision completed event processed for user ${userId}`);
  } catch (error) {
    console.error('Error processing revision.completed:', error);
    throw error;
  }
};

module.exports = { handleRevisionCompleted };
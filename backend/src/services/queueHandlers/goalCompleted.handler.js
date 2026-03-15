const Goal = require('../../models/Goal');
const Notification = require('../../models/Notification');
const { invalidateCache } = require('../../middleware/cache');

const handleGoalCompleted = async (job) => {
  const { userId, goalId, completedAt, goalType, targetCount, completedCount } = job.data;

  try {
    // Create a congratulatory notification
    await Notification.create({
      userId,
      type: 'goal_completion',
      title: 'Goal Achieved!',
      message: `Congratulations! You've completed your ${goalType} goal (${completedCount}/${targetCount})!`,
      data: { goalId, goalType, targetCount, completedCount },
      channel: 'in-app',
      status: 'pending',
      scheduledAt: new Date(),
    });

    // Invalidate caches
    await invalidateCache(`goals:*:user:${userId}:*`);
    await invalidateCache(`notifications:${userId}:*`);

    console.log(`Goal completed event processed for user ${userId}`);
  } catch (error) {
    console.error('Error processing goal.completed:', error);
    throw error;
  }
};

module.exports = { handleGoalCompleted };
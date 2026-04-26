const Goal = require('../../models/Goal');
const Notification = require('../../models/Notification');
const { invalidateCache } = require('../../middleware/cache');

const handleGoalCompleted = async (job) => {
  const { userId, goalId, completedAt, goalType, targetCount, completedCount, completedQuestionDetails } = job.data;

  try {
    let title = 'Goal Achieved!';
    let message = `Congratulations! You've completed your ${goalType} goal (${completedCount}/${targetCount})!`;
    let notificationData = { goalId, goalType, targetCount, completedCount };

    if (goalType === 'planned' && completedQuestionDetails) {
      title = 'Planned Goal Completed!';
      message = `You completed your planned goal by solving "${completedQuestionDetails.title}"!`;
      notificationData = {
        ...notificationData,
        completedQuestion: {
          questionId: completedQuestionDetails.questionId,
          platformQuestionId: completedQuestionDetails.platformQuestionId,
          title: completedQuestionDetails.title,
        },
      };
    }

    await Notification.create({
      userId,
      type: 'goal_completion',
      title,
      message,
      data: notificationData,
      channel: 'in-app',
      status: 'pending',
      scheduledAt: new Date(),
    });

    await invalidateCache(`goals:*:user:${userId}:*`);
    await invalidateCache(`notifications:${userId}:*`);

    console.log(`Goal completed event processed for user ${userId} (${goalType})`);
  } catch (error) {
    console.error('Error processing goal.completed:', error);
    throw error;
  }
};

module.exports = { handleGoalCompleted };
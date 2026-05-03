// src/services/queueHandlers/goalCompleted.handler.js
const Goal = require('../../models/Goal');
const Notification = require('../../models/Notification');
const { invalidateCache, invalidateDashboardCache } = require('../../middleware/cache');

const handleGoalCompleted = async (job) => {
  const { 
    userId, 
    goalId, 
    completedAt, 
    goalType, 
    targetCount, 
    completedCount, 
    completedQuestionDetails,
    triggerQuestionId
  } = job.data;

  try {
    // Fetch the goal to verify it is actually completed
    const goal = await Goal.findById(goalId);
    if (!goal) {
      console.warn(`Goal ${goalId} not found, skipping confidence increment`);
      return;
    }

    // Only proceed if the goal is truly completed
    if (goal.status !== 'completed') {
      console.log(`Goal ${goalId} is not completed (status: ${goal.status}), skipping confidence increment`);
      return;
    }

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

    const { jobQueue } = require('../queue.service');

    // Increment confidence based on goal type
    if (goalType === 'planned') {
      // For planned goals, increment confidence for each unique completed question
      if (goal.completedQuestions && goal.completedQuestions.length > 0) {
        const questionIds = [...new Set(goal.completedQuestions.map(cq => cq.questionId.toString()))];
        for (const qid of questionIds) {
          await jobQueue.add('confidence.increment', {
            userId,
            questionId: qid,
            action: 'goal_completed_planned',
          });
        }
      }
    } else if (triggerQuestionId) {
      // For daily/weekly goals, increment confidence for the question that triggered completion
      await jobQueue.add('confidence.increment', {
        userId,
        questionId: triggerQuestionId,
        action: 'goal_completed_daily_weekly',
      });
    }

    await invalidateCache(`goals:*:user:${userId}:*`);
    await invalidateCache(`notifications:${userId}:*`);
    await invalidateDashboardCache(userId);

    console.log(`Goal completed event processed for user ${userId} (${goalType})`);
  } catch (error) {
    console.error('Error processing goal.completed:', error);
    throw error;
  }
};

module.exports = { handleGoalCompleted };
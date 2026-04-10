const User = require('../../models/User');
const Question = require('../../models/Question');
const UserQuestionProgress = require('../../models/UserQuestionProgress');
const HeatmapData = require('../../models/HeatmapData');
const Notification = require('../../models/Notification');
const { invalidateCache } = require('../../middleware/cache');
const heatmapService = require('../heatmap.service');
const { parseDate } = require('../../utils/helpers/date');

const handleRevisionCompleted = async (job) => {
  const { userId, revisionId, questionId, completedAt, revisionIndex, status } = job.data;

  const revisionDate = parseDate(completedAt);

  try {
    // --- Update user streak and revision count ---
    const user = await User.findById(userId);
    if (user) {
      user.stats.totalRevisions += 1;

      const today = new Date();
      const todayStr = today.toDateString();
      const lastActive = user.streak.lastActiveDate ? new Date(user.streak.lastActiveDate).toDateString() : null;
      if (!lastActive) {
        user.streak.current = 1;
        user.streak.longest = 1;
        user.stats.activeDays = 1;
      } else if (lastActive !== todayStr) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastActive === yesterday.toDateString()) {
          user.streak.current += 1;
          if (user.streak.current > user.streak.longest) user.streak.longest = user.streak.current;
        } else {
          user.streak.current = 1;
        }
        user.stats.activeDays += 1;
      }
      user.streak.lastActiveDate = today;

      await user.save();
      await invalidateCache(`user:${userId}:profile`);
    }

    // --- Update question progress (revision count) ---
    const progress = await UserQuestionProgress.findOne({ userId, questionId });
    if (progress) {
      progress.revisionCount += 1;
      progress.lastRevisedAt = revisionDate;
      await progress.save();
      await invalidateCache(`progress:*:user:${userId}:*`);
    }

    // --- Update heatmap – FIX: create if missing ---
    const year = revisionDate.getFullYear();
    let heatmap = await HeatmapData.findOne({ userId, year });
    if (!heatmap) {
      heatmap = await heatmapService.generateHeatmapData(userId, year);
    }
    if (heatmap) {
      const dayEntry = heatmap.dailyData.find(d => new Date(d.date).toDateString() === revisionDate.toDateString());
      if (dayEntry) {
        dayEntry.revisionProblems += 1;
        dayEntry.totalActivities += 1;
        dayEntry.intensityLevel = Math.min(4, Math.floor(dayEntry.totalActivities / 3));
      }
      heatmap.lastUpdated = new Date();
      await heatmap.save();
      await invalidateCache(`heatmap:${userId}:${year}:*`);
    }

    // --- Fetch question title for notification ---
    const question = await Question.findById(questionId).select('title');
    const questionTitle = question ? question.title : 'a question';

    // --- Create in-app notification for this completed revision ---
    await Notification.create({
      userId,
      type: 'revision_completed',
      title: 'Revision Completed',
      message: `You completed a revision for "${questionTitle}"`,
      data: {
        questionId,
        revisionId,
        revisionIndex,
        status,
      },
      channel: 'in-app',
      status: 'sent',
      scheduledAt: new Date(),
    });

    await invalidateCache(`notifications:*:user:${userId}:*`);

    console.log(`Revision completed event processed for user ${userId}`);
  } catch (error) {
    console.error('Error processing revision.completed:', error);
    throw error;
  }
};

module.exports = { handleRevisionCompleted };
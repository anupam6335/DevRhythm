const User = require('../../models/User');
const Question = require('../../models/Question');
const PatternMastery = require('../../models/PatternMastery');
const RevisionSchedule = require('../../models/RevisionSchedule');
const Goal = require('../../models/Goal');
const ActivityLog = require('../../models/ActivityLog');
const HeatmapData = require('../../models/HeatmapData');
const Notification = require('../../models/Notification');
const { invalidateUserCache, invalidateCache } = require('../../middleware/cache');
const { getStartOfDay } = require('../../utils/helpers/date');

const handleQuestionSolved = async (job) => {
  const { userId, questionId, progressId, timeSpent = 0, solvedAt } = job.data;

  // Convert solvedAt to Date object
  const solvedDate = solvedAt instanceof Date ? solvedAt : new Date(solvedAt);
  if (isNaN(solvedDate.getTime())) {
    throw new Error(`Invalid solvedAt date: ${solvedAt}`);
  }

  console.log(`[question.solved] Started for user ${userId}, question ${questionId}, solvedAt ${solvedDate.toISOString()}`);

  try {
    const question = await Question.findById(questionId);
    if (!question) throw new Error('Question not found');

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // --- 1. Update UserStats ---
    user.stats.totalSolved += 1;
    user.stats.totalTimeSpent += timeSpent;

    // Simple mastery rate: percentage of total questions solved (temporary)
    const totalQuestions = await Question.countDocuments();
    user.stats.masteryRate = totalQuestions > 0 ? (user.stats.totalSolved / totalQuestions) * 100 : 0;

    // Update active days and streak
    const today = new Date();
    const todayStr = today.toDateString();
    const lastActive = user.streak.lastActiveDate ? new Date(user.streak.lastActiveDate).toDateString() : null;
    if (!lastActive) {
      // First activity
      user.streak.current = 1;
      user.streak.longest = 1;
      user.stats.activeDays = 1;
    } else if (lastActive !== todayStr) {
      // Check if yesterday
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
    await invalidateUserCache(userId);
    console.log(`[question.solved] User stats updated for ${userId}`);

    // --- 2. Update PatternMastery ---
    if (question.pattern) {
      let pattern = await PatternMastery.findOne({ userId, patternName: question.pattern });
      if (!pattern) {
        pattern = new PatternMastery({ userId, patternName: question.pattern });
      }
      pattern.solvedCount += 1;
      pattern.totalAttempts += 1;
      pattern.successfulAttempts += 1;
      pattern.successRate = pattern.totalAttempts > 0 ? (pattern.successfulAttempts / pattern.totalAttempts) * 100 : 0;
      const totalPatternQuestions = await Question.countDocuments({ pattern: question.pattern });
      pattern.masteryRate = totalPatternQuestions > 0 ? Math.min(100, (pattern.masteredCount / totalPatternQuestions) * 100) : 0;
      pattern.confidenceLevel = pattern.masteryRate >= 80 ? 5 : pattern.masteryRate >= 60 ? 4 : pattern.masteryRate >= 40 ? 3 : pattern.masteryRate >= 20 ? 2 : 1;
      pattern.lastPracticed = solvedDate;
      pattern.lastUpdated = new Date();
      pattern.recentQuestions.unshift({
        questionProgressId: progressId,
        questionId,
        title: question.title,
        problemLink: question.problemLink,
        platform: question.platform,
        difficulty: question.difficulty,
        solvedAt: solvedDate,
        status: 'Solved',
        timeSpent,
      });
      if (pattern.recentQuestions.length > 10) pattern.recentQuestions.pop();
      await pattern.save();
      await invalidateCache(`pattern-mastery:*:user:${userId}:*`);
      console.log(`[question.solved] Pattern mastery updated for ${question.pattern}`);
    }

    // --- 3. Update RevisionSchedule ---
    const existingRevision = await RevisionSchedule.findOne({ userId, questionId });
    if (!existingRevision) {
      const baseDate = solvedDate;
      const schedule = [1, 3, 7, 14, 30].map(days => {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + days);
        d.setHours(0, 0, 0, 0);
        return d;
      });
      await RevisionSchedule.create({
        userId,
        questionId,
        schedule,
        baseDate,
        status: 'active',
      });
    }
    await invalidateCache(`revisions:*:user:${userId}:*`);

    // --- 4. Update Goals ---
    const dayStart = getStartOfDay(solvedDate);
    const dailyGoal = await Goal.findOne({
      userId,
      goalType: 'daily',
      startDate: { $lte: dayStart },
      endDate: { $gte: dayStart },
      status: 'active',
    });
    if (dailyGoal) {
      dailyGoal.completedCount += 1;
      await dailyGoal.save();
      if (dailyGoal.completedCount >= dailyGoal.targetCount) {
        const { goalCompletedQueue } = require('../queue.service');
        await goalCompletedQueue.add({
          userId,
          goalId: dailyGoal._id,
          completedAt: new Date(),
          goalType: dailyGoal.goalType,
          targetCount: dailyGoal.targetCount,
          completedCount: dailyGoal.completedCount,
        });
      }
    }
    await invalidateCache(`goals:*:user:${userId}:*`);

    // --- 5. Create ActivityLog ---
    await ActivityLog.create({
      userId,
      action: 'question_solved',
      targetId: questionId,
      targetType: 'Question',
      metadata: {
        title: question.title,
        difficulty: question.difficulty,
        platform: question.platform,
        pattern: question.pattern,
        timeSpent,
      },
      createdAt: solvedDate,
    });

    // --- 6. Update HeatmapData ---
    const year = solvedDate.getFullYear();
    let heatmap = await HeatmapData.findOne({ userId, year });
    if (heatmap) {
      const dayEntry = heatmap.dailyData.find(d => new Date(d.date).toDateString() === solvedDate.toDateString());
      if (dayEntry) {
        dayEntry.newProblemsSolved += 1;
        dayEntry.totalActivities += 1;
        dayEntry.totalTimeSpent += timeSpent;
        dayEntry.intensityLevel = Math.min(4, Math.floor(dayEntry.totalActivities / 3));
      }
      heatmap.lastUpdated = new Date();
      await heatmap.save();
      await invalidateCache(`heatmap:${userId}:${year}:*`);
    }

    // --- 7. Milestone Notification ---
    const solvedCount = user.stats.totalSolved;
    const milestones = [1, 10, 25, 50, 100, 250, 500, 1000];
    if (milestones.includes(solvedCount)) {
      await Notification.create({
        userId,
        type: 'goal_completion',
        title: 'Milestone Achieved!',
        message: `Congratulations! You've solved ${solvedCount} problems.`,
        data: { milestone: solvedCount },
        channel: 'both',
        status: 'pending',
        scheduledAt: new Date(),
      });
      await invalidateCache(`notifications:${userId}:*`);
    }

    console.log(`[question.solved] Completed successfully for user ${userId}`);
  } catch (error) {
    console.error(`[question.solved] Error processing for user ${userId}:`, error);
    throw error; // Bull will retry the job
  }
};

module.exports = { handleQuestionSolved };
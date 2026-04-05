const User = require('../../models/User');
const Question = require('../../models/Question');
const PatternMastery = require('../../models/PatternMastery');
const RevisionSchedule = require('../../models/RevisionSchedule');
const Goal = require('../../models/Goal');
const ActivityLog = require('../../models/ActivityLog');
const HeatmapData = require('../../models/HeatmapData');
const Notification = require('../../models/Notification');
const { invalidateUserCache, invalidateCache } = require('../../middleware/cache');
const { getStartOfDay, parseDate } = require('../../utils/helpers/date');

const handleQuestionSolved = async (job) => {
  const { userId, questionId, progressId, timeSpent = 0, solvedAt } = job.data;
  const solvedDate = parseDate(solvedAt);
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

    const totalQuestions = await Question.countDocuments();
    let rawMasteryRate = totalQuestions > 0 ? (user.stats.totalSolved / totalQuestions) * 100 : 0;
    if (rawMasteryRate > 100) {
      console.warn(
        `[question.solved] Mastery rate capped for user ${userId}: ` +
        `raw ${rawMasteryRate} > 100 (totalSolved=${user.stats.totalSolved}, totalQuestions=${totalQuestions})`
      );
      rawMasteryRate = 100;
    }
    user.stats.masteryRate = rawMasteryRate;

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
    await invalidateUserCache(userId);
    console.log(`[question.solved] User stats updated for ${userId}`);

    // --- 2. Update PatternMastery for each pattern (with validation fixes) ---
    if (question.pattern && Array.isArray(question.pattern) && question.pattern.length > 0) {
      for (const patternName of question.pattern) {
        let pattern = await PatternMastery.findOne({ userId, patternName });
        if (!pattern) {
          pattern = new PatternMastery({
            userId,
            patternName,
            title: patternName,
            description: `Problems using the ${patternName} pattern`,
          });
        } else {
          // Ensure existing documents have required fields
          if (!pattern.title) pattern.title = patternName;
          if (!pattern.description) pattern.description = `Problems using the ${patternName} pattern`;
        }

        pattern.solvedCount += 1;
        pattern.totalAttempts += 1;
        pattern.successfulAttempts += 1;

        // FIX: Ensure successfulAttempts never exceeds totalAttempts
        if (pattern.successfulAttempts > pattern.totalAttempts) {
          console.warn(`[pattern] Data inconsistency for ${patternName}: successfulAttempts=${pattern.successfulAttempts}, totalAttempts=${pattern.totalAttempts}. Correcting.`);
          pattern.successfulAttempts = pattern.totalAttempts;
        }

        // FIX: Clamp successRate to [0,100]
        pattern.successRate = pattern.totalAttempts > 0
          ? Math.min(100, (pattern.successfulAttempts / pattern.totalAttempts) * 100)
          : 0;

        const totalPatternQuestions = await Question.countDocuments({ pattern: patternName });
        // FIX: Clamp masteryRate to [0,100]
        pattern.masteryRate = totalPatternQuestions > 0
          ? Math.min(100, (pattern.masteredCount / totalPatternQuestions) * 100)
          : 0;

        // Recalculate confidence level based on clamped masteryRate
        pattern.confidenceLevel = pattern.masteryRate >= 80 ? 5
          : pattern.masteryRate >= 60 ? 4
          : pattern.masteryRate >= 40 ? 3
          : pattern.masteryRate >= 20 ? 2 : 1;

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
      }
      await invalidateCache(`pattern-mastery:*:user:${userId}:*`);
      console.log(`[question.solved] Pattern mastery updated for patterns: ${question.pattern.join(', ')}`);
    }

    // --- 3. Update RevisionSchedule (auto‑complete first revision) ---
    const existingRevision = await RevisionSchedule.findOne({ userId, questionId });
    if (!existingRevision) {
      const baseDate = solvedDate;
      const schedule = [1, 3, 7, 14, 30].map(days => {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + days);
        d.setHours(0, 0, 0, 0);
        return d;
      });

      // Create the schedule with the first revision already marked as completed
      await RevisionSchedule.create({
        userId,
        questionId,
        schedule,
        baseDate,
        status: 'active',
        currentRevisionIndex: 1, // Start from the second revision (index 1)
        completedRevisions: [{
          date: schedule[0],          // The first scheduled revision date
          completedAt: new Date(),    // Completed at the moment of solving
          status: 'completed'
        }]
      });

      console.log(`[question.solved] Revision schedule created with first revision auto‑completed for user ${userId}, question ${questionId}`);
    } else {
      console.log(`[question.solved] Revision schedule already exists for user ${userId}, question ${questionId}`);
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
      targetModel: 'Question',
      metadata: {
        title: question.title,
        difficulty: question.difficulty,
        platform: question.platform,
        pattern: question.pattern,
        timeSpent,
      },
      timestamp: solvedDate,
    });

    // --- 6. Update HeatmapData ---
    const year = solvedDate.getFullYear();
    let heatmap = await HeatmapData.findOne({ userId, year });
    if (heatmap) {
      const dayEntry = heatmap.dailyData.find(d => new Date(d.date).toDateString() === solvedDate.toDateString());
      if (dayEntry) {
        dayEntry.newProblemsSolved += 1;
        dayEntry.totalActivities += 1;
        dayEntry.totalSubmissions += 1;
        dayEntry.totalTimeSpent += timeSpent;
        dayEntry.intensityLevel = Math.min(4, Math.floor(dayEntry.totalActivities / 3));
      }
      heatmap.lastUpdated = new Date();
      await heatmap.save();
      await invalidateCache(`heatmap:${userId}:${year}:*`);
    }

    // --- 7. In-app notification for this solved question ---
    await Notification.create({
      userId,
      type: 'question_solved',
      title: 'Problem Solved!',
      message: `You solved "${question.title}"`,
      data: {
        questionId,
        title: question.title,
        difficulty: question.difficulty,
        platform: question.platform,
        timeSpent,
      },
      channel: 'in-app',
      status: 'sent',
      scheduledAt: new Date(),
    });

    // --- 8. Milestone Notification ---
    const solvedCount = user.stats.totalSolved;
    const milestones = [1, 10, 25, 50, 100, 250, 500, 1000];
    if (milestones.includes(solvedCount)) {
      await Notification.create({
        userId,
        type: 'goal_completion',
        title: 'Milestone Achieved!',
        message: `Congratulations! You've solved ${solvedCount} problems.`,
        data: { milestone: solvedCount },
        channel: 'in-app',
        status: 'sent',
        scheduledAt: new Date(),
      });
    }

    await invalidateCache(`notifications:*:user:${userId}:*`);
    console.log(`[question.solved] Completed successfully for user ${userId}`);
  } catch (error) {
    console.error(`[question.solved] Error processing for user ${userId}:`, error);
    throw error;
  }
};

module.exports = { handleQuestionSolved };
const User = require("../../models/User");
const Question = require("../../models/Question");
const PatternMastery = require("../../models/PatternMastery");
const RevisionSchedule = require("../../models/RevisionSchedule");
const Goal = require("../../models/Goal");
const ActivityLog = require("../../models/ActivityLog");
const HeatmapData = require("../../models/HeatmapData");
const Notification = require("../../models/Notification");
const UserQuestionProgress = require("../../models/UserQuestionProgress");
const {
  invalidateUserCache,
  invalidateCache,
} = require("../../middleware/cache");
const { getStartOfDay, parseDate } = require("../../utils/helpers/date");
const heatmapService = require("../heatmap.service");

const handleQuestionSolved = async (job) => {
  const { userId, questionId, progressId, timeSpent = 0, solvedAt } = job.data;
  const solvedDate = parseDate(solvedAt);
  if (isNaN(solvedDate.getTime())) {
    throw new Error(`Invalid solvedAt date: ${solvedAt}`);
  }

  try {
    const question = await Question.findById(questionId);
    if (!question) throw new Error("Question not found");

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // --- Determine if this is a first-time solve ---
    const existingProgress = await UserQuestionProgress.findOne({
      userId,
      questionId,
    }).select("status");
    const isFirstSolve =
      !existingProgress || existingProgress.status !== "Solved";

    // --- 1. Update UserStats ---
    if (isFirstSolve) {
      user.stats.totalSolved += 1;
    }
    user.stats.totalTimeSpent += timeSpent;

    const totalQuestions = await Question.countDocuments();
    let rawMasteryRate =
      totalQuestions > 0 ? (user.stats.totalSolved / totalQuestions) * 100 : 0;
    if (rawMasteryRate > 100) rawMasteryRate = 100;
    user.stats.masteryRate = rawMasteryRate;

    const today = new Date();
    const todayStr = today.toDateString();
    const lastActive = user.streak.lastActiveDate
      ? new Date(user.streak.lastActiveDate).toDateString()
      : null;
    if (!lastActive) {
      user.streak.current = 1;
      user.streak.longest = 1;
      user.stats.activeDays = 1;
    } else if (lastActive !== todayStr) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastActive === yesterday.toDateString()) {
        user.streak.current += 1;
        if (user.streak.current > user.streak.longest)
          user.streak.longest = user.streak.current;
      } else {
        user.streak.current = 1;
      }
      user.stats.activeDays += 1;
    }
    user.streak.lastActiveDate = today;

    await user.save();
    await invalidateUserCache(userId);

    // --- 2. Update UserQuestionProgress atomically ---
    await UserQuestionProgress.findOneAndUpdate(
      { userId, questionId },
      {
        $inc: {
          totalTimeSpent: timeSpent,
          ...(isFirstSolve ? { "attempts.count": 1 } : {}),
        },
        $set: {
          status: "Solved",
          "attempts.solvedAt": solvedDate,
          "attempts.lastAttemptAt": solvedDate,
          updatedAt: solvedDate,
        },
        $setOnInsert: {
          "attempts.firstAttemptAt": solvedDate,
        },
      },
      { upsert: true, new: true },
    );

    // --- 3. Update PatternMastery for each pattern ---
    if (
      question.pattern &&
      Array.isArray(question.pattern) &&
      question.pattern.length > 0
    ) {
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
          if (!pattern.title) pattern.title = patternName;
          if (!pattern.description)
            pattern.description = `Problems using the ${patternName} pattern`;
        }

        if (isFirstSolve) {
          pattern.solvedCount += 1;
          pattern.totalAttempts += 1;
          pattern.successfulAttempts += 1;
        } else {
          // Repeat solve: still count as an attempt, but not as a new solve
          pattern.totalAttempts += 1;
          pattern.successfulAttempts += 1;
        }

        if (pattern.successfulAttempts > pattern.totalAttempts) {
          console.warn(
            `[pattern] Data inconsistency for ${patternName}: successfulAttempts=${pattern.successfulAttempts}, totalAttempts=${pattern.totalAttempts}. Correcting.`,
          );
          pattern.successfulAttempts = pattern.totalAttempts;
        }

        pattern.successRate =
          pattern.totalAttempts > 0
            ? Math.min(
                100,
                (pattern.successfulAttempts / pattern.totalAttempts) * 100,
              )
            : 0;

        const totalPatternQuestions = await Question.countDocuments({
          pattern: patternName,
        });
        pattern.masteryRate =
          totalPatternQuestions > 0
            ? Math.min(
                100,
                (pattern.masteredCount / totalPatternQuestions) * 100,
              )
            : 0;

        pattern.confidenceLevel =
          pattern.masteryRate >= 80
            ? 5
            : pattern.masteryRate >= 60
              ? 4
              : pattern.masteryRate >= 40
                ? 3
                : pattern.masteryRate >= 20
                  ? 2
                  : 1;

        pattern.lastPracticed = solvedDate;
        pattern.lastUpdated = new Date();

        pattern.recentQuestions.unshift({
          questionProgressId: progressId,
          questionId,
          platformQuestionId: question.platformQuestionId,
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
    }

    // --- 4. RevisionSchedule (auto‑complete first revision) – only for first solve ---
    if (isFirstSolve) {
      const existingRevision = await RevisionSchedule.findOne({
        userId,
        questionId,
      });
      if (!existingRevision) {
        const baseDate = solvedDate;
        const schedule = [1, 3, 7, 14, 30].map((days) => {
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
          status: "active",
          currentRevisionIndex: 1,
          completedRevisions: [
            {
              date: schedule[0],
              completedAt: new Date(),
              status: "completed",
            },
          ],
        });
      }
      await invalidateCache(`revisions:*:user:${userId}:*`);
    }

    // --- 5. Update Goals (only first solve contributes to goal progress) ---
    if (isFirstSolve) {
      const dayStart = getStartOfDay(solvedDate);
      const dailyGoal = await Goal.findOne({
        userId,
        goalType: "daily",
        startDate: { $lte: dayStart },
        endDate: { $gte: dayStart },
        status: "active",
      });
      if (dailyGoal) {
        dailyGoal.completedCount += 1;
        await dailyGoal.save();
        if (dailyGoal.completedCount >= dailyGoal.targetCount) {
          const { goalCompletedQueue } = require("../queue.service");
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
    }

    // --- 6. ActivityLog (always log) ---
    await ActivityLog.create({
      userId,
      action: "question_solved",
      targetId: questionId,
      targetModel: "Question",
      metadata: {
        title: question.title,
        difficulty: question.difficulty,
        platform: question.platform,
        pattern: question.pattern,
        timeSpent,
        isFirstSolve,
      },
      timestamp: solvedDate,
    });

    // --- 7. HeatmapData – create if missing, update correctly ---
    const year = solvedDate.getUTCFullYear();
    let heatmap = await HeatmapData.findOne({ userId, year });
    if (!heatmap) {
      heatmap = await heatmapService.generateHeatmapData(userId, year);
    }
    if (heatmap) {
      const activityDateStr = solvedDate.toISOString().split("T")[0];
      const dayEntry = heatmap.dailyData.find(
        (d) => d.date.toISOString().split("T")[0] === activityDateStr,
      );
      if (dayEntry) {
        // Always increment total activities and time spent
        dayEntry.totalActivities += 1;
        dayEntry.totalSubmissions += 1;
        dayEntry.totalTimeSpent += timeSpent;

        // Only increment newProblemsSolved on first solve
        if (isFirstSolve) {
          dayEntry.newProblemsSolved += 1;
        }

        // Update intensity level (0-4 based on totalActivities)
        dayEntry.intensityLevel = Math.min(
          4,
          Math.floor(dayEntry.totalActivities / 3),
        );
      } else {
        console.error(
          `[heatmap] No daily entry found for date ${activityDateStr}`,
        );
      }
      heatmap.lastUpdated = new Date();
      await heatmap.save();
      await invalidateCache(`heatmap:*:user:${userId}:*`);
    }

    // --- 8. Notifications ---
    if (isFirstSolve) {
      await Notification.create({
        userId,
        type: "question_solved",
        title: "Problem Solved!",
        message: `You solved "${question.title}"`,
        data: {
          questionId,
          title: question.title,
          difficulty: question.difficulty,
          platform: question.platform,
          timeSpent,
        },
        channel: "in-app",
        status: "sent",
        scheduledAt: new Date(),
      });

      const solvedCount = user.stats.totalSolved;
      const milestones = [1, 10, 25, 50, 100, 250, 500, 1000];
      if (milestones.includes(solvedCount)) {
        await Notification.create({
          userId,
          type: "goal_completion",
          title: "Milestone Achieved!",
          message: `Congratulations! You've solved ${solvedCount} problems.`,
          data: { milestone: solvedCount },
          channel: "in-app",
          status: "sent",
          scheduledAt: new Date(),
        });
      }
    }

    await invalidateCache(`notifications:*:user:${userId}:*`);
  } catch (error) {
    console.error(
      `[question.solved] Error processing for user ${userId}:`,
      error,
    );
    throw error;
  }
};

module.exports = { handleQuestionSolved };
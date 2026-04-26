const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const Goal = require('../models/Goal');
const User = require('../models/User');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const GoalSnapshot = require('../models/GoalSnapshot');
const {
  getStartOfMonth,
  getEndOfMonth,
  getStartOfYear,
  getEndOfYear,
} = require('../utils/helpers/date');

class GoalSnapshotService {
  static async generateUserSnapshot(userId, year, month, periodType, timeZone = 'UTC') {
    let startDate, endDate;
    if (periodType === 'monthly') {
      const utcDate = new Date(Date.UTC(year, month - 1, 1));
      startDate = getStartOfMonth(utcDate, timeZone);
      endDate = getEndOfMonth(utcDate, timeZone);
    } else {
      const utcDate = new Date(Date.UTC(year, 0, 1));
      startDate = getStartOfYear(utcDate, timeZone);
      endDate = getEndOfYear(utcDate, timeZone);
    }

    const goalsCompleted = await Goal.countDocuments({
      userId,
      status: 'completed',
      achievedAt: { $gte: startDate, $lte: endDate },
    });

    const goalsNotCompleted = await Goal.countDocuments({
      userId,
      status: 'failed',
      endDate: { $gte: startDate, $lte: endDate },
    });

    const solvedRecords = await UserQuestionProgress.find({
      userId,
      status: 'Solved',
      'attempts.solvedAt': { $gte: startDate, $lte: endDate },
    })
      .select('questionId attempts.solvedAt')
      .lean();

    let questionsSolvedForGoals = 0;
    if (solvedRecords.length > 0) {
      const activeGoals = await Goal.find({
        userId,
        status: 'active',
        $or: [
          { goalType: 'daily', startDate: { $lte: endDate }, endDate: { $gte: startDate } },
          { goalType: 'weekly', startDate: { $lte: endDate }, endDate: { $gte: startDate } },
          { goalType: 'planned', startDate: { $lte: endDate }, endDate: { $gte: startDate } },
        ],
      }).lean();

      if (activeGoals.length > 0) {
        const plannedTargetQuestionIds = new Set();
        const dailyWeeklyExists = activeGoals.some(g => g.goalType === 'daily' || g.goalType === 'weekly');

        for (const goal of activeGoals) {
          if (goal.goalType === 'planned' && goal.targetQuestions) {
            for (const qId of goal.targetQuestions) {
              plannedTargetQuestionIds.add(qId.toString());
            }
          }
        }

        for (const solve of solvedRecords) {
          const solveDate = solve.attempts.solvedAt;
          let isGoalRelated = false;

          if (dailyWeeklyExists) {
            const matchingDailyWeekly = activeGoals.some(g => {
              if (g.goalType !== 'daily' && g.goalType !== 'weekly') return false;
              return solveDate >= g.startDate && solveDate <= g.endDate;
            });
            if (matchingDailyWeekly) isGoalRelated = true;
          }

          if (!isGoalRelated && plannedTargetQuestionIds.size > 0) {
            if (plannedTargetQuestionIds.has(solve.questionId.toString())) {
              const matchingPlanned = activeGoals.some(g => {
                if (g.goalType !== 'planned') return false;
                if (!g.targetQuestions.map(id => id.toString()).includes(solve.questionId.toString())) return false;
                return solveDate >= g.startDate && solveDate <= g.endDate;
              });
              if (matchingPlanned) isGoalRelated = true;
            }
          }

          if (isGoalRelated) questionsSolvedForGoals++;
        }
      }
    }

    const snapshot = await GoalSnapshot.findOneAndUpdate(
      {
        userId,
        periodType,
        year,
        month: periodType === 'monthly' ? month : 0,
      },
      {
        $set: {
          goalsCompleted,
          goalsNotCompleted,
          questionsSolvedForGoals,
          calculatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
    return snapshot;
  }

  static async generateGlobalSnapshot(year, month, periodType, timeZone = 'UTC') {
    const publicUsers = await User.find({
      privacy: { $in: ['public', 'link-only'] },
      isActive: true,
    }).select('_id');

    const userIds = publicUsers.map(u => u._id);
    if (userIds.length === 0) {
      const snapshot = await GoalSnapshot.findOneAndUpdate(
        {
          userId: null,
          periodType,
          year,
          month: periodType === 'monthly' ? month : 0,
        },
        {
          $set: {
            avgGoalsCompleted: 0,
            contributingUsersCount: 0,
            calculatedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
      return snapshot;
    }

    const matchCondition = {
      userId: { $in: userIds },
      periodType,
      year,
      month: periodType === 'monthly' ? month : 0,
    };
    const aggregation = await GoalSnapshot.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          totalGoalsCompleted: { $sum: '$goalsCompleted' },
          userCount: { $sum: 1 },
        },
      },
    ]);

    let avgGoalsCompleted = 0;
    let contributingUsersCount = 0;
    if (aggregation.length > 0) {
      contributingUsersCount = aggregation[0].userCount;
      avgGoalsCompleted = contributingUsersCount > 0 ? aggregation[0].totalGoalsCompleted / contributingUsersCount : 0;
    }
    avgGoalsCompleted = Math.round(avgGoalsCompleted * 100) / 100;

    const snapshot = await GoalSnapshot.findOneAndUpdate(
      {
        userId: null,
        periodType,
        year,
        month: periodType === 'monthly' ? month : 0,
      },
      {
        $set: {
          avgGoalsCompleted,
          contributingUsersCount,
          calculatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
    return snapshot;
  }

  static async backfillUserSnapshots(userId, timeZone = 'UTC', monthsBack = 12) {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1;

    for (let offset = 0; offset < monthsBack; offset++) {
      let year = currentYear;
      let month = currentMonth - offset;
      if (month <= 0) {
        month += 12;
        year -= 1;
      }
      if (year < 2000) continue;
      await this.generateUserSnapshot(userId, year, month, 'monthly', timeZone);
    }

    const targetYears = new Set();
    for (let offset = 0; offset < monthsBack; offset++) {
      let year = currentYear;
      let month = currentMonth - offset;
      if (month <= 0) {
        month += 12;
        year -= 1;
      }
      targetYears.add(year);
    }
    for (const year of targetYears) {
      await this.generateUserSnapshot(userId, year, 0, 'yearly', timeZone);
    }
  }

  static async getChartData(userId, periodType, options = {}) {
    const { year = null, months = 12, includeComparison = true, timeZone = 'UTC' } = options;

    let labels = [];
    let userGoalsCompleted = [];
    let userGoalsNotCompleted = [];
    let userQuestionsSolvedForGoals = [];
    let comparisonAvgGoalsCompleted = [];

    if (periodType === 'monthly') {
      let targetMonths = [];
      const now = new Date();
      const currentYear = now.getUTCFullYear();
      const currentMonth = now.getUTCMonth() + 1;

      if (year) {
        for (let month = 1; month <= 12; month++) {
          targetMonths.push({ year, month });
          const utcDate = new Date(Date.UTC(year, month - 1, 1));
          const label = DateTime.fromJSDate(utcDate, { zone: timeZone }).toFormat('MMM yyyy');
          labels.push(label);
        }
      } else {
        for (let offset = 0; offset < months; offset++) {
          let y = currentYear;
          let m = currentMonth - offset;
          if (m <= 0) {
            m += 12;
            y -= 1;
          }
          if (y < 2000) continue;
          targetMonths.unshift({ year: y, month: m });
          const utcDate = new Date(Date.UTC(y, m - 1, 1));
          const label = DateTime.fromJSDate(utcDate, { zone: timeZone }).toFormat('MMM yyyy');
          labels.unshift(label);
        }
      }

      const userSnapshots = await GoalSnapshot.find({
        userId,
        periodType: 'monthly',
        $or: targetMonths.map(tm => ({ year: tm.year, month: tm.month })),
      }).lean();

      const userMap = new Map();
      for (const snap of userSnapshots) {
        const key = `${snap.year}-${snap.month}`;
        userMap.set(key, snap);
      }

      let globalMap = new Map();
      if (includeComparison) {
        const globalSnapshots = await GoalSnapshot.find({
          userId: null,
          periodType: 'monthly',
          $or: targetMonths.map(tm => ({ year: tm.year, month: tm.month })),
        }).lean();
        for (const snap of globalSnapshots) {
          const key = `${snap.year}-${snap.month}`;
          globalMap.set(key, snap);
        }
      }

      for (const { year: y, month: m } of targetMonths) {
        const key = `${y}-${m}`;
        const userSnap = userMap.get(key) || {
          goalsCompleted: 0,
          goalsNotCompleted: 0,
          questionsSolvedForGoals: 0,
        };
        userGoalsCompleted.push(userSnap.goalsCompleted);
        userGoalsNotCompleted.push(userSnap.goalsNotCompleted);
        userQuestionsSolvedForGoals.push(userSnap.questionsSolvedForGoals);
        if (includeComparison) {
          const globalSnap = globalMap.get(key) || { avgGoalsCompleted: 0 };
          comparisonAvgGoalsCompleted.push(globalSnap.avgGoalsCompleted);
        }
      }
    } else {
      let targetYears = [];
      if (year) {
        targetYears = [year];
        labels = [`${year}`];
      } else {
        const currentYear = new Date().getUTCFullYear();
        for (let y = currentYear - months + 1; y <= currentYear; y++) {
          if (y >= 2000) targetYears.push(y);
          labels.push(`${y}`);
        }
      }

      const userSnapshots = await GoalSnapshot.find({
        userId,
        periodType: 'yearly',
        year: { $in: targetYears },
        month: 0,
      }).lean();

      const userMap = new Map();
      for (const snap of userSnapshots) {
        userMap.set(snap.year, snap);
      }

      let globalMap = new Map();
      if (includeComparison) {
        const globalSnapshots = await GoalSnapshot.find({
          userId: null,
          periodType: 'yearly',
          year: { $in: targetYears },
          month: 0,
        }).lean();
        for (const snap of globalSnapshots) {
          globalMap.set(snap.year, snap);
        }
      }

      for (const y of targetYears) {
        const userSnap = userMap.get(y) || {
          goalsCompleted: 0,
          goalsNotCompleted: 0,
          questionsSolvedForGoals: 0,
        };
        userGoalsCompleted.push(userSnap.goalsCompleted);
        userGoalsNotCompleted.push(userSnap.goalsNotCompleted);
        userQuestionsSolvedForGoals.push(userSnap.questionsSolvedForGoals);
        if (includeComparison) {
          const globalSnap = globalMap.get(y) || { avgGoalsCompleted: 0 };
          comparisonAvgGoalsCompleted.push(globalSnap.avgGoalsCompleted);
        }
      }
    }

    const result = {
      labels,
      user: {
        goalsCompleted: userGoalsCompleted,
        goalsNotCompleted: userGoalsNotCompleted,
        questionsSolvedGoalRelated: userQuestionsSolvedForGoals,
      },
      comparison: includeComparison ? { avgGoalsCompleted: comparisonAvgGoalsCompleted } : null,
    };
    return result;
  }

  static async generateForAllUsers(targetDate, periodType, timeZone = 'UTC') {
    const year = targetDate.getUTCFullYear();
    const month = periodType === 'monthly' ? targetDate.getUTCMonth() + 1 : 0;

    const users = await User.find({ isActive: true }).select('_id');
    const userIds = users.map(u => u._id);

    const batchSize = 100;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      await Promise.all(
        batch.map(userId => this.generateUserSnapshot(userId, year, month, periodType, timeZone))
      );
    }

    await this.generateGlobalSnapshot(year, month, periodType, timeZone);
  }
}

module.exports = GoalSnapshotService;
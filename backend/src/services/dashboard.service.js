const Goal = require('../models/Goal');
const RevisionSchedule = require('../models/RevisionSchedule');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const HeatmapData = require('../models/HeatmapData');
const Notification = require('../models/Notification');
const PatternMastery = require('../models/PatternMastery');
const Question = require('../models/Question');
const GoalSnapshotService = require('./goalSnapshot.service');
const leetcodeService = require('./leetcode.service');
const { calculateIntensityLevel } = require('./heatmap.service');
const { getStartOfDay, getEndOfDay, getStartOfWeek, getEndOfWeek } = require('../utils/helpers/date');
const { slugify } = require('../utils/helpers/string');

const getUserStats = (user) => ({
  totalSolved: user.stats?.totalSolved || 0,
  masteryRate: Math.round((user.stats?.masteryRate || 0) * 100) / 100,
  currentStreak: user.streak?.current || 0,
  longestStreak: user.streak?.longest || 0
});

const getCurrentGoals = async (userId, timeZone) => {
  const now = new Date();
  const todayStart = getStartOfDay(now, timeZone);
  const todayEnd = getEndOfDay(now, timeZone);

  const [dailyGoal, weeklyGoal] = await Promise.all([
    Goal.findOne({
      userId,
      goalType: 'daily',
      startDate: { $lte: todayEnd },
      endDate: { $gte: todayStart },
      status: 'active'
    }).lean(),
    Goal.findOne({
      userId,
      goalType: 'weekly',
      startDate: { $lte: todayEnd },
      endDate: { $gte: todayStart },
      status: 'active'
    }).lean()
  ]);

  return {
    daily: dailyGoal ? {
      target: dailyGoal.targetCount,
      completed: dailyGoal.completedCount,
      percent: dailyGoal.completionPercentage
    } : null,
    weekly: weeklyGoal ? {
      target: weeklyGoal.targetCount,
      completed: weeklyGoal.completedCount,
      percent: weeklyGoal.completionPercentage
    } : null
  };
};

const getGoalGraph = async (userId, timeZone) => {
  try {
    const chartData = await GoalSnapshotService.getChartData(userId, 'monthly', {
      months: 6,
      includeComparison: true,
      timeZone
    });
    return {
      labels: chartData.labels,
      datasets: [
        { label: 'Goals Completed', data: chartData.user.goalsCompleted },
        { label: 'Goal Related Solved', data: chartData.user.questionsSolvedGoalRelated }
      ],
      comparisonAvg: chartData.comparison?.avgGoalsCompleted || null
    };
  } catch (error) {
    console.error('Error fetching goal graph:', error);
    return { labels: [], datasets: [], comparisonAvg: null };
  }
};

const getRevisionsData = async (userId, timeZone) => {
  const todayStart = getStartOfDay(new Date(), timeZone);
  const todayEnd = getEndOfDay(new Date(), timeZone);
  const nextWeekEnd = getEndOfDay(new Date(todayStart.getTime() + 7 * 86400000));

  const pendingCountResult = await RevisionSchedule.aggregate([
    { $match: { userId, status: 'active' } },
    { $project: { nextDue: { $arrayElemAt: ['$schedule', '$currentRevisionIndex'] } } },
    { $match: { nextDue: { $gte: todayStart, $lte: todayEnd } } },
    { $count: 'count' }
  ]);
  const pendingTodayCount = pendingCountResult[0]?.count || 0;

  const pendingList = await RevisionSchedule.aggregate([
    { $match: { userId, status: 'active' } },
    { $addFields: { nextDue: { $arrayElemAt: ['$schedule', '$currentRevisionIndex'] } } },
    { $match: { nextDue: { $gte: todayStart, $lte: todayEnd } } },
    { $sort: { nextDue: 1 } },
    { $limit: 5 },
    { $lookup: { from: 'questions', localField: 'questionId', foreignField: '_id', as: 'question' } },
    { $unwind: '$question' },
    {
      $lookup: {
        from: 'userquestionprogresses',
        let: { qId: '$question._id' },
        pipeline: [
          { $match: { $expr: { $and: [ { $eq: ['$userId', userId] }, { $eq: ['$questionId', '$$qId'] } ] } } },
          { $limit: 1 }
        ],
        as: 'progress'
      }
    },
    { $unwind: { path: '$progress', preserveNullAndEmptyArrays: true } },
    { $project: {
        questionId: '$question._id',
        platformQuestionId: '$question.platformQuestionId',
        title: '$question.title',
        platform: '$question.platform',
        difficulty: '$question.difficulty',
        scheduledDate: '$nextDue',
        overdue: { $lt: ['$nextDue', todayStart] },
        totalTimeSpent: { $ifNull: ['$progress.totalTimeSpent', 0] },
        revisionCount: { $ifNull: ['$progress.revisionCount', 0] },
        attemptsCount: { $ifNull: ['$progress.attempts.count', 0] },
        lastPracticed: {
          $ifNull: [
            '$progress.lastRevisedAt',
            { $ifNull: ['$progress.updatedAt', '$progress.attempts.lastAttemptAt'] }
          ]
        },
        status: { $ifNull: ['$progress.status', 'Not Started'] }
      }
    }
  ]);

  const upcomingCountResult = await RevisionSchedule.aggregate([
    { $match: { userId, status: 'active' } },
    { $project: { nextDue: { $arrayElemAt: ['$schedule', '$currentRevisionIndex'] } } },
    { $match: { nextDue: { $gt: todayEnd, $lte: nextWeekEnd } } },
    { $count: 'count' }
  ]);
  const upcomingCount = upcomingCountResult[0]?.count || 0;

  return { pendingTodayCount, pendingToday: pendingList, upcomingCount };
};

const getRecentActivity = async (userId, timeZone) => {
  const solved = await UserQuestionProgress.find({
    userId,
    status: { $in: ['Solved', 'Mastered'] },
    'attempts.solvedAt': { $exists: true }
  })
    .sort({ 'attempts.solvedAt': -1 })
    .limit(5)
    .populate('questionId', '_id platformQuestionId title platform difficulty')
    .lean();

  const solvedItems = solved.map(s => ({
    type: 'solved',
    questionId: s.questionId._id,
    platformQuestionId: s.questionId.platformQuestionId,
    title: s.questionId.title,
    platform: s.questionId.platform,
    difficulty: s.questionId.difficulty,
    timestamp: s.attempts.solvedAt,
    totalTimeSpent: s.totalTimeSpent || 0,
    revisionCount: s.revisionCount || 0,
    attemptsCount: s.attempts?.count || 0,
    lastPracticed: s.lastRevisedAt || s.updatedAt || s.attempts?.lastAttemptAt || null,
    status: s.status
  }));

  const revisions = await RevisionSchedule.aggregate([
    { $match: { userId } },
    { $unwind: '$completedRevisions' },
    { $match: { 'completedRevisions.status': 'completed' } },
    { $sort: { 'completedRevisions.completedAt': -1 } },
    { $limit: 5 },
    { $lookup: { from: 'questions', localField: 'questionId', foreignField: '_id', as: 'question' } },
    { $unwind: '$question' },
    {
      $lookup: {
        from: 'userquestionprogresses',
        let: { qId: '$question._id' },
        pipeline: [
          { $match: { $expr: { $and: [ { $eq: ['$userId', userId] }, { $eq: ['$questionId', '$$qId'] } ] } } },
          { $limit: 1 }
        ],
        as: 'progress'
      }
    },
    { $unwind: { path: '$progress', preserveNullAndEmptyArrays: true } },
    { $project: {
        questionId: '$question._id',
        platformQuestionId: '$question.platformQuestionId',
        title: '$question.title',
        platform: '$question.platform',
        difficulty: '$question.difficulty',
        timestamp: '$completedRevisions.completedAt',
        totalTimeSpent: { $ifNull: ['$progress.totalTimeSpent', 0] },
        revisionCount: { $ifNull: ['$progress.revisionCount', 0] },
        attemptsCount: { $ifNull: ['$progress.attempts.count', 0] },
        lastPracticed: {
          $ifNull: [
            '$progress.lastRevisedAt',
            { $ifNull: ['$progress.updatedAt', '$progress.attempts.lastAttemptAt'] }
          ]
        },
        status: { $ifNull: ['$progress.status', 'Not Started'] }
      }
    }
  ]);

  const revisionItems = revisions.map(r => ({
    type: 'revision',
    questionId: r.questionId,
    platformQuestionId: r.platformQuestionId,
    title: r.title,
    platform: r.platform,
    difficulty: r.difficulty,
    timestamp: r.timestamp,
    totalTimeSpent: r.totalTimeSpent,
    revisionCount: r.revisionCount,
    attemptsCount: r.attemptsCount,
    lastPracticed: r.lastPracticed,
    status: r.status
  }));

  const all = [...solvedItems, ...revisionItems];
  all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return all.slice(0, 5);
};

const getHeatmapSummary = async (userId) => {
  const year = new Date().getFullYear();
  const heatmap = await HeatmapData.findOne({ userId, year }).select('statsPanel').lean();
  if (!heatmap?.statsPanel) {
    return { yearlyProblems: 0, activeDaysPercentage: 0, consistencyScore: 0 };
  }
  return {
    yearlyProblems: heatmap.statsPanel.yearlyProblems || 0,
    activeDaysPercentage: heatmap.statsPanel.activeDays?.percentage || 0,
    consistencyScore: heatmap.statsPanel.consistencyScore || 0
  };
};

const getDailyProblem = async (userId) => {
  try {
    const daily = await leetcodeService.getDailyProblem();
    if (!daily) return null;
    const todayUTC = new Date().toISOString().split('T')[0];
    const isActive = daily.date === todayUTC;

    // Fetch the corresponding question from the database
    const question = await Question.findOne({
      platform: 'LeetCode',
      platformQuestionId: daily.titleSlug,
      isActive: true
    }).lean();

    let progress = null;
    let questionId = null;
    if (question) {
      questionId = question._id;
      progress = await UserQuestionProgress.findOne({ userId, questionId }).lean();
    }

    return {
      title: daily.title,
      link: daily.link,
      difficulty: daily.difficulty,
      date: daily.date,
      isActive,
      platformQuestionId: daily.titleSlug,
      questionId,
      totalTimeSpent: progress?.totalTimeSpent || 0,
      revisionCount: progress?.revisionCount || 0,
      attemptsCount: progress?.attempts?.count || 0,
      lastPracticed: progress?.lastRevisedAt || progress?.updatedAt || progress?.attempts?.lastAttemptAt || null,
      status: progress?.status || 'Not Started'
    };
  } catch (error) {
    console.error('Error fetching daily problem:', error);
    return null;
  }
};

const getUnreadNotificationsCount = async (userId) => {
  return Notification.countDocuments({ userId, readAt: null });
};

const getRecentNotifications = async (userId) => {
  const notifications = await Notification.find({ userId, status: 'sent' })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
  return notifications.map(n => ({
    id: n._id,
    type: n.type,
    title: n.title,
    message: n.message,
    createdAt: n.createdAt,
    read: !!n.readAt
  }));
};

const getRecentRevisions = async (userId, timeZone) => {
  const todayStart = getStartOfDay(new Date(), timeZone);
  const todayEnd = getEndOfDay(new Date(), timeZone);

  const pendingItems = await RevisionSchedule.aggregate([
    { $match: { userId, status: 'active' } },
    { $addFields: { nextDue: { $arrayElemAt: ['$schedule', '$currentRevisionIndex'] } } },
    { $match: { nextDue: { $gte: todayStart, $lte: todayEnd } } },
    { $lookup: { from: 'questions', localField: 'questionId', foreignField: '_id', as: 'question' } },
    { $unwind: '$question' },
    {
      $lookup: {
        from: 'userquestionprogresses',
        let: { qId: '$question._id' },
        pipeline: [
          { $match: { $expr: { $and: [ { $eq: ['$userId', userId] }, { $eq: ['$questionId', '$$qId'] } ] } } },
          { $limit: 1 }
        ],
        as: 'progress'
      }
    },
    { $unwind: { path: '$progress', preserveNullAndEmptyArrays: true } },
    { $project: {
        _id: 0,
        questionId: '$question._id',
        platformQuestionId: '$question.platformQuestionId',
        title: '$question.title',
        platform: '$question.platform',
        difficulty: '$question.difficulty',
        date: '$nextDue',
        isPending: { $literal: true },
        totalTimeSpent: { $ifNull: ['$progress.totalTimeSpent', 0] },
        revisionCount: { $ifNull: ['$progress.revisionCount', 0] },
        attemptsCount: { $ifNull: ['$progress.attempts.count', 0] },
        lastPracticed: {
          $ifNull: [
            '$progress.lastRevisedAt',
            { $ifNull: ['$progress.updatedAt', '$progress.attempts.lastAttemptAt'] }
          ]
        },
        status: { $ifNull: ['$progress.status', 'Not Started'] }
      }
    }
  ]);

  const pendingQuestionIds = new Set(pendingItems.map(item => item.questionId.toString()));

  const completedRevisions = await RevisionSchedule.aggregate([
    { $match: { userId } },
    { $unwind: '$completedRevisions' },
    { $match: { 'completedRevisions.status': 'completed' } },
    { $sort: { 'completedRevisions.completedAt': -1 } },
    { $limit: 10 },
    { $lookup: { from: 'questions', localField: 'questionId', foreignField: '_id', as: 'question' } },
    { $unwind: '$question' },
    {
      $lookup: {
        from: 'userquestionprogresses',
        let: { qId: '$question._id' },
        pipeline: [
          { $match: { $expr: { $and: [ { $eq: ['$userId', userId] }, { $eq: ['$questionId', '$$qId'] } ] } } },
          { $limit: 1 }
        ],
        as: 'progress'
      }
    },
    { $unwind: { path: '$progress', preserveNullAndEmptyArrays: true } },
    { $project: {
        questionId: '$question._id',
        platformQuestionId: '$question.platformQuestionId',
        title: '$question.title',
        platform: '$question.platform',
        difficulty: '$question.difficulty',
        date: '$completedRevisions.completedAt',
        totalTimeSpent: { $ifNull: ['$progress.totalTimeSpent', 0] },
        revisionCount: { $ifNull: ['$progress.revisionCount', 0] },
        attemptsCount: { $ifNull: ['$progress.attempts.count', 0] },
        lastPracticed: {
          $ifNull: [
            '$progress.lastRevisedAt',
            { $ifNull: ['$progress.updatedAt', '$progress.attempts.lastAttemptAt'] }
          ]
        },
        status: { $ifNull: ['$progress.status', 'Not Started'] }
      }
    }
  ]);

  const result = [...pendingItems];
  const used = new Set(pendingQuestionIds);
  for (const rev of completedRevisions) {
    if (result.length >= 5) break;
    const idStr = rev.questionId.toString();
    if (!used.has(idStr)) {
      used.add(idStr);
      result.push({ ...rev, isPending: false });
    }
  }
  return result.slice(0, 5);
};

const getRecentlySolved = async (userId) => {
  const solved = await UserQuestionProgress.find({
    userId,
    status: { $in: ['Solved', 'Mastered'] },
    'attempts.solvedAt': { $exists: true }
  })
    .sort({ 'attempts.solvedAt': -1 })
    .limit(5)
    .populate('questionId', '_id platformQuestionId title platform difficulty')
    .lean();

  return solved.map(s => ({
    questionId: s.questionId._id,
    platformQuestionId: s.questionId.platformQuestionId,
    title: s.questionId.title,
    platform: s.questionId.platform,
    difficulty: s.questionId.difficulty,
    solvedAt: s.attempts.solvedAt,
    totalTimeSpent: s.totalTimeSpent || 0,
    revisionCount: s.revisionCount || 0,
    attemptsCount: s.attempts?.count || 0,
    lastPracticed: s.lastRevisedAt || s.updatedAt || s.attempts?.lastAttemptAt || null,
    status: s.status
  }));
};

const getWeeklyStudyTime = async (userId, timeZone) => {
  const now = new Date();
  const weekStart = getStartOfWeek(now, timeZone);
  const weekEnd = getEndOfWeek(now, timeZone);
  const year = now.getUTCFullYear();

  const heatmap = await HeatmapData.findOne({ userId, year }).select('dailyData').lean();
  if (!heatmap?.dailyData) return 0;

  let total = 0;
  for (const day of heatmap.dailyData) {
    const dayDate = new Date(day.date);
    if (dayDate >= weekStart && dayDate <= weekEnd) total += day.totalTimeSpent || 0;
  }
  return total;
};

const getRevisionCompletionRate = async (userId, timeZone) => {
  const now = new Date();
  const todayStart = getStartOfDay(now, timeZone);
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(todayStart);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const scheduledLast7 = await RevisionSchedule.aggregate([
    { $match: { userId, status: 'active' } },
    { $project: { nextDue: { $arrayElemAt: ['$schedule', '$currentRevisionIndex'] } } },
    { $match: { nextDue: { $gte: sevenDaysAgo, $lt: todayStart } } },
    { $count: 'count' }
  ]);
  const scheduledPrev7 = await RevisionSchedule.aggregate([
    { $match: { userId, status: 'active' } },
    { $project: { nextDue: { $arrayElemAt: ['$schedule', '$currentRevisionIndex'] } } },
    { $match: { nextDue: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } } },
    { $count: 'count' }
  ]);

  const scheduledLast = scheduledLast7[0]?.count || 0;
  const scheduledPrev = scheduledPrev7[0]?.count || 0;

  const completedLast7 = await RevisionSchedule.aggregate([
    { $match: { userId } },
    { $unwind: '$completedRevisions' },
    { $match: { 'completedRevisions.completedAt': { $gte: sevenDaysAgo, $lt: todayStart }, 'completedRevisions.status': 'completed' } },
    { $count: 'count' }
  ]);
  const completedPrev7 = await RevisionSchedule.aggregate([
    { $match: { userId } },
    { $unwind: '$completedRevisions' },
    { $match: { 'completedRevisions.completedAt': { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }, 'completedRevisions.status': 'completed' } },
    { $count: 'count' }
  ]);

  const lastCompleted = completedLast7[0]?.count || 0;
  const prevCompleted = completedPrev7[0]?.count || 0;

  const lastRate = scheduledLast ? (lastCompleted / scheduledLast) * 100 : 0;
  const prevRate = scheduledPrev ? (prevCompleted / scheduledPrev) * 100 : 0;
  let trend = 0;
  if (lastRate > prevRate) trend = 1;
  else if (lastRate < prevRate) trend = -1;

  return { percentage: Math.round(lastRate), trend, completed: lastCompleted, scheduled: scheduledLast };
};

const getUpcomingRevisionsList = async (userId, timeZone, limit = 5) => {
  const todayEnd = getEndOfDay(new Date(), timeZone);
  const nextWeekEnd = getEndOfDay(new Date(todayEnd.getTime() + 7 * 86400000));

  const upcoming = await RevisionSchedule.aggregate([
    { $match: { userId, status: 'active' } },
    { $addFields: { nextDue: { $arrayElemAt: ['$schedule', '$currentRevisionIndex'] } } },
    { $match: { nextDue: { $gt: todayEnd, $lte: nextWeekEnd } } },
    { $sort: { nextDue: 1 } },
    { $limit: limit },
    { $lookup: { from: 'questions', localField: 'questionId', foreignField: '_id', as: 'question' } },
    { $unwind: '$question' },
    {
      $lookup: {
        from: 'userquestionprogresses',
        let: { qId: '$question._id' },
        pipeline: [
          { $match: { $expr: { $and: [ { $eq: ['$userId', userId] }, { $eq: ['$questionId', '$$qId'] } ] } } },
          { $limit: 1 }
        ],
        as: 'progress'
      }
    },
    { $unwind: { path: '$progress', preserveNullAndEmptyArrays: true } },
    { $project: {
        questionId: '$question._id',
        platformQuestionId: '$question.platformQuestionId',
        title: '$question.title',
        platform: '$question.platform',
        difficulty: '$question.difficulty',
        scheduledDate: '$nextDue',
        totalTimeSpent: { $ifNull: ['$progress.totalTimeSpent', 0] },
        revisionCount: { $ifNull: ['$progress.revisionCount', 0] },
        attemptsCount: { $ifNull: ['$progress.attempts.count', 0] },
        lastPracticed: {
          $ifNull: [
            '$progress.lastRevisedAt',
            { $ifNull: ['$progress.updatedAt', '$progress.attempts.lastAttemptAt'] }
          ]
        },
        status: { $ifNull: ['$progress.status', 'Not Started'] }
      }
    }
  ]);
  return upcoming;
};

const getActivePlannedGoals = async (userId, limit = 2) => {
  const goals = await Goal.find({ userId, goalType: 'planned', status: 'active' })
    .populate('targetQuestions', '_id platformQuestionId title')
    .sort({ endDate: 1 })
    .limit(limit)
    .lean();

  // Collect all target question IDs
  const allQuestionIds = goals.flatMap(goal => goal.targetQuestions.map(q => q._id));
  // Fetch progress for all these questions in one query
  const progressMap = new Map();
  if (allQuestionIds.length) {
    const progresses = await UserQuestionProgress.find({
      userId,
      questionId: { $in: allQuestionIds }
    }).lean();
    for (const p of progresses) {
      progressMap.set(p.questionId.toString(), p);
    }
  }

  // Helper to format date range
  const formatDateRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const startStr = startDate.toLocaleDateString(undefined, options);
    const endStr = endDate.toLocaleDateString(undefined, options);
    return `${startStr} – ${endStr}`;
  };

  return goals.map(goal => ({
    id: goal._id,
    title: formatDateRange(goal.startDate, goal.endDate),   // changed: date range
    description: goal.targetQuestions.length === 1
      ? `Solve ${goal.targetQuestions[0].title}`
      : `Solve ${goal.targetQuestions.length} problems`,
    deadline: goal.endDate,
    progress: {
      completed: goal.completedQuestions.length,
      total: goal.targetQuestions.length,
      percentage: Math.round((goal.completedQuestions.length / goal.targetQuestions.length) * 100)
    },
    questions: goal.targetQuestions.map(q => {
      const prog = progressMap.get(q._id.toString());
      return {
        id: q._id,
        platformQuestionId: q.platformQuestionId,
        title: q.title,
        totalTimeSpent: prog?.totalTimeSpent || 0,
        revisionCount: prog?.revisionCount || 0,
        attemptsCount: prog?.attempts?.count || 0,
        lastPracticed: prog?.lastRevisedAt || prog?.updatedAt || prog?.attempts?.lastAttemptAt || null,
        status: prog?.status || 'Not Started'
      };
    })
  }));
};

const getTopWeakestPattern = async (userId) => {
  const patterns = await PatternMastery.find({ userId, solvedCount: { $gt: 0 } })
    .select('patternName confidenceLevel masteryRate solvedCount')
    .lean();
  if (!patterns.length) return null;
  patterns.sort((a, b) => a.confidenceLevel - b.confidenceLevel || a.masteryRate - b.masteryRate);
  const weakest = patterns[0];
  return {
    patternName: weakest.patternName,
    slug: slugify(weakest.patternName),
    confidenceLevel: weakest.confidenceLevel,
    masteryRate: Math.round(weakest.masteryRate),
    solvedCount: weakest.solvedCount
  };
};

const getCurrentMonthHeatmap = async (userId, timeZone) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-indexed

  // Use UTC-based dates to avoid timezone rollover
  const startOfMonth = getStartOfDay(new Date(Date.UTC(year, month, 1)), timeZone);
  const endOfMonth = getEndOfDay(new Date(Date.UTC(year, month + 1, 0)), timeZone);
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const heatmap = await HeatmapData.findOne({ userId, year })
    .select('dailyData')
    .lean();

  if (!heatmap?.dailyData) {
    const result = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = getStartOfDay(new Date(Date.UTC(year, month, d)), timeZone);
      result.push({
        date: date.toISOString(),
        activityCount: 0,
        intensityLevel: 0
      });
    }
    return result;
  }

  // Filter dailyData to current month
  const monthData = heatmap.dailyData.filter(day => {
    const dayDate = new Date(day.date);
    return dayDate >= startOfMonth && dayDate <= endOfMonth;
  });

  const resultMap = new Map();
  for (const day of monthData) {
    const dateStr = day.date.toISOString().split('T')[0];
    const activityCount = day.totalActivities || 0;
    const intensity = calculateIntensityLevel(activityCount);
    resultMap.set(dateStr, {
      date: day.date,
      activityCount: activityCount,
      intensityLevel: intensity
    });
  }

  const result = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = getStartOfDay(new Date(Date.UTC(year, month, d)), timeZone);
    const dateStr = date.toISOString().split('T')[0];
    if (resultMap.has(dateStr)) {
      result.push(resultMap.get(dateStr));
    } else {
      result.push({
        date: date.toISOString(),
        activityCount: 0,
        intensityLevel: 0
      });
    }
  }
  return result;
};

module.exports = {
  getUserStats,
  getCurrentGoals,
  getGoalGraph,
  getRevisionsData,
  getRecentActivity,
  getHeatmapSummary,
  getDailyProblem,
  getUnreadNotificationsCount,
  getRecentNotifications,
  getRecentRevisions,
  getRecentlySolved,
  getWeeklyStudyTime,
  getRevisionCompletionRate,
  getUpcomingRevisionsList,
  getActivePlannedGoals,
  getTopWeakestPattern,
  getCurrentMonthHeatmap,
};
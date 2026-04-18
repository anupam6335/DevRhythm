const RevisionSchedule = require('../models/RevisionSchedule');
const Question = require('../models/Question');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const { getStartOfDay, getEndOfDay, formatDate, getDaysBetween, isToday } = require('../utils/helpers/date');
const mongoose = require('mongoose');

const calculateRevisionStats = async (userId) => {
  const todayStart = getStartOfDay();
  const todayEnd = getEndOfDay();

  const stats = await RevisionSchedule.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(userId) },
    },
    {
      $facet: {
        totalActive: [
          { $match: { status: 'active' } },
          { $count: 'count' },
        ],
        totalCompleted: [
          { $match: { status: 'completed' } },
          { $count: 'count' },
        ],
        totalOverdue: [
          {
            $match: {
              status: 'active',
              $expr: {
                $and: [
                  { $lt: [{ $arrayElemAt: ['$schedule', '$currentRevisionIndex'] }, todayStart] },
                  { $lt: ['$currentRevisionIndex', { $size: '$schedule' }] },
                ],
              },
            },
          },
          { $count: 'count' },
        ],
        pendingToday: [
          {
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
              status: 'active',
              schedule: { $elemMatch: { $gte: todayStart, $lte: todayEnd } },
              $expr: {
                $lt: ['$currentRevisionIndex', { $size: '$schedule' }],
              },
            },
          },
          { $count: 'count' },
        ],
        pendingWeek: [
          {
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
              status: 'active',
              schedule: {
                $elemMatch: {
                  $gte: todayStart,
                  $lte: new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000),
                },
              },
              $expr: {
                $lt: ['$currentRevisionIndex', { $size: '$schedule' }],
              },
            },
          },
          { $count: 'count' },
        ],
        byRevisionIndex: [
          {
            $match: { status: 'active' },
          },
          {
            $group: {
              _id: '$currentRevisionIndex',
              count: { $sum: 1 },
            },
          },
        ],
        completionStats: [
          {
            $project: {
              totalRevisions: { $size: '$schedule' },
              completedCount: { $size: '$completedRevisions' },
            },
          },
          {
            $group: {
              _id: null,
              totalRevisions: { $sum: '$totalRevisions' },
              totalCompleted: { $sum: '$completedCount' },
            },
          },
        ],
        overdueStats: [
          {
            $match: { status: 'active' },
          },
          {
            $group: {
              _id: null,
              totalOverdueCount: { $sum: '$overdueCount' },
              avgOverdue: { $avg: '$overdueCount' },
            },
          },
        ],
      },
    },
  ]);

  const result = stats[0];
  const totalActive = result.totalActive[0]?.count || 0;
  const totalCompleted = result.totalCompleted[0]?.count || 0;
  const totalOverdue = result.totalOverdue[0]?.count || 0;
  const pendingToday = result.pendingToday[0]?.count || 0;
  const pendingWeek = result.pendingWeek[0]?.count || 0;
  const completionStats = result.completionStats[0];
  const overdueStats = result.overdueStats[0];

  const byRevisionIndex = {};
  result.byRevisionIndex.forEach(item => {
    byRevisionIndex[item._id] = item.count;
  });

  const completionRate = completionStats && completionStats.totalRevisions > 0
    ? Math.round((completionStats.totalCompleted / completionStats.totalRevisions) * 100)
    : 0;

  return {
    totalActive,
    totalCompleted,
    totalOverdue,
    pendingToday,
    pendingWeek,
    completionRate,
    averageOverdue: overdueStats?.avgOverdue || 0,
    byRevisionIndex,
  };
};

const calculateUpcomingStats = async (userId, startDate, endDate) => {
  const stats = await RevisionSchedule.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'active',
      },
    },
    {
      $unwind: {
        path: '$schedule',
        includeArrayIndex: 'revisionIndex',
      },
    },
    {
      $match: {
        $expr: {
          $and: [
            { $gte: ['$schedule', startDate] },
            { $lte: ['$schedule', endDate] },
            { $eq: ['$revisionIndex', '$currentRevisionIndex'] },
          ],
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$schedule' } },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const byDay = {};
  let totalUpcoming = 0;

  stats.forEach(stat => {
    byDay[stat._id] = stat.count;
    totalUpcoming += stat.count;
  });

  return {
    totalUpcoming,
    byDay,
  };
};

const getRevisionStatusLabel = (revision, index = null, mode = 'actionable') => {
  const idx = index !== null ? index : revision.currentRevisionIndex;
  
  if (revision.status === 'completed') {
    return 'Completed';
  }

  const isCompleted = revision.completedRevisions.some(cr => {
    const crDate = new Date(cr.date);
    const schDate = revision.schedule[idx];
    return crDate.getTime() === schDate.getTime();
  });

  if (isCompleted) {
    return 'Completed';
  }

  const dueDate = revision.schedule[idx];
  const todayStart = getStartOfDay();

  if (mode === 'display') {
    if (dueDate < todayStart) return 'Overdue';
    if (isToday(dueDate)) return 'Pending';
    return 'Upcoming';
  }

  if (idx < revision.currentRevisionIndex) {
    return 'Completed';
  }

  if (idx === revision.currentRevisionIndex) {
    if (dueDate < todayStart) return 'Overdue';
    if (isToday(dueDate)) return 'Pending';
    return 'Upcoming';
  }

  return 'Upcoming';
};

const createRevisionSchedule = async (userId, questionId, baseDate, customSchedule = null) => {
  const schedule = customSchedule || [1, 3, 7, 14, 30].map(days => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + days);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const revision = await RevisionSchedule.create({
    userId,
    questionId,
    schedule,
    baseDate,
    status: 'active',
  });

  return revision;
};

const markRevisionComplete = async (revisionId, completedAt = new Date(), status = 'completed') => {
  const revision = await RevisionSchedule.findById(revisionId);

  if (!revision) {
    throw new Error('Revision schedule not found');
  }

  if (revision.currentRevisionIndex >= revision.schedule.length) {
    throw new Error('All revisions already completed');
  }

  const scheduledDate = revision.schedule[revision.currentRevisionIndex];

  revision.completedRevisions.push({
    date: scheduledDate,
    completedAt,
    status,
  });

  revision.currentRevisionIndex += 1;

  if (revision.currentRevisionIndex >= revision.schedule.length) {
    revision.status = 'completed';
  }

  revision.updatedAt = new Date();
  await revision.save();

  return revision;
};

const getPendingRevisionsForDate = async (userId, date) => {
  const dateStart = getStartOfDay(date);
  const dateEnd = getEndOfDay(date);

  const pending = await RevisionSchedule.find({
    userId,
    schedule: { $elemMatch: { $gte: dateStart, $lte: dateEnd } },
    status: 'active',
    $expr: {
      $lt: ['$currentRevisionIndex', { $size: '$schedule' }],
    },
  }).populate('questionId');

  return pending;
};

const updateOverdueRevisions = async () => {
  const today = getStartOfDay();

  const result = await RevisionSchedule.updateMany(
    {
      status: 'active',
      $expr: {
        $and: [
          { $lt: [{ $arrayElemAt: ['$schedule', '$currentRevisionIndex'] }, today] },
          { $lt: ['$currentRevisionIndex', { $size: '$schedule' }] },
        ],
      },
    },
    {
      $inc: { overdueCount: 1 },
      $set: { status: 'overdue', updatedAt: new Date() },
    }
  );

  return result.modifiedCount;
};

// ==================== Detailed Revision Stats ====================

/**
 * Get detailed revision statistics for a user
 * @param {string} userId
 * @returns {Promise<Object>} Detailed stats object
 */
const getDetailedRevisionStats = async (userId) => {
  const objectId = new mongoose.Types.ObjectId(userId);

  // 1. Fetch all revision schedules for the user
  const schedules = await RevisionSchedule.find({ userId: objectId })
    .populate('questionId', 'title difficulty platform pattern platformQuestionId')
    .lean();

  if (!schedules.length) {
    return {
      summary: {
        totalActiveSchedules: 0,
        totalCompletedSchedules: 0,
        totalOverdueSchedules: 0,
        totalRevisionsCompleted: 0,
        totalRevisionsPending: 0,
        completionRate: 0,
        averageOverdueDays: 0,
        maxOverdueDays: 0,
        revisionStreak: { current: 0, longest: 0 }
      },
      byRevisionIndex: [],
      trends: { daily: [], weekly: [], monthly: [] },
      overdueDistribution: { '1-3days': 0, '4-7days': 0, '8-14days': 0, '15-30days': 0, '30+days': 0 },
      upcomingSchedule: [],
      byDifficulty: {},
      byPlatform: {},
      byPattern: [],
      timeStats: { totalMinutesSpent: 0, averageMinutesPerRevision: 0, averageMinutesPerDay: 0, mostProductiveDay: null, mostProductiveDayMinutes: 0, timeByDifficulty: {} },
      confidenceStats: { overallAverageAfter: null, confidenceDistributionAfter: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, confidenceImprovementByRevisionIndex: [] },
      questionLevelDetails: []
    };
  }

  let totalActiveSchedules = 0, totalCompletedSchedules = 0, totalOverdueSchedules = 0;
  let totalRevisionsCompleted = 0, totalRevisionsPending = 0, totalOverdueDaysSum = 0, maxOverdueDays = 0;
  const byIndexMap = new Map();
  const completedRevisionsList = [];
  const overdueDates = [];
  const upcomingMap = new Map();

  const now = new Date();

  for (const schedule of schedules) {
    if (!schedule.questionId) continue;

    if (schedule.status === 'active') totalActiveSchedules++;
    else if (schedule.status === 'completed') totalCompletedSchedules++;
    else if (schedule.status === 'overdue') totalOverdueSchedules++;

    const completedCount = schedule.completedRevisions?.length || 0;
    const totalRevisions = schedule.schedule.length;
    const pendingCount = totalRevisions - schedule.currentRevisionIndex;
    totalRevisionsCompleted += completedCount;
    totalRevisionsPending += pendingCount;

    totalOverdueDaysSum += schedule.overdueCount || 0;
    if ((schedule.overdueCount || 0) > maxOverdueDays) maxOverdueDays = schedule.overdueCount;

    if (schedule.status === 'active') {
      const idx = schedule.currentRevisionIndex;
      byIndexMap.set(idx, (byIndexMap.get(idx) || 0) + 1);
    }

    if (schedule.completedRevisions) {
      for (const rev of schedule.completedRevisions) {
        const dateStr = formatDate(rev.completedAt);
        completedRevisionsList.push({
          date: dateStr,
          timeSpent: rev.timeSpent || 0,
          confidenceAfter: rev.confidenceAfter
        });
      }
    }

    if (schedule.status === 'active' && schedule.currentRevisionIndex < schedule.schedule.length) {
      const dueDate = schedule.schedule[schedule.currentRevisionIndex];
      if (dueDate < now) {
        const daysOverdue = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
        overdueDates.push(daysOverdue);
      }
    }

    if (schedule.status === 'active' && schedule.currentRevisionIndex < schedule.schedule.length) {
      const dueDate = schedule.schedule[schedule.currentRevisionIndex];
      if (dueDate >= now && dueDate <= new Date(now.getTime() + 7 * 86400000)) {
        const dateStr = formatDate(dueDate);
        if (!upcomingMap.has(dateStr)) {
          upcomingMap.set(dateStr, { count: 0, questions: [] });
        }
        const entry = upcomingMap.get(dateStr);
        entry.count++;
        entry.questions.push({
          questionId: schedule.questionId._id,
          platformQuestionId: schedule.questionId.platformQuestionId,
          title: schedule.questionId.title,
          difficulty: schedule.questionId.difficulty,
          platform: schedule.questionId.platform,
          revisionIndex: schedule.currentRevisionIndex,
          dueDate: dueDate
        });
      }
    }
  }

  const totalRevisions = totalRevisionsCompleted + totalRevisionsPending;
  const completionRate = totalRevisions > 0 ? (totalRevisionsCompleted / totalRevisions) * 100 : 0;

  const byRevisionIndex = [];
  for (let i = 0; i <= 4; i++) {
    byRevisionIndex.push({
      index: i,
      totalQuestions: byIndexMap.get(i) || 0,
      completed: 0,
      completionRate: 0,
      skipped: 0, 
      averageTimeSpent: 0,
      averageConfidenceAfter: null,
      dropoutRate: 0
    });
  }

  const dailyMap = new Map();
  const weeklyMap = new Map();
  const monthlyMap = new Map();

  for (const rev of completedRevisionsList) {
    const date = rev.date;
    const time = rev.timeSpent;
    const confidence = rev.confidenceAfter;

    if (!dailyMap.has(date)) dailyMap.set(date, { completed: 0, timeSpent: 0, confidenceSum: 0, count: 0 });
    const daily = dailyMap.get(date);
    daily.completed++;
    daily.timeSpent += time;
    if (confidence) { daily.confidenceSum += confidence; daily.count++; }

    const d = new Date(date);
    const weekNum = getWeekNumber(d);
    const weekKey = `${d.getFullYear()}-W${weekNum}`;
    if (!weeklyMap.has(weekKey)) weeklyMap.set(weekKey, { completed: 0, timeSpent: 0, confidenceSum: 0, count: 0 });
    const weekly = weeklyMap.get(weekKey);
    weekly.completed++;
    weekly.timeSpent += time;
    if (confidence) { weekly.confidenceSum += confidence; weekly.count++; }

    const monthKey = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!monthlyMap.has(monthKey)) monthlyMap.set(monthKey, { completed: 0, timeSpent: 0, confidenceSum: 0, count: 0 });
    const monthly = monthlyMap.get(monthKey);
    monthly.completed++;
    monthly.timeSpent += time;
    if (confidence) { monthly.confidenceSum += confidence; monthly.count++; }
  }

  const dailyTrend = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-30)
    .map(([date, data]) => ({
      date,
      completed: data.completed,
      timeSpent: data.timeSpent,
      avgConfidence: data.count ? (data.confidenceSum / data.count).toFixed(1) : null
    }));

  const weeklyTrend = Array.from(weeklyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([week, data]) => ({
      week,
      completed: data.completed,
      timeSpent: data.timeSpent,
      avgConfidence: data.count ? (data.confidenceSum / data.count).toFixed(1) : null
    }));

  const monthlyTrend = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([month, data]) => ({
      month,
      completed: data.completed,
      timeSpent: data.timeSpent,
      avgConfidence: data.count ? (data.confidenceSum / data.count).toFixed(1) : null
    }));

  const overdueDistribution = { '1-3days': 0, '4-7days': 0, '8-14days': 0, '15-30days': 0, '30+days': 0 };
  for (const days of overdueDates) {
    if (days <= 3) overdueDistribution['1-3days']++;
    else if (days <= 7) overdueDistribution['4-7days']++;
    else if (days <= 14) overdueDistribution['8-14days']++;
    else if (days <= 30) overdueDistribution['15-30days']++;
    else overdueDistribution['30+days']++;
  }

  const upcomingSchedule = Array.from(upcomingMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({
      date,
      dayOfWeek: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
      count: data.count,
      questions: data.questions
    }));

  const difficultyMap = new Map();
  const platformMap = new Map();
  const patternMap = new Map();

  for (const schedule of schedules) {
    if (!schedule.questionId) continue;
    const q = schedule.questionId;

    const difficulty = q.difficulty || 'Unknown';
    const platform = q.platform || 'Other';
    const patterns = Array.isArray(q.pattern) ? q.pattern : (q.pattern ? [q.pattern] : []);

    if (!difficultyMap.has(difficulty)) {
      difficultyMap.set(difficulty, { totalRevisions: 0, completed: 0, totalTimeSpent: 0, confidenceSum: 0, confidenceCount: 0, overdueCount: 0 });
    }
    const diffStat = difficultyMap.get(difficulty);
    diffStat.totalRevisions++;
    diffStat.completed += schedule.completedRevisions?.length || 0;
    if (schedule.completedRevisions) {
      for (const rev of schedule.completedRevisions) {
        diffStat.totalTimeSpent += rev.timeSpent || 0;
        if (rev.confidenceAfter) {
          diffStat.confidenceSum += rev.confidenceAfter;
          diffStat.confidenceCount++;
        }
      }
    }
    if (schedule.status === 'overdue') diffStat.overdueCount++;

    if (!platformMap.has(platform)) {
      platformMap.set(platform, { totalRevisions: 0, completed: 0, totalTimeSpent: 0, confidenceSum: 0, confidenceCount: 0, overdueCount: 0 });
    }
    const platStat = platformMap.get(platform);
    platStat.totalRevisions++;
    platStat.completed += schedule.completedRevisions?.length || 0;
    if (schedule.completedRevisions) {
      for (const rev of schedule.completedRevisions) {
        platStat.totalTimeSpent += rev.timeSpent || 0;
        if (rev.confidenceAfter) {
          platStat.confidenceSum += rev.confidenceAfter;
          platStat.confidenceCount++;
        }
      }
    }
    if (schedule.status === 'overdue') platStat.overdueCount++;

    for (const pattern of patterns) {
      if (!pattern) continue;
      if (!patternMap.has(pattern)) {
        patternMap.set(pattern, { totalRevisions: 0, completed: 0, totalTimeSpent: 0, overdueCount: 0 });
      }
      const patStat = patternMap.get(pattern);
      patStat.totalRevisions++;
      patStat.completed += schedule.completedRevisions?.length || 0;
      if (schedule.completedRevisions) {
        for (const rev of schedule.completedRevisions) {
          patStat.totalTimeSpent += rev.timeSpent || 0;
        }
      }
      if (schedule.status === 'overdue') patStat.overdueCount++;
    }
  }

  const byDifficulty = {};
  for (const [diff, stat] of difficultyMap.entries()) {
    const avgConfidence = stat.confidenceCount ? stat.confidenceSum / stat.confidenceCount : null;
    byDifficulty[diff] = {
      totalRevisions: stat.totalRevisions,
      completed: stat.completed,
      completionRate: parseFloat(((stat.completed / stat.totalRevisions) * 100).toFixed(1)),
      averageTimeSpent: stat.completed ? (stat.totalTimeSpent / stat.completed).toFixed(1) : 0,
      averageConfidenceAfter: avgConfidence ? parseFloat(avgConfidence.toFixed(1)) : null,
      overdueCount: stat.overdueCount
    };
  }

  const byPlatform = {};
  for (const [plat, stat] of platformMap.entries()) {
    const avgConfidence = stat.confidenceCount ? stat.confidenceSum / stat.confidenceCount : null;
    byPlatform[plat] = {
      totalRevisions: stat.totalRevisions,
      completed: stat.completed,
      completionRate: parseFloat(((stat.completed / stat.totalRevisions) * 100).toFixed(1)),
      averageTimeSpent: stat.completed ? (stat.totalTimeSpent / stat.completed).toFixed(1) : 0,
      averageConfidenceAfter: avgConfidence ? parseFloat(avgConfidence.toFixed(1)) : null,
      overdueCount: stat.overdueCount
    };
  }

  const byPattern = Array.from(patternMap.entries())
    .map(([pattern, stat]) => ({
      patternName: pattern,
      totalRevisions: stat.totalRevisions,
      completed: stat.completed,
      completionRate: parseFloat(((stat.completed / stat.totalRevisions) * 100).toFixed(1)),
      averageTimeSpent: stat.completed ? (stat.totalTimeSpent / stat.completed).toFixed(1) : 0,
      overdueCount: stat.overdueCount
    }))
    .sort((a, b) => b.totalRevisions - a.totalRevisions)
    .slice(0, 10);

  const totalMinutesSpent = completedRevisionsList.reduce((sum, r) => sum + r.timeSpent, 0);
  const averageMinutesPerRevision = completedRevisionsList.length ? (totalMinutesSpent / completedRevisionsList.length).toFixed(1) : 0;
  const averageMinutesPerDay = dailyTrend.length ? (dailyTrend.reduce((sum, d) => sum + d.timeSpent, 0) / dailyTrend.length).toFixed(1) : 0;
  let mostProductiveDay = null, mostProductiveDayMinutes = 0;
  for (const day of dailyTrend) {
    if (day.timeSpent > mostProductiveDayMinutes) {
      mostProductiveDayMinutes = day.timeSpent;
      mostProductiveDay = day.date;
    }
  }
  const timeByDifficulty = {};
  for (const [diff, stat] of Object.entries(byDifficulty)) {
    timeByDifficulty[diff] = (stat.averageTimeSpent || 0) * stat.completed;
  }

  const allConfidences = completedRevisionsList.filter(r => r.confidenceAfter).map(r => r.confidenceAfter);
  const confidenceDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const c of allConfidences) {
    if (c >= 1 && c <= 5) confidenceDistribution[c]++;
  }
  const overallAverageAfter = allConfidences.length ? (allConfidences.reduce((a,b) => a+b,0) / allConfidences.length).toFixed(1) : null;

  let currentStreak = 0, longestStreak = 0;
  const sortedCompletionDates = [...new Set(completedRevisionsList.map(r => r.date))].sort();
  let tempStreak = 0, lastDate = null;
  for (const dateStr of sortedCompletionDates) {
    const currentDate = new Date(dateStr);
    if (lastDate) {
      const diffDays = (currentDate - lastDate) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) tempStreak++;
      else tempStreak = 1;
    } else {
      tempStreak = 1;
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;
    lastDate = currentDate;
  }
  currentStreak = tempStreak;

  const urgentQuestions = schedules
    .filter(s => s.questionId && s.status === 'active' && s.currentRevisionIndex < s.schedule.length && s.schedule[s.currentRevisionIndex] < now)
    .map(s => ({
      questionId: s.questionId._id,
      platformQuestionId: s.questionId.platformQuestionId,
      title: s.questionId.title,
      difficulty: s.questionId.difficulty,
      platform: s.questionId.platform,
      currentRevisionIndex: s.currentRevisionIndex,
      nextRevisionDue: s.schedule[s.currentRevisionIndex],
      totalTimeSpent: s.completedRevisions?.reduce((sum, r) => sum + (r.timeSpent || 0), 0) || 0,
      confidenceLevel: s.completedRevisions?.length ? s.completedRevisions[s.completedRevisions.length - 1].confidenceAfter : null,
      status: 'overdue'
    }))
    .sort((a, b) => a.nextRevisionDue - b.nextRevisionDue)
    .slice(0, 10);

  const finalStats = {
    summary: {
      totalActiveSchedules,
      totalCompletedSchedules,
      totalOverdueSchedules,
      totalRevisionsCompleted,
      totalRevisionsPending,
      completionRate: parseFloat(completionRate.toFixed(1)),
      averageOverdueDays: totalActiveSchedules ? (totalOverdueDaysSum / totalActiveSchedules).toFixed(1) : 0,
      maxOverdueDays,
      revisionStreak: {
        current: currentStreak,
        longest: longestStreak
      }
    },
    byRevisionIndex,
    trends: {
      daily: dailyTrend,
      weekly: weeklyTrend,
      monthly: monthlyTrend
    },
    overdueDistribution,
    upcomingSchedule,
    byDifficulty,
    byPlatform,
    byPattern,
    timeStats: {
      totalMinutesSpent,
      averageMinutesPerRevision: parseFloat(averageMinutesPerRevision),
      averageMinutesPerDay: parseFloat(averageMinutesPerDay),
      mostProductiveDay,
      mostProductiveDayMinutes,
      timeByDifficulty
    },
    confidenceStats: {
      overallAverageAfter: overallAverageAfter ? parseFloat(overallAverageAfter) : null,
      confidenceDistributionAfter: confidenceDistribution,
      confidenceImprovementByRevisionIndex: byRevisionIndex.map(idx => ({ index: idx.index, gain: null }))
    },
    questionLevelDetails: urgentQuestions
  };

  return finalStats;
};

// Helper to get week number (ISO)
function getWeekNumber(d) {
  const date = new Date(d);
  date.setHours(0,0,0,0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}


// ==================== Exports ====================
module.exports = {
  calculateRevisionStats,
  calculateUpcomingStats,
  createRevisionSchedule,
  markRevisionComplete,
  getPendingRevisionsForDate,
  updateOverdueRevisions,
  getRevisionStatusLabel,
  getDetailedRevisionStats,
};
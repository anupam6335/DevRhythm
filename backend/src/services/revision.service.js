const RevisionSchedule = require('../models/RevisionSchedule');
const { getStartOfDay, getEndOfDay } = require('../utils/helpers/date');

const calculateRevisionStats = async (userId) => {
  const todayStart = getStartOfDay();
  const todayEnd = getEndOfDay();
  
  const stats = await RevisionSchedule.aggregate([
    {
      $match: { userId },
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
              userId,
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
              userId,
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
        userId,
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

module.exports = {
  calculateRevisionStats,
  calculateUpcomingStats,
  createRevisionSchedule,
  markRevisionComplete,
  getPendingRevisionsForDate,
  updateOverdueRevisions,
};
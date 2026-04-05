const { client: redisClient } = require('../config/redis');
const RevisionSchedule = require('../models/RevisionSchedule');
const { getStartOfDay, getEndOfDay, formatDate } = require('../utils/helpers/date');
const { invalidateCache } = require('../middleware/cache');
const { jobQueue } = require('./queue.service');

const getRevisionActivityKey = (userId, questionId, date) => {
  const dateStr = formatDate(date);
  return `revision:activity:${userId}:${questionId}:${dateStr}`;
};

const recordTimeSpent = async (userId, questionId, date, minutes) => {
  const key = getRevisionActivityKey(userId, questionId, date);
  await redisClient.hIncrBy(key, 'timeSpent', minutes);
  await redisClient.expire(key, 86400); // 24 hours
};

const recordCodeSubmission = async (userId, questionId, date) => {
  const key = getRevisionActivityKey(userId, questionId, date);
  await redisClient.hSet(key, 'codeSubmitted', 'true');
  await redisClient.expire(key, 86400);
};

const getRevisionActivity = async (userId, questionId, date) => {
  const key = getRevisionActivityKey(userId, questionId, date);
  const data = await redisClient.hGetAll(key);
  return {
    timeSpent: parseInt(data.timeSpent) || 0,
    codeSubmitted: data.codeSubmitted === 'true',
  };
};

const checkAndCompleteRevision = async (userId, questionId, date, source = 'auto') => {
  const todayStart = getStartOfDay(date);
  const todayEnd = getEndOfDay(date);

  // Find active revision where today's date matches a pending scheduled date
  const revision = await RevisionSchedule.findOne({
    userId,
    questionId,
    status: 'active',
    schedule: { $elemMatch: { $gte: todayStart, $lte: todayEnd } },
    $expr: {
      $lt: ['$currentRevisionIndex', { $size: '$schedule' }],
    },
  });

  if (!revision) {
    // No pending revision for today
    return { completed: false, message: null };
  }

  // Additional safety: ensure the scheduled date for the current index is today
  const scheduledDate = revision.schedule[revision.currentRevisionIndex];
  if (scheduledDate < todayStart || scheduledDate > todayEnd) {
    return { completed: false, message: null };
  }

  // Check activity for today
  const activity = await getRevisionActivity(userId, questionId, date);
  const conditionsMet = activity.timeSpent > 20 || activity.codeSubmitted;

  if (!conditionsMet && source === 'manual') {
    return {
      completed: false,
      message: 'Please spend more than 20 minutes or submit code (all test cases must pass) before marking the revision as complete.',
    };
  }

  if (conditionsMet) {
    // Mark the revision as completed
    revision.completedRevisions.push({
      date: scheduledDate,
      completedAt: new Date(),
      status: 'completed',
    });

    if (revision.currentRevisionIndex < revision.schedule.length - 1) {
      revision.currentRevisionIndex += 1;
    } else {
      revision.status = 'completed';
    }

    revision.updatedAt = new Date();
    await revision.save();

    // Emit event
    if (jobQueue) {
      await jobQueue.add({
        type: 'revision.completed',
        userId,
        revisionId: revision._id,
        questionId,
        completedAt: new Date(),
        revisionIndex: revision.currentRevisionIndex - 1,
        status: 'completed',
      });
    }

    await invalidateCache(`revisions:*:user:${userId}:*`);

    return {
      completed: true,
      message: 'Great, your revision is done.',
    };
  }

  return { completed: false, message: null };
};

module.exports = {
  recordTimeSpent,
  recordCodeSubmission,
  checkAndCompleteRevision,
  getRevisionActivity,
};
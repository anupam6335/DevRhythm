const { client: redisClient } = require('../config/redis');
const RevisionSchedule = require('../models/RevisionSchedule');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const { getStartOfDay, getEndOfDay, formatDate, isToday } = require('../utils/helpers/date');
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

/**
 * Complete a revision (or a specific revision by date) for a given question.
 * @param {string} userId
 * @param {string} questionId
 * @param {Date} date - current date (used for overdue checks)
 * @param {string} source - 'auto' or 'manual'
 * @param {Object} options - { targetDate: Date, allowOverdue: boolean }
 * @returns {Object} { completed: boolean, message: string, skippedCount: number, overdueCompleted: boolean }
 */
const checkAndCompleteRevision = async (userId, questionId, date, source = 'auto', options = {}) => {
  const { targetDate = null, allowOverdue = false } = options;
  const todayStart = getStartOfDay(date);

  const revision = await RevisionSchedule.findOne({
    userId,
    questionId,
    status: 'active',
  });

  if (!revision) {
    return { completed: false, message: 'No active revision schedule found', skippedCount: 0 };
  }

  // Determine which revision to complete
  let targetIndex = null;
  if (targetDate) {
    const targetDayStart = getStartOfDay(targetDate);
    // Find the index whose schedule date matches the target day
    for (let i = 0; i < revision.schedule.length; i++) {
      if (getStartOfDay(revision.schedule[i]).getTime() === targetDayStart.getTime()) {
        targetIndex = i;
        break;
      }
    }
    if (targetIndex === null) {
      return { completed: false, message: 'No revision scheduled for the given date', skippedCount: 0 };
    }
  } else {
    // Default: complete the current pending revision
    targetIndex = revision.currentRevisionIndex;
  }

  // Check if this revision is already completed
  const alreadyCompleted = revision.completedRevisions.some(rev =>
    getStartOfDay(rev.date).getTime() === getStartOfDay(revision.schedule[targetIndex]).getTime()
  );
  if (alreadyCompleted) {
    return { completed: true, message: 'Revision already completed', skippedCount: 0, overdueCompleted: false };
  }

  const isOverdue = revision.schedule[targetIndex] < todayStart;

  // For manual completion, check conditions (unless it's an auto completion from code submission)
  if (source === 'manual' && targetIndex === revision.currentRevisionIndex) {
    const activity = await getRevisionActivity(userId, questionId, date);
    const conditionsMet = activity.timeSpent > 20 || activity.codeSubmitted;
    if (!conditionsMet) {
      return {
        completed: false,
        message: 'Please spend more than 20 minutes or submit code (all test cases must pass) before marking the revision as complete.',
        skippedCount: 0
      };
    }
  }

  // If the target revision is overdue and allowOverdue is false, reject
  if (isOverdue && !allowOverdue) {
    return {
      completed: false,
      message: 'This revision is overdue. Please add ?overdue=true to complete it.',
      skippedCount: 0
    };
  }

  // Get confidence after completion
  const progress = await UserQuestionProgress.findOne({ userId, questionId });
  const confidenceAfter = progress?.confidenceLevel || null;
  const activity = await getRevisionActivity(userId, questionId, date);

  // Push completed entry
  const outOfOrder = (targetIndex !== revision.currentRevisionIndex);
  revision.completedRevisions.push({
    date: revision.schedule[targetIndex],
    completedAt: new Date(),
    status: 'completed',
    timeSpent: activity.timeSpent,
    confidenceAfter,
    overdueCompleted: isOverdue,
    skipped: false,
    outOfOrder: outOfOrder
  });

  // If the completed revision is the current pending one, advance the index
  if (targetIndex === revision.currentRevisionIndex) {
    // Find the next pending revision (not already completed)
    let nextIndex = revision.currentRevisionIndex + 1;
    while (nextIndex < revision.schedule.length &&
           revision.completedRevisions.some(rev => getStartOfDay(rev.date).getTime() === getStartOfDay(revision.schedule[nextIndex]).getTime())) {
      nextIndex++;
    }
    if (nextIndex < revision.schedule.length) {
      revision.currentRevisionIndex = nextIndex;
    } else {
      revision.status = 'completed';
    }
  }
  // If completed out of order, do not change currentRevisionIndex

  revision.updatedAt = new Date();
  await revision.save();

  // Emit event
  const { jobQueue } = require('./queue.service');
  if (jobQueue) {
    await jobQueue.add({
      type: 'revision.completed',
      userId,
      revisionId: revision._id,
      questionId,
      completedAt: new Date(),
      revisionIndex: targetIndex,
      status: 'completed',
      overdueCompleted: isOverdue,
      outOfOrder
    });
  }

  await invalidateCache(`revisions:*:user:${userId}:*`);

  return {
    completed: true,
    message: outOfOrder
      ? `Completed revision for ${getStartOfDay(revision.schedule[targetIndex]).toDateString()} (out of order).`
      : 'Great, your revision is done.',
    skippedCount: 0,
    overdueCompleted: isOverdue,
    outOfOrder
  };
};

module.exports = {
  recordTimeSpent,
  recordCodeSubmission,
  checkAndCompleteRevision,
  getRevisionActivity,
};
const { client: redisClient } = require('../config/redis');
const RevisionSchedule = require('../models/RevisionSchedule');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const User = require('../models/User');
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
  await redisClient.expire(key, 86400);
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

const getUserTimeZone = async (userId) => {
  const user = await User.findById(userId).select('preferences.timezone');
  return user?.preferences?.timezone || 'UTC';
};

/**
 * Update revision state (status, overdueCount, overdueActive) based on currentRevisionIndex.
 */
const updateRevisionState = (revision, timeZone) => {
  const todayStart = getStartOfDay(new Date(), timeZone);
  const idx = revision.currentRevisionIndex;

  if (idx >= revision.schedule.length) {
    revision.status = 'completed';
    revision.overdueActive = false;
    revision.overdueCount = 0;
    return;
  }

  const pendingDue = revision.schedule[idx];
  const daysOverdue = Math.floor((todayStart - pendingDue) / (1000 * 60 * 60 * 24));
  revision.overdueCount = daysOverdue > 0 ? daysOverdue : 0;
  revision.overdueActive = daysOverdue > 0;
  revision.status = daysOverdue > 0 ? 'overdue' : 'active';
};

/**
 * Standard completion – completes the current pending revision and advances the index.
 * Used by the regular completion endpoint.
 */
const checkAndCompleteRevision = async (userId, questionId, date, source = 'auto', options = {}) => {
  const { targetDate = null, allowOverdue = false } = options;
  const timeZone = await getUserTimeZone(userId);
  const todayStart = getStartOfDay(date, timeZone);

  const revision = await RevisionSchedule.findOne({
    userId,
    questionId,
    status: { $in: ['active', 'overdue'] }
  });

  if (!revision) {
    return { completed: false, message: 'No active revision schedule found', skippedCount: 0 };
  }

  // Determine target index (default current, or specified date)
  let targetIndex = null;
  if (targetDate) {
    const targetDayStart = getStartOfDay(targetDate, timeZone);
    for (let i = 0; i < revision.schedule.length; i++) {
      if (getStartOfDay(revision.schedule[i], timeZone).getTime() === targetDayStart.getTime()) {
        targetIndex = i;
        break;
      }
    }
    if (targetIndex === null) {
      return { completed: false, message: 'No revision scheduled for the given date', skippedCount: 0 };
    }
  } else {
    targetIndex = revision.currentRevisionIndex;
  }

  // Check if already completed
  const alreadyCompleted = revision.completedRevisions.some(cr =>
    getStartOfDay(cr.date, timeZone).getTime() === getStartOfDay(revision.schedule[targetIndex], timeZone).getTime()
  );
  if (alreadyCompleted) {
    return { completed: true, message: 'Revision already completed', skippedCount: 0, overdueCompleted: false };
  }

  const isOverdue = revision.schedule[targetIndex] < todayStart;

  // For manual completion, enforce activity conditions
  if (source === 'manual' && targetIndex === revision.currentRevisionIndex) {
    const activity = await getRevisionActivity(userId, questionId, date);
    const conditionsMet = activity.timeSpent >= 20 || activity.codeSubmitted;
    if (!conditionsMet) {
      return {
        completed: false,
        message: 'Please spend at least 20 minutes or submit passing code before marking this revision as complete.',
        skippedCount: 0
      };
    }
  }

  if (isOverdue && !allowOverdue) {
    return {
      completed: false,
      message: 'This revision is overdue. Please add ?overdue=true to complete it.',
      skippedCount: 0
    };
  }

  const progress = await UserQuestionProgress.findOne({ userId, questionId });
  const confidenceAfter = progress?.confidenceLevel || null;
  const activity = await getRevisionActivity(userId, questionId, date);

  const outOfOrder = (targetIndex !== revision.currentRevisionIndex);

  // Add completion entry
  revision.completedRevisions.push({
    date: revision.schedule[targetIndex],
    completedAt: new Date(),
    status: 'completed',
    timeSpent: activity.timeSpent,
    confidenceAfter,
    overdueCompleted: isOverdue,
    skipped: false,
    outOfOrder,
  });

  // Advance index if this was the current pending revision
  if (targetIndex === revision.currentRevisionIndex) {
    let nextIndex = revision.currentRevisionIndex + 1;
    while (nextIndex < revision.schedule.length &&
           revision.completedRevisions.some(cr => getStartOfDay(cr.date, timeZone).getTime() === getStartOfDay(revision.schedule[nextIndex], timeZone).getTime())) {
      nextIndex++;
    }
    revision.currentRevisionIndex = nextIndex;
  }

  updateRevisionState(revision, timeZone);
  revision.updatedAt = new Date();
  await revision.save();

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
      outOfOrder,
    });
  }

  await invalidateCache(`revisions:*:user:${userId}:*`);

  return {
    completed: true,
    message: outOfOrder
      ? `Completed revision for ${getStartOfDay(revision.schedule[targetIndex], timeZone).toDateString()} (out of order).`
      : 'Great, your revision is done.',
    skippedCount: 0,
    overdueCompleted: isOverdue,
    outOfOrder,
  };
};

/**
 * NEW: Complete a specific past revision (date < today) without affecting currentRevisionIndex.
 * Enforces activity conditions (20 min or code passed today).
 */
const completePastRevision = async (userId, questionId, targetDate, confidence = null) => {
  const timeZone = await getUserTimeZone(userId);
  const todayStart = getStartOfDay(new Date(), timeZone);
  const targetDayStart = getStartOfDay(targetDate, timeZone);

  // Ensure target date is in the past
  if (targetDayStart >= todayStart) {
    return { completed: false, message: 'Cannot complete a future or today’s revision with this endpoint. Use the standard completion endpoint.' };
  }

  const revision = await RevisionSchedule.findOne({
    userId,
    questionId,
    status: { $in: ['active', 'overdue'] }
  });

  if (!revision) {
    return { completed: false, message: 'No active revision schedule found' };
  }

  // Find index matching the target date
  let targetIndex = -1;
  for (let i = 0; i < revision.schedule.length; i++) {
    if (getStartOfDay(revision.schedule[i], timeZone).getTime() === targetDayStart.getTime()) {
      targetIndex = i;
      break;
    }
  }

  if (targetIndex === -1) {
    return { completed: false, message: 'No revision scheduled on the given date' };
  }

  // Check if already completed
  const alreadyCompleted = revision.completedRevisions.some(cr =>
    getStartOfDay(cr.date, timeZone).getTime() === targetDayStart.getTime()
  );
  if (alreadyCompleted) {
    return { completed: true, message: 'Revision already completed' };
  }

  // Enforce activity condition: must have spent ≥20 minutes today OR submitted passing code today
  const activity = await getRevisionActivity(userId, questionId, new Date());
  const conditionsMet = activity.timeSpent >= 20 || activity.codeSubmitted;
  if (!conditionsMet) {
    return {
      completed: false,
      message: 'You must spend at least 20 minutes on this question today or submit passing code before completing a past revision.'
    };
  }

  // Add completion entry
  revision.completedRevisions.push({
    date: revision.schedule[targetIndex],
    completedAt: new Date(),
    status: 'completed',
    timeSpent: activity.timeSpent,
    confidenceAfter: confidence && confidence >= 1 && confidence <= 5 ? confidence : null,
    overdueCompleted: true,
    skipped: false,
    outOfOrder: true, // always out of order because index points to future/today
  });

  // Do NOT change currentRevisionIndex
  // Recalculate state based on the existing index (which already points to today/future)
  updateRevisionState(revision, timeZone);
  revision.updatedAt = new Date();
  await revision.save();

  await invalidateCache(`revisions:*:user:${userId}:*`);

  return {
    completed: true,
    message: `Past revision for ${formatDate(targetDate)} marked as completed.`,
    revision,
  };
};

module.exports = {
  recordTimeSpent,
  recordCodeSubmission,
  checkAndCompleteRevision,
  completePastRevision,
  getRevisionActivity,
};
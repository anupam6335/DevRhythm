// src/services/revisionActivity.service.js
const { client: redisClient } = require('../config/redis');
const RevisionSchedule = require('../models/RevisionSchedule');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const User = require('../models/User');
const { getStartOfDay, getEndOfDay, formatDate, isToday } = require('../utils/helpers/date');
const { invalidateCache } = require('../middleware/cache');

// ========== PRODUCTION SETTINGS ==========
const JOB_DELAY_MS = 20 * 60 * 1000 + 5000; // 20 minutes + 5 seconds buffer
const CONDITION_MINUTES = 19.9;              // 19.9 minutes (buffer)
// =========================================

/**
 * Lazy-loaded jobQueue to avoid circular dependency
 */
let _jobQueue = null;
const getJobQueue = () => {
  if (!_jobQueue) {
    const { jobQueue } = require('./queue.service');
    if (!jobQueue) {
      throw new Error('Job queue is not available. Make sure Redis is connected and workers are started.');
    }
    _jobQueue = jobQueue;
  }
  return _jobQueue;
};

// ========== Helper: Redis key for daily activity ==========
const getRevisionActivityKey = (userId, questionId, date) => {
  const dateStr = formatDate(date);
  return `revision:activity:${userId}:${questionId}:${dateStr}`;
};

// ========== Record time spent for a day ==========
const recordTimeSpent = async (userId, questionId, date, minutes) => {
  const key = getRevisionActivityKey(userId, questionId, date);
  await redisClient.hIncrBy(key, 'timeSpent', minutes);
  await redisClient.expire(key, 86400);
};

// ========== Record code submission for a day ==========
const recordCodeSubmission = async (userId, questionId, date) => {
  const key = getRevisionActivityKey(userId, questionId, date);
  await redisClient.hSet(key, 'codeSubmitted', 'true');
  await redisClient.expire(key, 86400);
};

// ========== Get daily activity ==========
const getRevisionActivity = async (userId, questionId, date) => {
  const key = getRevisionActivityKey(userId, questionId, date);
  const data = await redisClient.hGetAll(key);
  return {
    timeSpent: parseInt(data.timeSpent) || 0,
    codeSubmitted: data.codeSubmitted === 'true',
  };
};

// ========== Get user timezone ==========
const getUserTimeZone = async (userId) => {
  const user = await User.findById(userId).select('preferences.timezone');
  return user?.preferences?.timezone || 'UTC';
};

// ========== Update revision state ==========
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

// ========== Standard completion (current pending revision) ==========
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

  // For manual completion, enforce activity conditions (today’s activity)
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

  const jobQueue = getJobQueue();
  await jobQueue.add('revision.completed', {
    userId,
    revisionId: revision._id,
    questionId,
    completedAt: new Date(),
    revisionIndex: targetIndex,
    status: 'completed',
    overdueCompleted: isOverdue,
    outOfOrder,
  });

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

// ========== Revision Session Management (for complete-past) ==========

const getRevisionSessionKey = (userId, questionId, targetDate) => {
  const dateStr = formatDate(targetDate);
  return `revision:session:${userId}:${questionId}:${dateStr}`;
};

const startRevisionSession = async (userId, questionId, targetDate) => {
  const key = getRevisionSessionKey(userId, questionId, targetDate);
  const startTime = Date.now();

  console.log(`[revision.session] Creating auto-completion job for user ${userId}, question ${questionId}, date ${formatDate(targetDate)}, delay ${JOB_DELAY_MS}ms`);

  const jobQueue = getJobQueue();
  const job = await jobQueue.add(
    'revision.auto_complete',
    {
      userId,
      questionId,
      targetDate: targetDate.toISOString(),
    },
    { delay: JOB_DELAY_MS }
  );

  console.log(`[revision.session] Job created with id ${job.id}`);

  const session = { startTime, testPassed: false, jobId: job.id };
  await redisClient.setEx(key, 7200, JSON.stringify(session));
  return session;
};

const getRevisionSession = async (userId, questionId, targetDate) => {
  const key = getRevisionSessionKey(userId, questionId, targetDate);
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

const cancelAutoCompletion = async (userId, questionId, targetDate) => {
  const key = getRevisionSessionKey(userId, questionId, targetDate);
  const data = await redisClient.get(key);
  if (data) {
    const session = JSON.parse(data);
    if (session.jobId) {
      try {
        const jobQueue = getJobQueue();
        const job = await jobQueue.getJob(session.jobId);
        if (job && !job.finishedOn) {
          await job.remove();
        }
      } catch (err) {
        console.warn(`[cancelAutoCompletion] Failed to remove job ${session.jobId}: ${err.message}`);
        // Do not rethrow – allow completion to proceed
      }
    }
  }
};

const cancelAllAutoCompletionsForQuestion = async (userId, questionId) => {
  const pattern = `revision:session:${userId}:${questionId}:*`;
  let cursor = 0;
  let keys = [];
  do {
    const reply = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
    cursor = reply.cursor;
    keys.push(...reply.keys);
  } while (cursor !== 0);

  for (const key of keys) {
    const data = await redisClient.get(key);
    if (data) {
      const session = JSON.parse(data);
      if (session.jobId) {
        try {
          const jobQueue = getJobQueue();
          const job = await jobQueue.getJob(session.jobId);
          if (job && !job.finishedOn) {
            await job.remove();
          }
        } catch (err) {
          console.warn(`[cancelAllAutoCompletionsForQuestion] Failed to remove job ${session.jobId}: ${err.message}`);
        }
      }
    }
  }
};

const markTestPassedForQuestion = async (userId, questionId) => {
  const pattern = `revision:session:${userId}:${questionId}:*`;
  let cursor = 0;
  let keys = [];
  do {
    const reply = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
    cursor = reply.cursor;
    keys.push(...reply.keys);
  } while (cursor !== 0);

  for (const key of keys) {
    const data = await redisClient.get(key);
    if (data) {
      const session = JSON.parse(data);
      if (!session.testPassed) {
        session.testPassed = true;
        await redisClient.setEx(key, 7200, JSON.stringify(session));
      }
      if (session.jobId) {
        try {
          const jobQueue = getJobQueue();
          const job = await jobQueue.getJob(session.jobId);
          if (job && !job.finishedOn) {
            await job.remove();
          }
        } catch (err) {
          console.warn(`[markTestPassedForQuestion] Failed to remove job ${session.jobId}: ${err.message}`);
        }
      }
    }
  }
};

const deleteRevisionSession = async (userId, questionId, targetDate) => {
  const key = getRevisionSessionKey(userId, questionId, targetDate);
  await redisClient.del(key);
};

// ========== Updated completePastRevision with session logic ==========
const completePastRevision = async (userId, questionId, targetDate, confidence = null, auto = false) => {
  const timeZone = await getUserTimeZone(userId);
  const todayStart = getStartOfDay(new Date(), timeZone);
  const targetDayStart = getStartOfDay(targetDate, timeZone);

  // 1. Ensure target date is in the past
  if (targetDayStart >= todayStart) {
    return { completed: false, message: 'Cannot complete a future or today’s revision with this endpoint. Use the standard completion endpoint.' };
  }

  // 2. Find the revision schedule
  const revision = await RevisionSchedule.findOne({
    userId,
    questionId,
    status: { $in: ['active', 'overdue'] }
  });
  if (!revision) {
    return { completed: false, message: 'No active revision schedule found' };
  }

  // 3. Find the matching revision index by date
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

  // 4. Check if already completed
  const alreadyCompleted = revision.completedRevisions.some(cr =>
    getStartOfDay(cr.date, timeZone).getTime() === targetDayStart.getTime()
  );
  if (alreadyCompleted) {
    return { completed: true, message: 'Revision already completed' };
  }

  // ========== SESSION‑BASED VALIDATION ==========
  let session = await getRevisionSession(userId, questionId, targetDate);
  if (!session) {
    // First call – start session and return "session started" message
    await startRevisionSession(userId, questionId, targetDate);
    return {
      completed: false,
      message: 'Revision session started. You need to spend 20 minutes (after this request) or pass all test cases before completing this past revision.'
    };
  }

  // Session exists – check conditions
  const now = Date.now();
  const elapsedMinutes = (now - session.startTime) / (1000 * 60);
  const conditionMet = elapsedMinutes >= CONDITION_MINUTES || session.testPassed === true;

  if (!conditionMet) {
    const remainingMinutes = Math.ceil(CONDITION_MINUTES - elapsedMinutes);
    const elapsedWhole = Math.floor(elapsedMinutes);
    const friendlyMessage = `You need to spend at least 20 minutes on this question before completing this past revision. You have spent ${elapsedWhole} minute(s) so far. ${remainingMinutes} more minute(s) required. Alternatively, solve the question (pass all test cases) to complete it immediately.`;
    return {
      completed: false,
      message: friendlyMessage
    };
  }

  // ---------- Conditions satisfied – proceed to mark completion ----------
  // Record time spent for this day (optional)
  const activity = await getRevisionActivity(userId, questionId, new Date());

  revision.completedRevisions.push({
    date: revision.schedule[targetIndex],
    completedAt: new Date(),
    status: 'completed',
    timeSpent: activity.timeSpent,
    confidenceAfter: confidence && confidence >= 1 && confidence <= 5 ? confidence : null,
    overdueCompleted: true,
    skipped: false,
    outOfOrder: false,
  });

  // Do NOT change currentRevisionIndex
  updateRevisionState(revision, timeZone);
  revision.updatedAt = new Date();
  await revision.save();

  // Delete the session now that it's completed
  await deleteRevisionSession(userId, questionId, targetDate);

  await invalidateCache(`revisions:*:user:${userId}:*`);

  // Queue confidence increment
  const jobQueue = getJobQueue();
  await jobQueue.add('confidence.increment', {
    userId,
    questionId,
    action: 'past_revision_completed',
  });

  // Attempt to cancel the auto‑completion job (best effort, do not block on error)
  try {
    await cancelAutoCompletion(userId, questionId, targetDate);
  } catch (err) {
    console.warn(`Failed to cancel auto‑completion job for ${userId}/${questionId}/${targetDate}: ${err.message}`);
  }

  return {
    completed: true,
    message: `Past revision for ${formatDate(targetDate)} marked as completed.`,
    revision,
  };
};

module.exports = {
  recordTimeSpent,
  recordCodeSubmission,
  getRevisionActivity,
  checkAndCompleteRevision,
  completePastRevision,
  startRevisionSession,
  getRevisionSession,
  markTestPassedForQuestion,
  cancelAutoCompletion,
  cancelAllAutoCompletionsForQuestion,
  deleteRevisionSession,
};
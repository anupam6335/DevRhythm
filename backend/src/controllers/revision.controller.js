const RevisionSchedule = require('../models/RevisionSchedule');
const Question = require('../models/Question');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const { formatResponse, paginate, getPaginationParams, getStartOfDay, getEndOfDay, formatDate, isToday } = require("../utils/helpers");
const AppError = require('../utils/errors/AppError');
const { invalidateCache } = require('../middleware/cache');
const revisionService = require('../services/revision.service');
const revisionActivityService = require('../services/revisionActivity.service');
const { jobQueue } = require('../services/queue.service');
const { client: redisClient } = require('../config/redis');

const calculateSpacedRepetitionSchedule = (baseDate, schedule = [1, 3, 7, 14, 30]) => {
  return schedule.map(days => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + days);
    date.setHours(0, 0, 0, 0);
    return date;
  });
};

const getRevisions = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { status, questionId, sortBy = 'schedule', sortOrder = 'asc' } = req.query;
    
    const query = { userId: req.user._id };
    if (status) query.status = status;
    if (questionId) query.questionId = questionId;
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const [revisions, total] = await Promise.all([
      RevisionSchedule.find(query)
        .populate({
          path: 'questionId',
          select: 'title platform difficulty tags platformQuestionId', 
        })
        .sort(sort)
        .skip(skip)
        .limit(limit),
      RevisionSchedule.countDocuments(query),
    ]);
    
    const enhancedRevisions = revisions.map(rev => {
      const revObj = rev.toObject();
      revObj.currentStatus = revisionService.getRevisionStatusLabel(rev, null, 'actionable', req.userTimeZone);
      revObj.scheduleStatuses = rev.schedule.map((date, idx) => ({
        date,
        status: revisionService.getRevisionStatusLabel(rev, idx, 'display', req.userTimeZone)
      }));
      return revObj;
    });
    
    res.json(formatResponse('Revision schedules retrieved successfully', {
      revisions: enhancedRevisions,
    }, {
      pagination: paginate(total, page, limit),
    }));
  } catch (error) {
    next(error);
  }
};

const getTodayRevisions = async (req, res, next) => {
  try {
    const timeZone = req.userTimeZone;
    const todayStart = getStartOfDay(new Date(), timeZone);
    const todayEnd = getEndOfDay(new Date(), timeZone);
    
    const pendingRevisions = await RevisionSchedule.aggregate([
      { $match: { userId: req.user._id, status: 'active' } },
      {
        $addFields: {
          pendingDue: { $arrayElemAt: ['$schedule', '$currentRevisionIndex'] }
        }
      },
      { $match: { pendingDue: { $gte: todayStart, $lte: todayEnd } } },
      {
        $lookup: {
          from: 'questions',
          localField: 'questionId',
          foreignField: '_id',
          as: 'question'
        }
      },
      { $unwind: { path: '$question', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          questionId: { $ifNull: ['$question._id', null] },
          title: { $ifNull: ['$question.title', null] },
          platform: { $ifNull: ['$question.platform', null] },
          platformQuestionId: { $ifNull: ['$question.platformQuestionId', null] },
          difficulty: { $ifNull: ['$question.difficulty', null] },
          tags: { $ifNull: ['$question.tags', []] },
          scheduledDate: '$pendingDue',
          revisionIndex: '$currentRevisionIndex',
          overdue: { $lt: ['$pendingDue', todayStart] }
        }
      }
    ]);
    
    const stats = await revisionService.calculateRevisionStats(req.user._id);
    
    const enhancedRevisions = pendingRevisions.map(rev => ({
      _id: rev._id,
      questionId: rev.questionId,
      scheduledDate: rev.scheduledDate,
      revisionIndex: rev.revisionIndex,
      overdue: rev.overdue,
      status: rev.overdue ? 'Overdue' : 'Pending'
    }));
    
    res.json(formatResponse('Today\'s pending revisions retrieved', {
      pendingRevisions: enhancedRevisions,
      stats,
    }));
  } catch (error) {
    next(error);
  }
};

const getUpcomingRevisions = async (req, res, next) => {
  try {
    const timeZone = req.userTimeZone;
    let startDate = req.query.startDate ? new Date(req.query.startDate) : getStartOfDay(new Date(), timeZone);
    let endDate = req.query.endDate ? new Date(req.query.endDate) : getEndOfDay(new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000), timeZone);
    
    const upcoming = await RevisionSchedule.aggregate([
      { $match: { userId: req.user._id, status: 'active' } },
      {
        $addFields: {
          pendingDue: { $arrayElemAt: ['$schedule', '$currentRevisionIndex'] }
        }
      },
      { $match: { pendingDue: { $gte: startDate, $lte: endDate } } },
      {
        $lookup: {
          from: 'questions',
          localField: 'questionId',
          foreignField: '_id',
          as: 'question'
        }
      },
      { $unwind: { path: '$question', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$pendingDue' } },
          date: { $first: '$pendingDue' },
          count: { $sum: 1 },
          questions: {
            $push: {
              _id: '$_id',
              questionId: {
                $cond: {
                  if: { $eq: ['$question', null] },
                  then: null,
                  else: {
                    _id: '$question._id',
                    platformQuestionId: '$question.platformQuestionId',
                    title: '$question.title',
                    platform: '$question.platform',
                    difficulty: '$question.difficulty'
                  }
                }
              },
              revisionIndex: '$currentRevisionIndex'
            }
          }
        }
      },
      { $sort: { date: 1 } },
    ]);
    
    // POST‑PROCESSING: replace empty objects with null
    for (const group of upcoming) {
      for (const q of group.questions) {
        if (q.questionId && typeof q.questionId === 'object' && Object.keys(q.questionId).length === 0) {
          q.questionId = null;
        }
      }
    }
    
    const stats = await revisionService.calculateUpcomingStats(req.user._id, startDate, endDate);
    
    upcoming.forEach(group => {
      group.questions = group.questions.map(q => ({
        ...q,
        status: 'Upcoming'
      }));
    });
    
    res.json(formatResponse('Upcoming revisions retrieved', {
      upcomingRevisions: upcoming,
      stats,
    }));
  } catch (error) {
    next(error);
  }
};

const getQuestionRevision = async (req, res, next) => {
  try {
    const timeZone = req.userTimeZone;
    const revision = await RevisionSchedule.findOne({
      userId: req.user._id,
      questionId: req.params.questionId,
    }).populate({
      path: 'questionId',
      select: 'platformQuestionId title difficulty platform', 
    });
    
    if (!revision) {
      throw new AppError('Revision schedule not found', 404);
    }
  
    const revObj = revision.toObject();
    revObj.currentStatus = revisionService.getRevisionStatusLabel(revision, null, 'actionable', timeZone);
    revObj.scheduleStatuses = revision.schedule.map((date, idx) => ({
      date,
      status: revisionService.getRevisionStatusLabel(revision, idx, 'display', timeZone)
    }));
    
    res.json(formatResponse('Revision schedule retrieved successfully', {
      revision: revObj,
    }));
  } catch (error) {
    next(error);
  }
};

const getQuestionRevisionByPlatform = async (req, res, next) => {
  try {
    const timeZone = req.userTimeZone;
    const { platform, platformQuestionId } = req.params;
    const question = await Question.findOne({ platform, platformQuestionId, isActive: true });
    if (!question) throw new AppError('Question not found', 404);

    const revision = await RevisionSchedule.findOne({
      userId: req.user._id,
      questionId: question._id,
    }).populate({
      path: 'questionId',
      select: 'platformQuestionId title difficulty platform', 
    });

    if (!revision) throw new AppError('Revision schedule not found', 404);

    const revObj = revision.toObject();
    revObj.currentStatus = revisionService.getRevisionStatusLabel(revision, null, 'actionable', timeZone);
    revObj.scheduleStatuses = revision.schedule.map((date, idx) => ({
      date,
      status: revisionService.getRevisionStatusLabel(revision, idx, 'display', timeZone)
    }));

    res.json(formatResponse('Revision schedule retrieved successfully', { revision: revObj }));
  } catch (error) {
    next(error);
  }
};

const createRevision = async (req, res, next) => {
  try {
    let { baseDate = new Date(), schedule } = req.body;
    
    let baseDateObj;
    if (baseDate instanceof Date) {
      baseDateObj = baseDate;
    } else {
      baseDateObj = new Date(baseDate);
    }
    
    if (isNaN(baseDateObj.getTime())) {
      throw new AppError('Invalid baseDate format. Use ISO string like: 2026-02-01T08:00:00.000Z', 400);
    }
    
    const existing = await RevisionSchedule.findOne({
      userId: req.user._id,
      questionId: req.params.questionId,
    });
    
    if (existing) {
      throw new AppError('Revision schedule already exists for this question', 409);
    }
    
    const question = await Question.findById(req.params.questionId);
    if (!question) {
      throw new AppError('Question not found', 404);
    }

    const progress = await UserQuestionProgress.findOne({
      userId: req.user._id,
      questionId: req.params.questionId,
      status: { $in: ['Solved', 'Mastered'] }
    });
    if (!progress) {
      throw new AppError('Cannot create revision schedule for an unsolved question. Please solve it first.', 400);
    }
    
    let revisionSchedule;
    if (schedule && Array.isArray(schedule) && schedule.length > 0) {
      revisionSchedule = schedule.map(dateStr => {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          throw new AppError(`Invalid date in schedule: ${dateStr}`, 400);
        }
        return date;
      });
      
      if (revisionSchedule.length !== 5) {
        throw new AppError('Schedule must contain exactly 5 dates', 400);
      }
    } else {
      revisionSchedule = calculateSpacedRepetitionSchedule(baseDateObj);
    }
    
    const revision = await RevisionSchedule.create({
      userId: req.user._id,
      questionId: req.params.questionId,
      schedule: revisionSchedule,
      baseDate: baseDateObj,
      status: 'active',
    });
    
    await invalidateCache(`revisions:*:user:${req.user._id}:*`);
    
    res.status(201).json(formatResponse('Revision schedule created successfully', {
      revision,
    }));
  } catch (error) {
    console.error('DEBUG: Error in createRevision:', error);
    next(error);
  }
};

const completeRevision = async (req, res, next) => {
  try {
    const { revisionId } = req.params;
    const skipOverdue = req.query.skipOverdue === 'true';
    const allowOverdue = req.query.overdue === 'true';

    const revision = await RevisionSchedule.findOne({ _id: revisionId, userId: req.user._id });
    if (!revision) throw new AppError('Revision schedule not found', 404);

    const result = await revisionActivityService.checkAndCompleteRevision(
      req.user._id,
      revision.questionId,
      new Date(),
      'manual',
      { skipOverdue, allowOverdue }
    );

    if (!result.completed) {
      throw new AppError(result.message, 400);
    }

    // Fixed: two-argument form
    if (jobQueue) {
      await jobQueue.add('confidence.increment', {
        userId: req.user._id,
        questionId: revision.questionId,
        action: 'revision_completed',
      });
    }

    res.json(formatResponse(result.message, {
      revisionCompleted: true,
      overdueCompleted: result.overdueCompleted || false,
      skippedCount: result.skippedCount || 0
    }));
  } catch (error) {
    next(error);
  }
};

const completeQuestionRevision = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const skipOverdue = req.query.skipOverdue === 'true';
    const allowOverdue = req.query.overdue === 'true';

    const result = await revisionActivityService.checkAndCompleteRevision(
      req.user._id,
      questionId,
      new Date(),
      'manual',
      { skipOverdue, allowOverdue }
    );

    if (!result.completed) {
      throw new AppError(result.message, 400);
    }

    // Fixed: two-argument form
    if (jobQueue) {
      await jobQueue.add('confidence.increment', {
        userId: req.user._id,
        questionId,
        action: 'revision_completed',
      });
    }

    res.json(formatResponse(result.message, {
      revisionCompleted: true,
      overdueCompleted: result.overdueCompleted || false,
      skippedCount: result.skippedCount || 0
    }));
  } catch (error) {
    next(error);
  }
};

const completePastRevision = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { date, confidence } = req.body;

    if (confidence !== undefined) {
      throw new AppError('Manual confidence update is not allowed. Confidence is automatically incremented.', 400);
    }

    if (!date) {
      throw new AppError('Date is required', 400);
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      throw new AppError('Invalid date format. Use ISO string or YYYY-MM-DD', 400);
    }

    const result = await revisionActivityService.completePastRevision(
      req.user._id,
      questionId,
      targetDate,
      confidence
    );

    if (!result.completed) {
      if (result.message && result.message.includes('session started')) {
        return res.status(202).json(formatResponse(result.message, null));
      }
      throw new AppError(result.message, 400);
    }

    // Confidence increment is already queued inside the service, so no need here.
    // Remove the duplicate call.

    res.json(formatResponse(result.message, { revision: result.revision }));
  } catch (error) {
    next(error);
  }
};

const recordTimeSpent = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { minutes } = req.body;
    const today = new Date();

    await revisionActivityService.recordTimeSpent(req.user._id, questionId, today, minutes);

    const todayStr = formatDate(today);
    const redisKey = `revision:activity:${req.user._id}:${questionId}:${todayStr}`;
    const activity = await redisClient.hGetAll(redisKey);
    const totalMinutesToday = parseInt(activity.timeSpent) || 0;

    const notifiedKey = `time_threshold_notified:${req.user._id}:${questionId}:${todayStr}`;
    const alreadyNotified = await redisClient.exists(notifiedKey);
    
    // Fixed: two-argument form
    if (totalMinutesToday >= 20 && !alreadyNotified && jobQueue) {
      await jobQueue.add('time.threshold_reached', {
        userId: req.user._id,
        questionId,
        minutesSpent: totalMinutesToday,
        date: today,
      });
      await redisClient.setEx(notifiedKey, 86400, '1');
    }

    let progress = await UserQuestionProgress.findOne({
      userId: req.user._id,
      questionId
    });

    if (!progress) {
      progress = new UserQuestionProgress({
        userId: req.user._id,
        questionId,
        totalTimeSpent: minutes,
        status: 'Not Started',
      });
    } else {
      progress.totalTimeSpent += minutes;
    }

    const isTimeThresholdReached = progress.totalTimeSpent >= 20;
    const isNotSolved = progress.status !== 'Solved' && progress.status !== 'Mastered';

    // Fixed: two-argument form
    if (isTimeThresholdReached && isNotSolved && jobQueue) {
      await jobQueue.add('question.solved', {
        userId: req.user._id,
        questionId,
        progressId: progress._id,
        timeSpent: minutes,
        solvedAt: new Date(),
        source: 'time_based'
      });
    }

    if (progress.totalTimeSpent >= 20 && progress.status === 'Not Started') {
      progress.status = 'Attempted';
    }

    await progress.save();

    const existingRevision = await RevisionSchedule.findOne({
      userId: req.user._id,
      questionId
    });
    if (!existingRevision && progress.totalTimeSpent >= 20) {
      const baseDate = new Date();
      const schedule = [1, 3, 7, 14, 30].map(days => {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + days);
        d.setHours(0, 0, 0, 0);
        return d;
      });
      await RevisionSchedule.create({
        userId: req.user._id,
        questionId,
        schedule,
        baseDate,
        status: 'active'
      });
      await invalidateCache(`revisions:*:user:${req.user._id}:*`);
    }

    const result = await revisionActivityService.checkAndCompleteRevision(
      req.user._id,
      questionId,
      today,
      'auto'
    );

    if (result.completed) {
      return res.json(formatResponse(result.message, { revisionCompleted: true }));
    }

    res.json(formatResponse('Time recorded successfully', { minutes }));
  } catch (error) {
    next(error);
  }
};

const rescheduleRevision = async (req, res, next) => {
  try {
    const timeZone = req.userTimeZone;
    const { newDate, revisionIndex } = req.body;
    
    if (revisionIndex < 0 || revisionIndex > 4) {
      throw new AppError('Invalid revision index', 400);
    }
    
    const revision = await RevisionSchedule.findOne({
      _id: req.params.revisionId,
      userId: req.user._id,
    });
    
    if (!revision) {
      throw new AppError('Revision schedule not found', 404);
    }
    
    if (revision.status === 'completed') {
      throw new AppError('Cannot reschedule a completed revision schedule.', 400);
    }
    
    const currentDueDate = revision.schedule[revision.currentRevisionIndex];
    
    if (!isToday(currentDueDate, timeZone)) {
      throw new AppError('Revisions can only be rescheduled on their scheduled due date.', 400);
    }
    
    revision.schedule[revisionIndex] = new Date(newDate);
    revision.updatedAt = new Date();
    
    if (revisionIndex < revision.currentRevisionIndex) {
      revision.currentRevisionIndex = revisionIndex;
    }
    
    await revision.save();
    
    await invalidateCache(`revisions:*:user:${req.user._id}:*`);
    
    res.json(formatResponse('Revision rescheduled successfully', {
      revision,
    }));
  } catch (error) {
    next(error);
  }
};

const deleteRevision = async (req, res, next) => {
  try {
    const revision = await RevisionSchedule.findOneAndDelete({
      _id: req.params.revisionId,
      userId: req.user._id,
    });
    
    if (!revision) {
      throw new AppError('Revision schedule not found', 404);
    }
    
    await invalidateCache(`revisions:*:user:${req.user._id}:*`);
    
    res.json(formatResponse('Revision schedule deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const deleteQuestionRevision = async (req, res, next) => {
  try {
    const revision = await RevisionSchedule.findOneAndDelete({
      userId: req.user._id,
      questionId: req.params.questionId,
    });
    
    if (!revision) {
      throw new AppError('Revision schedule not found', 404);
    }
    
    await invalidateCache(`revisions:*:user:${req.user._id}:*`);
    
    res.json(formatResponse('Revision schedule deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const fetchOverdueRevisionsForStats = async (userId, timeZone, limit = 50) => {
  const todayStart = getStartOfDay(new Date(), timeZone);
  const overdue = await RevisionSchedule.aggregate([
    { $match: { userId, status: { $in: ['active', 'overdue'] } } },
    {
      $addFields: {
        pendingDue: { $arrayElemAt: ['$schedule', '$currentRevisionIndex'] },
        // Check if the pending due date is already in completedRevisions
        alreadyCompleted: {
          $in: [
            { $arrayElemAt: ['$schedule', '$currentRevisionIndex'] },
            '$completedRevisions.date'
          ]
        }
      }
    },
    { $match: { pendingDue: { $lt: todayStart }, alreadyCompleted: false } },
    { $sort: { pendingDue: 1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'questions',
        localField: 'questionId',
        foreignField: '_id',
        as: 'question'
      }
    },
    { $unwind: { path: '$question', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        questionId: '$question._id',
        platformQuestionId: '$question.platformQuestionId',
        title: { $ifNull: ['$question.title', 'Unknown'] },
        difficulty: '$question.difficulty',
        platform: '$question.platform',
        currentRevisionIndex: 1,
        nextRevisionDue: '$pendingDue',
        totalTimeSpent: { $sum: '$completedRevisions.timeSpent' },
        confidenceLevel: { $arrayElemAt: ['$completedRevisions.confidenceAfter', -1] },
        status: { $literal: 'overdue' }
      }
    }
  ]);
  return overdue;
};

const fetchUpcomingRevisionsForStats = async (userId, timeZone, limit = 20) => {
  const startDate = getStartOfDay(new Date(), timeZone);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30);
  endDate.setHours(23, 59, 59, 999);

  const upcoming = await RevisionSchedule.aggregate([
    { $match: { userId, status: 'active' } },
    {
      $addFields: {
        pendingDue: { $arrayElemAt: ['$schedule', '$currentRevisionIndex'] }
      }
    },
    { $match: { pendingDue: { $gte: startDate, $lte: endDate } } },
    { $sort: { pendingDue: 1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'questions',
        localField: 'questionId',
        foreignField: '_id',
        as: 'question'
      }
    },
    { $unwind: { path: '$question', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        questionId: '$question._id',
        platformQuestionId: '$question.platformQuestionId',
        title: { $ifNull: ['$question.title', 'Unknown'] },
        platform: '$question.platform',
        difficulty: '$question.difficulty',
        scheduledDate: '$pendingDue',
        revisionIndex: '$currentRevisionIndex',
        status: { $literal: 'Upcoming' }
      }
    }
  ]);
  return upcoming;
};

const getRevisionStats = async (req, res, next) => {
  try {
    const detailed = req.query.detailed === 'true';
    const timeZone = req.userTimeZone;
    
    let stats;
    if (detailed) {
      stats = await revisionService.getDetailedRevisionStats(req.user._id, timeZone);
      
      const [overdueRevisions, upcomingRevisions] = await Promise.all([
        fetchOverdueRevisionsForStats(req.user._id, timeZone, 5),
        fetchUpcomingRevisionsForStats(req.user._id, timeZone, 5)
      ]);
      stats.overdueRevisions = overdueRevisions;
      stats.upcomingRevisions = upcomingRevisions;
    } else {
      stats = await revisionService.calculateRevisionStats(req.user._id);
    }
    
    res.json(formatResponse(
      detailed ? 'Detailed revision statistics retrieved' : 'Revision statistics retrieved',
      { stats }
    ));
  } catch (error) {
    next(error);
  }
};

const getOverdueRevisions = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const timeZone = req.userTimeZone;
    const today = getStartOfDay(new Date(), timeZone);
    
    const overdue = await RevisionSchedule.aggregate([
      { $match: { userId: req.user._id, status: { $in: ['active', 'overdue'] } } },
      {
        $addFields: {
          pendingDue: { $arrayElemAt: ['$schedule', '$currentRevisionIndex'] },
          // Check if the pending due date is already in completedRevisions
          alreadyCompleted: {
            $in: [
              { $arrayElemAt: ['$schedule', '$currentRevisionIndex'] },
              '$completedRevisions.date'
            ]
          }
        }
      },
      { $match: { pendingDue: { $lt: today }, alreadyCompleted: false } },
      { $sort: { pendingDue: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'questions',
          localField: 'questionId',
          foreignField: '_id',
          as: 'question'
        }
      },
      { $unwind: { path: '$question', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          questionId: '$question._id',
          platformQuestionId: '$question.platformQuestionId',
          title: { $ifNull: ['$question.title', 'Unknown'] },
          platform: '$question.platform',
          difficulty: '$question.difficulty',
          tags: '$question.tags',
          scheduledDate: '$pendingDue',
          overdue: { $literal: true },
          currentRevisionIndex: 1,
          totalTimeSpent: { $sum: '$completedRevisions.timeSpent' },
          confidenceAfter: { $arrayElemAt: ['$completedRevisions.confidenceAfter', -1] }
        }
      }
    ]);
    
    const totalResult = await RevisionSchedule.aggregate([
      { $match: { userId: req.user._id, status: { $in: ['active', 'overdue'] } } },
      {
        $addFields: {
          pendingDue: { $arrayElemAt: ['$schedule', '$currentRevisionIndex'] },
          alreadyCompleted: {
            $in: [
              { $arrayElemAt: ['$schedule', '$currentRevisionIndex'] },
              '$completedRevisions.date'
            ]
          }
        }
      },
      { $match: { pendingDue: { $lt: today }, alreadyCompleted: false } },
      { $count: 'count' }
    ]);
    const totalCount = totalResult[0]?.count || 0;
    
    res.json(formatResponse('Overdue revisions retrieved', {
      revisions: overdue,
    }, {
      pagination: paginate(totalCount, page, limit),
    }));
  } catch (error) {
    next(error);
  }
};

const getDetailedRevisionStats = async (req, res, next) => {
  req.query.detailed = 'true';
  return getRevisionStats(req, res, next);
};

module.exports = {
  getRevisions,
  getTodayRevisions,
  getUpcomingRevisions,
  getQuestionRevision,
  getQuestionRevisionByPlatform,
  createRevision,
  completeRevision,
  completeQuestionRevision,
  completePastRevision,
  recordTimeSpent,
  rescheduleRevision,
  deleteRevision,
  deleteQuestionRevision,
  getRevisionStats,
  getOverdueRevisions,
  getDetailedRevisionStats,
  calculateSpacedRepetitionSchedule,
};
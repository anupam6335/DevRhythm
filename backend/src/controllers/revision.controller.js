const RevisionSchedule = require('../models/RevisionSchedule');
const Question = require('../models/Question');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const { formatResponse, paginate, getPaginationParams, getStartOfDay, getEndOfDay, formatDate, isToday } = require("../utils/helpers");
const AppError = require('../utils/errors/AppError');
const { invalidateCache } = require('../middleware/cache');
const revisionService = require('../services/revision.service');
const revisionActivityService = require('../services/revisionActivity.service');
const { jobQueue } = require('../services/queue.service');

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
      revObj.currentStatus = revisionService.getRevisionStatusLabel(rev);
      revObj.scheduleStatuses = rev.schedule.map((date, idx) => ({
        date,
        status: revisionService.getRevisionStatusLabel(rev, idx)
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
    const todayStart = getStartOfDay();
    const todayEnd = getEndOfDay();
    
    const pendingRevisions = await RevisionSchedule.find({
      userId: req.user._id,
      schedule: { $elemMatch: { $gte: todayStart, $lte: todayEnd } },
      status: 'active',
      $expr: {
        $lt: ['$currentRevisionIndex', { $size: '$schedule' }],
      },
    }).populate({
      path: 'questionId',
      select: 'title platform difficulty tags platformQuestionId', 
    });
    
    const stats = await revisionService.calculateRevisionStats(req.user._id);
    
    const enhancedRevisions = pendingRevisions.map(rev => ({
      _id: rev._id,
      questionId: rev.questionId,
      scheduledDate: rev.schedule[rev.currentRevisionIndex],
      revisionIndex: rev.currentRevisionIndex,
      overdue: rev.schedule[rev.currentRevisionIndex] < todayStart,
      status: revisionService.getRevisionStatusLabel(rev),
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
    const startDate = new Date(req.query.startDate || getStartOfDay());
    const endDate = new Date(req.query.endDate || getEndOfDay(new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)));
    
    const upcoming = await RevisionSchedule.aggregate([
      {
        $match: {
          userId: req.user._id,
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
        $lookup: {
          from: 'questions',
          localField: 'questionId',
          foreignField: '_id',
          as: 'question',
        },
      },
      {
        $unwind: '$question',
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$schedule' } },
          date: { $first: '$schedule' },
          count: { $sum: 1 },
          questions: {
            $push: {
              _id: '$_id',
              questionId: {
                _id: '$question._id',
                platformQuestionId: '$question.platformQuestionId', // ✅ added
                title: '$question.title',
                platform: '$question.platform',
                difficulty: '$question.difficulty',
              },
              revisionIndex: '$revisionIndex',
            },
          },
        },
      },
      {
        $sort: { date: 1 },
      },
    ]);
    
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
    revObj.currentStatus = revisionService.getRevisionStatusLabel(revision, null, 'actionable');
    revObj.scheduleStatuses = revision.schedule.map((date, idx) => ({
      date,
      status: revisionService.getRevisionStatusLabel(revision, idx, 'display')
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
    revObj.currentStatus = revisionService.getRevisionStatusLabel(revision, null, 'actionable');
    revObj.scheduleStatuses = revision.schedule.map((date, idx) => ({
      date,
      status: revisionService.getRevisionStatusLabel(revision, idx, 'display')
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
      console.error('DEBUG: Invalid baseDate:', baseDate);
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

    res.json(formatResponse(result.message, {
      revisionCompleted: true,
      overdueCompleted: result.overdueCompleted || false,
      skippedCount: result.skippedCount || 0
    }));
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
    
    if (!isToday(currentDueDate)) {
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

// Now accepts a limit parameter (default 50 for backward compatibility)
const fetchOverdueRevisionsForStats = async (userId, limit = 50) => {
  const todayStart = getStartOfDay();
  const overdue = await RevisionSchedule.find({
    userId,
    status: 'active',
    $expr: {
      $and: [
        { $lt: [{ $arrayElemAt: ['$schedule', '$currentRevisionIndex'] }, todayStart] },
        { $lt: ['$currentRevisionIndex', { $size: '$schedule' }] }
      ]
    }
  })
    .populate({
      path: 'questionId',
      select: '_id platformQuestionId title difficulty platform'
    })
    .sort({ 'schedule': 1 })
    .limit(limit)   // ← limit applied here
    .lean();

  return overdue.map(rev => ({
    questionId: rev.questionId?._id || null,
    platformQuestionId: rev.questionId?.platformQuestionId || null,
    title: rev.questionId?.title || 'Unknown',
    difficulty: rev.questionId?.difficulty || null,
    platform: rev.questionId?.platform || null,
    currentRevisionIndex: rev.currentRevisionIndex,
    nextRevisionDue: rev.schedule[rev.currentRevisionIndex] || null,
    totalTimeSpent: rev.completedRevisions.reduce((sum, cr) => sum + (cr.timeSpent || 0), 0),
    confidenceLevel: rev.completedRevisions.length
      ? rev.completedRevisions[rev.completedRevisions.length - 1].confidenceAfter
      : null,
    status: 'overdue'
  }));
};


// Now accepts a limit parameter (default 20 for backward compatibility)
const fetchUpcomingRevisionsForStats = async (userId, limit = 20) => {
  const startDate = getStartOfDay();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  endDate.setHours(23, 59, 59, 999);

  const upcoming = await RevisionSchedule.aggregate([
    { $match: { userId, status: 'active' } },
    { $unwind: { path: '$schedule', includeArrayIndex: 'revisionIndex' } },
    {
      $match: {
        $expr: {
          $and: [
            { $gte: ['$schedule', startDate] },
            { $lte: ['$schedule', endDate] },
            { $eq: ['$revisionIndex', '$currentRevisionIndex'] }
          ]
        }
      }
    },
    { $sort: { schedule: 1 } },
    { $limit: limit },   // ← limit applied here
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
        _id: 0,
        questionId: '$question._id',
        platformQuestionId: '$question.platformQuestionId',
        title: '$question.title',
        platform: '$question.platform',
        difficulty: '$question.difficulty',
        scheduledDate: '$schedule',
        revisionIndex: '$revisionIndex',
        status: 'Upcoming'
      }
    }
  ]);
  return upcoming;
};

const getRevisionStats = async (req, res, next) => {
  try {
    const detailed = req.query.detailed === 'true';
    
    let stats;
    if (detailed) {
      // Get the full detailed stats (trends, byDifficulty, etc.)
      stats = await revisionService.getDetailedRevisionStats(req.user._id);
      
      // Add limited overdue and upcoming revisions
      const [overdueRevisions, upcomingRevisions] = await Promise.all([
        fetchOverdueRevisionsForStats(req.user._id, 5),
        fetchUpcomingRevisionsForStats(req.user._id, 5)
      ]);
      stats.overdueRevisions = overdueRevisions;
      stats.upcomingRevisions = upcomingRevisions;
      
      // Optionally remove the old questionLevelDetails if you want to avoid duplication
      // delete stats.questionLevelDetails;
    } else {
      // Basic stats only
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
    const today = getStartOfDay();
    
    const query = {
      userId: req.user._id,
      status: 'active',
      $expr: {
        $and: [
          { $lt: ['$currentRevisionIndex', { $size: '$schedule' }] },
          { $lt: [{ $arrayElemAt: ['$schedule', '$currentRevisionIndex'] }, today] },
        ],
      },
    };
    
    const [revisions, total] = await Promise.all([
      RevisionSchedule.find(query)
        .populate({
          path: 'questionId',
          select: 'title platform difficulty tags platformQuestionId', 
        })
        .sort({ schedule: 1 })
        .skip(skip)
        .limit(limit),
      RevisionSchedule.countDocuments(query),
    ]);
    
    const enhancedRevisions = revisions.map(rev => {
      const revObj = rev.toObject();
      revObj.currentStatus = revisionService.getRevisionStatusLabel(rev);
      return revObj;
    });
    
    res.json(formatResponse('Overdue revisions retrieved', {
      revisions: enhancedRevisions,
    }, {
      pagination: paginate(total, page, limit),
    }));
  } catch (error) {
    next(error);
  }
};

// Kept for backward compatibility, but now redirects to getRevisionStats with detailed=true
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
  recordTimeSpent,
  rescheduleRevision,
  deleteRevision,
  deleteQuestionRevision,
  getRevisionStats,
  getOverdueRevisions,
  getDetailedRevisionStats,
  calculateSpacedRepetitionSchedule,
};



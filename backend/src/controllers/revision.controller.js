const RevisionSchedule = require('../models/RevisionSchedule');
const Question = require('../models/Question');
const { formatResponse } = require('../utils/helpers/response');
const { paginate, getPaginationParams, getStartOfDay, getEndOfDay, formatDate } = require('../utils/helpers');
const AppError = require('../utils/errors/AppError');
const { invalidateCache } = require('../middleware/cache');
const revisionService = require('../services/revision.service');

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
          select: 'title platform difficulty tags',
        })
        .sort(sort)
        .skip(skip)
        .limit(limit),
      RevisionSchedule.countDocuments(query),
    ]);
    
    res.json(formatResponse('Revision schedules retrieved successfully', {
      revisions,
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
      select: 'title platform difficulty tags',
    });
    
    const stats = await revisionService.calculateRevisionStats(req.user._id);
    
    res.json(formatResponse('Today\'s pending revisions retrieved', {
      pendingRevisions: pendingRevisions.map(rev => ({
        _id: rev._id,
        questionId: rev.questionId,
        scheduledDate: rev.schedule[rev.currentRevisionIndex],
        revisionIndex: rev.currentRevisionIndex,
        overdue: rev.schedule[rev.currentRevisionIndex] < todayStart,
      })),
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
    });
    
    if (!revision) {
      throw new AppError('Revision schedule not found', 404);
    }
    
    res.json(formatResponse('Revision schedule retrieved successfully', {
      revision,
    }));
  } catch (error) {
    next(error);
  }
};

const createRevision = async (req, res, next) => {
  try {
    console.log('DEBUG: createRevision called with:', {
      userId: req.user._id,
      questionId: req.params.questionId,
      body: req.body
    });

    let { baseDate = new Date(), schedule } = req.body;
    
    console.log('DEBUG: Parsed baseDate:', baseDate, 'Type:', typeof baseDate);
    
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
    
    console.log('DEBUG: Checking for existing revision...');
    const existing = await RevisionSchedule.findOne({
      userId: req.user._id,
      questionId: req.params.questionId,
    });
    
    if (existing) {
      console.log('DEBUG: Revision already exists');
      throw new AppError('Revision schedule already exists for this question', 409);
    }
    
    console.log('DEBUG: Checking question exists...');
    const question = await Question.findById(req.params.questionId);
    if (!question) {
      console.log('DEBUG: Question not found:', req.params.questionId);
      throw new AppError('Question not found', 404);
    }
    
    let revisionSchedule;
    if (schedule && Array.isArray(schedule) && schedule.length > 0) {
      console.log('DEBUG: Using provided schedule');
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
      console.log('DEBUG: Calculating spaced repetition schedule');
      revisionSchedule = calculateSpacedRepetitionSchedule(baseDateObj);
    }
    
    console.log('DEBUG: Creating revision schedule...');
    const revision = await RevisionSchedule.create({
      userId: req.user._id,
      questionId: req.params.questionId,
      schedule: revisionSchedule,
      baseDate: baseDateObj,
      status: 'active',
    });
    
    console.log('DEBUG: Invalidating cache...');
    await invalidateCache(`revisions:*:user:${req.user._id}:*`);
    
    console.log('DEBUG: Sending response...');
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
    const { completedAt = new Date(), status = 'completed', confidenceLevel } = req.body;
    
    const revision = await RevisionSchedule.findOne({
      _id: req.params.revisionId,
      userId: req.user._id,
    });
    
    if (!revision) {
      throw new AppError('Revision schedule not found', 404);
    }
    
    if (revision.currentRevisionIndex >= revision.schedule.length) {
      throw new AppError('All revisions already completed', 400);
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
    
    await invalidateCache(`revisions:*:user:${req.user._id}:*`);
    
    res.json(formatResponse('Revision marked as completed', {
      revision,
    }));
  } catch (error) {
    next(error);
  }
};

const completeQuestionRevision = async (req, res, next) => {
  try {
    const todayStart = getStartOfDay();
    const todayEnd = getEndOfDay();
    
    const revision = await RevisionSchedule.findOne({
      userId: req.user._id,
      questionId: req.params.questionId,
      status: 'active',
      schedule: { $elemMatch: { $gte: todayStart, $lte: todayEnd } },
      $expr: {
        $lt: ['$currentRevisionIndex', { $size: '$schedule' }],
      },
    });
    
    if (!revision) {
      throw new AppError('No pending revision for today', 404);
    }
    
    const { completedAt = new Date(), status = 'completed', confidenceLevel } = req.body;
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
    
    await invalidateCache(`revisions:*:user:${req.user._id}:*`);
    
    res.json(formatResponse('Revision marked as completed', {
      revision,
    }));
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
    
    if (revisionIndex >= revision.schedule.length) {
      throw new AppError('Invalid revision index', 400);
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

const getRevisionStats = async (req, res, next) => {
  try {
    const stats = await revisionService.calculateRevisionStats(req.user._id);
    
    res.json(formatResponse('Revision statistics retrieved', {
      stats,
    }));
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
          { $lt: ['$schedule', { $size: '$schedule' }] },
          { $lt: [{ $arrayElemAt: ['$schedule', '$currentRevisionIndex'] }, today] },
        ],
      },
    };
    
    const [revisions, total] = await Promise.all([
      RevisionSchedule.find(query)
        .populate({
          path: 'questionId',
          select: 'title platform difficulty tags',
        })
        .sort({ schedule: 1 })
        .skip(skip)
        .limit(limit),
      RevisionSchedule.countDocuments(query),
    ]);
    
    res.json(formatResponse('Overdue revisions retrieved', {
      revisions,
    }, {
      pagination: paginate(total, page, limit),
    }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRevisions,
  getTodayRevisions,
  getUpcomingRevisions,
  getQuestionRevision,
  createRevision,
  completeRevision,
  completeQuestionRevision,
  rescheduleRevision,
  deleteRevision,
  deleteQuestionRevision,
  getRevisionStats,
  getOverdueRevisions,
  calculateSpacedRepetitionSchedule,
};
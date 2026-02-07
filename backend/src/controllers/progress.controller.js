const UserQuestionProgress = require('../models/UserQuestionProgress');
const Question = require('../models/Question');
const progressService = require('../services/progress.service');
const patternMasteryService = require('../services/patternMastery.service');
const { formatResponse } = require('../utils/helpers/response');
const { getPaginationParams, paginate } = require('../utils/helpers/pagination');
const AppError = require('../utils/errors/AppError');
const { invalidateProgressCache } = require('../middleware/cache');

const updateProgressPatternMastery = async (userId, questionId) => {
  try {
    const progress = await UserQuestionProgress.findOne({ userId, questionId });
    if (progress) {
      await patternMasteryService.updatePatternMasteryFromProgress(userId, progress._id);
    }
  } catch (error) {
    console.error('Pattern mastery sync failed:', error);
  }
};

const getProgress = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { status, questionId, sortBy, sortOrder, minConfidence, maxConfidence } = req.query;
    const query = { userId: req.user._id };
    
    if (status) query.status = status;
    if (questionId) query.questionId = questionId;
    if (minConfidence || maxConfidence) {
      query.confidenceLevel = {};
      if (minConfidence) query.confidenceLevel.$gte = parseInt(minConfidence);
      if (maxConfidence) query.confidenceLevel.$lte = parseInt(maxConfidence);
    }

    const sort = {};
    if (sortBy === 'attempts') sort['attempts.count'] = sortOrder === 'asc' ? 1 : -1;
    else sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [progress, total] = await Promise.all([
      UserQuestionProgress.find(query)
        .populate('questionId', '_id title platform difficulty tags pattern')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .select('-__v')
        .lean(),
      UserQuestionProgress.countDocuments(query)
    ]);

    res.json(formatResponse('Progress records retrieved successfully', { progress }, { pagination: paginate(total, page, limit) }));
  } catch (error) { next(error); }
};

const getQuestionProgress = async (req, res, next) => {
  try {
    const progress = await UserQuestionProgress.findOne({
      userId: req.user._id,
      questionId: req.params.questionId
    }).select('-__v').lean();

    if (!progress) throw new AppError('Progress record not found', 404);
    res.json(formatResponse('Question progress retrieved successfully', { progress }));
  } catch (error) { next(error); }
};

const createOrUpdateProgress = async (req, res, next) => {
  try {
    const { status, notes, keyInsights, savedCode, confidenceLevel, timeSpent } = req.body;
    const userId = req.user._id;
    const questionId = req.params.questionId;

    const question = await Question.findById(questionId);
    if (!question) throw new AppError('Question not found', 404);

    let progress = await UserQuestionProgress.findOne({ userId, questionId });
    
    const updateData = {
      updatedAt: new Date()
    };
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (keyInsights !== undefined) updateData.keyInsights = keyInsights;
    if (savedCode) updateData.savedCode = { ...savedCode, lastUpdated: new Date() };
    if (confidenceLevel) updateData.confidenceLevel = confidenceLevel;

    if (timeSpent) {
      updateData.$inc = { totalTimeSpent: timeSpent };
    }

    if (status === 'Solved' && (!progress || progress.status !== 'Solved')) {
      updateData.$set = { ...updateData.$set, 'attempts.solvedAt': new Date() };
    } else if (status === 'Mastered' && (!progress || progress.status !== 'Mastered')) {
      updateData.$set = { ...updateData.$set, 'attempts.masteredAt': new Date() };
    }

    if (progress) {
      progress = await UserQuestionProgress.findOneAndUpdate(
        { userId, questionId },
        updateData,
        { new: true }
      );
    } else {
      const attemptData = { count: 0 };
      if (status && status !== 'Not Started') {
        attemptData.firstAttemptAt = new Date();
        attemptData.lastAttemptAt = new Date();
        attemptData.count = 1;
      }

      progress = await UserQuestionProgress.create({
        userId,
        questionId,
        status: status || 'Not Started',
        attempts: attemptData,
        notes,
        keyInsights,
        savedCode: savedCode ? { ...savedCode, lastUpdated: new Date() } : undefined,
        confidenceLevel: confidenceLevel || 1,
        totalTimeSpent: timeSpent || 0
      });
    }

    await invalidateProgressCache(userId);
    await updateProgressPatternMastery(userId, questionId);

    const statusCode = progress.createdAt === progress.updatedAt ? 201 : 200;
    res.status(statusCode).json(formatResponse(
      progress.createdAt === progress.updatedAt ? 'Progress created successfully' : 'Progress updated successfully',
      { progress }
    ));
  } catch (error) { next(error); }
};

const updateStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const questionId = req.params.questionId;
    
    const progress = await UserQuestionProgress.findOneAndUpdate(
      { userId, questionId },
      { 
        $set: { 
          status: req.body.status,
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await invalidateProgressCache(userId);
    await updateProgressPatternMastery(userId, questionId);

    res.json(formatResponse('Status updated successfully', { progress }));
  } catch (error) { next(error); }
};

const updateCode = async (req, res, next) => {
  try {
    const { language, code } = req.body;
    const userId = req.user._id;
    const questionId = req.params.questionId;
    
    const progress = await UserQuestionProgress.findOneAndUpdate(
      { userId, questionId },
      {
        $set: {
          savedCode: { language, code, lastUpdated: new Date() },
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await invalidateProgressCache(userId);
    await updateProgressPatternMastery(userId, questionId);

    res.json(formatResponse('Code updated successfully', { progress }));
  } catch (error) { next(error); }
};

const updateNotes = async (req, res, next) => {
  try {
    const { notes, keyInsights } = req.body;
    const userId = req.user._id;
    const questionId = req.params.questionId;
    
    const updateData = { updatedAt: new Date() };
    if (notes !== undefined) updateData.notes = notes;
    if (keyInsights !== undefined) updateData.keyInsights = keyInsights;
    
    const progress = await UserQuestionProgress.findOneAndUpdate(
      { userId, questionId },
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await invalidateProgressCache(userId);
    await updateProgressPatternMastery(userId, questionId);

    res.json(formatResponse('Notes updated successfully', { progress }));
  } catch (error) { next(error); }
};

const updateConfidence = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const questionId = req.params.questionId;
    
    const progress = await UserQuestionProgress.findOneAndUpdate(
      { userId, questionId },
      {
        $set: {
          confidenceLevel: req.body.confidenceLevel,
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await invalidateProgressCache(userId);
    await updateProgressPatternMastery(userId, questionId);

    res.json(formatResponse('Confidence level updated successfully', { progress }));
  } catch (error) { next(error); }
};

const recordAttempt = async (req, res, next) => {
  try {
    const { timeSpent, successful } = req.body;
    const userId = req.user._id;
    const questionId = req.params.questionId;
    
    const update = {
      $inc: { 'attempts.count': 1, totalTimeSpent: timeSpent },
      $set: { 
        'attempts.lastAttemptAt': new Date(),
        updatedAt: new Date()
      }
    };

    if (!successful) {
      update.$set.status = 'Attempted';
    }

    const progress = await UserQuestionProgress.findOneAndUpdate(
      { userId, questionId },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (!progress.attempts.firstAttemptAt) {
      progress.attempts.firstAttemptAt = new Date();
      await progress.save();
    }

    await invalidateProgressCache(userId);
    await updateProgressPatternMastery(userId, questionId);

    res.json(formatResponse('Attempt recorded successfully', { progress }));
  } catch (error) { next(error); }
};

const recordRevision = async (req, res, next) => {
  try {
    const { timeSpent, confidenceLevel } = req.body;
    const userId = req.user._id;
    const questionId = req.params.questionId;
    
    const update = {
      $inc: { revisionCount: 1, totalTimeSpent: timeSpent },
      $set: { 
        lastRevisedAt: new Date(),
        updatedAt: new Date()
      }
    };

    if (confidenceLevel) {
      update.$set.confidenceLevel = confidenceLevel;
    }

    const progress = await UserQuestionProgress.findOneAndUpdate(
      { userId, questionId },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await invalidateProgressCache(userId);
    await updateProgressPatternMastery(userId, questionId);

    res.json(formatResponse('Revision recorded successfully', { progress }));
  } catch (error) { next(error); }
};

const deleteProgress = async (req, res, next) => {
  try {
    const progress = await UserQuestionProgress.findOneAndDelete({
      userId: req.user._id,
      questionId: req.params.questionId
    });

    if (!progress) throw new AppError('Progress record not found', 404);

    await invalidateProgressCache(req.user._id);
    await patternMasteryService.updatePatternMasteryFromProgress(req.user._id, progress._id);

    res.json(formatResponse('Progress deleted successfully'));
  } catch (error) { next(error); }
};

const getProgressStats = async (req, res, next) => {
  try {
    const stats = await progressService.calculateProgressStats(req.user._id);
    res.json(formatResponse('Progress statistics retrieved successfully', { stats }));
  } catch (error) { next(error); }
};

const getRecentProgress = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const progress = await progressService.getUserRecentProgress(req.user._id, limit);
    res.json(formatResponse('Recent progress retrieved successfully', { progress }));
  } catch (error) { next(error); }
};

module.exports = {
  getProgress,
  getQuestionProgress,
  createOrUpdateProgress,
  updateStatus,
  updateCode,
  updateNotes,
  updateConfidence,
  recordAttempt,
  recordRevision,
  deleteProgress,
  getProgressStats,
  getRecentProgress
};
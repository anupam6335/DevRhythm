const Question = require('../models/Question');
const { formatResponse } = require('../utils/helpers/response');
const { getPaginationParams, paginate } = require('../utils/helpers/pagination');
const AppError = require('../utils/errors/AppError');
const { invalidateQuestionCache } = require('../middleware/cache');

const getQuestions = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { platform, difficulty, pattern, tags, search } = req.query;
    const query = { isActive: true };
    if (platform) query.platform = platform;
    if (difficulty) query.difficulty = difficulty;
    if (pattern) query.pattern = pattern;
    if (tags) query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    if (search) query.$text = { $search: search };
    const [questions, total] = await Promise.all([
      Question.find(query).skip(skip).limit(limit).select('-__v'),
      Question.countDocuments(query)
    ]);
    res.json(formatResponse('Questions retrieved successfully', { questions }, { pagination: paginate(total, page, limit) }));
  } catch (error) { next(error); }
};

const getQuestionById = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id).populate('similarQuestions', '_id title platform difficulty pattern').select('-__v');
    if (!question) throw new AppError('Question not found', 404);
    res.json(formatResponse('Question retrieved successfully', { question }));
  } catch (error) { next(error); }
};

const createQuestion = async (req, res, next) => {
  try {
    const existing = await Question.findOne({ platform: req.body.platform, platformQuestionId: req.body.platformQuestionId });
    if (existing) throw new AppError('Question with same platform and ID already exists', 409);
    const question = await Question.create(req.body);
    
    await invalidateQuestionCache(question._id, question.platform, question.platformQuestionId);
    
    res.status(201).json(formatResponse('Question created successfully', { question }));
  } catch (error) { next(error); }
};

const updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-__v');
    if (!question) throw new AppError('Question not found', 404);
    
    await invalidateQuestionCache(question._id, question.platform, question.platformQuestionId);
    
    res.json(formatResponse('Question updated successfully', { question }));
  } catch (error) { next(error); }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!question) throw new AppError('Question not found', 404);
    
    await invalidateQuestionCache(question._id, question.platform, question.platformQuestionId);
    
    res.json(formatResponse('Question deleted successfully'));
  } catch (error) { next(error); }
};

const restoreQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!question) throw new AppError('Question not found', 404);
    
    await invalidateQuestionCache(question._id, question.platform, question.platformQuestionId);
    
    res.json(formatResponse('Question restored successfully', { question }));
  } catch (error) { next(error); }
};

const permanentDeleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) throw new AppError('Question not found', 404);
    
    await invalidateQuestionCache(question._id, question.platform, question.platformQuestionId);
    
    res.json(formatResponse('Question permanently deleted successfully'));
  } catch (error) { next(error); }
};

const getDeletedQuestions = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { platform, difficulty, pattern, tags, search } = req.query;
    const query = { isActive: false };
    if (platform) query.platform = platform;
    if (difficulty) query.difficulty = difficulty;
    if (pattern) query.pattern = pattern;
    if (tags) query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    if (search) query.$text = { $search: search };
    const [questions, total] = await Promise.all([
      Question.find(query).skip(skip).limit(limit).select('-__v'),
      Question.countDocuments(query)
    ]);
    res.json(formatResponse('Deleted questions retrieved successfully', { questions }, { pagination: paginate(total, page, limit) }));
  } catch (error) { next(error); }
};

const getQuestionByPlatformId = async (req, res, next) => {
  try {
    const question = await Question.findOne({ platform: req.params.platform, platformQuestionId: req.params.platformQuestionId, isActive: true }).populate('similarQuestions', '_id title platform difficulty pattern').select('-__v');
    if (!question) throw new AppError('Question not found', 404);
    res.json(formatResponse('Question retrieved successfully', { question }));
  } catch (error) { next(error); }
};

const getSimilarQuestions = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id).select('similarQuestions');
    if (!question) throw new AppError('Question not found', 404);
    const similar = await Question.find({ _id: { $in: question.similarQuestions }, isActive: true }).select('_id title problemLink platform difficulty tags pattern');
    res.json(formatResponse('Similar questions retrieved successfully', { similarQuestions: similar }));
  } catch (error) { next(error); }
};

const getPatterns = async (req, res, next) => {
  try {
    const patterns = await Question.distinct('pattern', { pattern: { $ne: '' }, isActive: true });
    res.json(formatResponse('Patterns retrieved successfully', { patterns }));
  } catch (error) { next(error); }
};

const getTags = async (req, res, next) => {
  try {
    const tags = await Question.distinct('tags', { isActive: true });
    res.json(formatResponse('Tags retrieved successfully', { tags }));
  } catch (error) { next(error); }
};

const getStatistics = async (req, res, next) => {
  try {
    const totalQuestions = await Question.countDocuments({ isActive: true });
    const byDifficulty = await Question.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
    ]);
    const byPlatform = await Question.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
    ]);
    const totalPatterns = await Question.distinct('pattern', { pattern: { $ne: '' }, isActive: true });
    const totalTags = await Question.distinct('tags', { isActive: true });
    res.json(formatResponse('Statistics retrieved successfully', {
      statistics: {
        totalQuestions,
        byDifficulty: Object.fromEntries(byDifficulty.map(d => [d._id.toLowerCase(), d.count])),
        byPlatform: Object.fromEntries(byPlatform.map(p => [p._id, p.count])),
        totalPatterns: totalPatterns.length,
        totalTags: totalTags.length,
      }
    }));
  } catch (error) { next(error); }
};

module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  restoreQuestion,
  permanentDeleteQuestion,
  getDeletedQuestions,
  getQuestionByPlatformId,
  getSimilarQuestions,
  getPatterns,
  getTags,
  getStatistics,
};
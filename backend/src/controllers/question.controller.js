const Question = require('../models/Question');
const { formatResponse } = require('../utils/helpers/response');
const { getPaginationParams, paginate } = require('../utils/helpers/pagination');
const AppError = require('../utils/errors/AppError');
const { invalidateQuestionCache } = require('../middleware/cache');
const { fetchProblemDetails, searchProblems } = require('../services/leetcode.service');
const { applySorting } = require('../utils/helpers/sort');
const { jobQueue } = require('../services/queue.service');

// generate a pattern name from tags
const generatePatternFromTags = (tags) => {
  if (!tags || tags.length === 0) return '';
  // Use the first tag, capitalize first letter
  const firstTag = tags[0];
  return firstTag.charAt(0).toUpperCase() + firstTag.slice(1);
};

/**
 * POST /api/v1/questions/fetch-leetcode
 * Body: { url: "https://leetcode.com/problems/..." }
 * Returns { title, difficulty, tags, link } if found.
 */
const fetchLeetCodeQuestion = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) throw new AppError('URL is required', 400);

    const details = await fetchProblemDetails(url);
    res.json(formatResponse('Problem fetched from LeetCode', details));
  } catch (error) {
    // Let the error handler format the response
    next(error);
  }
};

/**
 * GET /api/v1/questions/search-leetcode?q=three%20sum&type=name
 * GET /api/v1/questions/search-leetcode?q=binary%20search&type=tag
 */
const searchLeetCodeQuestions = async (req, res, next) => {
  try {
    const { q, type = 'name' } = req.query;
    if (!q || q.length < 2) {
      throw new AppError('Search query must be at least 2 characters', 400);
    }

    const results = await searchProblems(q, type);
    res.json(formatResponse('LeetCode search results', { results }));
  } catch (error) {
    next(error);
  }
};

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

    // Auto‑generate pattern if not provided
    let { pattern, tags } = req.body;
    if (!pattern || pattern === '') {
      pattern = generatePatternFromTags(tags || []);
    }

    // Normalize pattern to array (existing logic)
    if (pattern && !Array.isArray(pattern)) {
      req.body.pattern = [pattern];
    } else {
      req.body.pattern = pattern; // may be undefined or array
    }

    const question = await Question.create(req.body);
    
    await jobQueue.add({
      type: 'revision.schedule',
      userId: req.user._id,
      questionId: question._id,
      baseDate: new Date(),
    });
    
    await invalidateQuestionCache(question._id, question.platform, question.platformQuestionId);
    
    res.status(201).json(formatResponse('Question created successfully', { question }));
  } catch (error) { next(error); }
};

const updateQuestion = async (req, res, next) => {
  try {
    // Normalize pattern to array if it's provided as a string
    if (req.body.pattern && !Array.isArray(req.body.pattern)) {
      req.body.pattern = [req.body.pattern];
    }

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

/**
 * GET /api/v1/questions/similar/:id?limit=10
 * Returns questions similar to the given one based on pattern, tags, and title.
 */
const getSimilarQuestions = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const limit = parseInt(req.query.limit) || 10;

    const target = await Question.findById(targetId).select('pattern tags title');
    if (!target) throw new AppError('Question not found', 404);

    // Normalize target patterns to array
    let targetPatterns = target.pattern || [];
    if (!Array.isArray(targetPatterns)) targetPatterns = [targetPatterns];

    // Build pre‑filter: at least one matching pattern or tag OR text search relevance
    const filterConditions = [
      { $text: { $search: target.title } } // always include text search
    ];

    // If there are patterns, add pattern overlap condition
    if (targetPatterns.length > 0) {
      filterConditions.push({ pattern: { $in: targetPatterns } });
    }

    // If there are tags, add tag overlap condition
    if (target.tags && target.tags.length > 0) {
      filterConditions.push({ tags: { $in: target.tags } });
    }

    const similar = await Question.aggregate([
      {
        $match: {
          _id: { $ne: target._id },
          isActive: true,
          $or: filterConditions
        }
      },
      {
        $addFields: {
          textScore: { $meta: 'textScore' },
          // pattern array conversion (same as before)
          patternArray: {
            $cond: {
              if: { $isArray: "$pattern" },
              then: "$pattern",
              else: {
                $cond: {
                  if: { $eq: [{ $type: "$pattern" }, "string"] },
                  then: ["$pattern"],
                  else: []
                }
              }
            }
          },
          tagsArray: {
            $cond: {
              if: { $isArray: "$tags" },
              then: "$tags",
              else: {
                $cond: {
                  if: { $eq: [{ $type: "$tags" }, "string"] },
                  then: ["$tags"],
                  else: []
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          patternScore: {
            $cond: {
              if: {
                $gt: [
                  { $size: { $setIntersection: ["$patternArray", targetPatterns] } },
                  0
                ]
              },
              then: 100,
              else: 0
            }
          },
          tagOverlap: {
            $size: { $setIntersection: ["$tagsArray", target.tags || []] }
          }
        }
      },
      {
        $addFields: {
          totalScore: {
            $add: [
              { $ifNull: ['$textScore', 0] },
              { $multiply: ['$tagOverlap', 10] },
              '$patternScore'
            ]
          }
        }
      },
      { $sort: { totalScore: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          title: 1,
          problemLink: 1,
          platform: 1,
          difficulty: 1,
          tags: 1,
          pattern: 1,
          platformQuestionId: 1,
          totalScore: 1
        }
      }
    ]);

    res.json(formatResponse('Similar questions retrieved successfully', { similarQuestions: similar }));
  } catch (error) {
    next(error);
  }
};

const getPatterns = async (req, res, next) => {
  try {
    const patterns = await Question.distinct('pattern', { pattern: { $ne: [] }, isActive: true });
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
    const totalPatterns = await Question.distinct('pattern', { pattern: { $ne: [] }, isActive: true });
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
  fetchLeetCodeQuestion,
  searchLeetCodeQuestions,
};
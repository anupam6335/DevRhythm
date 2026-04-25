const Question = require('../models/Question');
const Goal = require('../models/Goal');  
const UserQuestionProgress = require('../models/UserQuestionProgress');
const RevisionSchedule = require('../models/RevisionSchedule');
const CodeExecutionHistory = require('../models/CodeExecutionHistory');
const ActivityLog = require('../models/ActivityLog');
const { formatResponse } = require('../utils/helpers/response');
const { getPaginationParams, paginate } = require('../utils/helpers/pagination');
const { applySorting } = require('../utils/helpers/sort');
const { slugify } = require('../utils/helpers/string');
const { getStartOfDay, getEndOfDay } = require('../utils/helpers/date');
const AppError = require('../utils/errors/AppError');
const { invalidateQuestionCache } = require('../middleware/cache');
const { fetchProblemDetails, searchProblems } = require('../services/leetcode.service');
const { jobQueue } = require('../services/queue.service');
const revisionService = require('../services/revision.service');

const generatePatternFromTags = (tags) => {
  if (!tags || tags.length === 0) return '';
  const firstTag = tags[0];
  return firstTag.charAt(0).toUpperCase() + firstTag.slice(1);
};

const fetchLeetCodeQuestion = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) throw new AppError('URL is required', 400);

    const details = await fetchProblemDetails(url);
    res.json(formatResponse('Problem fetched from LeetCode', details));
  } catch (error) {
    next(error);
  }
};

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
    const { platform, difficulty, pattern, tags, search, status } = req.query;
    
    let query = { isActive: true };
    if (platform) query.platform = platform;
    if (difficulty) query.difficulty = difficulty;
    if (pattern) query.pattern = pattern;
    if (tags) query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    if (search) query.$text = { $search: search };

    if (status === 'solved' && req.user) {
      const solvedProgress = await UserQuestionProgress.find({
        userId: req.user._id,
        status: { $in: ['Solved', 'Mastered'] }
      }).select('questionId').lean();
      
      const solvedIds = solvedProgress.map(p => p.questionId);
      if (solvedIds.length === 0) {
        return res.json(formatResponse('Questions retrieved successfully', { questions: [] }, {
          pagination: paginate(0, page, limit)
        }));
      }
      query._id = { $in: solvedIds };
    }

    let dbQuery = Question.find(query).skip(skip).limit(limit).select('-__v');
    dbQuery = applySorting(dbQuery, req.query, { createdAt: -1 });

    const [questions, total] = await Promise.all([
      dbQuery.lean(),
      Question.countDocuments(query)
    ]);

    let solvedMap = new Map();
    if (questions.length > 0 && req.user && status !== 'solved') {
      const questionIds = questions.map(q => q._id);
      const solvedProgress = await UserQuestionProgress.find({
        userId: req.user._id,
        questionId: { $in: questionIds },
        status: { $in: ['Solved', 'Mastered'] }
      }).select('questionId status').lean();

      solvedMap = new Map(
        solvedProgress.map(p => [p.questionId.toString(), p.status])
      );
    }

    const enrichedQuestions = questions.map(q => ({
      ...q,
      isSolved: status === 'solved' ? true : solvedMap.has(q._id.toString()),
      userStatus: status === 'solved' ? 'Solved' : (solvedMap.get(q._id.toString()) || null)
    }));

    res.json(formatResponse('Questions retrieved successfully', { questions: enrichedQuestions }, {
      pagination: paginate(total, page, limit)
    }));
  } catch (error) {
    next(error);
  }
};

const getQuestionById = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id).populate('similarQuestions', '_id title platform difficulty pattern').select('-__v');
    if (!question) throw new AppError('Question not found', 404);
    res.json(formatResponse('Question retrieved successfully', { question }));
  } catch (error) { next(error); }
};

const fetchQuestionDetails = async (userId, questionId) => {
  const [
    question,
    progress,
    revision,
    codeHistory,
    activityLogs
  ] = await Promise.all([
    Question.findById(questionId)
      .select('title problemLink platform platformQuestionId difficulty tags pattern solutionLinks similarQuestions contentRef testCases starterCode source createdBy isActive')
      .lean(),
    UserQuestionProgress.findOne({ userId, questionId })
      .select('-__v')
      .lean(),
    RevisionSchedule.findOne({ userId, questionId })
      .select('-__v')
      .lean(),
    CodeExecutionHistory.find({ userId, questionId })
      .sort({ executedAt: -1 })
      .limit(10)
      .select('-__v')
      .lean(),
    ActivityLog.find({ userId, targetId: questionId, targetModel: 'Question' })
      .sort({ timestamp: -1 })
      .limit(5)
      .select('-__v')
      .lean()
  ]);

  if (!question) return null;

  return {
    question,
    progress: progress || null,
    revision: revision ? {
      ...revision,
      currentStatus: revisionService.getRevisionStatusLabel(revision, null, 'actionable'),
      scheduleStatuses: revision.schedule.map((date, idx) => ({
        date,
        status: revisionService.getRevisionStatusLabel(revision, idx, 'display')
      }))
    } : null,
    codeExecutionHistory: codeHistory || [],
    activityLogs: activityLogs || []
  };
};

const getQuestionDetails = async (req, res, next) => {
  try {
    const { id: questionId } = req.params;
    const userId = req.user._id;

    const details = await fetchQuestionDetails(userId, questionId);
    if (!details) throw new AppError('Question not found', 404);

    res.json(formatResponse('Question details retrieved successfully', details));
  } catch (error) {
    next(error);
  }
};

const getQuestionDetailsByPlatform = async (req, res, next) => {
  try {
    const { platform, platformQuestionId } = req.params;
    const userId = req.user._id;

    const question = await Question.findOne({ platform, platformQuestionId, isActive: true })
      .select('_id')
      .lean();
    if (!question) throw new AppError('Question not found', 404);

    const details = await fetchQuestionDetails(userId, question._id);
    res.json(formatResponse('Question details retrieved successfully', details));
  } catch (error) {
    next(error);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const { isManual = false, contentRef, testCases, starterCode } = req.body;

    let platformQuestionId = req.body.platformQuestionId;
    if (!platformQuestionId || platformQuestionId.trim() === '') {
      if (!req.body.title) {
        throw new AppError('Title is required to generate question ID', 400);
      }

      const baseSlug = slugify(req.body.title);
      let slug = baseSlug;
      let counter = 1;

      while (await Question.findOne({ platform: req.body.platform, platformQuestionId: slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      platformQuestionId = slug;
      req.body.platformQuestionId = slug;
    }

    const existing = await Question.findOne({ platform: req.body.platform, platformQuestionId: req.body.platformQuestionId });
    if (existing) throw new AppError('Question with same platform and ID already exists', 409);

    let { pattern, tags } = req.body;
    if (!pattern || pattern === '') {
      pattern = generatePatternFromTags(tags || []);
    }

    if (pattern && !Array.isArray(pattern)) {
      req.body.pattern = [pattern];
    } else {
      req.body.pattern = pattern;
    }

    if (isManual) {
      req.body.source = 'manual';
      req.body.createdBy = req.user._id;
      req.body.contentRef = contentRef;
      req.body.testCases = testCases;
    } else {
      req.body.source = 'leetcode';
      req.body.createdBy = null;
    }

    let filteredStarterCode = null;
    if (starterCode) {
      const allowedLanguages = ['cpp', 'javascript', 'java', 'python', 'python3'];
      filteredStarterCode = {};
      for (const [lang, code] of Object.entries(starterCode)) {
        const normalizedLang = lang.toLowerCase();
        if (allowedLanguages.includes(normalizedLang)) {
          filteredStarterCode[normalizedLang] = code;
        }
      }
      req.body.starterCode = filteredStarterCode;
    }

    const question = await Question.create(req.body);

    if (!isManual && (!starterCode || Object.keys(starterCode).length === 0)) {
      try {
        const problemUrl = req.body.problemLink;
        if (problemUrl) {
          const details = await fetchProblemDetails(problemUrl);
          if (details.codeSnippets && Object.keys(details.codeSnippets).length > 0) {
            const allowedLanguages = ['cpp', 'javascript', 'java', 'python', 'python3'];
            const filteredSnippets = {};
            for (const [lang, code] of Object.entries(details.codeSnippets)) {
              const normalizedLang = lang.toLowerCase();
              if (allowedLanguages.includes(normalizedLang)) {
                filteredSnippets[normalizedLang] = code;
              }
            }
            question.starterCode = filteredSnippets;
            await question.save();
          }
        }
      } catch (fetchErr) {
        console.error('Failed to fetch starter code as fallback:', fetchErr.message);
      }
    }

    if (question.contentRef && (!question.testCases || question.testCases.length === 0)) {
      await jobQueue.add({
        type: 'question.extract_testcases',
        questionId: question._id
      });
    }

    await jobQueue.add({
      type: 'revision.schedule',
      userId: req.user._id,
      questionId: question._id,
      baseDate: new Date(),
    });

    await invalidateQuestionCache(question._id, question.platform, question.platformQuestionId);

    res.status(201).json(formatResponse('Question created successfully', { question }));
  } catch (error) {
    next(error);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);
    if (!question) throw new AppError('Question not found', 404);

    if (question.source === 'leetcode') {
      throw new AppError('LeetCode-fetched questions cannot be updated', 403);
    }

    if (question.source === 'manual') {
      if (!question.createdBy || question.createdBy.toString() !== req.user._id.toString()) {
        throw new AppError('Only the creator can update this question', 403);
      }
    }

    const allowedUpdates = {};
    if (req.body.difficulty !== undefined) allowedUpdates.difficulty = req.body.difficulty;
    if (req.body.tags !== undefined) allowedUpdates.tags = req.body.tags;
    if (req.body.pattern !== undefined) allowedUpdates.pattern = req.body.pattern;
    if (req.body.solutionLinks !== undefined) allowedUpdates.solutionLinks = req.body.solutionLinks;
    if (req.body.contentRef !== undefined) allowedUpdates.contentRef = req.body.contentRef;
    if (req.body.testCases !== undefined) allowedUpdates.testCases = req.body.testCases;
    if (req.body.starterCode !== undefined) allowedUpdates.starterCode = req.body.starterCode;

    if (Object.keys(allowedUpdates).length === 0) {
      throw new AppError('No allowed fields to update', 400);
    }

    if (allowedUpdates.pattern !== undefined) {
      let pattern = allowedUpdates.pattern;
      if (!Array.isArray(pattern)) {
        pattern = pattern ? [pattern] : [];
      }
      allowedUpdates.pattern = pattern;
    }

    if (allowedUpdates.starterCode) {
      const allowedLanguages = ['cpp', 'javascript', 'java', 'python', 'python3'];
      const filteredCode = {};
      for (const [lang, code] of Object.entries(allowedUpdates.starterCode)) {
        const normalizedLang = lang.toLowerCase();
        if (allowedLanguages.includes(normalizedLang)) {
          filteredCode[normalizedLang] = code;
        }
      }
      allowedUpdates.starterCode = filteredCode;
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      allowedUpdates,
      { new: true, runValidators: true }
    ).select('-__v');

    await invalidateQuestionCache(updatedQuestion._id, updatedQuestion.platform, updatedQuestion.platformQuestionId);

    res.json(formatResponse('Question updated successfully', { question: updatedQuestion }));
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  next(new AppError('Delete operation is not allowed', 405));
};

const restoreQuestion = async (req, res, next) => {
  next(new AppError('Restore operation is not allowed', 405));
};

const permanentDeleteQuestion = async (req, res, next) => {
  next(new AppError('Permanent delete operation is not allowed', 405));
};

const getDeletedQuestions = async (req, res, next) => {
  res.json(formatResponse('Deleted questions not supported', { questions: [] }));
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
    const targetId = req.params.id;
    const limit = parseInt(req.query.limit) || 10;

    const target = await Question.findById(targetId).select('pattern tags title');
    if (!target) throw new AppError('Question not found', 404);

    let targetPatterns = target.pattern || [];
    if (!Array.isArray(targetPatterns)) targetPatterns = [targetPatterns];

    const filterConditions = [
      { $text: { $search: target.title } }
    ];

    if (targetPatterns.length > 0) {
      filterConditions.push({ pattern: { $in: targetPatterns } });
    }

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

const getDailyProblemAndGoal = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const timeZone = req.userTimeZone; // used for daily goal boundaries

    const currentStreak = req.user.streak.current;
    const longestStreak = req.user.streak.longest;

    const todayStart = getStartOfDay(new Date(), timeZone);
    const todayEnd = getEndOfDay(new Date(), timeZone);

    const dailyGoal = await Goal.findOne({
      userId,
      goalType: 'daily',
      startDate: { $lte: todayStart },
      endDate: { $gte: todayEnd },
      status: 'active'
    }).lean();

    const todayGoal = dailyGoal ? {
      targetCount: dailyGoal.targetCount,
      completedCount: dailyGoal.completedCount,
      completionPercentage: dailyGoal.completionPercentage,
      status: dailyGoal.status
    } : null;

    let dailyProblem = null;
    try {
      dailyProblem = await require('../services/leetcode.service').getDailyProblem();
    } catch (error) {
      console.error('Failed to fetch LeetCode daily problem:', error.message);
    }

    const responseData = {
      dailyProblem: dailyProblem || null,
      todayGoal,
      currentStreak,
      longestStreak,
    };

    res.json(formatResponse('Daily problem and goal retrieved successfully', responseData));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuestions,
  getQuestionById,
  getQuestionDetails,
  getQuestionDetailsByPlatform,
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
  getDailyProblemAndGoal,
};
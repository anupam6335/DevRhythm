const Joi = require('joi');
const constants = require('../config/constants');

const questionValidator = {
  createQuestion: Joi.object({
    dayId: Joi.string().pattern(constants.PATTERNS.OBJECT_ID).optional(),
    title: Joi.string().required(),
    description: Joi.string().max(5000).optional(),
    platform: Joi.string().valid('leetcode', 'codeforces', 'hackerrank', 'atcoder', 'codewars', 'custom', 'other').required(),
    platformId: Joi.string().optional(),
    primaryLink: Joi.string().uri().required(),
    resourceLinks: Joi.array().items(Joi.string().uri()).optional(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
    tags: Joi.array().items(Joi.string()).optional(),
    problemType: Joi.array().items(Joi.string()).optional(),
    dataStructure: Joi.array().items(Joi.string()).optional(),
    algorithmCategory: Joi.array().items(Joi.string()).optional(),
    companyTags: Joi.array().items(Joi.string()).optional(),
    frequencyTag: Joi.string().valid('high', 'medium', 'low').optional(),
    inLists: Joi.array().items(Joi.object({
      listName: Joi.string().required(),
      listId: Joi.string().optional()
    })).optional(),
    status: Joi.string().valid('pending', 'done', 'not-solved', 'partially-solved', 'need-help').default('pending'),
    confidenceScore: Joi.number().integer().min(1).max(5).optional(),
    personalRating: Joi.number().integer().min(1).max(5).optional(),
    understandingLevel: Joi.string().valid('memorized', 'understood', 'mastered').optional(),
    notes: Joi.string().max(10000).optional(),
    solutionCode: Joi.string().optional(),
    solutionExplanation: Joi.string().optional(),
    orderIndex: Joi.number().integer().default(0),
    isPinned: Joi.boolean().default(false),
    prerequisites: Joi.array().items(Joi.string().pattern(constants.PATTERNS.OBJECT_ID)).optional(),
    relatedQuestions: Joi.array().items(Joi.string().pattern(constants.PATTERNS.OBJECT_ID)).optional(),
    templateId: Joi.string().pattern(constants.PATTERNS.OBJECT_ID).optional()
  }),

  updateQuestion: Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().max(5000).optional(),
    primaryLink: Joi.string().uri().optional(),
    resourceLinks: Joi.array().items(Joi.string().uri()).optional(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    problemType: Joi.array().items(Joi.string()).optional(),
    dataStructure: Joi.array().items(Joi.string()).optional(),
    algorithmCategory: Joi.array().items(Joi.string()).optional(),
    companyTags: Joi.array().items(Joi.string()).optional(),
    frequencyTag: Joi.string().valid('high', 'medium', 'low').optional(),
    status: Joi.string().valid('pending', 'done', 'not-solved', 'partially-solved', 'need-help').optional(),
    confidenceScore: Joi.number().integer().min(1).max(5).optional(),
    personalRating: Joi.number().integer().min(1).max(5).optional(),
    understandingLevel: Joi.string().valid('memorized', 'understood', 'mastered').optional(),
    notes: Joi.string().max(10000).optional(),
    solutionCode: Joi.string().optional(),
    solutionExplanation: Joi.string().optional(),
    orderIndex: Joi.number().integer().optional(),
    isPinned: Joi.boolean().optional(),
    prerequisites: Joi.array().items(Joi.string().pattern(constants.PATTERNS.OBJECT_ID)).optional(),
    relatedQuestions: Joi.array().items(Joi.string().pattern(constants.PATTERNS.OBJECT_ID)).optional(),
    lastRevisedAt: Joi.date().iso().optional()
  }).min(1),

  questionQuery: Joi.object({
    dayId: Joi.string().pattern(constants.PATTERNS.OBJECT_ID).optional(),
    status: Joi.string().valid('pending', 'done', 'not-solved', 'partially-solved', 'need-help').optional(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
    platform: Joi.string().valid('leetcode', 'codeforces', 'hackerrank', 'atcoder', 'codewars', 'custom', 'other').optional(),
    tags: Joi.string().optional(),
    companyTags: Joi.string().optional(),
    problemType: Joi.string().optional(),
    search: Joi.string().optional(),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'solvedAt', 'difficulty', 'confidenceScore', 'personalRating').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    isPinned: Joi.boolean().optional(),
    hasRevisionDue: Joi.boolean().optional()
  }),

  bulkCreate: Joi.array().items(
    Joi.object({
      title: Joi.string().required(),
      description: Joi.string().max(5000).optional(),
      platform: Joi.string().valid('leetcode', 'codeforces', 'hackerrank', 'atcoder', 'codewars', 'custom', 'other').required(),
      primaryLink: Joi.string().uri().required(),
      difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
      tags: Joi.array().items(Joi.string()).optional()
    })
  ).max(50),

  questionStats: Joi.object({
    period: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').default('monthly'),
    groupBy: Joi.string().valid('difficulty', 'platform', 'status', 'tags').default('difficulty')
  }),

  validateCreateQuestion(req, res, next) {
    const { error } = this.createQuestion.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid question creation data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateUpdateQuestion(req, res, next) {
    const { error } = this.updateQuestion.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid question update data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateQuestionQuery(req, res, next) {
    const { error } = this.questionQuery.validate(req.query);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid question query parameters',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateBulkCreate(req, res, next) {
    const { error } = this.bulkCreate.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid bulk create data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateQuestionStats(req, res, next) {
    const { error } = this.questionStats.validate(req.query);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid question stats parameters',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  }
};

module.exports = questionValidator;
const Joi = require('joi');
const constants = require('../config/constants');

const studyPlanValidator = {
  createStudyPlan: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    planType: Joi.string().valid('predefined', 'custom', 'company-specific', 'topic-based', 'adaptive').required(),
    goal: Joi.object({
      type: Joi.string().valid('interview', 'competition', 'skill', 'promotion').required(),
      targetCompanies: Joi.array().items(Joi.string()).optional(),
      timeframe: Joi.string().valid('30-day', '60-day', '90-day', 'custom').required(),
      customDays: Joi.number().integer().min(1).optional(),
      difficultyProgression: Joi.string().valid('sequential', 'mixed').default('sequential')
    }).required(),
    structure: Joi.object({
      totalDays: Joi.number().integer().min(1).required(),
      questionsPerDay: Joi.number().integer().min(1).default(5),
      revisionDays: Joi.array().items(Joi.number().integer().min(1)).optional(),
      assessmentDays: Joi.array().items(Joi.number().integer().min(1)).optional(),
      restDays: Joi.array().items(Joi.number().integer().min(1)).optional()
    }).required(),
    days: Joi.array().items(
      Joi.object({
        dayNumber: Joi.number().integer().min(1).required(),
        dayType: Joi.string().valid('learning', 'revision', 'mock', 'rest', 'assessment').required(),
        focusTopics: Joi.array().items(Joi.string()).optional(),
        difficultyLevel: Joi.string().valid('easy', 'medium', 'hard', 'mixed').optional(),
        targetQuestionCount: Joi.number().integer().min(0).optional(),
        prerequisites: Joi.array().items(Joi.string()).optional(),
        notes: Joi.string().optional()
      })
    ).optional(),
    questionAssignments: Joi.array().items(
      Joi.object({
        dayNumber: Joi.number().integer().min(1).required(),
        questionType: Joi.string().valid('specific', 'category', 'adaptive').required(),
        specificQuestions: Joi.array().items(Joi.string().pattern(constants.PATTERNS.OBJECT_ID)).optional(),
        categories: Joi.object({
          topics: Joi.array().items(Joi.string()).optional(),
          difficulty: Joi.string().valid('easy', 'medium', 'hard', 'mixed').optional(),
          companies: Joi.array().items(Joi.string()).optional(),
          problemPatterns: Joi.array().items(Joi.string()).optional()
        }).optional(),
        count: Joi.number().integer().min(1).optional()
      })
    ).optional(),
    adaptiveSettings: Joi.object({
      enabled: Joi.boolean().default(false),
      adjustmentFrequency: Joi.string().valid('weekly', 'bi-weekly', 'monthly').optional(),
      performanceThresholds: Joi.object({
        accuracyLow: Joi.number().min(0).max(100).default(60),
        accuracyHigh: Joi.number().min(0).max(100).default(90),
        timeSlow: Joi.number().integer().min(0).default(1800)
      }).optional()
    }).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    isPublic: Joi.boolean().default(false)
  }),

  updateStudyPlan: Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    goal: Joi.object({
      type: Joi.string().valid('interview', 'competition', 'skill', 'promotion').optional(),
      targetCompanies: Joi.array().items(Joi.string()).optional(),
      timeframe: Joi.string().valid('30-day', '60-day', '90-day', 'custom').optional(),
      customDays: Joi.number().integer().min(1).optional(),
      difficultyProgression: Joi.string().valid('sequential', 'mixed').optional()
    }).optional(),
    structure: Joi.object({
      totalDays: Joi.number().integer().min(1).optional(),
      questionsPerDay: Joi.number().integer().min(1).optional(),
      revisionDays: Joi.array().items(Joi.number().integer().min(1)).optional(),
      assessmentDays: Joi.array().items(Joi.number().integer().min(1)).optional(),
      restDays: Joi.array().items(Joi.number().integer().min(1)).optional()
    }).optional(),
    adaptiveSettings: Joi.object({
      enabled: Joi.boolean().optional(),
      adjustmentFrequency: Joi.string().valid('weekly', 'bi-weekly', 'monthly').optional(),
      performanceThresholds: Joi.object({
        accuracyLow: Joi.number().min(0).max(100).optional(),
        accuracyHigh: Joi.number().min(0).max(100).optional(),
        timeSlow: Joi.number().integer().min(0).optional()
      }).optional()
    }).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    isPublic: Joi.boolean().optional()
  }).min(1),

  studyPlanQuery: Joi.object({
    planType: Joi.string().valid('predefined', 'custom', 'company-specific', 'topic-based', 'adaptive').optional(),
    goalType: Joi.string().valid('interview', 'competition', 'skill', 'promotion').optional(),
    timeframe: Joi.string().valid('30-day', '60-day', '90-day', 'custom').optional(),
    tags: Joi.string().optional(),
    isPublic: Joi.boolean().optional(),
    search: Joi.string().optional(),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'popularityScore', 'totalDays').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  assignPlan: Joi.object({
    userId: Joi.string().pattern(constants.PATTERNS.OBJECT_ID).optional(),
    startDate: Joi.date().iso().optional(),
    adjustments: Joi.object({
      difficultyAdjusted: Joi.boolean().default(false),
      paceAdjusted: Joi.boolean().default(false),
      topicsAdded: Joi.array().items(Joi.string()).optional(),
      topicsRemoved: Joi.array().items(Joi.string()).optional()
    }).optional()
  }),

  progressUpdate: Joi.object({
    dayCompleted: Joi.boolean().default(false),
    questionsCompleted: Joi.number().integer().min(0).default(0),
    accuracy: Joi.number().min(0).max(100).optional(),
    timePerQuestion: Joi.number().integer().min(0).optional(),
    weakAreas: Joi.array().items(Joi.string()).optional()
  }),

  validateCreateStudyPlan(req, res, next) {
    const { error } = this.createStudyPlan.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid study plan creation data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateUpdateStudyPlan(req, res, next) {
    const { error } = this.updateStudyPlan.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid study plan update data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateStudyPlanQuery(req, res, next) {
    const { error } = this.studyPlanQuery.validate(req.query);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid study plan query parameters',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateAssignPlan(req, res, next) {
    const { error } = this.assignPlan.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid plan assignment data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateProgressUpdate(req, res, next) {
    const { error } = this.progressUpdate.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid progress update data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  }
};

module.exports = studyPlanValidator;
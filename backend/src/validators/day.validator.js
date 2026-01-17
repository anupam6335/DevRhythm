const Joi = require('joi');
const constants = require('../config/constants');

const dayValidator = {
  createDay: Joi.object({
    dayNumber: Joi.number().integer().min(1).required(),
    date: Joi.date().iso().required(),
    title: Joi.string().max(100).optional(),
    type: Joi.string().valid('learning', 'revision', 'mock', 'rest', 'assessment').default('learning'),
    difficultyRating: Joi.number().integer().min(1).max(5).optional(),
    notes: Joi.string().max(2000).optional(),
    focusTopics: Joi.array().items(Joi.string()).optional(),
    targetQuestionCount: Joi.number().integer().min(0).default(5),
    studyPlanId: Joi.string().pattern(constants.PATTERNS.OBJECT_ID).optional()
  }),

  updateDay: Joi.object({
    title: Joi.string().max(100).optional(),
    type: Joi.string().valid('learning', 'revision', 'mock', 'rest', 'assessment').optional(),
    difficultyRating: Joi.number().integer().min(1).max(5).optional(),
    productivityScore: Joi.number().min(0).max(100).optional(),
    notes: Joi.string().max(2000).optional(),
    focusTopics: Joi.array().items(Joi.string()).optional(),
    targetQuestionCount: Joi.number().integer().min(0).optional(),
    isCompleted: Joi.boolean().optional(),
    startTime: Joi.date().iso().optional(),
    endTime: Joi.date().iso().optional()
  }).min(1),

  dayQuery: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    type: Joi.string().valid('learning', 'revision', 'mock', 'rest', 'assessment').optional(),
    isCompleted: Joi.boolean().optional(),
    studyPlanId: Joi.string().pattern(constants.PATTERNS.OBJECT_ID).optional(),
    sortBy: Joi.string().valid('date', 'dayNumber', 'createdAt', 'updatedAt').default('date'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  dayStats: Joi.object({
    period: Joi.string().valid('daily', 'weekly', 'monthly').default('daily'),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
  }),

  validateCreateDay(req, res, next) {
    const { error } = this.createDay.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid day creation data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateUpdateDay(req, res, next) {
    const { error } = this.updateDay.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid day update data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateDayQuery(req, res, next) {
    const { error } = this.dayQuery.validate(req.query);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid day query parameters',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateDayStats(req, res, next) {
    const { error } = this.dayStats.validate(req.query);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid day stats parameters',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  }
};

module.exports = dayValidator;
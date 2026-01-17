const Joi = require('joi');
const constants = require('../config/constants');

const timerValidator = {
  createTimer: Joi.object({
    questionId: Joi.string().pattern(constants.PATTERNS.OBJECT_ID).required(),
    dayId: Joi.string().pattern(constants.PATTERNS.OBJECT_ID).optional(),
    optimalTimeTarget: Joi.number().integer().min(0).optional(),
    timeLimit: Joi.number().integer().min(0).optional(),
    clientId: Joi.string().optional(),
    deviceInfo: Joi.string().optional()
  }),

  updateTimer: Joi.object({
    status: Joi.string().valid('running', 'paused', 'stopped', 'completed').optional(),
    completionStatus: Joi.string().valid('within-limit', 'exceeded-limit', 'abandoned').optional(),
    optimalTimeTarget: Joi.number().integer().min(0).optional(),
    timeLimit: Joi.number().integer().min(0).optional(),
    clientId: Joi.string().optional()
  }).min(1),

  timerAction: Joi.object({
    action: Joi.string().valid('start', 'pause', 'resume', 'stop', 'complete').required(),
    reason: Joi.string().optional(),
    clientId: Joi.string().optional()
  }),

  segment: Joi.object({
    segmentType: Joi.string().valid('thinking', 'coding', 'debugging', 'break', 'review').required(),
    notes: Joi.string().max(500).optional()
  }),

  distraction: Joi.object({
    reason: Joi.string().required(),
    duration: Joi.number().integer().min(0).optional()
  }),

  timerQuery: Joi.object({
    questionId: Joi.string().pattern(constants.PATTERNS.OBJECT_ID).optional(),
    dayId: Joi.string().pattern(constants.PATTERNS.OBJECT_ID).optional(),
    status: Joi.string().valid('running', 'paused', 'stopped', 'completed').optional(),
    completionStatus: Joi.string().valid('within-limit', 'exceeded-limit', 'abandoned').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'completedAt', 'totalElapsedTime').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  validateCreateTimer(req, res, next) {
    const { error } = this.createTimer.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid timer creation data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateUpdateTimer(req, res, next) {
    const { error } = this.updateTimer.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid timer update data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateTimerAction(req, res, next) {
    const { error } = this.timerAction.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid timer action',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateSegment(req, res, next) {
    const { error } = this.segment.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid segment data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateDistraction(req, res, next) {
    const { error } = this.distraction.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid distraction data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateTimerQuery(req, res, next) {
    const { error } = this.timerQuery.validate(req.query);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid timer query parameters',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  }
};

module.exports = timerValidator;
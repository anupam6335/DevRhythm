const Joi = require('joi');
const constants = require('../config/constants');

const revisionValidator = {
  markRevision: Joi.object({
    intervalName: Joi.string().valid('sameDay', 'day3', 'day7', 'day14', 'day30', 'adaptive').required(),
    effectiveness: Joi.number().min(0).max(1).default(0.8),
    timeTaken: Joi.number().integer().min(0).optional(),
    confidenceBefore: Joi.number().integer().min(1).max(5).optional(),
    confidenceAfter: Joi.number().integer().min(1).max(5).optional(),
    remembered: Joi.boolean().default(true),
    notes: Joi.string().max(1000).optional()
  }),

  reschedule: Joi.object({
    newDate: Joi.date().iso().required(),
    reason: Joi.string().max(500).optional()
  }),

  revisionQuery: Joi.object({
    status: Joi.string().valid('active', 'paused', 'completed', 'overdue').optional(),
    interval: Joi.string().valid('sameDay', 'day3', 'day7', 'day14', 'day30', 'adaptive').optional(),
    dueBefore: Joi.date().iso().optional(),
    dueAfter: Joi.date().iso().optional(),
    questionId: Joi.string().pattern(constants.PATTERNS.OBJECT_ID).optional(),
    inQueue: Joi.boolean().optional(),
    sortBy: Joi.string().valid('scheduledAt', 'completedAt', 'nextReviewDue', 'queuePriority').default('nextReviewDue'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  }),

  adaptiveSettings: Joi.object({
    baseInterval: Joi.number().integer().min(1).default(1),
    easeFactor: Joi.number().min(1.3).max(3.0).default(2.5),
    intervalModifier: Joi.number().min(0.5).max(2.0).default(1)
  }),

  queueManagement: Joi.object({
    action: Joi.string().valid('add', 'remove', 'reorder').required(),
    queuePriority: Joi.number().integer().optional(),
    queuePosition: Joi.number().integer().optional()
  }),

  validateMarkRevision(req, res, next) {
    const { error } = this.markRevision.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid revision mark data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateReschedule(req, res, next) {
    const { error } = this.reschedule.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid reschedule data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateRevisionQuery(req, res, next) {
    const { error } = this.revisionQuery.validate(req.query);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid revision query parameters',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateAdaptiveSettings(req, res, next) {
    const { error } = this.adaptiveSettings.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid adaptive settings',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateQueueManagement(req, res, next) {
    const { error } = this.queueManagement.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid queue management data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  }
};

module.exports = revisionValidator;
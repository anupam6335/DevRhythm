const Joi = require('joi');
const validation = require('../middleware/validation.middleware');
const constants = require('../config/constants');

class TimerValidator {
  constructor() {
    this.schemas = this.initializeSchemas();
  }

  initializeSchemas() {
    return {
      timerStart: Joi.object({
        questionId: validation.getSchema('objectId').required(),
        dayId: validation.getSchema('objectId'),
        clientId: Joi.string().max(100),
        deviceInfo: Joi.string().max(255),
        optimalTimeTarget: Joi.number().integer().min(0),
        timeLimit: Joi.number().integer().min(0)
      }),

      timerPause: Joi.object({
        reason: Joi.string().max(100).default('manual'),
        segmentType: Joi.string().valid(...Object.values(constants.TIMER.SEGMENT_TYPES))
      }),

      timerResume: Joi.object({
        segmentType: Joi.string().valid(...Object.values(constants.TIMER.SEGMENT_TYPES)).default('coding')
      }),

      timerStop: Joi.object({
        completionStatus: Joi.string().valid('within-limit', 'exceeded-limit', 'abandoned').default('abandoned'),
        segmentType: Joi.string().valid(...Object.values(constants.TIMER.SEGMENT_TYPES))
      }),

      timerQuery: validation.getSchema('pagination').append({
        questionId: validation.getSchema('objectId'),
        dayId: validation.getSchema('objectId'),
        status: Joi.string().valid(...Object.values(constants.TIMER.STATUS)),
        completionStatus: Joi.string().valid('within-limit', 'exceeded-limit', 'abandoned'),
        startDate: Joi.date().iso(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')),
        sortBy: Joi.string().valid('createdAt', 'updatedAt', 'completedAt', 'totalElapsedTime').default('createdAt'),
        order: Joi.string().valid('asc', 'desc').default('desc')
      }),

      timerSegment: Joi.object({
        segmentType: Joi.string().valid(...Object.values(constants.TIMER.SEGMENT_TYPES)).required(),
        startTime: Joi.date().iso(),
        endTime: Joi.date().iso(),
        notes: Joi.string().max(1000)
      }),

      timerDistraction: Joi.object({
        reason: Joi.string().max(100).required(),
        startTime: Joi.date().iso(),
        endTime: Joi.date().iso()
      }),

      timerStats: Joi.object({
        questionId: validation.getSchema('objectId'),
        startDate: Joi.date().iso(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')),
        period: Joi.string().valid('day', 'week', 'month', 'year', 'custom')
      }),

      timerRecovery: Joi.object({
        recoveryToken: Joi.string().required(),
        clientId: Joi.string().max(100),
        deviceInfo: Joi.string().max(255)
      })
    };
  }

  validateTimerStart() {
    return validation.validateBody(this.schemas.timerStart);
  }

  validateTimerPause() {
    return validation.validateBody(this.schemas.timerPause);
  }

  validateTimerResume() {
    return validation.validateBody(this.schemas.timerResume);
  }

  validateTimerStop() {
    return validation.validateBody(this.schemas.timerStop);
  }

  validateTimerQuery() {
    return validation.validateQuery(this.schemas.timerQuery);
  }

  validateTimerSegment() {
    return validation.validateBody(this.schemas.timerSegment);
  }

  validateTimerDistraction() {
    return validation.validateBody(this.schemas.timerDistraction);
  }

  validateTimerStats() {
    return validation.validateQuery(this.schemas.timerStats);
  }

  validateTimerRecovery() {
    return validation.validateBody(this.schemas.timerRecovery);
  }

  getSchema(name) {
    return this.schemas[name];
  }
}

const timerValidator = new TimerValidator();
module.exports = timerValidator;
const Joi = require('joi');
const validation = require('../middleware/validation.middleware');
const constants = require('../config/constants');

class RevisionValidator {
  constructor() {
    this.schemas = this.initializeSchemas();
  }

  initializeSchemas() {
    return {
      revisionComplete: Joi.object({
        intervalName: Joi.string().valid(...Object.values(constants.REVISION.INTERVALS)).required(),
        effectiveness: Joi.number().min(0).max(1).default(0.8),
        timeTaken: Joi.number().integer().min(0),
        confidenceBefore: Joi.number().integer().min(1).max(5),
        confidenceAfter: Joi.number().integer().min(1).max(5),
        remembered: Joi.boolean().default(true),
        notes: Joi.string().max(2000)
      }),

      revisionQuery: validation.getSchema('pagination').append({
        status: Joi.string().valid(...Object.values(constants.REVISION.STATUS)),
        intervalName: Joi.string().valid(...Object.values(constants.REVISION.INTERVALS)),
        isOverdue: Joi.boolean(),
        inQueue: Joi.boolean(),
        questionId: validation.getSchema('objectId'),
        sortBy: Joi.string().valid('nextReviewDue', 'createdAt', 'updatedAt', 'queuePriority').default('nextReviewDue'),
        order: Joi.string().valid('asc', 'desc').default('asc')
      }),

      revisionSchedule: Joi.object({
        questionId: validation.getSchema('objectId').required(),
        enableDay14: Joi.boolean().default(false),
        enableDay30: Joi.boolean().default(false),
        manualReschedule: Joi.date().iso(),
        pauseUntil: Joi.date().iso()
      }),

      revisionQueue: Joi.object({
        queuePriority: Joi.number().integer().min(0).max(10),
        queuePosition: Joi.number().integer().min(0)
      }),

      revisionStats: Joi.object({
        startDate: Joi.date().iso(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')),
        period: Joi.string().valid('day', 'week', 'month', 'year', 'custom')
      }),

      bulkRevisionComplete: Joi.array().items(
        Joi.object({
          revisionId: validation.getSchema('objectId').required(),
          intervalName: Joi.string().valid(...Object.values(constants.REVISION.INTERVALS)).required(),
          effectiveness: Joi.number().min(0).max(1).default(0.8),
          remembered: Joi.boolean().default(true)
        })
      ).max(20)
    };
  }

  validateRevisionComplete() {
    return validation.validateBody(this.schemas.revisionComplete);
  }

  validateRevisionQuery() {
    return validation.validateQuery(this.schemas.revisionQuery);
  }

  validateRevisionSchedule() {
    return validation.validateBody(this.schemas.revisionSchedule);
  }

  validateRevisionQueue() {
    return validation.validateBody(this.schemas.revisionQueue);
  }

  validateRevisionStats() {
    return validation.validateQuery(this.schemas.revisionStats);
  }

  validateBulkRevisionComplete() {
    return validation.validateBody(this.schemas.bulkRevisionComplete);
  }

  getSchema(name) {
    return this.schemas[name];
  }
}

const revisionValidator = new RevisionValidator();
module.exports = revisionValidator;
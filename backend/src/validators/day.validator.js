const Joi = require('joi');
const validation = require('../middleware/validation.middleware');
const constants = require('../config/constants');

class DayValidator {
  constructor() {
    this.schemas = this.initializeSchemas();
  }

  initializeSchemas() {
    return {
      createDay: Joi.object({
        date: Joi.date().iso().required(),
        title: Joi.string().max(255),
        type: Joi.string().valid(...Object.values(constants.DAY.TYPES)).default('learning'),
        difficultyRating: Joi.number().integer().min(1).max(5),
        productivityScore: Joi.number().integer().min(0).max(100),
        notes: Joi.string().max(2000),
        focusTopics: Joi.array().items(Joi.string().max(100)),
        targetQuestionCount: Joi.number().integer().min(0).max(50).default(5),
        studyPlanId: validation.getSchema('objectId')
      }),

      updateDay: Joi.object({
        title: Joi.string().max(255),
        type: Joi.string().valid(...Object.values(constants.DAY.TYPES)),
        difficultyRating: Joi.number().integer().min(1).max(5),
        productivityScore: Joi.number().integer().min(0).max(100),
        notes: Joi.string().max(2000),
        focusTopics: Joi.array().items(Joi.string().max(100)),
        targetQuestionCount: Joi.number().integer().min(0).max(50),
        isCompleted: Joi.boolean(),
        startTime: Joi.date().iso(),
        endTime: Joi.date().iso().min(Joi.ref('startTime'))
      }),

      dayQuery: validation.getSchema('pagination').append({
        date: Joi.date().iso(),
        startDate: Joi.date().iso(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')),
        type: Joi.string().valid(...Object.values(constants.DAY.TYPES)),
        isCompleted: Joi.boolean(),
        sortBy: Joi.string().valid('date', 'dayNumber', 'createdAt', 'updatedAt').default('date'),
        order: Joi.string().valid('asc', 'desc').default('desc')
      }),

      dayStats: Joi.object({
        startDate: Joi.date().iso(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')),
        period: Joi.string().valid('day', 'week', 'month', 'year', 'custom')
      }),

      dayCompletion: Joi.object({
        isCompleted: Joi.boolean().required(),
        completedAt: Joi.date().iso(),
        completionPercentage: Joi.number().integer().min(0).max(100)
      }),

      bulkDayCreate: Joi.array().items(
        Joi.object({
          date: Joi.date().iso().required(),
          title: Joi.string().max(255),
          type: Joi.string().valid(...Object.values(constants.DAY.TYPES)).default('learning')
        })
      ).max(100)
    };
  }

  validateCreateDay() {
    return validation.validateBody(this.schemas.createDay);
  }

  validateUpdateDay() {
    return validation.validateBody(this.schemas.updateDay);
  }

  validateDayQuery() {
    return validation.validateQuery(this.schemas.dayQuery);
  }

  validateDayStats() {
    return validation.validateQuery(this.schemas.dayStats);
  }

  validateDayCompletion() {
    return validation.validateBody(this.schemas.dayCompletion);
  }

  validateBulkDayCreate() {
    return validation.validateBody(this.schemas.bulkDayCreate);
  }

  getSchema(name) {
    return this.schemas[name];
  }
}

const dayValidator = new DayValidator();
module.exports = dayValidator;
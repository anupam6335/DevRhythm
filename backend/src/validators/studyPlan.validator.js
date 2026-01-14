const Joi = require('joi');
const validation = require('../middleware/validation.middleware');
const constants = require('../config/constants');

class StudyPlanValidator {
  constructor() {
    this.schemas = this.initializeSchemas();
  }

  initializeSchemas() {
    return {
      createStudyPlan: Joi.object({
        name: Joi.string().max(255).required(),
        description: Joi.string().max(2000),
        planType: Joi.string().valid(...Object.values(constants.STUDY_PLAN.TYPES)).required(),
        goal: Joi.object({
          type: Joi.string().valid(...Object.values(constants.STUDY_PLAN.GOAL_TYPES)).required(),
          targetCompanies: Joi.array().items(Joi.string().max(100)),
          timeframe: Joi.string().valid(...Object.values(constants.STUDY_PLAN.TIMEFRAMES)).required(),
          customDays: Joi.number().integer().min(1).max(365),
          difficultyProgression: Joi.string().valid('sequential', 'mixed').default('sequential')
        }).required(),
        structure: Joi.object({
          totalDays: Joi.number().integer().min(1).max(365).required(),
          questionsPerDay: Joi.number().integer().min(1).max(50).default(5),
          revisionDays: Joi.array().items(Joi.number().integer().min(1)),
          assessmentDays: Joi.array().items(Joi.number().integer().min(1)),
          restDays: Joi.array().items(Joi.number().integer().min(1))
        }).required(),
        days: Joi.array().items(
          Joi.object({
            dayNumber: Joi.number().integer().min(1).required(),
            dayType: Joi.string().valid(...Object.values(constants.DAY.TYPES)).default('learning'),
            focusTopics: Joi.array().items(Joi.string().max(100)),
            difficultyLevel: Joi.string().valid('easy', 'medium', 'hard', 'mixed').default('mixed'),
            targetQuestionCount: Joi.number().integer().min(0).max(50),
            prerequisites: Joi.array().items(Joi.string().max(100)),
            notes: Joi.string().max(1000)
          })
        ).max(365),
        questionAssignments: Joi.array().items(
          Joi.object({
            dayNumber: Joi.number().integer().min(1).required(),
            questionType: Joi.string().valid('specific', 'category', 'adaptive').default('category'),
            specificQuestions: Joi.array().items(validation.getSchema('objectId')),
            categories: Joi.object({
              topics: Joi.array().items(Joi.string().max(100)),
              difficulty: Joi.string().valid('easy', 'medium', 'hard', 'mixed'),
              companies: Joi.array().items(Joi.string().max(100)),
              problemPatterns: Joi.array().items(Joi.string().max(100))
            }),
            count: Joi.number().integer().min(1).max(50)
          })
        ),
        adaptiveSettings: Joi.object({
          enabled: Joi.boolean().default(false),
          adjustmentFrequency: Joi.string().valid('weekly', 'bi-weekly', 'monthly').default('weekly'),
          performanceThresholds: Joi.object({
            accuracyLow: Joi.number().min(0).max(100).default(60),
            accuracyHigh: Joi.number().min(0).max(100).default(90),
            timeSlow: Joi.number().integer().min(0).default(1800)
          })
        }),
        tags: Joi.array().items(Joi.string().max(50)),
        isPublic: Joi.boolean().default(false)
      }),

      updateStudyPlan: Joi.object({
        name: Joi.string().max(255),
        description: Joi.string().max(2000),
        structure: Joi.object({
          totalDays: Joi.number().integer().min(1).max(365),
          questionsPerDay: Joi.number().integer().min(1).max(50),
          revisionDays: Joi.array().items(Joi.number().integer().min(1)),
          assessmentDays: Joi.array().items(Joi.number().integer().min(1)),
          restDays: Joi.array().items(Joi.number().integer().min(1))
        }),
        adaptiveSettings: Joi.object({
          enabled: Joi.boolean(),
          adjustmentFrequency: Joi.string().valid('weekly', 'bi-weekly', 'monthly'),
          performanceThresholds: Joi.object({
            accuracyLow: Joi.number().min(0).max(100),
            accuracyHigh: Joi.number().min(0).max(100),
            timeSlow: Joi.number().integer().min(0)
          })
        }),
        tags: Joi.array().items(Joi.string().max(50)),
        isPublic: Joi.boolean()
      }),

      studyPlanQuery: validation.getSchema('pagination').append({
        planType: Joi.array().items(Joi.string().valid(...Object.values(constants.STUDY_PLAN.TYPES))),
        goalType: Joi.array().items(Joi.string().valid(...Object.values(constants.STUDY_PLAN.GOAL_TYPES))),
        timeframe: Joi.array().items(Joi.string().valid(...Object.values(constants.STUDY_PLAN.TIMEFRAMES))),
        tags: Joi.array().items(Joi.string().max(50)),
        isPublic: Joi.boolean(),
        isArchived: Joi.boolean(),
        createdBy: validation.getSchema('objectId'),
        sortBy: Joi.string().valid('createdAt', 'updatedAt', 'popularityScore', 'totalDays').default('createdAt'),
        order: Joi.string().valid('asc', 'desc').default('desc')
      }),

      assignStudyPlan: Joi.object({
        userId: validation.getSchema('objectId'),
        startDay: Joi.number().integer().min(1).default(1),
        customizations: Joi.object({
          questionsPerDay: Joi.number().integer().min(1).max(50),
          difficultyAdjustment: Joi.string().valid('easier', 'harder', 'same'),
          paceAdjustment: Joi.string().valid('slower', 'faster', 'same')
        })
      }),

      studyPlanProgress: Joi.object({
        dayCompleted: Joi.boolean().default(false),
        questionsCompleted: Joi.number().integer().min(0),
        accuracy: Joi.number().min(0).max(100),
        timePerQuestion: Joi.number().integer().min(0),
        weakAreas: Joi.array().items(Joi.string().max(100))
      }),

      studyPlanShare: Joi.object({
        userIds: Joi.array().items(validation.getSchema('objectId')).min(1).max(100).required(),
        canEdit: Joi.boolean().default(false)
      })
    };
  }

  validateCreateStudyPlan() {
    return validation.validateBody(this.schemas.createStudyPlan);
  }

  validateUpdateStudyPlan() {
    return validation.validateBody(this.schemas.updateStudyPlan);
  }

  validateStudyPlanQuery() {
    return validation.validateQuery(this.schemas.studyPlanQuery);
  }

  validateAssignStudyPlan() {
    return validation.validateBody(this.schemas.assignStudyPlan);
  }

  validateStudyPlanProgress() {
    return validation.validateBody(this.schemas.studyPlanProgress);
  }

  validateStudyPlanShare() {
    return validation.validateBody(this.schemas.studyPlanShare);
  }

  getSchema(name) {
    return this.schemas[name];
  }
}

const studyPlanValidator = new StudyPlanValidator();
module.exports = studyPlanValidator;
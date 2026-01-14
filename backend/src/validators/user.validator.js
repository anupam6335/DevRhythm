const Joi = require('joi');
const validation = require('../middleware/validation.middleware');
const constants = require('../config/constants');

class UserValidator {
  constructor() {
    this.schemas = this.initializeSchemas();
  }

  initializeSchemas() {
    return {
      updateProfile: Joi.object({
        name: Joi.string().max(100),
        avatar: Joi.string().uri().max(2000),
        timezone: Joi.string().pattern(constants.VALIDATION.TIMEZONE),
        locale: Joi.string().length(2)
      }),

      updatePreferences: Joi.object({
        difficultyProgression: Joi.string().valid(...Object.values(constants.USER.PREFERENCES.DIFFICULTY_PROGRESSION)),
        dailyTimeCommitment: Joi.number().integer().min(5).max(480),
        studyIntensity: Joi.string().valid(...Object.values(constants.USER.PREFERENCES.STUDY_INTENSITY)),
        defaultQuestionsPerDay: Joi.number().integer().min(1).max(50),
        notificationPreferences: Joi.object({
          inApp: Joi.boolean(),
          email: Joi.boolean(),
          push: Joi.boolean(),
          quietHours: Joi.object({
            from: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            to: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          })
        })
      }),

      updateUIPreferences: Joi.object({
        theme: Joi.string().valid(...Object.values(constants.USER.PREFERENCES.THEMES)),
        density: Joi.string().valid(...Object.values(constants.USER.PREFERENCES.DENSITY)),
        shortcutsEnabled: Joi.boolean(),
        autoSave: Joi.boolean(),
        defaultView: Joi.string().valid('dashboard', 'day', 'questions', 'analytics')
      }),

      updateLearningGoals: Joi.object({
        targetCompanies: Joi.array().items(Joi.string().max(100)),
        timeline: Joi.string().valid('1m', '3m', '6m', '1y', 'custom'),
        focusAreas: Joi.array().items(Joi.string().max(100)),
        goalType: Joi.string().valid(...Object.values(constants.STUDY_PLAN.GOAL_TYPES))
      }),

      onboardingComplete: Joi.object({
        step: Joi.number().integer().min(0).max(10).required(),
        completed: Joi.boolean().default(true),
        data: Joi.object({
          goalType: Joi.string().valid(...Object.values(constants.STUDY_PLAN.GOAL_TYPES)),
          targetCompanies: Joi.array().items(Joi.string().max(100)),
          dailyTimeCommitment: Joi.number().integer().min(5).max(480),
          defaultQuestionsPerDay: Joi.number().integer().min(1).max(50)
        })
      }),

      userQuery: validation.getSchema('pagination').append({
        email: validation.getSchema('email'),
        provider: Joi.string().valid('google', 'github'),
        onboardingCompleted: Joi.boolean(),
        isActive: Joi.boolean(),
        sortBy: Joi.string().valid('createdAt', 'updatedAt', 'lastLogin', 'loginCount').default('createdAt'),
        order: Joi.string().valid('asc', 'desc').default('desc')
      }),

      userStats: Joi.object({
        startDate: Joi.date().iso(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')),
        period: Joi.string().valid('day', 'week', 'month', 'year', 'custom')
      }),

      exportData: Joi.object({
        format: Joi.string().valid('json', 'csv', 'pdf').default('json'),
        include: Joi.array().items(
          Joi.string().valid('profile', 'questions', 'days', 'timers', 'revisions', 'achievements', 'analytics')
        ).default(['profile', 'questions', 'days']),
        startDate: Joi.date().iso(),
        endDate: Joi.date().iso().min(Joi.ref('startDate'))
      }),

      sessionManagement: Joi.object({
        sessionId: Joi.string().max(100),
        allOther: Joi.boolean().default(false)
      })
    };
  }

  validateUpdateProfile() {
    return validation.validateBody(this.schemas.updateProfile);
  }

  validateUpdatePreferences() {
    return validation.validateBody(this.schemas.updatePreferences);
  }

  validateUpdateUIPreferences() {
    return validation.validateBody(this.schemas.updateUIPreferences);
  }

  validateUpdateLearningGoals() {
    return validation.validateBody(this.schemas.updateLearningGoals);
  }

  validateOnboardingComplete() {
    return validation.validateBody(this.schemas.onboardingComplete);
  }

  validateUserQuery() {
    return validation.validateQuery(this.schemas.userQuery);
  }

  validateUserStats() {
    return validation.validateQuery(this.schemas.userStats);
  }

  validateExportData() {
    return validation.validateBody(this.schemas.exportData);
  }

  validateSessionManagement() {
    return validation.validateBody(this.schemas.sessionManagement);
  }

  getSchema(name) {
    return this.schemas[name];
  }
}

const userValidator = new UserValidator();
module.exports = userValidator;
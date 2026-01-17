const Joi = require('joi');
const constants = require('../config/constants');

const userValidator = {
  updateProfile: Joi.object({
    name: Joi.string().max(100).optional(),
    timezone: Joi.string().optional(),
    learningGoals: Joi.object({
      targetCompanies: Joi.array().items(Joi.string()).optional(),
      timeline: Joi.string().valid('1m', '3m', '6m', '1y', 'custom').optional(),
      focusAreas: Joi.array().items(Joi.string()).optional(),
      goalType: Joi.string().valid('interview', 'competition', 'skill', 'promotion').optional()
    }).optional(),
    preferences: Joi.object({
      difficultyProgression: Joi.string().valid('sequential', 'mixed').optional(),
      dailyTimeCommitment: Joi.number().integer().min(1).max(1440).optional(),
      studyIntensity: Joi.string().valid('light', 'moderate', 'intense').optional(),
      defaultQuestionsPerDay: Joi.number().integer().min(1).max(50).optional(),
      notificationPreferences: Joi.object({
        inApp: Joi.boolean().optional(),
        email: Joi.boolean().optional(),
        push: Joi.boolean().optional(),
        quietHours: Joi.object({
          from: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
          to: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
        }).optional()
      }).optional()
    }).optional(),
    uiPreferences: Joi.object({
      theme: Joi.string().valid('light', 'dark', 'auto').optional(),
      density: Joi.string().valid('compact', 'comfortable', 'spacious').optional(),
      shortcutsEnabled: Joi.boolean().optional(),
      autoSave: Joi.boolean().optional(),
      defaultView: Joi.string().valid('dashboard', 'day', 'questions', 'analytics').optional()
    }).optional()
  }).min(1),

  onboarding: Joi.object({
    step: Joi.number().integer().min(0).max(10).required(),
    data: Joi.object({
      learningGoals: Joi.object({
        targetCompanies: Joi.array().items(Joi.string()).optional(),
        timeline: Joi.string().valid('1m', '3m', '6m', '1y', 'custom').optional(),
        focusAreas: Joi.array().items(Joi.string()).optional(),
        goalType: Joi.string().valid('interview', 'competition', 'skill', 'promotion').optional()
      }).optional(),
      preferences: Joi.object({
        difficultyProgression: Joi.string().valid('sequential', 'mixed').optional(),
        dailyTimeCommitment: Joi.number().integer().min(1).max(1440).optional(),
        studyIntensity: Joi.string().valid('light', 'moderate', 'intense').optional(),
        defaultQuestionsPerDay: Joi.number().integer().min(1).max(50).optional()
      }).optional()
    }).required()
  }),

  exportData: Joi.object({
    format: Joi.string().valid('json', 'csv', 'pdf').default('json'),
    include: Joi.array().items(Joi.string().valid('profile', 'days', 'questions', 'timers', 'revisions', 'achievements')).default(['profile', 'days', 'questions']),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional()
  }),

  userQuery: Joi.object({
    search: Joi.string().optional(),
    sortBy: Joi.string().valid('createdAt', 'lastLogin', 'name', 'email').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    hasStreak: Joi.boolean().optional(),
    onboardingCompleted: Joi.boolean().optional()
  }),

  sessionManagement: Joi.object({
    sessionId: Joi.string().optional(),
    deviceInfo: Joi.string().optional(),
    ipAddress: Joi.string().ip().optional()
  }),

  validateUpdateProfile(req, res, next) {
    const { error } = this.updateProfile.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid profile update data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateOnboarding(req, res, next) {
    const { error } = this.onboarding.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid onboarding data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateExportData(req, res, next) {
    const { error } = this.exportData.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid export data request',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateUserQuery(req, res, next) {
    const { error } = this.userQuery.validate(req.query);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid user query parameters',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateSessionManagement(req, res, next) {
    const { error } = this.sessionManagement.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid session management data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  }
};

module.exports = userValidator;
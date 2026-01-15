const Joi = require('joi');
const constants = require('../config/constants');

const authValidator = {
  oauthCallback: Joi.object({
    code: Joi.string().required(),
    state: Joi.string().optional()
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  }),

  logout: Joi.object({
    allDevices: Joi.boolean().default(false)
  }),

  session: Joi.object({
    deviceInfo: Joi.string().optional(),
    ipAddress: Joi.string().ip().optional()
  }),

  providerLink: Joi.object({
    provider: Joi.string().valid(...Object.values(constants.AUTH.PROVIDERS)).required(),
    code: Joi.string().required(),
    state: Joi.string().optional()
  }),

  validateOAuthCallback(req, res, next) {
    const { error } = this.oauthCallback.validate(req.query);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid OAuth callback parameters',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateRefreshToken(req, res, next) {
    const { error } = this.refreshToken.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid refresh token request',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateLogout(req, res, next) {
    const { error } = this.logout.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid logout request',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateSession(req, res, next) {
    const { error } = this.session.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid session data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateProviderLink(req, res, next) {
    const { error } = this.providerLink.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid provider link request',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  }
};

module.exports = authValidator;
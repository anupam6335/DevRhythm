const Joi = require('joi');
const validation = require('../middleware/validation.middleware');
const constants = require('../config/constants');

class AuthValidator {
  constructor() {
    this.schemas = this.initializeSchemas();
  }

  initializeSchemas() {
    return {
      oauthCallback: Joi.object({
        code: Joi.string().required(),
        state: Joi.string().required(),
        error: Joi.string(),
        error_description: Joi.string()
      }),

      refreshToken: Joi.object({
        refreshToken: Joi.string().required()
      }),

      logout: Joi.object({
        allDevices: Joi.boolean().default(false)
      }),

      sessionInfo: Joi.object({
        deviceInfo: Joi.string().max(255),
        ipAddress: Joi.string().ip()
      }),

      validateToken: Joi.object({
        token: Joi.string().required()
      })
    };
  }

  validateOAuthCallback() {
    return validation.validateQuery(this.schemas.oauthCallback);
  }

  validateRefreshToken() {
    return validation.validateBody(this.schemas.refreshToken);
  }

  validateLogout() {
    return validation.validateBody(this.schemas.logout);
  }

  validateSessionInfo() {
    return validation.validateBody(this.schemas.sessionInfo);
  }

  validateToken() {
    return validation.validateBody(this.schemas.validateToken);
  }

  getSchema(name) {
    return this.schemas[name];
  }
}

const authValidator = new AuthValidator();
module.exports = authValidator;
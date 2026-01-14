const Joi = require('joi');
const mongoose = require('mongoose');
const config = require('../config/environment');
const constants = require('../config/constants');
const logger = require('../utils/logger');
const apiResponse = require('../utils/apiResponse');

class ValidationMiddleware {
  constructor() {
    this.schemas = this.initializeSchemas();
  }

  initializeSchemas() {
    return {
      objectId: Joi.string().custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      }, 'ObjectId validation').message('Invalid ObjectId'),

      pagination: Joi.object({
        page: Joi.number().integer().min(1).default(constants.PAGINATION.DEFAULT_PAGE),
        limit: Joi.number().integer().min(1).max(constants.PAGINATION.MAX_LIMIT).default(constants.PAGINATION.DEFAULT_LIMIT),
        sort: Joi.string(),
        order: Joi.string().valid('asc', 'desc').default('desc'),
        search: Joi.string().max(100)
      }),

      dateRange: Joi.object({
        startDate: Joi.date().iso(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')),
        period: Joi.string().valid('today', 'week', 'month', 'year', 'custom')
      }),

      email: Joi.string().email().max(255).trim().lowercase(),
      
      url: Joi.string().uri().max(2000),
      
      timezone: Joi.string().pattern(constants.VALIDATION.TIMEZONE),
      
      date: Joi.string().pattern(constants.VALIDATION.DATE_FORMAT),
      
      datetime: Joi.string().pattern(constants.VALIDATION.DATETIME_FORMAT)
    };
  }

  validate(schema, source = 'body') {
    return (req, res, next) => {
      const data = req[source];
      
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false
      });

      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message.replace(/['"]/g, ''),
          type: detail.type
        }));

        logger.warn('Validation failed', {
          path: req.path,
          method: req.method,
          source: source,
          errors: details,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });

        return apiResponse.unprocessableEntity(res, 'Validation failed', {
          errors: details
        });
      }

      req[source] = value;
      req.validated = req.validated || {};
      req.validated[source] = value;
      
      next();
    };
  }

  validateParams(schema) {
    return this.validate(schema, 'params');
  }

  validateQuery(schema) {
    return this.validate(schema, 'query');
  }

  validateBody(schema) {
    return this.validate(schema, 'body');
  }

  validateHeaders(schema) {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.headers, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: true
      });

      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message.replace(/['"]/g, ''),
          type: detail.type
        }));

        return apiResponse.unprocessableEntity(res, 'Header validation failed', {
          errors: details
        });
      }

      req.headers = { ...req.headers, ...value };
      req.validated = req.validated || {};
      req.validated.headers = value;
      
      next();
    };
  }

  validateFile() {
    return (req, res, next) => {
      if (!req.file && !req.files) {
        return apiResponse.badRequest(res, 'No file uploaded');
      }

      next();
    };
  }

  validatePagination() {
    return this.validateQuery(this.schemas.pagination);
  }

  validateDateRange() {
    return this.validateQuery(this.schemas.dateRange);
  }

  validateObjectId(paramName = 'id') {
    return (req, res, next) => {
      const id = req.params[paramName];
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return apiResponse.badRequest(res, `Invalid ${paramName} format`);
      }

      next();
    };
  }

  validateArrayOfObjectIds(fieldName) {
    return (req, res, next) => {
      const ids = req.body[fieldName];
      
      if (!Array.isArray(ids)) {
        return apiResponse.badRequest(res, `${fieldName} must be an array`);
      }

      for (const id of ids) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return apiResponse.badRequest(res, `Invalid ObjectId in ${fieldName}`);
        }
      }

      next();
    };
  }

  validateEnum(fieldName, enumValues, source = 'body') {
    return (req, res, next) => {
      const value = req[source][fieldName];
      
      if (value && !enumValues.includes(value)) {
        return apiResponse.badRequest(res, `Invalid ${fieldName}. Must be one of: ${enumValues.join(', ')}`);
      }

      next();
    };
  }

  validateRequiredFields(fields, source = 'body') {
    return (req, res, next) => {
      const missingFields = [];
      
      for (const field of fields) {
        if (req[source][field] === undefined || req[source][field] === null || req[source][field] === '') {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        return apiResponse.badRequest(res, `Missing required fields: ${missingFields.join(', ')}`);
      }

      next();
    };
  }

  validateAtLeastOne(fields, source = 'body') {
    return (req, res, next) => {
      const hasAtLeastOne = fields.some(field => 
        req[source][field] !== undefined && 
        req[source][field] !== null && 
        req[source][field] !== ''
      );

      if (!hasAtLeastOne) {
        return apiResponse.badRequest(res, `At least one of these fields is required: ${fields.join(', ')}`);
      }

      next();
    };
  }

  validateLength(fieldName, min, max, source = 'body') {
    return (req, res, next) => {
      const value = req[source][fieldName];
      
      if (value === undefined || value === null) {
        return next();
      }

      if (typeof value !== 'string') {
        return apiResponse.badRequest(res, `${fieldName} must be a string`);
      }

      if (value.length < min) {
        return apiResponse.badRequest(res, `${fieldName} must be at least ${min} characters`);
      }

      if (value.length > max) {
        return apiResponse.badRequest(res, `${fieldName} must be at most ${max} characters`);
      }

      next();
    };
  }

  validateNumberRange(fieldName, min, max, source = 'body') {
    return (req, res, next) => {
      const value = req[source][fieldName];
      
      if (value === undefined || value === null) {
        return next();
      }

      const num = Number(value);
      
      if (isNaN(num)) {
        return apiResponse.badRequest(res, `${fieldName} must be a number`);
      }

      if (num < min) {
        return apiResponse.badRequest(res, `${fieldName} must be at least ${min}`);
      }

      if (num > max) {
        return apiResponse.badRequest(res, `${fieldName} must be at most ${max}`);
      }

      next();
    };
  }

  validateDate(fieldName, source = 'body') {
    return (req, res, next) => {
      const value = req[source][fieldName];
      
      if (value === undefined || value === null) {
        return next();
      }

      const date = new Date(value);
      
      if (isNaN(date.getTime())) {
        return apiResponse.badRequest(res, `${fieldName} must be a valid date`);
      }

      next();
    };
  }

  validateFutureDate(fieldName, source = 'body') {
    return (req, res, next) => {
      const value = req[source][fieldName];
      
      if (value === undefined || value === null) {
        return next();
      }

      const date = new Date(value);
      const now = new Date();
      
      if (isNaN(date.getTime())) {
        return apiResponse.badRequest(res, `${fieldName} must be a valid date`);
      }

      if (date <= now) {
        return apiResponse.badRequest(res, `${fieldName} must be a future date`);
      }

      next();
    };
  }

  validatePastDate(fieldName, source = 'body') {
    return (req, res, next) => {
      const value = req[source][fieldName];
      
      if (value === undefined || value === null) {
        return next();
      }

      const date = new Date(value);
      const now = new Date();
      
      if (isNaN(date.getTime())) {
        return apiResponse.badRequest(res, `${fieldName} must be a valid date`);
      }

      if (date >= now) {
        return apiResponse.badRequest(res, `${fieldName} must be a past date`);
      }

      next();
    };
  }

  validateRegex(fieldName, pattern, source = 'body') {
    return (req, res, next) => {
      const value = req[source][fieldName];
      
      if (value === undefined || value === null) {
        return next();
      }

      const regex = new RegExp(pattern);
      
      if (!regex.test(value)) {
        return apiResponse.badRequest(res, `${fieldName} has invalid format`);
      }

      next();
    };
  }

  validateEmail(fieldName, source = 'body') {
    return this.validateRegex(fieldName, constants.VALIDATION.EMAIL, source);
  }

  validateURL(fieldName, source = 'body') {
    return this.validateRegex(fieldName, constants.VALIDATION.URL, source);
  }

  getSchema(name) {
    return this.schemas[name];
  }

  createSchema(baseSchema, customizations = {}) {
    return baseSchema.append(customizations);
  }

  logValidationError(req, errors) {
    logger.warn('Request validation failed', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.user ? req.user._id : 'anonymous',
      errors: errors,
      timestamp: new Date().toISOString(),
      body: config.env === 'development' ? req.body : undefined
    });
  }
}

const validationMiddleware = new ValidationMiddleware();
module.exports = validationMiddleware;
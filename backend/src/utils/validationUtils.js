const Joi = require('joi');
const mongoose = require('mongoose');
const validator = require('validator');
const config = require('../config/environment');
const constants = require('../config/constants');
const stringUtils = require('./stringUtils');

class ValidationUtils {
  constructor() {
    this.customValidators = this.initializeCustomValidators();
  }

  initializeCustomValidators() {
    return {
      objectId: (value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      },

      email: (value, helpers) => {
        if (!validator.isEmail(value)) {
          return helpers.error('any.invalid');
        }
        return value.toLowerCase().trim();
      },

      url: (value, helpers) => {
        if (!validator.isURL(value, { require_protocol: true })) {
          return helpers.error('any.invalid');
        }
        return value;
      },

      timezone: (value, helpers) => {
        try {
          const Intl = require('intl');
          const supported = Intl.supportedValuesOf('timeZone');
          if (!supported.includes(value)) {
            return helpers.error('any.invalid');
          }
          return value;
        } catch (error) {
          const moment = require('moment-timezone');
          if (!moment.tz.zone(value)) {
            return helpers.error('any.invalid');
          }
          return value;
        }
      },

      date: (value, helpers) => {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return helpers.error('any.invalid');
        }
        return date;
      },

      futureDate: (value, helpers) => {
        const date = new Date(value);
        const now = new Date();
        
        if (isNaN(date.getTime())) {
          return helpers.error('any.invalid');
        }
        
        if (date <= now) {
          return helpers.error('date.future');
        }
        
        return date;
      },

      pastDate: (value, helpers) => {
        const date = new Date(value);
        const now = new Date();
        
        if (isNaN(date.getTime())) {
          return helpers.error('any.invalid');
        }
        
        if (date >= now) {
          return helpers.error('date.past');
        }
        
        return date;
      },

      phone: (value, helpers) => {
        if (!validator.isMobilePhone(value, 'any', { strictMode: false })) {
          return helpers.error('any.invalid');
        }
        return value;
      },

      hexColor: (value, helpers) => {
        if (!validator.isHexColor(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      },

      mongoId: (value, helpers) => {
        if (!validator.isMongoId(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      },

      strongPassword: (value, helpers) => {
        if (!validator.isStrongPassword(value, {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        })) {
          return helpers.error('password.weak');
        }
        return value;
      },

      json: (value, helpers) => {
        try {
          JSON.parse(value);
          return value;
        } catch (error) {
          return helpers.error('any.invalid');
        }
      },

      base64: (value, helpers) => {
        if (!validator.isBase64(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      },

      uuid: (value, helpers) => {
        if (!validator.isUUID(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      },

      creditCard: (value, helpers) => {
        if (!validator.isCreditCard(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      },

      isbn: (value, helpers) => {
        if (!validator.isISBN(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      }
    };
  }

  createSchema(baseSchema, extensions = {}) {
    return baseSchema.append(extensions);
  }

  validateObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  validateEmail(email) {
    return validator.isEmail(email);
  }

  validateURL(url, options = {}) {
    return validator.isURL(url, {
      require_protocol: true,
      require_valid_protocol: true,
      protocols: ['http', 'https'],
      ...options
    });
  }

  validatePhone(phone, locale = 'any') {
    return validator.isMobilePhone(phone, locale, { strictMode: false });
  }

  validateDate(date) {
    const d = new Date(date);
    return !isNaN(d.getTime());
  }

  validateFutureDate(date) {
    const d = new Date(date);
    const now = new Date();
    return !isNaN(d.getTime()) && d > now;
  }

  validatePastDate(date) {
    const d = new Date(date);
    const now = new Date();
    return !isNaN(d.getTime()) && d < now;
  }

  validateJSON(json) {
    try {
      JSON.parse(json);
      return true;
    } catch (error) {
      return false;
    }
  }

  validateEnum(value, enumArray) {
    return enumArray.includes(value);
  }

  validateRange(value, min, max) {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
  }

  validateLength(value, min, max) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value.length >= min && value.length <= max;
  }

  validatePattern(value, pattern) {
    const regex = new RegExp(pattern);
    return regex.test(value);
  }

  validateFileType(filename, allowedTypes) {
    const ext = filename.split('.').pop().toLowerCase();
    return allowedTypes.includes('.' + ext);
  }

  validateFileSize(size, maxSize) {
    return size <= maxSize;
  }

  validateMimeType(mimeType, allowedTypes) {
    return allowedTypes.includes(mimeType);
  }

  validateRequired(value) {
    return value !== undefined && value !== null && value !== '';
  }

  validateArray(value, validator) {
    if (!Array.isArray(value)) {
      return false;
    }
    
    return value.every(item => validator(item));
  }

  validateObject(value, schema) {
    try {
      const { error } = schema.validate(value, { abortEarly: false });
      return !error;
    } catch (error) {
      return false;
    }
  }

  sanitizeInput(input, options = {}) {
    if (typeof input === 'string') {
      let sanitized = input;
      
      if (options.trim !== false) {
        sanitized = sanitized.trim();
      }
      
      if (options.stripTags !== false) {
        sanitized = stringUtils.stripHTML(sanitized);
      }
      
      if (options.escape !== false) {
        sanitized = stringUtils.escapeHTML(sanitized);
      }
      
      if (options.maxLength) {
        sanitized = stringUtils.truncate(sanitized, options.maxLength);
      }
      
      if (options.lowercase) {
        sanitized = sanitized.toLowerCase();
      }
      
      if (options.uppercase) {
        sanitized = sanitized.toUpperCase();
      }
      
      return sanitized;
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item, options));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized = {};
      for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          sanitized[key] = this.sanitizeInput(input[key], options);
        }
      }
      return sanitized;
    }
    
    return input;
  }

  sanitizeForLogging(data) {
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'authorization',
      'cookie', 'creditCard', 'ssn', 'cvv', 'pin'
    ];
    
    const sanitize = (obj, path = '') => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => sanitize(item, path));
      }
      
      const sanitized = {};
      
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const fullPath = path ? `${path}.${key}` : key;
          const lowerKey = key.toLowerCase();
          
          if (sensitiveFields.some(field => 
            lowerKey.includes(field) || fullPath.toLowerCase().includes(field)
          )) {
            sanitized[key] = '***REDACTED***';
          } else {
            sanitized[key] = sanitize(obj[key], fullPath);
          }
        }
      }
      
      return sanitized;
    };
    
    return sanitize(data);
  }

  validateAndSanitize(data, schema, options = {}) {
    const validationOptions = {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
      ...options.validation
    };
    
    const { error, value } = schema.validate(data, validationOptions);
    
    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
        type: detail.type
      }));
      
      return {
        isValid: false,
        errors: details,
        sanitizedData: null
      };
    }
    
    let sanitizedData = value;
    
    if (options.sanitize !== false) {
      sanitizedData = this.sanitizeInput(value, options.sanitizeOptions || {});
    }
    
    return {
      isValid: true,
      errors: null,
      sanitizedData
    };
  }

  getValidationMessages(errors) {
    if (!errors || errors.length === 0) {
      return [];
    }
    
    return errors.map(error => ({
      field: error.field,
      message: this.formatErrorMessage(error)
    }));
  }

  formatErrorMessage(error) {
    const messages = {
      'any.required': '{{field}} is required',
      'any.invalid': '{{field}} is invalid',
      'string.empty': '{{field}} cannot be empty',
      'string.min': '{{field}} must be at least {{limit}} characters',
      'string.max': '{{field}} must be at most {{limit}} characters',
      'string.email': '{{field}} must be a valid email',
      'string.uri': '{{field}} must be a valid URL',
      'string.pattern.base': '{{field}} has invalid format',
      'number.min': '{{field}} must be at least {{limit}}',
      'number.max': '{{field}} must be at most {{limit}}',
      'number.integer': '{{field}} must be an integer',
      'date.base': '{{field}} must be a valid date',
      'date.future': '{{field}} must be a future date',
      'date.past': '{{field}} must be a past date',
      'array.min': '{{field}} must have at least {{limit}} items',
      'array.max': '{{field}} must have at most {{limit}} items',
      'password.weak': '{{field}} must be stronger'
    };
    
    let message = messages[error.type] || '{{field}} is invalid';
    
    message = message.replace('{{field}}', error.field);
    
    if (error.context && error.context.limit) {
      message = message.replace('{{limit}}', error.context.limit);
    }
    
    return message;
  }

  createQuestionValidationSchema() {
    return Joi.object({
      title: Joi.string().max(500).required(),
      difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
      platform: Joi.string().valid(
        'leetcode', 'codeforces', 'hackerrank', 'atcoder', 'codewars', 'custom', 'other'
      ).required(),
      primaryLink: Joi.string().custom(this.customValidators.url, 'URL validation').required(),
      status: Joi.string().valid(
        'pending', 'done', 'not-solved', 'partially-solved', 'need-help'
      ).default('pending'),
      tags: Joi.array().items(Joi.string().max(50)),
      confidenceScore: Joi.number().integer().min(1).max(5),
      personalRating: Joi.number().integer().min(1).max(5)
    });
  }

  createUserValidationSchema() {
    return Joi.object({
      email: Joi.string().custom(this.customValidators.email, 'Email validation').required(),
      name: Joi.string().max(100).required(),
      timezone: Joi.string().custom(this.customValidators.timezone, 'Timezone validation')
        .default('UTC'),
      preferences: Joi.object({
        dailyTimeCommitment: Joi.number().integer().min(5).max(480).default(60),
        defaultQuestionsPerDay: Joi.number().integer().min(1).max(50).default(5)
      }).default({})
    });
  }

  createPaginationSchema() {
    return Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      sort: Joi.string(),
      order: Joi.string().valid('asc', 'desc').default('desc'),
      search: Joi.string().max(100)
    });
  }

  createDateRangeSchema() {
    return Joi.object({
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')),
      period: Joi.string().valid('today', 'week', 'month', 'year', 'custom')
    });
  }

  getCustomValidator(name) {
    return this.customValidators[name];
  }

  addCustomValidator(name, validator) {
    this.customValidators[name] = validator;
  }

  validateWithJoi(data, schema, options = {}) {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
      ...options
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
        type: detail.type,
        context: detail.context
      }));
      
      throw {
        name: 'ValidationError',
        message: 'Validation failed',
        errors: errors
      };
    }
    
    return value;
  }

  validateBatch(items, validator, options = {}) {
    const results = {
      valid: [],
      invalid: [],
      errors: []
    };
    
    items.forEach((item, index) => {
      try {
        const validated = validator(item);
        results.valid.push(validated);
      } catch (error) {
        results.invalid.push(item);
        results.errors.push({
          index,
          item,
          error: error.message || 'Validation failed'
        });
      }
    });
    
    if (options.stopOnFirstError && results.invalid.length > 0) {
      throw {
        name: 'BatchValidationError',
        message: 'Batch validation failed',
        results: results
      };
    }
    
    return results;
  }
}

const validationUtils = new ValidationUtils();
module.exports = validationUtils;
const validator = require('validator');
const config = require('../config/environment');
const constants = require('../config/constants');

class SanitizeMiddleware {
  constructor() {
    this.sanitizeInput = this.sanitizeInput.bind(this);
    this.sanitizeOutput = this.sanitizeOutput.bind(this);
    this.validateInput = this.validateInput.bind(this);
    this.escapeHtml = this.escapeHtml.bind(this);
  }

  sanitizeInput(req, res, next) {
    // Skip sanitization for OAuth callback URLs to prevent encoding issues
    if (req.originalUrl.includes('/auth/google/callback') || req.originalUrl.includes('/auth/github/callback')) {
      return next();
    }

    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const sanitized = Array.isArray(obj) ? [] : {};
      
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          let value = obj[key];
          
          if (typeof value === 'string') {
            value = validator.trim(value);
            
            // Don't escape URLs or codes for OAuth
            if (!key.includes('code') && !key.includes('url') && !key.includes('redirect')) {
              value = validator.escape(value);
            }
            
            if (validator.isEmail(value)) {
              value = validator.normalizeEmail(value, { gmail_remove_dots: false });
            }
            
            if (validator.isURL(value, { require_protocol: true })) {
              value = validator.escape(value);
            }
            
            if (validator.isJSON(value)) {
              try {
                const parsed = JSON.parse(value);
                value = JSON.stringify(sanitizeObject(parsed));
              } catch (error) {
                value = validator.escape(value);
              }
            }
          } else if (typeof value === 'object') {
            value = sanitizeObject(value);
          }
          
          sanitized[key] = value;
        }
      }
      
      return sanitized;
    };
    
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  }

  sanitizeOutput(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = Array.isArray(data) ? [] : {};
    
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        let value = data[key];
        
        if (typeof value === 'string') {
          value = validator.escape(value);
        } else if (typeof value === 'object') {
          value = this.sanitizeOutput(value);
        }
        
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  validateInput(rules) {
    return (req, res, next) => {
      const errors = {};
      
      for (const field in rules) {
        const rule = rules[field];
        const value = req.body[field] || req.query[field] || req.params[field];
        
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors[field] = `${field} is required`;
          continue;
        }
        
        if (value === undefined || value === null || value === '') {
          continue;
        }
        
        if (rule.type === 'string') {
          if (typeof value !== 'string') {
            errors[field] = `${field} must be a string`;
          }
          
          if (rule.minLength && value.length < rule.minLength) {
            errors[field] = `${field} must be at least ${rule.minLength} characters`;
          }
          
          if (rule.maxLength && value.length > rule.maxLength) {
            errors[field] = `${field} must be at most ${rule.maxLength} characters`;
          }
          
          if (rule.pattern && !rule.pattern.test(value)) {
            errors[field] = `${field} format is invalid`;
          }
          
          if (rule.enum && !rule.enum.includes(value)) {
            errors[field] = `${field} must be one of: ${rule.enum.join(', ')}`;
          }
        }
        
        if (rule.type === 'number') {
          const num = Number(value);
          if (isNaN(num)) {
            errors[field] = `${field} must be a number`;
          } else {
            if (rule.min !== undefined && num < rule.min) {
              errors[field] = `${field} must be at least ${rule.min}`;
            }
            
            if (rule.max !== undefined && num > rule.max) {
              errors[field] = `${field} must be at most ${rule.max}`;
            }
            
            if (rule.integer && !Number.isInteger(num)) {
              errors[field] = `${field} must be an integer`;
            }
          }
        }
        
        if (rule.type === 'boolean') {
          if (typeof value !== 'boolean' && value !== 'true' && value !== 'false' && value !== 0 && value !== 1) {
            errors[field] = `${field} must be a boolean`;
          }
        }
        
        if (rule.type === 'email') {
          if (!validator.isEmail(value)) {
            errors[field] = `${field} must be a valid email`;
          }
        }
        
        if (rule.type === 'url') {
          if (!validator.isURL(value, { require_protocol: true })) {
            errors[field] = `${field} must be a valid URL with protocol`;
          }
        }
        
        if (rule.type === 'date') {
          if (!validator.isISO8601(value)) {
            errors[field] = `${field} must be a valid ISO 8601 date`;
          }
        }
        
        if (rule.type === 'objectId') {
          if (!constants.PATTERNS.OBJECT_ID.test(value)) {
            errors[field] = `${field} must be a valid ObjectId`;
          }
        }
      }
      
      if (Object.keys(errors).length > 0) {
        return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: constants.ERROR_CODES.VALIDATION_ERROR,
            errors: errors
          },
          timestamp: new Date().toISOString()
        });
      }
      
      next();
    };
  }

  escapeHtml(str) {
    if (typeof str !== 'string') return str;
    
    const htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    
    return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char]);
  }

  middleware() {
    return {
      sanitizeInput: this.sanitizeInput,
      sanitizeOutput: this.sanitizeOutput,
      validateInput: this.validateInput,
      escapeHtml: this.escapeHtml
    };
  }
}

module.exports = new SanitizeMiddleware();
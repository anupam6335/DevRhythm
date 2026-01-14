const xss = require('xss-clean');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const validator = require('validator');
const config = require('../config/environment');
const constants = require('../config/constants');
const logger = require('../utils/logger');

class SanitizeMiddleware {
  constructor() {
    this.helmetConfig = this.getHelmetConfig();
    this.xssOptions = this.getXssOptions();
    this.hppOptions = this.getHppOptions();
  }

  getHelmetConfig() {
    return {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      frameguard: { action: 'deny' },
      noSniff: true,
      ieNoOpen: true,
      xssFilter: true,
      hidePoweredBy: true
    };
  }

  getXssOptions() {
    return {
      whiteList: {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    };
  }

  getHppOptions() {
    return {
      whitelist: ['page', 'limit', 'sort', 'fields', 'search']
    };
  }

  helmetMiddleware() {
    return helmet(this.helmetConfig);
  }

  xssCleanMiddleware() {
    return xss(this.xssOptions);
  }

  mongoSanitizeMiddleware() {
    return mongoSanitize({
      replaceWith: '_',
      onSanitize: ({ req, key }) => {
        logger.warn('MongoDB sanitization applied', {
          path: req.path,
          method: req.method,
          key: key,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  hppMiddleware() {
    return hpp(this.hppOptions);
  }

  inputSanitizer() {
    return (req, res, next) => {
      this.sanitizeObject(req.query);
      this.sanitizeObject(req.body);
      this.sanitizeObject(req.params);
      
      next();
    };
  }

  sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return;
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        if (typeof value === 'string') {
          obj[key] = this.sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
          this.sanitizeObject(value);
        }
      }
    }
  }

  sanitizeString(str) {
    if (!str || typeof str !== 'string') return str;
    
    let sanitized = str;
    
    sanitized = validator.trim(sanitized);
    sanitized = validator.escape(sanitized);
    sanitized = validator.stripLow(sanitized);
    sanitized = validator.blacklist(sanitized, '\'"<>{}[]`');
    
    if (validator.isURL(sanitized, { require_protocol: false })) {
      sanitized = validator.normalizeEmail(sanitized, { all_lowercase: true });
    }
    
    if (validator.isEmail(sanitized)) {
      sanitized = validator.normalizeEmail(sanitized, { all_lowercase: true });
    }
    
    const maxLength = 10000;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
      logger.warn('String truncated due to length', {
        originalLength: str.length,
        truncatedLength: maxLength
      });
    }
    
    return sanitized;
  }

  validateContentType() {
    return (req, res, next) => {
      const contentType = req.get('Content-Type');
      
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        if (!contentType || !contentType.includes('application/json')) {
          return res.status(415).json({
            success: false,
            error: {
              code: constants.ERROR_CODES.VALIDATION_ERROR,
              message: 'Content-Type must be application/json',
              statusCode: 415
            }
          });
        }
      }
      
      next();
    };
  }

  validateFileUpload() {
    return (req, res, next) => {
      if (!req.file && !req.files) {
        return next();
      }
      
      const files = req.file ? [req.file] : req.files;
      const errors = [];
      
      for (const file of files) {
        if (file.size > constants.FILE.MAX_SIZE) {
          errors.push(`File ${file.originalname} exceeds maximum size of ${constants.FILE.MAX_SIZE / 1024 / 1024}MB`);
        }
        
        const ext = '.' + file.originalname.split('.').pop().toLowerCase();
        if (!constants.FILE.ALLOWED_EXTENSIONS.includes(ext)) {
          errors.push(`File ${file.originalname} has invalid extension. Allowed: ${constants.FILE.ALLOWED_EXTENSIONS.join(', ')}`);
        }
        
        if (!constants.FILE.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          errors.push(`File ${file.originalname} has invalid MIME type. Allowed: ${constants.FILE.ALLOWED_MIME_TYPES.join(', ')}`);
        }
        
        if (file.mimetype.startsWith('image/')) {
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
          if (!imageExtensions.includes(ext)) {
            errors.push(`Image file ${file.originalname} has invalid extension for its MIME type`);
          }
        }
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: constants.ERROR_CODES.VALIDATION_ERROR,
            message: 'File validation failed',
            statusCode: 400,
            details: errors
          }
        });
      }
      
      next();
    };
  }

  preventNoSQLInjection() {
    return (req, res, next) => {
      const checkObject = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            
            if (typeof value === 'string') {
              if (value.includes('$') || value.includes('{') || value.includes('}')) {
                logger.warn('Potential NoSQL injection attempt', {
                  path: req.path,
                  method: req.method,
                  key: key,
                  value: value.substring(0, 100),
                  ip: req.ip,
                  timestamp: new Date().toISOString()
                });
                
                delete obj[key];
              }
            } else if (typeof value === 'object' && value !== null) {
              checkObject(value);
            }
          }
        }
      };
      
      checkObject(req.query);
      checkObject(req.body);
      checkObject(req.params);
      
      next();
    };
  }

  validateOrigin() {
    return (req, res, next) => {
      const origin = req.get('Origin');
      const allowedOrigins = config.security.corsOrigin.split(',');
      
      if (origin && !allowedOrigins.includes(origin) && !origin.includes('localhost')) {
        logger.warn('Invalid origin', {
          origin: origin,
          path: req.path,
          method: req.method,
          ip: req.ip,
          allowedOrigins: allowedOrigins,
          timestamp: new Date().toISOString()
        });
        
        return res.status(403).json({
          success: false,
          error: {
            code: constants.ERROR_CODES.AUTHORIZATION_ERROR,
            message: 'Origin not allowed',
            statusCode: 403
          }
        });
      }
      
      next();
    };
  }

  getMiddleware() {
    return [
      this.helmetMiddleware(),
      this.xssCleanMiddleware(),
      this.mongoSanitizeMiddleware(),
      this.hppMiddleware(),
      this.validateContentType(),
      this.inputSanitizer(),
      this.preventNoSQLInjection(),
      this.validateOrigin()
    ];
  }

  sanitizeForLogging(data) {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];
    
    const sanitize = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const sanitized = Array.isArray(obj) ? [] : {};
      
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          const lowerKey = key.toLowerCase();
          
          if (sensitiveFields.some(field => lowerKey.includes(field))) {
            sanitized[key] = '***REDACTED***';
          } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitize(value);
          } else {
            sanitized[key] = value;
          }
        }
      }
      
      return sanitized;
    };
    
    return sanitize(data);
  }
}

const sanitizeMiddleware = new SanitizeMiddleware();
module.exports = sanitizeMiddleware;
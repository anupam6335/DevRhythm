const auth = require('./auth.middleware');
const cache = require('./cache.middleware');
const error = require('./error.middleware');
const logger = require('./logger.middleware');
const rateLimit = require('./rateLimit.middleware');
const sanitize = require('./sanitize.middleware');
const validation = require('./validation.middleware');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const config = require('../config/environment');

const middleware = {
  auth,
  cache,
  error,
  logger,
  rateLimit,
  sanitize,
  validation,

  initialize(app) {
    // Security middleware
    if (config.HELMET_ENABLED) {
      app.use(helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "http://localhost:5000", "http://127.0.0.1:5000", "https://accounts.google.com", "https://github.com"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'", "https://accounts.google.com"]
          }
        },
        hsts: false
      }));
    }
    
    if (config.HIDE_POWERED_BY) {
      app.use(helmet.hidePoweredBy());
    }
    
    if (config.NO_SNIFF_ENABLED) {
      app.use(helmet.noSniff());
    }
    
    if (config.XSS_PROTECTION_ENABLED) {
      app.use(helmet.xssFilter());
    }

    app.use(mongoSanitize());
    app.use(xss());
    
    // Logging middleware
    app.use(logger.getMorganMiddleware());
    app.use(logger.requestLogger());
    app.use(logger.performanceLogger());
    app.use(logger.auditLogger());
    
    // Sanitization middleware
    app.use(sanitize.sanitizeInput);
    
    // Rate limiting middleware
    app.use(rateLimit.globalLimiter());
    
    return this;
  },

  getMiddleware() {
    return {
      auth: auth.middleware(),
      cache: cache.middleware(),
      error: error.middleware(),
      logger: logger.getMiddleware(),
      rateLimit: rateLimit.middleware(),
      sanitize: sanitize.middleware(),
      validation: validation.middleware()
    };
  },

  asyncHandler(fn) {
    return error.asyncHandler(fn);
  },

  wrap(handlers) {
    return error.wrap(handlers);
  },

  requireAuth: auth.requireAuth,
  optionalAuth: auth.optionalAuth,
  checkRole: auth.checkRole,
  checkOwnership: auth.checkOwnership,

  cacheMiddleware: cache.cache,
  invalidateCache: cache.invalidateCache,
  invalidatePattern: cache.invalidatePattern,

  handleError: error.handleError,
  errorLogger: logger.errorLogger(),

  validate: validation.validate,
  validateParams: validation.validateParams,
  validateQuery: validation.validateQuery,
  validateBody: validation.validateBody,
  validateFile: validation.validateFile,
  validatePagination: validation.validatePagination,
  validateObjectId: validation.validateObjectId,
  validateEmail: validation.validateEmail,
  validateDateRange: validation.validateDateRange,

  createSchema: validation.createSchema,
  extendSchema: validation.extendSchema
};

module.exports = middleware;
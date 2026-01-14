const config = require('../config/environment');
const constants = require('../config/constants');
const logger = require('./logger');
const apiResponse = require('./apiResponse');

class ErrorHandler {
  constructor() {
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    process.on('uncaughtException', (error) => {
      this.handleUncaughtException(error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.handleUnhandledRejection(reason, promise);
    });

    process.on('warning', (warning) => {
      this.handleWarning(warning);
    });
  }

  handleUncaughtException(error) {
    logger.error('Uncaught Exception:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    });

    if (config.env === 'production') {
      process.exit(1);
    }
  }

  handleUnhandledRejection(reason, promise) {
    logger.error('Unhandled Rejection:', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise,
      timestamp: new Date().toISOString()
    });

    if (config.env === 'production') {
      process.exit(1);
    }
  }

  handleWarning(warning) {
    logger.warn('Process Warning:', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
      timestamp: new Date().toISOString()
    });
  }

  createError(code, message, statusCode = constants.HTTP_STATUS.BAD_REQUEST, details = null) {
    const error = new Error(message);
    error.code = code;
    error.statusCode = statusCode;
    error.details = details;
    error.isOperational = true;
    return error;
  }

  createValidationError(message, details) {
    return this.createError(
      constants.ERROR_CODES.VALIDATION_ERROR,
      message,
      constants.HTTP_STATUS.BAD_REQUEST,
      details
    );
  }

  createNotFoundError(message, details = null) {
    return this.createError(
      constants.ERROR_CODES.NOT_FOUND_ERROR,
      message,
      constants.HTTP_STATUS.NOT_FOUND,
      details
    );
  }

  createAuthenticationError(message, details = null) {
    return this.createError(
      constants.ERROR_CODES.AUTHENTICATION_ERROR,
      message,
      constants.HTTP_STATUS.UNAUTHORIZED,
      details
    );
  }

  createAuthorizationError(message, details = null) {
    return this.createError(
      constants.ERROR_CODES.AUTHORIZATION_ERROR,
      message,
      constants.HTTP_STATUS.FORBIDDEN,
      details
    );
  }

  createConflictError(message, details = null) {
    return this.createError(
      constants.ERROR_CODES.CONFLICT_ERROR,
      message,
      constants.HTTP_STATUS.CONFLICT,
      details
    );
  }

  createRateLimitError(message, details = null) {
    return this.createError(
      constants.ERROR_CODES.RATE_LIMIT_ERROR,
      message,
      constants.HTTP_STATUS.TOO_MANY_REQUESTS,
      details
    );
  }

  createDatabaseError(message, details = null) {
    return this.createError(
      constants.ERROR_CODES.DATABASE_ERROR,
      message,
      constants.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      details
    );
  }

  wrapAsync(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  wrapAllRoutes(routes) {
    const wrappedRoutes = {};
    
    for (const [route, handlers] of Object.entries(routes)) {
      wrappedRoutes[route] = {};
      
      for (const [method, handler] of Object.entries(handlers)) {
        wrappedRoutes[route][method] = this.wrapAsync(handler);
      }
    }
    
    return wrappedRoutes;
  }

  handleDatabaseError(error) {
    if (error.name === 'CastError') {
      return this.createValidationError('Invalid ID format', { id: 'Must be a valid ObjectId' });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return this.createConflictError('Duplicate field value', { [field]: `${field} already exists` });
    }
    
    if (error.name === 'ValidationError') {
      const details = {};
      Object.keys(error.errors).forEach(key => {
        details[key] = error.errors[key].message;
      });
      return this.createValidationError('Validation failed', details);
    }
    
    logger.error('Database Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      timestamp: new Date().toISOString()
    });
    
    return this.createDatabaseError('Database operation failed');
  }

  handleExternalServiceError(service, error) {
    logger.error('External Service Error:', {
      service,
      message: error.message,
      status: error.status,
      code: error.code,
      timestamp: new Date().toISOString()
    });
    
    return this.createError(
      constants.ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      `${service} service is temporarily unavailable`,
      constants.HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }

  handleJWTError(error) {
    if (error.name === 'TokenExpiredError') {
      return this.createAuthenticationError('Token expired');
    }
    
    if (error.name === 'JsonWebTokenError') {
      return this.createAuthenticationError('Invalid token');
    }
    
    return this.createAuthenticationError('Authentication failed');
  }

  handleRedisError(error) {
    logger.error('Redis Error:', {
      message: error.message,
      command: error.command,
      args: error.args,
      timestamp: new Date().toISOString()
    });
    
    return this.createError(
      constants.ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      'Cache service is temporarily unavailable',
      constants.HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }

  handleFileUploadError(error) {
    logger.error('File Upload Error:', {
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return this.createValidationError('File size exceeds limit', { 
        maxSize: `${constants.FILE.MAX_SIZE / 1024 / 1024}MB` 
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return this.createValidationError('Too many files uploaded');
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return this.createValidationError('Unexpected file field');
    }
    
    return this.createError(
      constants.ERROR_CODES.INTERNAL_SERVER_ERROR,
      'File upload failed'
    );
  }

  logError(error, req) {
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: error.statusCode || 500,
      errorCode: error.code || 'UNKNOWN',
      message: error.message,
      stack: config.env === 'development' ? error.stack : undefined,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user ? req.user._id : 'anonymous'
    };

    if (error.statusCode >= 500) {
      logger.error('Server Error', logData);
      
      if (config.env === 'production') {
        this.reportToMonitoring(error, req);
      }
    } else if (error.statusCode >= 400) {
      logger.warn('Client Error', logData);
    } else {
      logger.info('Application Error', logData);
    }
  }

  reportToMonitoring(error, req) {
    if (config.monitoring.sentryDsn) {
      const Sentry = require('@sentry/node');
      Sentry.captureException(error, {
        extra: {
          path: req.path,
          method: req.method,
          userId: req.user ? req.user._id : 'anonymous',
          ip: req.ip
        }
      });
    }

    if (config.monitoring.newRelicKey) {
      const newrelic = require('newrelic');
      newrelic.noticeError(error, {
        path: req.path,
        method: req.method,
        userId: req.user ? req.user._id : 'anonymous'
      });
    }
  }

  getErrorResponse(error) {
    const statusCode = error.statusCode || constants.HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const code = error.code || constants.ERROR_CODES.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Internal Server Error';
    const details = error.details || null;

    return {
      success: false,
      error: {
        code,
        message,
        statusCode,
        details,
        timestamp: new Date().toISOString()
      }
    };
  }

  middleware() {
    return (error, req, res, next) => {
      this.logError(error, req);
      
      const response = this.getErrorResponse(error);
      
      if (config.env === 'development') {
        response.error.stack = error.stack;
        response.error.path = req.path;
        response.error.method = req.method;
      }

      if (error.statusCode === constants.HTTP_STATUS.TOO_MANY_REQUESTS && error.retryAfter) {
        res.set('Retry-After', String(error.retryAfter));
      }

      res.status(error.statusCode || constants.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
    };
  }
}

const errorHandler = new ErrorHandler();
module.exports = errorHandler;
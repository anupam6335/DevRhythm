const config = require('../config/environment');
const constants = require('../config/constants');
const logger = require('../utils/logger');
const apiResponse = require('../utils/apiResponse');

class ErrorMiddleware {
  constructor() {
    this.handleNotFound = this.handleNotFound.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleValidationError = this.handleValidationError.bind(this);
    this.handleJWTError = this.handleJWTError.bind(this);
    this.handleMongoError = this.handleMongoError.bind(this);
    this.handleRateLimitError = this.handleRateLimitError.bind(this);
  }

  handleNotFound(req, res, next) {
    const error = new Error(`Not Found - ${req.method} ${req.originalUrl}`);
    error.statusCode = constants.HTTP_STATUS.NOT_FOUND;
    error.code = constants.ERROR_CODES.NOT_FOUND_ERROR;
    next(error);
  }

  handleError(err, req, res, next) {
    let error = { ...err };
    error.message = err.message;
    error.stack = err.stack;

    if (err.name === 'ValidationError') {
      error = this.handleValidationError(err);
    } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      error = this.handleJWTError(err);
    } else if (err.name === 'CastError' || err.code === 11000) {
      error = this.handleMongoError(err);
    } else if (err.name === 'RateLimitError') {
      error = this.handleRateLimitError(err);
    } else if (!error.statusCode) {
      error.statusCode = constants.HTTP_STATUS.INTERNAL_SERVER_ERROR;
      error.code = constants.ERROR_CODES.INTERNAL_SERVER_ERROR;
    }

    this.logError(error, req);

    const response = {
      success: false,
      error: {
        code: error.code || constants.ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: error.message || 'Internal Server Error',
        statusCode: error.statusCode,
        details: error.details || null
      }
    };

    if (config.env === 'development' || config.env === 'test') {
      response.error.stack = error.stack;
      response.error.path = req.path;
      response.error.method = req.method;
      response.error.timestamp = new Date().toISOString();
    }

    if (error.statusCode === constants.HTTP_STATUS.TOO_MANY_REQUESTS) {
      if (error.retryAfter) {
        res.set('Retry-After', String(error.retryAfter));
      }
    }

    res.status(error.statusCode).json(response);
  }

  handleValidationError(err) {
    const error = {
      statusCode: constants.HTTP_STATUS.BAD_REQUEST,
      code: constants.ERROR_CODES.VALIDATION_ERROR,
      message: 'Validation Error',
      details: {}
    };

    if (err.details) {
      err.details.forEach((detail) => {
        error.details[detail.path.join('.')] = detail.message;
      });
    } else if (err.errors) {
      Object.keys(err.errors).forEach((key) => {
        error.details[key] = err.errors[key].message;
      });
    }

    return error;
  }

  handleJWTError(err) {
    const error = {
      statusCode: constants.HTTP_STATUS.UNAUTHORIZED,
      code: constants.ERROR_CODES.AUTHENTICATION_ERROR,
      message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
    };

    return error;
  }

  handleMongoError(err) {
    const error = {
      statusCode: constants.HTTP_STATUS.BAD_REQUEST,
      code: constants.ERROR_CODES.DATABASE_ERROR,
      message: 'Database Error'
    };

    if (err.name === 'CastError') {
      error.message = 'Invalid ID format';
      error.details = { id: 'Must be a valid ObjectId' };
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      error.message = 'Duplicate field value';
      error.details = { [field]: `${field} already exists` };
    }

    return error;
  }

  handleRateLimitError(err) {
    const error = {
      statusCode: constants.HTTP_STATUS.TOO_MANY_REQUESTS,
      code: constants.ERROR_CODES.RATE_LIMIT_ERROR,
      message: 'Too many requests',
      retryAfter: err.retryAfter || 900
    };

    return error;
  }

  logError(error, req) {
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: error.statusCode,
      errorCode: error.code,
      message: error.message,
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

  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  wrapRoute(routeHandler) {
    return this.asyncHandler(routeHandler);
  }

  handleUncaughtException() {
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      if (config.env === 'production') {
        process.exit(1);
      }
    });
  }

  handleUnhandledRejection() {
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', {
        promise: promise,
        reason: reason,
        timestamp: new Date().toISOString()
      });

      if (config.env === 'production') {
        process.exit(1);
      }
    });
  }

  setupGlobalHandlers() {
    this.handleUncaughtException();
    this.handleUnhandledRejection();
  }
}

const errorMiddleware = new ErrorMiddleware();
module.exports = errorMiddleware;
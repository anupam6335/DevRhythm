const config = require('../config/environment');
const constants = require('../config/constants');
const logger = require('../utils/logger');

class ErrorMiddleware {
  constructor() {
    this.handleError = this.handleError.bind(this);
    this.handleNotFound = this.handleNotFound.bind(this);
    this.handleValidationError = this.handleValidationError.bind(this);
    this.handleDatabaseError = this.handleDatabaseError.bind(this);
    this.handleJwtError = this.handleJwtError.bind(this);
    this.handleRateLimitError = this.handleRateLimitError.bind(this);
  }

  handleError(err, req, res, next) {
    logger.error('Error occurred:', {
      error: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      user: req.user?.id
    });

    if (res.headersSent) {
      return next(err);
    }

    if (err.name === 'ValidationError') {
      return this.handleValidationError(err, req, res);
    }

    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
      return this.handleDatabaseError(err, req, res);
    }

    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return this.handleJwtError(err, req, res);
    }

    if (err.name === 'RateLimitError') {
      return this.handleRateLimitError(err, req, res);
    }

    const statusCode = err.statusCode || constants.HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = config.isProduction && statusCode >= 500 
      ? 'Internal server error' 
      : err.message || 'Something went wrong';

    res.status(statusCode).json({
      success: false,
      error: {
        message: message,
        code: err.code || constants.ERROR_CODES.SERVER_ERROR,
        ...(config.isDevelopment && { stack: err.stack })
      },
      timestamp: new Date().toISOString()
    });
  }

  handleNotFound(req, res, next) {
    const error = new Error(`Route ${req.originalUrl} not found`);
    error.statusCode = constants.HTTP_STATUS.NOT_FOUND;
    error.code = constants.ERROR_CODES.NOT_FOUND_ERROR;
    next(error);
  }

  handleValidationError(err, req, res) {
    const errors = {};
    
    if (err.details) {
      err.details.forEach(detail => {
        errors[detail.path.join('.')] = detail.message;
      });
    } else if (err.errors) {
      Object.keys(err.errors).forEach(key => {
        errors[key] = err.errors[key].message;
      });
    }

    res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: constants.ERROR_CODES.VALIDATION_ERROR,
        errors: errors
      },
      timestamp: new Date().toISOString()
    });
  }

  handleDatabaseError(err, req, res) {
    let statusCode = constants.HTTP_STATUS.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';
    let code = constants.ERROR_CODES.DATABASE_ERROR;

    if (err.code === 11000) {
      statusCode = constants.HTTP_STATUS.CONFLICT;
      message = 'Duplicate entry found';
      code = constants.ERROR_CODES.DUPLICATE_ERROR;
    }

    res.status(statusCode).json({
      success: false,
      error: {
        message: config.isDevelopment ? err.message : message,
        code: code,
        ...(config.isDevelopment && { details: err })
      },
      timestamp: new Date().toISOString()
    });
  }

  handleJwtError(err, req, res) {
    const statusCode = constants.HTTP_STATUS.UNAUTHORIZED;
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';

    res.status(statusCode).json({
      success: false,
      error: {
        message: message,
        code: constants.ERROR_CODES.AUTH_ERROR
      },
      timestamp: new Date().toISOString()
    });
  }

  handleRateLimitError(err, req, res) {
    res.status(constants.HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      error: {
        message: 'Too many requests, please try again later',
        code: constants.ERROR_CODES.RATE_LIMIT_ERROR,
        retryAfter: err.retryAfter
      },
      timestamp: new Date().toISOString()
    });
  }

  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  wrap(handlers) {
    if (Array.isArray(handlers)) {
      return handlers.map(handler => this.asyncHandler(handler));
    }
    return this.asyncHandler(handlers);
  }
}

module.exports = new ErrorMiddleware();
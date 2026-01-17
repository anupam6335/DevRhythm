const constants = require('../config/constants');
const logger = require('./logger');

class ErrorHandler {
  static handle(error, context = {}) {
    logger.error('Error occurred', {
      error: error.message,
      stack: error.stack,
      context
    });

    const errorResponse = {
      message: error.message || 'Internal server error',
      code: error.code || constants.ERROR_CODES.SERVER_ERROR,
      timestamp: new Date().toISOString()
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
      errorResponse.context = context;
    }

    return errorResponse;
  }

  static createError(message, code = constants.ERROR_CODES.SERVER_ERROR, statusCode = constants.HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    const error = new Error(message);
    error.code = code;
    error.statusCode = statusCode;
    return error;
  }

  static validationError(message, errors = {}) {
    const error = this.createError(
      message || 'Validation failed',
      constants.ERROR_CODES.VALIDATION_ERROR,
      constants.HTTP_STATUS.BAD_REQUEST
    );
    error.errors = errors;
    return error;
  }

  static authError(message = 'Authentication required') {
    return this.createError(
      message,
      constants.ERROR_CODES.AUTH_ERROR,
      constants.HTTP_STATUS.UNAUTHORIZED
    );
  }

  static forbiddenError(message = 'Access denied') {
    return this.createError(
      message,
      constants.ERROR_CODES.AUTH_ERROR,
      constants.HTTP_STATUS.FORBIDDEN
    );
  }

  static notFoundError(message = 'Resource not found') {
    return this.createError(
      message,
      constants.ERROR_CODES.NOT_FOUND_ERROR,
      constants.HTTP_STATUS.NOT_FOUND
    );
  }

  static duplicateError(message = 'Resource already exists') {
    return this.createError(
      message,
      constants.ERROR_CODES.DUPLICATE_ERROR,
      constants.HTTP_STATUS.CONFLICT
    );
  }

  static rateLimitError(message = 'Too many requests', retryAfter = null) {
    const error = this.createError(
      message,
      constants.ERROR_CODES.RATE_LIMIT_ERROR,
      constants.HTTP_STATUS.TOO_MANY_REQUESTS
    );
    error.retryAfter = retryAfter;
    return error;
  }

  static databaseError(message = 'Database error occurred') {
    return this.createError(
      message,
      constants.ERROR_CODES.DATABASE_ERROR,
      constants.HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  static wrapAsync(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  static isOperational(error) {
    return error instanceof Error && error.statusCode < 500;
  }

  static handleUncaughtException(error) {
    logger.error('Uncaught Exception:', error);
    
    if (!this.isOperational(error)) {
      process.exit(1);
    }
  }

  static handleUnhandledRejection(reason, promise) {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    
    if (!this.isOperational(reason)) {
      process.exit(1);
    }
  }

  static setupErrorHandlers() {
    process.on('uncaughtException', this.handleUncaughtException.bind(this));
    process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));
  }

  static async safeExecute(fn, errorHandler = null) {
    try {
      return await fn();
    } catch (error) {
      if (errorHandler) {
        return errorHandler(error);
      }
      throw error;
    }
  }

  static withRetry(fn, maxRetries = 3, delay = 1000) {
    return async (...args) => {
      let lastError;
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await fn(...args);
        } catch (error) {
          lastError = error;
          
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
          }
        }
      }
      
      throw lastError;
    };
  }

  static validateEnv() {
    const requiredEnvVars = [
      'MONGODB_URI'
    ];

    const missing = requiredEnvVars.filter(env => !process.env[env]);
    
    if (missing.length > 0) {
      if (process.env.NODE_ENV === 'production') {
        throw this.createError(`Missing required environment variables: ${missing.join(', ')}`);
      } else {
        logger.warn(`Missing environment variables in development: ${missing.join(', ')}`);
      }
    }
  }
}

module.exports = ErrorHandler;
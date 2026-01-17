const AnalyticsUtils = require('./analyticsUtils');
const ApiResponse = require('./apiResponse');
const DateUtils = require('./dateUtils');
const ErrorHandler = require('./errorHandler');
const ExportUtils = require('./exportUtils');
const logger = require('./logger');
const NotificationUtils = require('./notificationUtils');
const StringUtils = require('./stringUtils');
const ValidationUtils = require('./validationUtils');

const utils = {
  AnalyticsUtils,
  ApiResponse,
  DateUtils,
  ErrorHandler,
  ExportUtils,
  logger,
  NotificationUtils,
  StringUtils,
  ValidationUtils,

  initialize() {
    ErrorHandler.setupErrorHandlers();
    ErrorHandler.validateEnv();
    
    logger.info('Utils initialized');
    return this;
  },

  getUtils() {
    return {
      analytics: AnalyticsUtils,
      response: ApiResponse,
      date: DateUtils,
      error: ErrorHandler,
      export: ExportUtils,
      logger,
      notification: NotificationUtils,
      string: StringUtils,
      validation: ValidationUtils
    };
  }
};

module.exports = utils;
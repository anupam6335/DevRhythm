const authMiddleware = require('./auth.middleware');
const cacheMiddleware = require('./cache.middleware');
const errorMiddleware = require('./error.middleware');
const loggerMiddleware = require('./logger.middleware');
const rateLimitMiddleware = require('./rateLimit.middleware');
const sanitizeMiddleware = require('./sanitize.middleware');
const validationMiddleware = require('./validation.middleware');

module.exports = {
  auth: authMiddleware,
  cache: cacheMiddleware,
  error: errorMiddleware,
  logger: loggerMiddleware,
  rateLimit: rateLimitMiddleware,
  sanitize: sanitizeMiddleware,
  validation: validationMiddleware
};
const { auth, optionalAuth, generateToken, generateRefreshToken } = require('./auth');
const rateLimiters = require('./rateLimiter');
const { cache, invalidateCache, invalidateUserCache } = require('./cache');
const validate = require('./validator');
const errorHandler = require('./errorHandler');
const { morganMiddleware, logRequest, logger } = require('./logger');
const cors = require('./cors');

module.exports = {
  auth,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  ...rateLimiters,
  cache,
  invalidateCache,
  invalidateUserCache,
  validate,
  errorHandler,
  morganMiddleware,
  logRequest,
  logger,
  cors
};
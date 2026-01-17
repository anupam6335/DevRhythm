const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const config = require('../config/environment');
const constants = require('../config/constants');
const redis = require('../config/redis');
const logger = require('../utils/logger');

class RateLimitMiddleware {
  constructor() {
    this.limiters = new Map();
    this.defaultOptions = {
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      max: config.RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
      trustProxy: config.RATE_LIMIT_TRUST_PROXY,
      skipSuccessfulRequests: false,
      message: 'Too many requests, please try again later',
      statusCode: constants.HTTP_STATUS.TOO_MANY_REQUESTS,
      skip: (req) => {
        if (config.isDevelopment && req.ip === '::1') return true;
        return false;
      },
      handler: (req, res, next, options) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          method: req.method,
          url: req.originalUrl,
          userId: req.user?.id || 'anonymous',
          windowMs: options.windowMs,
          max: options.max
        });
        
        res.status(options.statusCode).json({
          success: false,
          error: {
            message: options.message,
            code: constants.ERROR_CODES.RATE_LIMIT_ERROR
          },
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  createLimiter(options = {}) {
    const limiterOptions = { ...this.defaultOptions, ...options };
    
    // Only use Redis store if Redis is connected
    if (config.QUERY_CACHE_ENABLED && redis.isConnected) {
      try {
        limiterOptions.store = new RedisStore({
          sendCommand: (...args) => redis.client.call(...args),
          prefix: 'rate-limit:'
        });
      } catch (error) {
        logger.warn('Failed to create Redis store for rate limiting:', error.message);
        // Fall back to in-memory store
      }
    }
    
    return rateLimit(limiterOptions);
  }

  globalLimiter() {
    const key = 'global';
    if (!this.limiters.has(key)) {
      this.limiters.set(key, this.createLimiter({
        keyGenerator: (req) => req.ip
      }));
    }
    return this.limiters.get(key);
  }

  userLimiter() {
    const key = 'user';
    if (!this.limiters.has(key)) {
      this.limiters.set(key, this.createLimiter({
        keyGenerator: (req) => req.user?.id || req.ip,
        max: 1000
      }));
    }
    return this.limiters.get(key);
  }

  authLimiter() {
    const key = 'auth';
    if (!this.limiters.has(key)) {
      this.limiters.set(key, this.createLimiter({
        keyGenerator: (req) => req.ip,
        windowMs: 15 * 60 * 1000,
        max: 10,
        message: 'Too many authentication attempts, please try again later'
      }));
    }
    return this.limiters.get(key);
  }

  apiLimiter() {
    const key = 'api';
    if (!this.limiters.has(key)) {
      this.limiters.set(key, this.createLimiter({
        keyGenerator: (req) => `${req.ip}:${req.path}`,
        windowMs: 60 * 1000,
        max: 60
      }));
    }
    return this.limiters.get(key);
  }

  uploadLimiter() {
    const key = 'upload';
    if (!this.limiters.has(key)) {
      this.limiters.set(key, this.createLimiter({
        keyGenerator: (req) => req.user?.id || req.ip,
        windowMs: 60 * 60 * 1000,
        max: 20,
        message: 'Too many file uploads, please try again later'
      }));
    }
    return this.limiters.get(key);
  }

  searchLimiter() {
    const key = 'search';
    if (!this.limiters.has(key)) {
      this.limiters.set(key, this.createLimiter({
        keyGenerator: (req) => req.user?.id || req.ip,
        windowMs: 60 * 1000,
        max: 30
      }));
    }
    return this.limiters.get(key);
  }

  dynamicLimiter(options) {
    const key = JSON.stringify(options);
    if (!this.limiters.has(key)) {
      this.limiters.set(key, this.createLimiter(options));
    }
    return this.limiters.get(key);
  }

  middleware() {
    return {
      global: this.globalLimiter(),
      user: this.userLimiter(),
      auth: this.authLimiter(),
      api: this.apiLimiter(),
      upload: this.uploadLimiter(),
      search: this.searchLimiter(),
      create: this.dynamicLimiter.bind(this)
    };
  }

  async resetLimit(key) {
    if (config.QUERY_CACHE_ENABLED && redis.isConnected) {
      try {
        const pattern = `rate-limit:${key}:*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.client.del(keys);
          logger.info(`Rate limit reset for key: ${key}`);
          return true;
        }
      } catch (error) {
        logger.warn('Error resetting rate limit:', error.message);
      }
    }
    return false;
  }

  getLimiterStats(key) {
    return {
      key,
      store: redis.isConnected ? 'redis' : 'memory',
      connected: redis.isConnected
    };
  }
}

module.exports = new RateLimitMiddleware();
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('../config/redis');
const config = require('../config/environment');
const constants = require('../config/constants');
const logger = require('../utils/logger');

class RateLimitMiddleware {
  constructor() {
    this.limiters = new Map();
    this.redisEnabled = config.redis.enabled;
    this.initializeLimiters();
  }

  initializeLimiters() {
    this.createLimiter('global', {
      windowMs: config.security.rateLimit.windowMs,
      max: config.security.rateLimit.maxRequests,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    });

    this.createLimiter('auth', {
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: 'Too many authentication attempts, please try again later.',
      skipSuccessfulRequests: true
    });

    this.createLimiter('api', {
      windowMs: 60 * 1000,
      max: 60,
      message: 'Too many API requests, please slow down.'
    });

    this.createLimiter('signup', {
      windowMs: 60 * 60 * 1000,
      max: 5,
      message: 'Too many accounts created from this IP, please try again later.'
    });
  }

  createLimiter(name, options) {
    const store = this.redisEnabled && redisClient.client 
      ? new RedisStore({
          sendCommand: (...args) => redisClient.client.call(...args),
          prefix: `rate_limit:${name}:`
        })
      : undefined;

    const limiter = rateLimit({
      ...options,
      store,
      keyGenerator: (req) => {
        if (name === 'auth' && req.body && req.body.email) {
          return `${req.ip}:${req.body.email}`;
        }
        return req.ip;
      },
      handler: (req, res, next, options) => {
        logger.warn('Rate limit exceeded', {
          limiter: name,
          ip: req.ip,
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString()
        });

        res.status(options.statusCode || 429).json({
          success: false,
          error: {
            code: constants.ERROR_CODES.RATE_LIMIT_ERROR,
            message: options.message,
            statusCode: options.statusCode || 429,
            retryAfter: Math.ceil(options.windowMs / 1000)
          }
        });
      },
      skip: (req) => {
        if (config.env === 'test') return true;
        
        const whitelist = process.env.RATE_LIMIT_WHITELIST 
          ? process.env.RATE_LIMIT_WHITELIST.split(',') 
          : [];
        
        return whitelist.includes(req.ip);
      }
    });

    this.limiters.set(name, limiter);
    return limiter;
  }

  getLimiter(name) {
    return this.limiters.get(name) || this.limiters.get('global');
  }

  global() {
    return this.getLimiter('global');
  }

  auth() {
    return this.getLimiter('auth');
  }

  api() {
    return this.getLimiter('api');
  }

  signup() {
    return this.getLimiter('signup');
  }

  custom(options) {
    const key = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return this.createLimiter(key, options);
  }

  userBased(windowMs = 15 * 60 * 1000, max = 100) {
    return rateLimit({
      windowMs,
      max,
      keyGenerator: (req) => {
        return req.user ? req.user._id.toString() : req.ip;
      },
      message: 'Too many requests from this user, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        return req.user && req.user.role === 'admin';
      }
    });
  }

  dynamicRateLimit() {
    return (req, res, next) => {
      const weight = this.calculateRequestWeight(req);
      const maxRequests = Math.floor(config.security.rateLimit.maxRequests / weight);
      
      const limiter = rateLimit({
        windowMs: config.security.rateLimit.windowMs,
        max: maxRequests,
        keyGenerator: (req) => req.ip,
        message: 'Too many requests, please try again later.',
        standardHeaders: true,
        legacyHeaders: false
      });
      
      limiter(req, res, next);
    };
  }

  calculateRequestWeight(req) {
    let weight = 1;
    
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      weight = 2;
    }
    
    if (req.path.includes('/auth/')) {
      weight = 3;
    }
    
    if (req.path.includes('/upload')) {
      weight = 5;
    }
    
    const contentLength = parseInt(req.get('content-length') || '0');
    if (contentLength > 1024 * 1024) {
      weight += 2;
    }
    
    return Math.min(weight, 5);
  }

  async getRateLimitStats(ip = null) {
    if (!this.redisEnabled || !redisClient.client) {
      return { redis: false, limiters: Array.from(this.limiters.keys()) };
    }
    
    try {
      const stats = {};
      
      for (const [name, limiter] of this.limiters.entries()) {
        if (ip) {
          const key = `rate_limit:${name}:${ip}`;
          const current = await redisClient.get(key);
          stats[name] = {
            current: current ? parseInt(current) : 0,
            ip: ip
          };
        }
      }
      
      return {
        redis: true,
        connected: redisClient.isConnected,
        stats
      };
    } catch (error) {
      logger.error(`Rate limit stats error: ${error.message}`);
      return { error: error.message };
    }
  }

  async resetRateLimit(ip, limiterName = null) {
    if (!this.redisEnabled || !redisClient.client) {
      return false;
    }
    
    try {
      if (limiterName) {
        const key = `rate_limit:${limiterName}:${ip}`;
        await redisClient.del(key);
        logger.info(`Reset rate limit for IP ${ip} on limiter ${limiterName}`);
      } else {
        for (const [name] of this.limiters.entries()) {
          const key = `rate_limit:${name}:${ip}`;
          await redisClient.del(key);
        }
        logger.info(`Reset all rate limits for IP ${ip}`);
      }
      
      return true;
    } catch (error) {
      logger.error(`Reset rate limit error: ${error.message}`);
      return false;
    }
  }
}

const rateLimitMiddleware = new RateLimitMiddleware();
module.exports = rateLimitMiddleware;
const redisClient = require('../config/redis');
const config = require('../config/environment');
const constants = require('../config/constants');
const logger = require('../utils/logger');
const crypto = require('crypto');

class CacheMiddleware {
  constructor() {
    this.cache = new Map();
    this.enabled = config.redis.enabled || false;
    this.memoryCache = new Map();
  }

  generateCacheKey(req, prefix = '') {
    const { originalUrl, method, query, body, user } = req;
    const keyData = {
      url: originalUrl,
      method: method,
      query: query,
      body: method === 'GET' ? {} : body,
      userId: user ? user._id : 'anonymous'
    };

    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(keyData))
      .digest('hex');

    return `${prefix}:${hash}`;
  }

  cacheResponse(ttl = constants.CACHE.TTL.MEDIUM, prefix = 'api') {
    return async (req, res, next) => {
      if (req.method !== 'GET') {
        return next();
      }

      if (req.headers['cache-control'] === 'no-cache') {
        return next();
      }

      const cacheKey = this.generateCacheKey(req, prefix);
      
      try {
        let cachedData = null;
        
        if (this.enabled) {
          cachedData = await redisClient.get(cacheKey);
        } else {
          const cachedItem = this.memoryCache.get(cacheKey);
          if (cachedItem && cachedItem.expiry > Date.now()) {
            cachedData = cachedItem.data;
          } else {
            this.memoryCache.delete(cacheKey);
          }
        }

        if (cachedData) {
          res.set('X-Cache', 'HIT');
          return res.json(cachedData);
        }

        const originalSend = res.json;
        res.json = function(data) {
          res.locals.cacheData = data;
          return originalSend.call(this, data);
        };

        res.on('finish', async () => {
          if (res.statusCode === 200 && res.locals.cacheData) {
            try {
              if (this.enabled) {
                await redisClient.set(cacheKey, res.locals.cacheData, ttl);
              } else {
                this.memoryCache.set(cacheKey, {
                  data: res.locals.cacheData,
                  expiry: Date.now() + (ttl * 1000)
                });
                
                this.cleanupMemoryCache();
              }
            } catch (error) {
              logger.error(`Cache set error: ${error.message}`);
            }
          }
        });

        next();
      } catch (error) {
        logger.error(`Cache middleware error: ${error.message}`);
        next();
      }
    };
  }

  cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expiry <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  invalidateCache(patterns = []) {
    return async (req, res, next) => {
      const originalEnd = res.end;
      
      res.end = async function(...args) {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const cacheMiddleware = require('./cache.middleware');
            await cacheMiddleware.invalidatePatterns(patterns, req.user);
          }
        } catch (error) {
          logger.error(`Cache invalidation error: ${error.message}`);
        }
        
        return originalEnd.apply(this, args);
      };

      next();
    };
  }

  async invalidatePatterns(patterns, user = null) {
    if (!this.enabled) {
      this.invalidateMemoryCache(patterns, user);
      return;
    }

    try {
      for (const pattern of patterns) {
        let finalPattern = pattern;
        
        if (user && pattern.includes(':userId')) {
          finalPattern = pattern.replace(':userId', user._id);
        }
        
        const keys = await redisClient.keys(finalPattern);
        
        if (keys.length > 0) {
          await redisClient.del(...keys);
          logger.debug(`Invalidated cache keys for pattern: ${finalPattern}`);
        }
      }
    } catch (error) {
      logger.error(`Cache pattern invalidation error: ${error.message}`);
    }
  }

  invalidateMemoryCache(patterns, user = null) {
    for (const pattern of patterns) {
      let finalPattern = pattern;
      
      if (user && pattern.includes(':userId')) {
        finalPattern = pattern.replace(':userId', user._id);
      }
      
      const regex = new RegExp(finalPattern.replace('*', '.*'));
      
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
        }
      }
    }
  }

  cacheUserData(ttl = constants.CACHE.TTL.LONG) {
    return async (req, res, next) => {
      if (!req.user) {
        return next();
      }

      const cacheKey = `user:${req.user._id}:data`;
      
      try {
        let userData = null;
        
        if (this.enabled) {
          userData = await redisClient.get(cacheKey);
        } else {
          const cachedItem = this.memoryCache.get(cacheKey);
          if (cachedItem && cachedItem.expiry > Date.now()) {
            userData = cachedItem.data;
          }
        }

        if (userData) {
          req.user.cachedData = userData;
        }

        const originalEnd = res.end;
        
        res.end = async function(...args) {
          if (res.statusCode === 200 && req.user.cachedData) {
            try {
              if (cacheMiddleware.enabled) {
                await redisClient.set(cacheKey, req.user.cachedData, ttl);
              } else {
                cacheMiddleware.memoryCache.set(cacheKey, {
                  data: req.user.cachedData,
                  expiry: Date.now() + (ttl * 1000)
                });
              }
            } catch (error) {
              logger.error(`User cache set error: ${error.message}`);
            }
          }
          
          return originalEnd.apply(this, args);
        };

        next();
      } catch (error) {
        logger.error(`User cache middleware error: ${error.message}`);
        next();
      }
    };
  }

  async clearUserCache(userId) {
    try {
      if (this.enabled) {
        const pattern = `user:${userId}:*`;
        const keys = await redisClient.keys(pattern);
        
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } else {
        const pattern = new RegExp(`^user:${userId}:`);
        
        for (const key of this.memoryCache.keys()) {
          if (pattern.test(key)) {
            this.memoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      logger.error(`Clear user cache error: ${error.message}`);
    }
  }

  healthCheck() {
    return {
      enabled: this.enabled,
      memoryCacheSize: this.memoryCache.size,
      redisConnected: this.enabled ? redisClient.isConnected : false
    };
  }

  async flushAll() {
    try {
      if (this.enabled) {
        await redisClient.flush('*');
      }
      
      this.memoryCache.clear();
      logger.info('Cache flushed successfully');
      return true;
    } catch (error) {
      logger.error(`Cache flush error: ${error.message}`);
      return false;
    }
  }

  getStats() {
    return {
      enabled: this.enabled,
      memoryCache: {
        size: this.memoryCache.size,
        keys: Array.from(this.memoryCache.keys())
      },
      redis: this.enabled ? {
        connected: redisClient.isConnected
      } : null
    };
  }
}

const cacheMiddleware = new CacheMiddleware();
module.exports = cacheMiddleware;
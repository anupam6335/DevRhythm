const config = require('../config/environment');
const constants = require('../config/constants');
const redis = require('../config/redis');
const logger = require('../utils/logger');

class CacheMiddleware {
  constructor() {
    this.cache = this.cache.bind(this);
    this.invalidateCache = this.invalidateCache.bind(this);
    this.invalidatePattern = this.invalidatePattern.bind(this);
    this.getCacheKey = this.getCacheKey.bind(this);
  }

  cache(ttl = constants.CACHE.TTL.MEDIUM, prefix = 'cache') {
    return async (req, res, next) => {
      if (!config.QUERY_CACHE_ENABLED || req.method !== 'GET') {
        return next();
      }

      const cacheKey = this.getCacheKey(req, prefix);
      
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          logger.debug(`Cache hit: ${cacheKey}`);
          return res.json(cachedData);
        }
        
        logger.debug(`Cache miss: ${cacheKey}`);
        
        const originalSend = res.send;
        const originalJson = res.json;
        
        res.json = (body) => {
          res.locals.cacheBody = body;
          return originalJson.call(res, body);
        };
        
        res.send = (body) => {
          if (typeof body === 'object') {
            res.locals.cacheBody = body;
          }
          return originalSend.call(res, body);
        };
        
        res.on('finish', async () => {
          if (res.statusCode === constants.HTTP_STATUS.OK && res.locals.cacheBody) {
            try {
              await redis.set(cacheKey, res.locals.cacheBody, ttl);
              logger.debug(`Cache set: ${cacheKey} for ${ttl}s`);
            } catch (error) {
              logger.error('Error setting cache:', error);
            }
          }
        });
        
        next();
      } catch (error) {
        logger.error('Cache middleware error:', error);
        next();
      }
    };
  }

  async invalidateCache(key) {
    if (!config.QUERY_CACHE_ENABLED) return;
    
    try {
      await redis.del(key);
      logger.debug(`Cache invalidated: ${key}`);
    } catch (error) {
      logger.error('Error invalidating cache:', error);
    }
  }

  async invalidatePattern(pattern) {
    if (!config.QUERY_CACHE_ENABLED) return;
    
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        const pipeline = redis.client.pipeline();
        keys.forEach(key => pipeline.del(key));
        await pipeline.exec();
        logger.debug(`Pattern cache invalidated: ${pattern}, keys: ${keys.length}`);
      }
    } catch (error) {
      logger.error('Error invalidating pattern cache:', error);
    }
  }

  getCacheKey(req, prefix = 'cache') {
    const { originalUrl, method, query, body, user } = req;
    const userId = user?.id || 'anonymous';
    
    const keyParts = [
      prefix,
      method,
      originalUrl,
      userId,
      JSON.stringify(query),
      JSON.stringify(body)
    ];
    
    return keyParts.join('|').replace(/[^a-zA-Z0-9|:.-]/g, '_');
  }

  cacheResponse(ttl = constants.CACHE.TTL.MEDIUM) {
    return async (key, data) => {
      if (!config.QUERY_CACHE_ENABLED) return data;
      
      try {
        await redis.set(key, data, ttl);
        return data;
      } catch (error) {
        logger.error('Error caching response:', error);
        return data;
      }
    };
  }

  async getCachedResponse(key) {
    if (!config.QUERY_CACHE_ENABLED) return null;
    
    try {
      return await redis.get(key);
    } catch (error) {
      logger.error('Error getting cached response:', error);
      return null;
    }
  }

  middleware() {
    return {
      cache: this.cache,
      invalidateCache: this.invalidateCache,
      invalidatePattern: this.invalidatePattern,
      getCacheKey: this.getCacheKey,
      cacheResponse: this.cacheResponse,
      getCachedResponse: this.getCachedResponse
    };
  }
}

module.exports = new CacheMiddleware();
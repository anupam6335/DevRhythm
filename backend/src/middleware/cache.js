const redisClient = require('../config/redis');

const cache = (duration = 60, keyPrefix = '') => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();
    
    let cacheKey = '';
    try {
      if (req.user && req.user._id) {
        cacheKey = `devrhythm:cache:${keyPrefix}:user:${req.user._id}:${req.originalUrl}`;
      } else {
        cacheKey = `devrhythm:cache:${keyPrefix}:${req.originalUrl}`;
      }
      
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      const originalJson = res.json;
      res.json = function(data) {
        redisClient.setEx(cacheKey, duration, JSON.stringify(data));
        originalJson.call(this, data);
      };
      next();
    } catch (error) {
      console.warn('Cache middleware error:', error.message);
      next();
    }
  };
};

const invalidateCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(`devrhythm:cache:${pattern}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.warn('Cache invalidation error:', error.message);
  }
};

const invalidateUserCache = async (userId) => {
  await invalidateCache(`user:${userId}:`);
  await invalidateCache(`notifications:${userId}:`);
  await invalidateCache(`progress-snapshots:${userId}:`);
  await invalidateCache(`leaderboards:user:${userId}:`);
};

const invalidateQuestionCache = async (questionId, platform, platformQuestionId) => {
  await invalidateCache('questions:*');
  await invalidateCache(`question:${questionId}`);
  await invalidateCache(`question:platform:${platform}:${platformQuestionId}`);
  await invalidateCache('questions:patterns');
  await invalidateCache('questions:tags');
  await invalidateCache('questions:statistics');
};

const invalidateProgressCache = async (userId) => {
  await invalidateCache(`progress:*:user:${userId}:*`);
  await invalidateCache(`progress:list:user:${userId}:*`);
  await invalidateCache(`progress:stats:user:${userId}:*`);
  await invalidateCache(`progress:recent:user:${userId}:*`);
  await invalidateCache(`progress:question:*:user:${userId}:*`);
};

module.exports = { cache, invalidateCache, invalidateUserCache, invalidateQuestionCache, invalidateProgressCache };
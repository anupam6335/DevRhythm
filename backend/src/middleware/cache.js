const redisClient = require('../config/redis');

const cache = (duration = 60, keyPrefix = '') => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();
    const key = `devrhythm:cache:${keyPrefix}:${req.originalUrl}`;
    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      const originalSend = res.json;
      res.json = function(data) {
        redisClient.setEx(key, duration, JSON.stringify(data));
        originalSend.call(this, data);
      };
      next();
    } catch (error) {
      next();
    }
  };
};

const invalidateCache = async (pattern) => {
  const keys = await redisClient.keys(`devrhythm:cache:${pattern}*`);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

const invalidateUserCache = async (userId) => {
  await invalidateCache(`user:${userId}:`);
  await invalidateCache(`notifications:${userId}:`);
  await invalidateCache(`progress-snapshots:${userId}:`);
  await invalidateCache(`leaderboards:user:${userId}:`);
};

module.exports = { cache, invalidateCache, invalidateUserCache };
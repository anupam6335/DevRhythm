const { client: redisClient } = require('../config/redis');
const crypto = require('crypto');

// Helper to generate ETag from response data
const generateETag = (data) => {
  const hash = crypto.createHash('sha1');
  hash.update(JSON.stringify(data));
  return `"${hash.digest('hex')}"`; // ETags are quoted strings per spec
};

// Helper to get keys by pattern using KEYS (use SCAN in production)
const getKeys = async (pattern) => {
  if (!redisClient) return [];
  try {
    return await redisClient.sendCommand(['KEYS', pattern]);
  } catch (err) {
    console.warn('Error getting keys:', err);
    return [];
  }
};

/**
 * Cache middleware with client-side caching headers.
 * @param {number} duration - TTL in seconds (also used for max-age)
 * @param {Object|string} options - If string, used as key prefix; else options object
 * @param {string} options.keyPrefix - Custom key prefix (default: '')
 * @param {string} options.privacy - 'public' or 'private' (default: 'private')
 * @param {number} options.maxAge - Override max-age (defaults to duration)
 */
const cache = (duration = 60, options = {}) => {
  // Handle legacy usage: second argument was keyPrefix as string
  if (typeof options === 'string') {
    options = { keyPrefix: options };
  }

  const {
    keyPrefix = '',
    privacy = 'private',   // default to private for authenticated data
    maxAge = duration,
  } = options;

  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();
    if (!redisClient) return next();

    // Build cache key (include user ID if authenticated, otherwise public)
    let cacheKey;
    if (req.user && req.user._id) {
      cacheKey = `devrhythm:cache:${keyPrefix}:user:${req.user._id}:${req.originalUrl}`;
    } else {
      cacheKey = `devrhythm:cache:${keyPrefix}:${req.originalUrl}`;
    }

    try {
      // Try to get cached entry
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const { data, etag } = JSON.parse(cached);

        // Set cache control headers
        res.setHeader('Cache-Control', `${privacy}, max-age=${maxAge}`);
        res.setHeader('ETag', etag);

        // Handle conditional request
        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch === etag) {
          return res.status(304).end(); // Not Modified
        }

        // Return cached data
        return res.json(data);
      }

      // No cache: capture response to store
      const originalJson = res.json;
      res.json = function (data) {
        // Compute ETag
        const etag = generateETag(data);

        // Set headers
        res.setHeader('Cache-Control', `${privacy}, max-age=${maxAge}`);
        res.setHeader('ETag', etag);

        // Store in Redis
        const toCache = JSON.stringify({ data, etag });
        redisClient.setEx(cacheKey, duration, toCache).catch(console.warn);

        // Send response
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
  if (!redisClient) return;
  try {
    const keys = await getKeys(`devrhythm:cache:${pattern}*`);
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

module.exports = {
  cache,
  invalidateCache,
  invalidateUserCache,
  invalidateQuestionCache,
  invalidateProgressCache,
};
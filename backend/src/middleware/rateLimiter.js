const rateLimit = require('express-rate-limit');
const redisClient = require('../config/redis');
const config = require('../config');

const createMemoryLimiter = (windowMs, max) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      statusCode: 429,
      message: 'Too many requests, please try again later.',
      data: null,
      meta: {},
      error: { code: 'RATE_LIMIT_EXCEEDED' }
    }
  });
};

const oauthLimiter = createMemoryLimiter(15 * 60 * 1000, 50);
const tokenLimiter = createMemoryLimiter(15 * 60 * 1000, 100);
const logoutLimiter = createMemoryLimiter(15 * 60 * 1000, 20);
const userLimiter = createMemoryLimiter(15 * 60 * 1000, 100);
const progressSnapshotLimiter = createMemoryLimiter(15 * 60 * 1000, 30);
const notificationReadLimiter = createMemoryLimiter(15 * 60 * 1000, 60);
const leaderboardLimiter = createMemoryLimiter(15 * 60 * 1000, 100);

const createRedisLimiter = async (windowMs, max, keyPrefix) => {
  try {
    const RedisStore = require('rate-limit-redis');
    return rateLimit({
      store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: `devrhythm:ratelimit:${keyPrefix}`
      }),
      windowMs,
      max,
      message: {
        success: false,
        statusCode: 429,
        message: 'Too many requests, please try again later.',
        data: null,
        meta: {},
        error: { code: 'RATE_LIMIT_EXCEEDED' }
      }
    });
  } catch (error) {
    console.warn('Redis rate limiter failed, using memory limiter:', error.message);
    return createMemoryLimiter(windowMs, max);
  }
};

module.exports = {
  oauthLimiter,
  tokenLimiter,
  logoutLimiter,
  userLimiter,
  progressSnapshotLimiter,
  notificationReadLimiter,
  leaderboardLimiter,
  createRedisLimiter,
  createMemoryLimiter
};
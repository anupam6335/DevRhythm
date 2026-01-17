const constants = require('./constants');
const environment = require('./environment');
const database = require('./database');
const redis = require('./redis');
const passport = require('./passport');

module.exports = {
  constants,
  environment,
  database,
  redis,
  passport,
  
  async initialize() {
    await database.connect();
    
    // Try to connect to Redis, but don't fail if it's not available
    if (environment.QUERY_CACHE_ENABLED) {
      try {
        await redis.connect();
      } catch (error) {
        console.warn('Redis connection failed, continuing without cache:', error.message);
      }
    }
    return this;
  },
  
  async shutdown() {
    await database.disconnect();
    
    if (redis.isConnected) {
      await redis.disconnect();
    }
  },
  
  getConfig() {
    return {
      environment,
      constants,
      services: {
        database: database.getStatus(),
        redis: redis.getStatus()
      }
    };
  }
};
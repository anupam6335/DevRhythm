const Redis = require('ioredis');
const config = require('./environment');
const logger = require('../utils/logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.pubClient = null;
    this.subClient = null;
    this.isConnected = false;
  }

  async connect() {
    if (!config.redis.enabled) {
      logger.warn('Redis is disabled. Using in-memory fallback.');
      return;
    }

    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        db: config.redis.db,
        retryStrategy: (times) => {
          const delay = Math.min(times * 100, 3000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        connectTimeout: 10000
      });

      this.pubClient = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        db: config.redis.db
      });

      this.subClient = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        db: config.redis.db
      });

      await this.client.ping();
      this.isConnected = true;
      
      logger.info(`Redis connected to ${config.redis.host}:${config.redis.port}`);

      this.setupEventListeners();
      
      return this.client;
    } catch (error) {
      logger.error(`Redis connection error: ${error.message}`);
      this.isConnected = false;
      
      if (config.env === 'production') {
        throw error;
      }
      
      return null;
    }
  }

  setupEventListeners() {
    if (!this.client) return;

    this.client.on('connect', () => {
      logger.debug('Redis client connected');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      logger.debug('Redis client ready');
    });

    this.client.on('error', (error) => {
      logger.error(`Redis client error: ${error.message}`);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.warn('Redis client connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });

    this.client.on('end', () => {
      logger.warn('Redis client connection ended');
      this.isConnected = false;
    });
  }

  async get(key) {
    if (!this.isConnected || !this.client) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Redis GET error for key ${key}: ${error.message}`);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl > 0) {
        await this.client.setex(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      logger.error(`Redis SET error for key ${key}: ${error.message}`);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}: ${error.message}`);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}: ${error.message}`);
      return false;
    }
  }

  async increment(key, by = 1) {
    if (!this.isConnected || !this.client) return null;
    
    try {
      const result = await this.client.incrby(key, by);
      return result;
    } catch (error) {
      logger.error(`Redis INCR error for key ${key}: ${error.message}`);
      return null;
    }
  }

  async decrement(key, by = 1) {
    if (!this.isConnected || !this.client) return null;
    
    try {
      const result = await this.client.decrby(key, by);
      return result;
    } catch (error) {
      logger.error(`Redis DECR error for key ${key}: ${error.message}`);
      return null;
    }
  }

  async expire(key, ttl) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}: ${error.message}`);
      return false;
    }
  }

  async ttl(key) {
    if (!this.isConnected || !this.client) return -2;
    
    try {
      const result = await this.client.ttl(key);
      return result;
    } catch (error) {
      logger.error(`Redis TTL error for key ${key}: ${error.message}`);
      return -2;
    }
  }

  async keys(pattern) {
    if (!this.isConnected || !this.client) return [];
    
    try {
      const result = await this.client.keys(pattern);
      return result;
    } catch (error) {
      logger.error(`Redis KEYS error for pattern ${pattern}: ${error.message}`);
      return [];
    }
  }

  async flush(pattern = '*') {
    if (!this.isConnected || !this.client) return false;
    
    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error(`Redis FLUSH error for pattern ${pattern}: ${error.message}`);
      return false;
    }
  }

  async publish(channel, message) {
    if (!this.isConnected || !this.pubClient) return false;
    
    try {
      const result = await this.pubClient.publish(channel, JSON.stringify(message));
      return result > 0;
    } catch (error) {
      logger.error(`Redis PUBLISH error for channel ${channel}: ${error.message}`);
      return false;
    }
  }

  async subscribe(channel, callback) {
    if (!this.isConnected || !this.subClient) return false;
    
    try {
      await this.subClient.subscribe(channel);
      this.subClient.on('message', (msgChannel, message) => {
        if (msgChannel === channel) {
          callback(JSON.parse(message));
        }
      });
      return true;
    } catch (error) {
      logger.error(`Redis SUBSCRIBE error for channel ${channel}: ${error.message}`);
      return false;
    }
  }

  async healthCheck() {
    if (!config.redis.enabled) {
      return { status: 'disabled', connected: false };
    }
    
    if (!this.client || !this.isConnected) {
      return { status: 'unhealthy', connected: false };
    }
    
    try {
      await this.client.ping();
      return {
        status: 'healthy',
        connected: true,
        ready: this.client.status === 'ready',
        host: config.redis.host,
        port: config.redis.port
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message
      };
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
    
    if (this.pubClient) {
      await this.pubClient.quit();
      this.pubClient = null;
    }
    
    if (this.subClient) {
      await this.subClient.quit();
      this.subClient = null;
    }
    
    this.isConnected = false;
    logger.info('Redis connections closed');
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
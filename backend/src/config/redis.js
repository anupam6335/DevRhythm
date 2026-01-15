const Redis = require('ioredis');
const logger = require('../utils/logger');
const config = require('./environment');

class RedisClient {
  constructor() {
    this.client = null;
    this.publisher = null;
    this.subscriber = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
  }

  async connect() {
    if (this.isConnected) return;
    
    // If Redis URL is not configured or is localhost but Redis is not running
    if (!config.REDIS_URL || config.REDIS_URL === 'redis://localhost:6379') {
      logger.warn('Redis URL not configured or using default localhost. Redis functionality will be disabled.');
      this.isConnected = false;
      return;
    }
    
    const options = {
      retryStrategy: (times) => {
        this.connectionAttempts = times;
        if (times > this.maxConnectionAttempts) {
          logger.warn(`Redis connection failed after ${times} attempts. Disabling Redis.`);
          this.isConnected = false;
          return null; // Stop retrying
        }
        const delay = Math.min(times * 1000, 5000);
        logger.info(`Redis connection attempt ${times}, retrying in ${delay}ms...`);
        return delay;
      },
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      connectTimeout: 5000,
      lazyConnect: true,
      showFriendlyErrorStack: true
    };

    if (config.REDIS_PASSWORD) {
      options.password = config.REDIS_PASSWORD;
    }
    if (config.REDIS_DB) {
      options.db = config.REDIS_DB;
    }

    try {
      this.client = new Redis(config.REDIS_URL, options);
      this.publisher = new Redis(config.REDIS_URL, options);
      this.subscriber = new Redis(config.REDIS_URL, options);

      // Test connection
      await this.client.ping();
      this.isConnected = true;

      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.client.on('error', (err) => {
        logger.warn('Redis client error:', err.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      logger.info('Redis connected successfully');
    } catch (error) {
      logger.warn('Redis connection failed, disabling Redis:', error.message);
      this.isConnected = false;
      this.cleanup();
    }
  }

  async disconnect() {
    if (!this.isConnected || !this.client) return;
    
    try {
      await this.client.quit();
      await this.publisher.quit();
      await this.subscriber.quit();
      this.isConnected = false;
      logger.info('Redis disconnected successfully');
    } catch (error) {
      logger.warn('Error disconnecting Redis:', error.message);
    } finally {
      this.cleanup();
    }
  }

  cleanup() {
    if (this.client) {
      this.client.disconnect();
    }
    if (this.publisher) {
      this.publisher.disconnect();
    }
    if (this.subscriber) {
      this.subscriber.disconnect();
    }
    this.client = null;
    this.publisher = null;
    this.subscriber = null;
    this.isConnected = false;
  }

  async get(key) {
    if (!this.isConnected || !this.client) return null;
    
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.warn('Redis GET error:', error.message);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      const stringValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
      return true;
    } catch (error) {
      logger.warn('Redis SET error:', error.message);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.warn('Redis DEL error:', error.message);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected || !this.client) return 0;
    
    try {
      return await this.client.exists(key);
    } catch (error) {
      logger.warn('Redis EXISTS error:', error.message);
      return 0;
    }
  }

  async expire(key, ttl) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      logger.warn('Redis EXPIRE error:', error.message);
      return false;
    }
  }

  async keys(pattern) {
    if (!this.isConnected || !this.client) return [];
    
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.warn('Redis KEYS error:', error.message);
      return [];
    }
  }

  async flush() {
    if (!this.isConnected || !this.client) return false;
    
    try {
      await this.client.flushdb();
      return true;
    } catch (error) {
      logger.warn('Redis FLUSHDB error:', error.message);
      return false;
    }
  }

  async publish(channel, message) {
    if (!this.isConnected || !this.publisher) return false;
    
    try {
      await this.publisher.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      logger.warn('Redis PUBLISH error:', error.message);
      return false;
    }
  }

  async subscribe(channel, callback) {
    if (!this.isConnected || !this.subscriber) return false;
    
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (ch, msg) => {
        if (ch === channel) {
          callback(JSON.parse(msg));
        }
      });
      return true;
    } catch (error) {
      logger.warn('Redis SUBSCRIBE error:', error.message);
      return false;
    }
  }

  async unsubscribe(channel) {
    if (!this.isConnected || !this.subscriber) return false;
    
    try {
      await this.subscriber.unsubscribe(channel);
      return true;
    } catch (error) {
      logger.warn('Redis UNSUBSCRIBE error:', error.message);
      return false;
    }
  }

  async hset(key, field, value) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      await this.client.hset(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.warn('Redis HSET error:', error.message);
      return false;
    }
  }

  async hget(key, field) {
    if (!this.isConnected || !this.client) return null;
    
    try {
      const data = await this.client.hget(key, field);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.warn('Redis HGET error:', error.message);
      return null;
    }
  }

  async hdel(key, field) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      await this.client.hdel(key, field);
      return true;
    } catch (error) {
      logger.warn('Redis HDEL error:', error.message);
      return false;
    }
  }

  async hgetall(key) {
    if (!this.isConnected || !this.client) return {};
    
    try {
      const data = await this.client.hgetall(key);
      const result = {};
      for (const [field, value] of Object.entries(data)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      logger.warn('Redis HGETALL error:', error.message);
      return {};
    }
  }

  getStatus() {
    return {
      status: this.isConnected ? 'connected' : 'disconnected',
      isConnected: this.isConnected,
      url: config.REDIS_URL || 'not_configured',
      attempts: this.connectionAttempts
    };
  }
}

module.exports = new RedisClient();
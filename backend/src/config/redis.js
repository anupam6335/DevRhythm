const redis = require('redis');
const config = require('./index');

let redisErrorLogged = false;
let heartbeatInterval = null;

const createRedisClient = () => {
  try {
    const url = config.redis.url;
    if (!url) {
      throw new Error('REDIS_URL is not defined in environment');
    }

    const isTLS = url.startsWith('rediss://');
    const socketOptions = {
      reconnectStrategy: (retries) => {
        if (retries > 50) {
          console.error('Redis: Too many reconnect attempts, stopping.');
          return new Error('Too many retries');
        }
        const delay = Math.min(Math.pow(2, retries) * 100, 10000);
        console.log(`Redis reconnect attempt ${retries}, waiting ${delay}ms`);
        return delay;
      },
      keepAlive: true,
      keepAliveInitialDelay: 5000,
      connectTimeout: 10000,
    };

    // Only add TLS options if using rediss:// and certificate validation is required
    if (isTLS) {
      // Use environment variable to control certificate validation (default: true)
      const rejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED !== 'false';
      socketOptions.tls = { rejectUnauthorized };
    }

    const client = redis.createClient({
      url: config.redis.url,
      password: config.redis.password,
      database: config.redis.db,
      socket: socketOptions,
    });

    client.on('error', (err) => {
      if (!redisErrorLogged) {
        console.error('Redis Client Error:', err.message);
        redisErrorLogged = true;
        // 🔥 Log a clear warning that rate limiters will fall back to memory
        console.warn(
          '⚠️ Redis is unavailable. Rate limiters will fall back to memory store. ' +
          'Retry-After headers will still be sent (handled by the rate limiter logic).'
        );
      }
    });

    client.on('connect', () => console.log('Redis client connected'));
    client.on('ready', () => {
      console.log('Redis client ready');
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      // Heartbeat every 30 seconds to keep connection alive
      heartbeatInterval = setInterval(async () => {
        try {
          if (client.isReady) {
            await client.ping();
          }
        } catch (err) {
          console.warn('[Redis] Heartbeat ping failed:', err.message);
        }
      }, 30000);
    });
    client.on('reconnecting', () => console.log('Redis client reconnecting'));
    client.on('end', () => {
      console.log('Redis client disconnected');
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    });

    return client;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    console.warn(
      '⚠️ Redis initialization failed. Rate limiters will fall back to memory store. ' +
      'Retry-After headers will still be sent (handled by the rate limiter logic).'
    );
    return null;
  }
};

const client = createRedisClient();

const waitForRedis = async () => {
  if (!client) throw new Error('Redis client not created');
  try {
    await client.connect();
    console.log('Redis connected successfully');
    if (process.env.NODE_ENV === 'development') {
      await client.flushAll();
      console.log('Redis cache cleared for development');
    }
  } catch (err) {
    console.error('Redis connection error:', err);
    // 🔥 Log fallback warning
    console.warn(
      '⚠️ Redis connection failed. Rate limiters will fall back to memory store. ' +
      'Retry-After headers will still be sent (handled by the rate limiter logic).'
    );
    throw err;
  }
};

process.on('SIGINT', async () => {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (client) await client.quit();
  process.exit(0);
});

module.exports = { client, waitForRedis };
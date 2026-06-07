const redis = require('redis');
const config = require('./index');

let redisErrorLogged = false;
let heartbeatInterval = null;

const createRedisClient = () => {
  try {
    // Parse REDIS_URL to determine if TLS is required
    const redisUrl = config.redis.url;
    const isTLS = redisUrl && redisUrl.startsWith('rediss://');

    // Base socket options
    const socketOptions = {
      reconnectStrategy: (retries) => {
        if (retries > 50) {
          console.error('Redis: Too many retries, stopping.');
          return new Error('Too many retries');
        }
        // Exponential backoff: 100ms, 200ms, 400ms, ... up to 10 seconds
        const delay = Math.min(Math.pow(2, retries) * 100, 10000);
        console.log(`Redis reconnect attempt ${retries}, waiting ${delay}ms`);
        return delay;
      },
      keepAlive: true,
      keepAliveInitialDelay: 5000,
      connectTimeout: 10000,
    };

    // Add TLS options if using rediss://
    if (isTLS) {
      socketOptions.tls = {
        // For Aiven free tier, we may need to reject unauthorized = false
        // if using self-signed certificates. However, Aiven uses proper CA.
        // This setting is safe and works for most managed Redis providers.
        rejectUnauthorized: false,
      };
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
      }
    });
    
    client.on('connect', () => console.log('Redis client connected'));
    client.on('ready', () => {
      console.log('Redis client ready');
      if (heartbeatInterval) clearInterval(heartbeatInterval);
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
    return null;
  }
};

const client = createRedisClient();

const waitForRedis = async () => {
  if (!client) throw new Error('Redis client not created');
  try {
    await client.connect();
    console.log('Redis connected successfully');
    // Only flush in development – keep production data
    if (process.env.NODE_ENV === 'development') {
      await client.flushAll();
      console.log('Redis cache cleared for development');
    }
  } catch (err) {
    console.error('Redis connection error:', err);
    throw err;
  }
};

process.on('SIGINT', async () => {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (client) await client.quit();
  process.exit(0);
});

module.exports = { client, waitForRedis };

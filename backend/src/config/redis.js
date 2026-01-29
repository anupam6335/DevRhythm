const redis = require('redis');
const config = require('./index');

const createRedisClient = () => {
  try {
    const client = redis.createClient({
      url: config.redis.url,
      password: config.redis.password,
      database: config.redis.db,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.log('Too many retries on Redis. Connection terminated');
            return new Error('Too many retries');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    client.on('error', (err) => console.error('Redis Client Error:', err));
    client.on('connect', () => console.log('Redis client connected'));
    client.on('ready', () => console.log('Redis client ready'));
    client.on('reconnecting', () => console.log('Redis client reconnecting'));
    client.on('end', () => console.log('Redis client disconnected'));

    client.connect()
      .then(() => console.log('Redis connected successfully'))
      .catch(err => console.error('Redis connection error:', err));

    process.on('SIGINT', async () => {
      await client.quit();
      process.exit(0);
    });

    return client;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    return null;
  }
};

const client = createRedisClient();

module.exports = client;
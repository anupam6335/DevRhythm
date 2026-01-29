const app = require('./app');
const config = require('./config');
const mongoose = require('./config/database');
const redis = require('./config/redis');
const jobs = require('./jobs');

const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}, Instance: ${process.env.RAILWAY_INSTANCE_ID || 'local'}`);
});

const gracefulShutdown = () => {
  console.log('Received shutdown signal, closing server...');
  server.close(async () => {
    console.log('HTTP server closed');
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    await redis.quit();
    console.log('Redis disconnected');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
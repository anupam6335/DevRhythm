require('dotenv').config();

const app = require('./app');
const logger = require('./utils/logger');
const config = require('./config/environment');

async function startServer() {
  try {
    await app.start(config.PORT);
    
    logger.info('=== DevRhythm Backend Started ===');
    logger.info(`Environment: ${config.NODE_ENV}`);
    logger.info(`Port: ${config.PORT}`);
    logger.info(`API Base: ${config.API_BASE_URL}`);
    logger.info(`Frontend: ${config.FRONTEND_URL}`);
    logger.info(`Database: ${config.MONGODB_URI ? config.MONGODB_URI.split('@')[1] || config.MONGODB_URI : 'Not configured'}`);
    logger.info('=================================');
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app.getApp();
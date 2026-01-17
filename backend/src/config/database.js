const mongoose = require('mongoose');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.mongoose = mongoose;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;
    
    const options = {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 2,
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_CONNECTION_TIMEOUT_MS) || 30000,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
      w: 'majority'
    };

    try {
      await this.mongoose.connect(process.env.MONGODB_URI, options);
      this.isConnected = true;
      
      this.mongoose.connection.on('connected', () => {
        logger.info('MongoDB connection established');
      });

      this.mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
        this.isConnected = false;
      });

      this.mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      process.on('SIGINT', this.gracefulExit.bind(this));
      process.on('SIGTERM', this.gracefulExit.bind(this));

      logger.info('MongoDB connected successfully');
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  async gracefulExit() {
    try {
      await this.mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    } catch (error) {
      logger.error('Error during MongoDB graceful exit:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    if (!this.isConnected) return;
    
    try {
      await this.mongoose.connection.close();
      this.isConnected = false;
      logger.info('MongoDB disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting MongoDB:', error);
      throw error;
    }
  }

  getConnection() {
    return this.mongoose.connection;
  }

  getStatus() {
    const state = this.mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return {
      status: states[state] || 'unknown',
      readyState: state,
      isConnected: this.isConnected
    };
  }
}

module.exports = new Database();
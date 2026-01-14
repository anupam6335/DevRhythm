const mongoose = require('mongoose');
const config = require('./environment');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.mongoose = mongoose;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000;
  }

  async connect() {
    try {
      const options = {
        ...config.mongodb.options,
        useNewUrlParser: true,
        useUnifiedTopology: true
      };

      await this.mongoose.connect(config.mongodb.uri, options);
      
      this.isConnected = true;
      this.retryCount = 0;
      
      logger.info(`MongoDB connected to ${config.mongodb.uri.split('@').pop() || config.mongodb.uri}`);
      
      this.setupEventListeners();
      await this.setupIndexes();
      
      return this.mongoose.connection;
    } catch (error) {
      logger.error(`MongoDB connection error: ${error.message}`);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        logger.warn(`Retrying connection (${this.retryCount}/${this.maxRetries}) in ${this.retryDelay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.connect();
      }
      
      throw error;
    }
  }

  setupEventListeners() {
    this.mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
      this.isConnected = true;
    });

    this.mongoose.connection.on('error', (err) => {
      logger.error(`Mongoose connection error: ${err.message}`);
      this.isConnected = false;
    });

    this.mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
      this.isConnected = false;
      
      if (config.env === 'production') {
        this.handleDisconnection();
      }
    });

    this.mongoose.connection.on('reconnected', () => {
      logger.info('Mongoose reconnected to MongoDB');
      this.isConnected = true;
    });
  }

  async handleDisconnection() {
    if (this.reconnectionAttempt) return;
    
    this.reconnectionAttempt = true;
    logger.warn('Attempting to reconnect to MongoDB...');
    
    try {
      await this.connect();
      this.reconnectionAttempt = false;
    } catch (error) {
      logger.error(`Failed to reconnect to MongoDB: ${error.message}`);
      this.reconnectionAttempt = false;
      
      if (config.env === 'production') {
        process.exit(1);
      }
    }
  }

  async setupIndexes() {
    try {
      const { modelManager } = require('../models');
      await modelManager.createIndexes();
      logger.info('Database indexes created/verified');
    } catch (error) {
      logger.warn(`Failed to create indexes: ${error.message}`);
    }
  }

  async disconnect() {
    if (!this.isConnected) return;
    
    try {
      await this.mongoose.connection.close();
      logger.info('MongoDB connection closed');
      this.isConnected = false;
    } catch (error) {
      logger.error(`Error closing MongoDB connection: ${error.message}`);
      throw error;
    }
  }

  async healthCheck() {
    try {
      await this.mongoose.connection.db.admin().ping();
      return {
        status: 'healthy',
        connected: this.isConnected,
        readyState: this.mongoose.connection.readyState,
        host: this.mongoose.connection.host,
        name: this.mongoose.connection.name
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: this.isConnected,
        readyState: this.mongoose.connection.readyState,
        error: error.message
      };
    }
  }

  async getStats() {
    try {
      const adminDb = this.mongoose.connection.db.admin();
      const serverStatus = await adminDb.serverStatus();
      const dbStats = await this.mongoose.connection.db.stats();
      
      return {
        server: {
          version: serverStatus.version,
          uptime: serverStatus.uptime,
          connections: serverStatus.connections,
          memory: serverStatus.mem
        },
        database: {
          collections: dbStats.collections,
          objects: dbStats.objects,
          avgObjSize: dbStats.avgObjSize,
          dataSize: dbStats.dataSize,
          storageSize: dbStats.storageSize,
          indexes: dbStats.indexes,
          indexSize: dbStats.indexSize
        },
        mongoose: {
          readyState: this.mongoose.connection.readyState,
          models: Object.keys(this.mongoose.models).length,
          connections: this.mongoose.connections.length
        }
      };
    } catch (error) {
      logger.error(`Error getting database stats: ${error.message}`);
      return { error: error.message };
    }
  }

  async cleanupTestData() {
    if (config.env !== 'test') {
      throw new Error('Cleanup only allowed in test environment');
    }
    
    try {
      const { modelManager } = require('../models');
      await modelManager.cleanupTestData();
      logger.info('Test data cleaned up');
    } catch (error) {
      logger.error(`Error cleaning test data: ${error.message}`);
      throw error;
    }
  }
}

const database = new Database();
module.exports = database;
// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const config = require('./config');
const middleware = require('./middleware');
const routes = require('./routes');
const logger = require('./utils/logger');

class App {
  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddlewares() {
    // CORS
    this.app.use(cors({
      origin: config.environment.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression
    if (config.environment.COMPRESSION_ENABLED) {
      this.app.use(compression({
        threshold: config.environment.COMPRESSION_THRESHOLD,
        filter: (req, res) => {
          if (req.headers['x-no-compression']) return false;
          return compression.filter(req, res);
        }
      }));
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Session
    if (config.environment.MONGODB_URI) {
      this.app.use(session({
        secret: config.environment.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
          mongoUrl: config.environment.MONGODB_URI,
          ttl: config.environment.SESSION_MAX_AGE / 1000
        }),
        cookie: {
          secure: config.environment.isProduction,
          httpOnly: true,
          maxAge: config.environment.SESSION_MAX_AGE,
          sameSite: 'strict'
        }
      }));
    } else {
      logger.warn('MongoDB URI not configured, using memory session store');
      this.app.use(session({
        secret: config.environment.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: config.environment.isProduction,
          httpOnly: true,
          maxAge: config.environment.SESSION_MAX_AGE,
          sameSite: 'strict'
        }
      }));
    }

    // Passport
    config.passport.initialize();
    
    // Initialize other middleware
    middleware.initialize(this.app);
  }

  initializeRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: config.database ? config.database.getStatus() : { status: 'not_configured' },
        redis: config.redis ? config.redis.getStatus() : { status: 'not_configured' }
      };
      
      res.status(200).json(health);
    });

    // Metrics
    if (config.environment.METRICS_ENABLED) {
      this.app.get(config.environment.METRICS_PATH, (req, res) => {
        const metrics = {
          timestamp: new Date().toISOString(),
          requests: req.app.get('requestCount') || 0,
          errors: req.app.get('errorCount') || 0,
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        };
        
        res.status(200).json(metrics);
      });
    }

    // API routes
    this.app.use(config.environment.API_BASE_URL, routes);

    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        message: 'DevRhythm API',
        version: '1.0.0',
        documentation: `${config.environment.BACKEND_URL}${config.environment.API_BASE_URL}/docs`,
        health: `${config.environment.BACKEND_URL}/health`,
        status: 'operational'
      });
    });
  }

  initializeErrorHandling() {
    // 404 handler
    this.app.use(middleware.error.handleNotFound);
    
    // Error logger
    this.app.use(middleware.logger.errorLogger());
    
    // Error handler
    this.app.use(middleware.error.handleError);
  }

  getApp() {
    return this.app;
  }

  async start(port = config.environment.PORT) {
    try {
      await config.initialize();
      
      this.server = this.app.listen(port, () => {
        logger.info(`Server running on port ${port}`);
        logger.info(`Environment: ${config.environment.NODE_ENV}`);
        logger.info(`API Base URL: ${config.environment.API_BASE_URL}`);
        logger.info(`Frontend URL: ${config.environment.FRONTEND_URL}`);
      });

      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`${signal} received, starting graceful shutdown`);
      
      try {
        await config.shutdown();
        
        if (this.server) {
          this.server.close(() => {
            logger.info('HTTP server closed');
            process.exit(0);
          });
          
          setTimeout(() => {
            logger.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
          }, 10000);
        } else {
          process.exit(0);
        }
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  }

  async stop() {
    if (this.server) {
      await new Promise((resolve) => {
        this.server.close(() => {
          logger.info('Server stopped');
          resolve();
        });
      });
    }
    
    await config.shutdown();
  }
}

module.exports = new App();
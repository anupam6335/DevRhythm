const express = require('express');
const cors = require('cors');
const compression = require('compression');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const swaggerUi = require('swagger-ui-express');
const config = require('./config/environment');
const constants = require('./config/constants');
const logger = require('./utils/logger');
const database = require('./config/database');
const redisClient = require('./config/redis');
const passportConfig = require('./config/passport');
const middleware = require('./middleware');
const errorHandler = require('./utils/errorHandler');
const routes = require('./routes');
const swaggerSpec = require('../swagger.json');

class App {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupHealthChecks();
  }

  setupMiddleware() {
    this.app.set('trust proxy', 1);
    
    this.app.use(compression());
    
    this.app.use(cors({
      origin: config.security.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Total-Pages', 'X-Current-Page']
    }));
    
    this.app.use(express.json({
      limit: '10mb',
      verify: (req, res, buf) => {
        req.rawBody = buf.toString();
      }
    }));
    
    this.app.use(express.urlencoded({
      extended: true,
      limit: '10mb'
    }));
    
    this.app.use(middleware.sanitize.getMiddleware());
    
    this.app.use(middleware.rateLimit.global());
    
    this.app.use(middleware.logger.getMiddleware());
    
    const sessionStore = MongoStore.create({
      mongoUrl: config.mongodb.uri,
      collectionName: 'sessions',
      ttl: config.session.maxAge / 1000,
      autoRemove: 'native'
    });
    
    this.app.use(session({
      secret: config.session.secret,
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        secure: config.env === 'production',
        httpOnly: true,
        maxAge: config.session.maxAge,
        sameSite: 'lax'
      },
      name: 'devrhythm.sid'
    }));
    
    this.app.use(passportConfig.getMiddleware());
    this.app.use(passportConfig.getSessionMiddleware());
    
    this.app.use(middleware.cache.cacheUserData());
    
    this.app.use((req, res, next) => {
      req._startTime = Date.now();
      res.header('X-Powered-By', 'DevRhythm');
      res.header('X-API-Version', config.api.version);
      res.header('X-Environment', config.env);
      
      if (config.env === 'development') {
        res.header('X-Response-Time', `${Date.now() - req._startTime}ms`);
      }
      
      next();
    });
  }

  setupRoutes() {
    this.app.get('/', (req, res) => {
      res.json({
        name: 'DevRhythm API',
        version: config.api.version,
        environment: config.env,
        documentation: '/api-docs',
        status: 'operational',
        timestamp: new Date().toISOString()
      });
    });
    
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: 'DevRhythm API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'list'
      }
    }));
    
    this.app.use(config.api.baseUrl, routes);
    
    this.app.use(middleware.error.handleNotFound);
  }

  setupErrorHandling() {
    this.app.use(middleware.error.handleError);
    
    this.app.use(errorHandler.middleware());
  }

  setupHealthChecks() {
    this.app.get('/health', async (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.env,
        version: config.api.version
      };
      
      try {
        const dbHealth = await database.healthCheck();
        health.database = dbHealth;
        
        const redisHealth = await redisClient.healthCheck();
        health.redis = redisHealth;
        
        const cacheHealth = middleware.cache.healthCheck();
        health.cache = cacheHealth;
        
        if (dbHealth.status !== 'healthy' || 
            (redisHealth.enabled && redisHealth.status !== 'healthy')) {
          health.status = 'unhealthy';
          res.status(503);
        }
      } catch (error) {
        health.status = 'unhealthy';
        health.error = error.message;
        res.status(503);
      }
      
      res.json(health);
    });
    
    this.app.get('/health/detailed', async (req, res) => {
      const detailedHealth = {
        timestamp: new Date().toISOString(),
        system: {
          node: process.version,
          platform: process.platform,
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          pid: process.pid
        },
        services: {}
      };
      
      try {
        detailedHealth.services.database = await database.getStats();
        detailedHealth.services.redis = await redisClient.healthCheck();
        detailedHealth.services.cache = middleware.cache.getStats();
        
        const { modelManager } = require('./models');
        const modelStats = await modelManager.getModelStats();
        detailedHealth.services.models = modelStats;
        
        res.json(detailedHealth);
      } catch (error) {
        res.status(500).json({
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    this.app.get('/metrics', middleware.auth.authenticateJWT(), (req, res) => {
      const metrics = {
        timestamp: new Date().toISOString(),
        requests: {
          total: req.app.locals.requestCount || 0,
          byMethod: req.app.locals.requestsByMethod || {},
          byRoute: req.app.locals.requestsByRoute || {}
        },
        memory: process.memoryUsage(),
        uptime: process.uptime()
      };
      
      res.json(metrics);
    });
  }

  async initialize() {
    try {
      await database.connect();
      
      if (config.redis.enabled) {
        await redisClient.connect();
      }
      
      logger.logStartup('DevRhythm API', config.api.version, config.port);
      
      this.app.locals.requestCount = 0;
      this.app.locals.requestsByMethod = {};
      this.app.locals.requestsByRoute = {};
      
      this.app.use((req, res, next) => {
        this.app.locals.requestCount = (this.app.locals.requestCount || 0) + 1;
        
        const method = req.method;
        this.app.locals.requestsByMethod[method] = 
          (this.app.locals.requestsByMethod[method] || 0) + 1;
        
        const route = req.path.split('/')[1] || 'root';
        this.app.locals.requestsByRoute[route] = 
          (this.app.locals.requestsByRoute[route] || 0) + 1;
        
        next();
      });
      
      return this.app;
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  getApp() {
    return this.app;
  }

  async gracefulShutdown() {
    logger.logShutdown('DevRhythm API', 'Graceful shutdown requested');
    
    try {
      await database.disconnect();
      
      if (config.redis.enabled) {
        await redisClient.disconnect();
      }
      
      logger.info('All connections closed gracefully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }
}

const app = new App();
module.exports = app;
require('dotenv').config();
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const config = require('./config/environment');
const logger = require('./utils/logger');
const app = require('./app');
const errorHandler = require('./utils/errorHandler');

class Server {
  constructor() {
    this.server = null;
    this.httpsServer = null;
    this.expressApp = null;
    this.isShuttingDown = false;
  }

  async start() {
    try {
      errorHandler.setupGlobalHandlers();
      
      const expressApp = await app.initialize();
      this.expressApp = expressApp.getApp();
      
      this.server = http.createServer(this.expressApp);
      
      if (config.env === 'production') {
        this.setupHTTPS();
      }
      
      this.setupSocketIO();
      this.setupGracefulShutdown();
      
      this.server.listen(config.port, () => {
        logger.info(`Server is running on port ${config.port}`);
        logger.info(`Environment: ${config.env}`);
        logger.info(`API Base URL: ${config.api.baseUrl}`);
        logger.info(`Frontend URL: http://localhost:${config.frontendPort}`);
        
        if (config.env === 'development') {
          logger.info(`API Documentation: http://localhost:${config.port}/api-docs`);
          logger.info(`Health Check: http://localhost:${config.port}/health`);
        }
        
        this.logStartupInfo();
      });
      
      this.server.on('error', (error) => {
        logger.error('Server error:', error);
        
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${config.port} is already in use`);
          process.exit(1);
        }
      });
      
      return this.server;
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  setupHTTPS() {
    const sslDir = path.join(process.cwd(), 'ssl');
    
    if (fs.existsSync(path.join(sslDir, 'key.pem')) && 
        fs.existsSync(path.join(sslDir, 'cert.pem'))) {
      
      const options = {
        key: fs.readFileSync(path.join(sslDir, 'key.pem')),
        cert: fs.readFileSync(path.join(sslDir, 'cert.pem')),
        ca: fs.existsSync(path.join(sslDir, 'ca.pem')) 
          ? fs.readFileSync(path.join(sslDir, 'ca.pem'))
          : null
      };
      
      this.httpsServer = https.createServer(options, this.expressApp);
      this.httpsServer.listen(443, () => {
        logger.info('HTTPS server is running on port 443');
      });
      
      this.expressApp.use((req, res, next) => {
        if (!req.secure && this.httpsServer) {
          return res.redirect(`https://${req.headers.host}${req.url}`);
        }
        next();
      });
    } else {
      logger.warn('SSL certificates not found. Running HTTP only.');
    }
  }

  setupSocketIO() {
    const socketIO = require('socket.io');
    const io = socketIO(this.server, {
      cors: {
        origin: config.security.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });
    
    io.on('connection', (socket) => {
      logger.debug('Socket.IO client connected', {
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
      
      socket.on('authenticate', async (token) => {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, config.jwt.secret, {
            issuer: 'devrhythm',
            audience: 'devrhythm-users'
          });
          
          socket.userId = decoded.sub;
          socket.join(`user:${socket.userId}`);
          
          logger.debug('Socket authenticated', {
            socketId: socket.id,
            userId: socket.userId
          });
          
          socket.emit('authenticated', { success: true });
        } catch (error) {
          logger.warn('Socket authentication failed', {
            socketId: socket.id,
            error: error.message
          });
          
          socket.emit('authentication_error', { error: 'Invalid token' });
          socket.disconnect();
        }
      });
      
      socket.on('timer:update', (data) => {
        if (socket.userId) {
          socket.to(`user:${socket.userId}`).emit('timer:update', data);
        }
      });
      
      socket.on('question:update', (data) => {
        if (socket.userId) {
          socket.to(`user:${socket.userId}`).emit('question:update', data);
        }
      });
      
      socket.on('disconnect', () => {
        logger.debug('Socket.IO client disconnected', {
          socketId: socket.id,
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
      });
    });
    
    this.expressApp.locals.io = io;
  }

  setupGracefulShutdown() {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        if (this.isShuttingDown) return;
        
        this.isShuttingDown = true;
        logger.info(`Received ${signal}, starting graceful shutdown...`);
        
        await this.shutdown();
      });
    });
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      this.shutdown();
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection:', { reason, promise });
      this.shutdown();
    });
  }

  async shutdown() {
    try {
      logger.info('Starting graceful shutdown...');
      
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(() => {
            logger.info('HTTP server closed');
            resolve();
          });
        });
      }
      
      if (this.httpsServer) {
        await new Promise((resolve) => {
          this.httpsServer.close(() => {
            logger.info('HTTPS server closed');
            resolve();
          });
        });
      }
      
      await app.gracefulShutdown();
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  logStartupInfo() {
    const info = {
      timestamp: new Date().toISOString(),
      environment: config.env,
      port: config.port,
      apiVersion: config.api.version,
      database: config.mongodb.uri.split('@').pop() || 'localhost',
      redis: config.redis.enabled ? `${config.redis.host}:${config.redis.port}` : 'disabled',
      features: {
        notifications: config.features.notifications,
        knowledgeGraph: config.features.knowledgeGraph,
        analytics: config.features.analytics,
        studyPlans: config.features.studyPlans
      }
    };
    
    logger.info('Server startup completed', info);
    
    if (config.env === 'development') {
      console.log('\n' + '='.repeat(60));
      console.log('DevRhythm Backend Server');
      console.log('='.repeat(60));
      console.log(`Environment: ${info.environment}`);
      console.log(`Port: ${info.port}`);
      console.log(`API Version: ${info.apiVersion}`);
      console.log(`Database: ${info.database}`);
      console.log(`Redis: ${info.redis}`);
      console.log('='.repeat(60));
      console.log('\nAvailable endpoints:');
      console.log(`  API: http://localhost:${info.port}${config.api.baseUrl}`);
      console.log(`  Docs: http://localhost:${info.port}/api-docs`);
      console.log(`  Health: http://localhost:${info.port}/health`);
      console.log('='.repeat(60) + '\n');
    }
  }

  getServer() {
    return this.server;
  }

  getHttpsServer() {
    return this.httpsServer;
  }
}

if (require.main === module) {
  const server = new Server();
  server.start().catch(error => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = Server;
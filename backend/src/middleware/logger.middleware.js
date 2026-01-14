const morgan = require('morgan');
const config = require('../config/environment');
const logger = require('../utils/logger');
const requestIp = require('request-ip');

class LoggerMiddleware {
  constructor() {
    this.setupMorgan();
  }

  setupMorgan() {
    const morganFormat = config.env === 'production' ? 'combined' : 'dev';
    
    this.morganMiddleware = morgan(morganFormat, {
      stream: {
        write: (message) => {
          logger.http(message.trim());
        }
      },
      skip: (req) => {
        return req.path === '/health' || req.path.startsWith('/api/v1/health');
      }
    });
  }

  getMorganMiddleware() {
    return this.morganMiddleware;
  }

  requestLogger() {
    return (req, res, next) => {
      const startTime = Date.now();
      const clientIp = requestIp.getClientIp(req);
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logData = {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration: `${duration}ms`,
          ip: clientIp,
          userAgent: req.get('user-agent'),
          userId: req.user ? req.user._id : 'anonymous',
          contentLength: res.get('content-length') || 0
        };

        if (res.statusCode >= 400) {
          logger.warn('Request Error', logData);
        } else {
          logger.info('Request Completed', logData);
        }
      });

      next();
    };
  }

  responseLogger() {
    return (req, res, next) => {
      const originalSend = res.send;
      const originalJson = res.json;
      
      res.send = function(body) {
        const contentType = this.get('Content-Type');
        const isJson = contentType && contentType.includes('application/json');
        
        if (isJson && body && this.statusCode >= 200 && this.statusCode < 300) {
          try {
            const data = typeof body === 'string' ? JSON.parse(body) : body;
            
            if (data.success !== false) {
              logger.debug('Response Data', {
                path: req.path,
                method: req.method,
                status: this.statusCode,
                data: this.statusCode === 200 ? data : undefined
              });
            }
          } catch (error) {
            logger.error('Response logging error:', error.message);
          }
        }
        
        return originalSend.call(this, body);
      };
      
      res.json = function(body) {
        if (body && this.statusCode >= 200 && this.statusCode < 300) {
          if (body.success !== false) {
            logger.debug('Response Data', {
              path: req.path,
              method: req.method,
              status: this.statusCode,
              data: this.statusCode === 200 ? body : undefined
            });
          }
        }
        
        return originalJson.call(this, body);
      };
      
      next();
    };
  }

  errorLogger() {
    return (err, req, res, next) => {
      const clientIp = requestIp.getClientIp(req);
      
      logger.error('Request Error', {
        method: req.method,
        url: req.originalUrl,
        ip: clientIp,
        userId: req.user ? req.user._id : 'anonymous',
        error: err.message,
        stack: config.env === 'development' ? err.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      next(err);
    };
  }

  performanceLogger() {
    return (req, res, next) => {
      const start = process.hrtime();
      const startMemory = process.memoryUsage();
      
      res.on('finish', () => {
        const diff = process.hrtime(start);
        const duration = diff[0] * 1e3 + diff[1] * 1e-6;
        const endMemory = process.memoryUsage();
        
        const memoryDiff = {
          rss: (endMemory.rss - startMemory.rss) / 1024 / 1024,
          heapTotal: (endMemory.heapTotal - startMemory.heapTotal) / 1024 / 1024,
          heapUsed: (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024
        };
        
        if (duration > 1000) {
          logger.warn('Slow Request', {
            path: req.path,
            method: req.method,
            duration: `${duration.toFixed(2)}ms`,
            memoryDiff,
            timestamp: new Date().toISOString()
          });
        } else if (duration > 500) {
          logger.info('Moderate Request', {
            path: req.path,
            method: req.method,
            duration: `${duration.toFixed(2)}ms`,
            timestamp: new Date().toISOString()
          });
        }
        
        if (memoryDiff.heapUsed > 50) {
          logger.warn('High Memory Usage', {
            path: req.path,
            method: req.method,
            memoryUsed: `${memoryDiff.heapUsed.toFixed(2)}MB`,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      next();
    };
  }

  auditLogger() {
    return (req, res, next) => {
      const clientIp = requestIp.getClientIp(req);
      const userId = req.user ? req.user._id : 'anonymous';
      const sensitivePaths = ['/auth', '/password', '/token', '/session'];
      const isSensitive = sensitivePaths.some(path => req.path.includes(path));
      
      res.on('finish', () => {
        const auditData = {
          timestamp: new Date().toISOString(),
          userId,
          ip: clientIp,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          userAgent: req.get('user-agent')
        };
        
        if (isSensitive) {
          logger.audit('Sensitive Action', auditData);
        } else if (req.method !== 'GET') {
          logger.audit('Write Action', auditData);
        }
      });
      
      next();
    };
  }

  getMiddleware() {
    return [
      this.getMorganMiddleware(),
      this.requestLogger(),
      this.responseLogger(),
      this.performanceLogger(),
      this.auditLogger()
    ];
  }

  logDatabaseQuery(query, collection, duration, result) {
    if (duration > 100) {
      logger.warn('Slow Database Query', {
        collection,
        duration: `${duration}ms`,
        query: typeof query === 'string' ? query.substring(0, 200) : JSON.stringify(query).substring(0, 200),
        resultSize: Array.isArray(result) ? result.length : result ? 1 : 0,
        timestamp: new Date().toISOString()
      });
    }
  }

  logExternalApiCall(service, method, url, duration, status, error = null) {
    const logData = {
      service,
      method,
      url,
      duration: `${duration}ms`,
      status,
      timestamp: new Date().toISOString()
    };
    
    if (error) {
      logData.error = error.message;
      logger.error('External API Error', logData);
    } else if (duration > 1000) {
      logger.warn('Slow External API', logData);
    } else if (duration > 500) {
      logger.info('External API Call', logData);
    } else {
      logger.debug('External API Call', logData);
    }
  }
}

const loggerMiddleware = new LoggerMiddleware();
module.exports = loggerMiddleware;
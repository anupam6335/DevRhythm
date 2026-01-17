const morgan = require('morgan');
const logger = require('../utils/logger');
const config = require('../config/environment');

class LoggerMiddleware {
  constructor() {
    this.morganFormat = config.isDevelopment ? 'dev' : 'combined';
    this.morganOptions = {
      stream: {
        write: (message) => logger.http(message.trim())
      }
    };
  }

  getMorganMiddleware() {
    return morgan(this.morganFormat, this.morganOptions);
  }

  requestLogger() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logData = {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          userId: req.user?.id || 'anonymous',
          contentType: req.get('content-type')
        };

        if (res.statusCode >= 400) {
          logger.error('Request failed', logData);
        } else if (res.statusCode >= 300) {
          logger.warn('Request redirected', logData);
        } else {
          logger.info('Request completed', logData);
        }
      });

      next();
    };
  }

  errorLogger() {
    return (err, req, res, next) => {
      logger.error('Request error', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: req.user?.id || 'anonymous',
        body: config.isDevelopment ? req.body : undefined
      });
      next(err);
    };
  }

  auditLogger() {
    return (req, res, next) => {
      const auditData = {
        timestamp: new Date().toISOString(),
        userId: req.user?.id || 'anonymous',
        action: `${req.method} ${req.originalUrl}`,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        params: req.params,
        query: req.query,
        body: this.sanitizeBody(req.body)
      };

      logger.audit('Audit log', auditData);
      next();
    };
  }

  sanitizeBody(body) {
    if (!body || typeof body !== 'object') return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }

  performanceLogger() {
    return (req, res, next) => {
      const start = process.hrtime();
      
      res.on('finish', () => {
        const diff = process.hrtime(start);
        const duration = diff[0] * 1e3 + diff[1] * 1e-6;
        
        if (duration > 1000) {
          logger.warn('Slow request detected', {
            method: req.method,
            url: req.originalUrl,
            duration: `${duration.toFixed(2)}ms`,
            threshold: '1000ms'
          });
        }
        
        logger.debug('Request performance', {
          method: req.method,
          url: req.originalUrl,
          duration: `${duration.toFixed(2)}ms`
        });
      });
      
      next();
    };
  }

  getMiddleware() {
    return {
      morgan: this.getMorganMiddleware(),
      requestLogger: this.requestLogger(),
      errorLogger: this.errorLogger(),
      auditLogger: this.auditLogger(),
      performanceLogger: this.performanceLogger()
    };
  }
}

module.exports = new LoggerMiddleware();
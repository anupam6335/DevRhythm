const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config/environment');

class Logger {
  constructor() {
    this.logDir = path.join(process.cwd(), config.logging.directory);
    this.setupLogDirectory();
    this.logger = this.createLogger();
  }

  setupLogDirectory() {
    if (config.logging.toFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  createLogger() {
    const transports = [
      new winston.transports.Console({
        level: config.logging.level,
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            let metaString = '';
            
            if (Object.keys(meta).length > 0) {
              if (meta.stack) {
                metaString = `\n${meta.stack}`;
              } else {
                try {
                  metaString = ` ${JSON.stringify(meta, null, 2)}`;
                } catch (error) {
                  metaString = ` ${String(meta)}`;
                }
              }
            }
            
            return `${timestamp} [${level}]: ${message}${metaString}`;
          })
        )
      })
    ];

    if (config.logging.toFile) {
      transports.push(
        new winston.transports.File({
          level: 'info',
          filename: path.join(this.logDir, 'combined.log'),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
          maxsize: 5242880,
          maxFiles: 5
        }),
        new winston.transports.File({
          level: 'error',
          filename: path.join(this.logDir, 'error.log'),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
          maxsize: 5242880,
          maxFiles: 5
        }),
        new winston.transports.File({
          level: 'audit',
          filename: path.join(this.logDir, 'audit.log'),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
          maxsize: 5242880,
          maxFiles: 10
        })
      );
    }

    return winston.createLogger({
      levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        audit: 6
      },
      level: config.logging.level,
      transports,
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(this.logDir, 'exceptions.log')
        })
      ],
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(this.logDir, 'rejections.log')
        })
      ],
      exitOnError: false
    });
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  http(message, meta = {}) {
    this.logger.http(message, meta);
  }

  verbose(message, meta = {}) {
    this.logger.verbose(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  audit(message, meta = {}) {
    this.logger.log('audit', message, meta);
  }

  logDatabaseQuery(query, collection, duration, resultSize) {
    if (duration > 100) {
      this.warn('Slow database query', {
        collection,
        duration: `${duration}ms`,
        query: typeof query === 'string' ? query.substring(0, 200) : JSON.stringify(query).substring(0, 200),
        resultSize
      });
    } else if (config.logging.level === 'debug') {
      this.debug('Database query', {
        collection,
        duration: `${duration}ms`,
        resultSize
      });
    }
  }

  logExternalApiCall(service, method, url, duration, status, error = null) {
    const logData = {
      service,
      method,
      url,
      duration: `${duration}ms`,
      status
    };
    
    if (error) {
      logData.error = error.message;
      this.error('External API error', logData);
    } else if (duration > 1000) {
      this.warn('Slow external API', logData);
    } else if (config.logging.level === 'debug') {
      this.debug('External API call', logData);
    }
  }

  logPerformance(operation, duration, meta = {}) {
    if (duration > 1000) {
      this.warn('Slow operation', {
        operation,
        duration: `${duration}ms`,
        ...meta
      });
    } else if (duration > 500 && config.logging.level === 'info') {
      this.info('Moderate operation', {
        operation,
        duration: `${duration}ms`,
        ...meta
      });
    } else if (config.logging.level === 'debug') {
      this.debug('Operation completed', {
        operation,
        duration: `${duration}ms`,
        ...meta
      });
    }
  }

  logSecurityEvent(eventType, userId, ip, details = {}) {
    this.audit('Security event', {
      eventType,
      userId,
      ip,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  logUserAction(userId, action, resourceType, resourceId, details = {}) {
    this.audit('User action', {
      userId,
      action,
      resourceType,
      resourceId,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user ? req.user._id : 'anonymous',
      timestamp: new Date().toISOString()
    };

    if (res.statusCode >= 400) {
      this.warn('Request error', logData);
    } else {
      this.http('Request completed', logData);
    }
  }

  logStartup(service, version, port) {
    this.info(`${service} starting`, {
      version,
      port,
      nodeVersion: process.version,
      pid: process.pid,
      environment: config.env,
      timestamp: new Date().toISOString()
    });
  }

  logShutdown(service, reason) {
    this.info(`${service} shutting down`, {
      reason,
      timestamp: new Date().toISOString()
    });
  }

  logMemoryUsage() {
    const memory = process.memoryUsage();
    this.debug('Memory usage', {
      rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memory.external / 1024 / 1024)}MB`,
      timestamp: new Date().toISOString()
    });
  }

  getLogStats() {
    if (!config.logging.toFile) {
      return { fileLogging: false };
    }

    try {
      const stats = {
        fileLogging: true,
        directory: this.logDir,
        files: []
      };

      const files = fs.readdirSync(this.logDir);
      
      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const fileStats = fs.statSync(filePath);
        
        stats.files.push({
          name: file,
          size: `${Math.round(fileStats.size / 1024)}KB`,
          modified: fileStats.mtime,
          created: fileStats.birthtime
        });
      });

      return stats;
    } catch (error) {
      return { error: error.message };
    }
  }

  rotateLogs() {
    if (!config.logging.toFile) {
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    
    try {
      const files = fs.readdirSync(this.logDir);
      
      files.forEach(file => {
        if (file.endsWith('.log') && !file.includes(dateStr)) {
          const oldPath = path.join(this.logDir, file);
          const newPath = path.join(this.logDir, `${file}.${dateStr}`);
          
          if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
            this.info(`Rotated log file: ${file} -> ${file}.${dateStr}`);
          }
        }
      });
    } catch (error) {
      this.error('Log rotation failed', { error: error.message });
    }
  }

  stream() {
    return {
      write: (message) => {
        this.http(message.trim());
      }
    };
  }
}

const logger = new Logger();

if (config.logging.toFile) {
  setInterval(() => logger.logMemoryUsage(), 5 * 60 * 1000);
  
  setInterval(() => logger.rotateLogs(), 24 * 60 * 60 * 1000);
}

module.exports = logger;
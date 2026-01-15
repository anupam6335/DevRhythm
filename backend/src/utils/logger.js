const winston = require('winston');
const path = require('path');
const config = require('../config/environment');

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
  
  if (stack) {
    log += `\n${stack}`;
  }
  
  if (Object.keys(meta).length > 0) {
    log += `\n${JSON.stringify(meta, null, 2)}`;
  }
  
  return log;
});

const logger = createLogger({
  level: config.LOG_LEVEL,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    config.isDevelopment ? colorize() : format(),
    logFormat
  ),
  transports: []
});

if (config.LOG_TO_FILE) {
  logger.add(new transports.File({
    filename: path.resolve(config.LOG_FILE_PATH),
    maxsize: config.LOG_MAX_SIZE,
    maxFiles: config.LOG_MAX_FILES,
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      logFormat
    )
  }));
}

if (config.isDevelopment) {
  logger.add(new transports.Console({
    format: combine(
      colorize(),
      logFormat
    )
  }));
} else {
  logger.add(new transports.Console({
    format: combine(
      logFormat
    )
  }));
}

logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

logger.audit = (message, meta = {}) => {
  logger.info(`[AUDIT] ${message}`, meta);
};

logger.security = (message, meta = {}) => {
  logger.warn(`[SECURITY] ${message}`, meta);
};

logger.performance = (message, duration, meta = {}) => {
  logger.info(`[PERFORMANCE] ${message} - ${duration}ms`, meta);
};

logger.database = (message, meta = {}) => {
  logger.debug(`[DATABASE] ${message}`, meta);
};

logger.api = (message, meta = {}) => {
  logger.info(`[API] ${message}`, meta);
};

module.exports = logger;
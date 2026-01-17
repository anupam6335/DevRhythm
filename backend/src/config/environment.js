const Joi = require('joi');
const path = require('path');
const fs = require('fs');

// Check if .env file exists
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  console.warn('.env file not found. Using default values or environment variables.');
}

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(5000),
  API_BASE_URL: Joi.string().default('/api/v1'),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:4000'),
  BACKEND_URL: Joi.string().uri().default('http://localhost:5000'),
  
  MONGODB_URI: Joi.string().default('mongodb://localhost:27017/devrhythm'),
  MONGODB_MAX_POOL_SIZE: Joi.number().integer().min(1).default(10),
  MONGODB_MIN_POOL_SIZE: Joi.number().integer().min(1).default(2),
  MONGODB_CONNECTION_TIMEOUT_MS: Joi.number().integer().min(1000).default(30000),
  
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().integer().min(0).default(0),
  
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().optional(),
  
  GITHUB_CLIENT_ID: Joi.string().optional(),
  GITHUB_CLIENT_SECRET: Joi.string().optional(),
  GITHUB_CALLBACK_URL: Joi.string().uri().optional(),
  
  JWT_SECRET: Joi.string().default('dev-jwt-secret-change-in-production'),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().default('dev-jwt-refresh-secret-change-in-production'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  
  SESSION_SECRET: Joi.string().default('dev-session-secret-change-in-production'),
  SESSION_MAX_AGE: Joi.number().integer().min(60000).default(604800000),
  
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(60000).default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().min(1).default(100),
  RATE_LIMIT_TRUST_PROXY: Joi.number().integer().valid(0, 1).default(1),
  
  SMTP_HOST: Joi.string().default('smtp.gmail.com'),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().email().optional(),
  SMTP_PASS: Joi.string().optional(),
  EMAIL_FROM: Joi.string().email().optional(),
  
  MAX_FILE_SIZE: Joi.number().integer().min(1024).default(5242880),
  ALLOWED_FILE_TYPES: Joi.string().default('image/jpeg,image/png,image/gif,application/pdf'),
  
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_TO_FILE: Joi.boolean().default(true),
  LOG_FILE_PATH: Joi.string().default('./logs/app.log'),
  LOG_MAX_SIZE: Joi.number().integer().min(1048576).default(10485760),
  LOG_MAX_FILES: Joi.number().integer().min(1).default(5),
  
  CORS_ORIGIN: Joi.string().default('http://localhost:4000'),
  HELMET_ENABLED: Joi.boolean().default(true),
  XSS_PROTECTION_ENABLED: Joi.boolean().default(true),
  NO_SNIFF_ENABLED: Joi.boolean().default(true),
  HIDE_POWERED_BY: Joi.boolean().default(true),
  HSTS_ENABLED: Joi.boolean().default(true),
  CONTENT_SECURITY_POLICY_ENABLED: Joi.boolean().default(true),
  
  COMPRESSION_ENABLED: Joi.boolean().default(true),
  COMPRESSION_THRESHOLD: Joi.number().integer().min(1).default(1024),
  QUERY_CACHE_ENABLED: Joi.boolean().default(true),
  QUERY_CACHE_TTL: Joi.number().integer().min(1).default(300),
  
  HEALTH_CHECK_PATH: Joi.string().default('/api/v1/health'),
  METRICS_ENABLED: Joi.boolean().default(true),
  METRICS_PATH: Joi.string().default('/api/v1/metrics')
}).unknown(true);

const { error, value: envVars } = envSchema.validate(process.env, {
  abortEarly: false,
  stripUnknown: true
});

if (error) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Environment validation warnings:', error.details.map(d => d.message));
  } else {
    throw new Error(`Environment validation error: ${error.message}`);
  }
}

module.exports = {
  NODE_ENV: envVars.NODE_ENV,
  PORT: envVars.PORT,
  API_BASE_URL: envVars.API_BASE_URL,
  FRONTEND_URL: envVars.FRONTEND_URL,
  BACKEND_URL: envVars.BACKEND_URL,
  
  MONGODB_URI: envVars.MONGODB_URI,
  MONGODB_MAX_POOL_SIZE: envVars.MONGODB_MAX_POOL_SIZE,
  MONGODB_MIN_POOL_SIZE: envVars.MONGODB_MIN_POOL_SIZE,
  MONGODB_CONNECTION_TIMEOUT_MS: envVars.MONGODB_CONNECTION_TIMEOUT_MS,
  
  REDIS_URL: envVars.REDIS_URL,
  REDIS_PASSWORD: envVars.REDIS_PASSWORD,
  REDIS_DB: envVars.REDIS_DB,
  
  GOOGLE_CLIENT_ID: envVars.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: envVars.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: envVars.GOOGLE_CALLBACK_URL,
  
  GITHUB_CLIENT_ID: envVars.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: envVars.GITHUB_CLIENT_SECRET,
  GITHUB_CALLBACK_URL: envVars.GITHUB_CALLBACK_URL,
  
  JWT_SECRET: envVars.JWT_SECRET,
  JWT_EXPIRES_IN: envVars.JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET: envVars.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: envVars.JWT_REFRESH_EXPIRES_IN,
  
  SESSION_SECRET: envVars.SESSION_SECRET,
  SESSION_MAX_AGE: envVars.SESSION_MAX_AGE,
  
  RATE_LIMIT_WINDOW_MS: envVars.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS: envVars.RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_TRUST_PROXY: envVars.RATE_LIMIT_TRUST_PROXY,
  
  SMTP_HOST: envVars.SMTP_HOST,
  SMTP_PORT: envVars.SMTP_PORT,
  SMTP_SECURE: envVars.SMTP_SECURE,
  SMTP_USER: envVars.SMTP_USER,
  SMTP_PASS: envVars.SMTP_PASS,
  EMAIL_FROM: envVars.EMAIL_FROM,
  
  MAX_FILE_SIZE: envVars.MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES: envVars.ALLOWED_FILE_TYPES.split(','),
  
  LOG_LEVEL: envVars.LOG_LEVEL,
  LOG_TO_FILE: envVars.LOG_TO_FILE,
  LOG_FILE_PATH: envVars.LOG_FILE_PATH,
  LOG_MAX_SIZE: envVars.LOG_MAX_SIZE,
  LOG_MAX_FILES: envVars.LOG_MAX_FILES,
  
  CORS_ORIGIN: envVars.CORS_ORIGIN,
  HELMET_ENABLED: envVars.HELMET_ENABLED,
  XSS_PROTECTION_ENABLED: envVars.XSS_PROTECTION_ENABLED,
  NO_SNIFF_ENABLED: envVars.NO_SNIFF_ENABLED,
  HIDE_POWERED_BY: envVars.HIDE_POWERED_BY,
  HSTS_ENABLED: envVars.HSTS_ENABLED,
  CONTENT_SECURITY_POLICY_ENABLED: envVars.CONTENT_SECURITY_POLICY_ENABLED,
  
  COMPRESSION_ENABLED: envVars.COMPRESSION_ENABLED,
  COMPRESSION_THRESHOLD: envVars.COMPRESSION_THRESHOLD,
  QUERY_CACHE_ENABLED: envVars.QUERY_CACHE_ENABLED,
  QUERY_CACHE_TTL: envVars.QUERY_CACHE_TTL,
  
  HEALTH_CHECK_PATH: envVars.HEALTH_CHECK_PATH,
  METRICS_ENABLED: envVars.METRICS_ENABLED,
  METRICS_PATH: envVars.METRICS_PATH,
  
  isDevelopment: envVars.NODE_ENV === 'development',
  isProduction: envVars.NODE_ENV === 'production',
  isTest: envVars.NODE_ENV === 'test'
};
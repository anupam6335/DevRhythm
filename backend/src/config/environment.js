const Joi = require('joi');

const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),
  FRONTEND_PORT: Joi.number().default(4000),
  API_VERSION: Joi.string().default('v1'),
  API_BASE_URL: Joi.string().default('/api/v1'),
  
  MONGODB_URI: Joi.string().required().description('MongoDB connection string'),
  MONGODB_POOL_SIZE: Joi.number().default(10),
  MONGODB_RETRY_WRITES: Joi.boolean().default(true),
  MONGODB_MAX_IDLE_TIME: Joi.number().default(60000),
  MONGODB_SERVER_SELECTION_TIMEOUT: Joi.number().default(5000),
  MONGODB_SOCKET_TIMEOUT: Joi.number().default(45000),
  
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow(''),
  REDIS_DB: Joi.number().default(0),
  REDIS_ENABLED: Joi.boolean().default(false),
  
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().required(),
  
  GITHUB_CLIENT_ID: Joi.string().required(),
  GITHUB_CLIENT_SECRET: Joi.string().required(),
  GITHUB_CALLBACK_URL: Joi.string().required(),
  
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  
  SESSION_SECRET: Joi.string().required(),
  SESSION_MAX_AGE: Joi.number().default(7 * 24 * 60 * 60 * 1000),
  
  CORS_ORIGIN: Joi.string().required(),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  
  SMTP_HOST: Joi.string(),
  SMTP_PORT: Joi.number(),
  SMTP_SECURE: Joi.boolean(),
  SMTP_USER: Joi.string(),
  SMTP_PASSWORD: Joi.string(),
  EMAIL_FROM: Joi.string(),
  
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_TO_FILE: Joi.boolean().default(false),
  LOG_DIRECTORY: Joi.string().default('logs'),
  
  SENTRY_DSN: Joi.string().allow(''),
  NEW_RELIC_LICENSE_KEY: Joi.string().allow(''),
  
  FEATURE_NOTIFICATIONS_ENABLED: Joi.boolean().default(true),
  FEATURE_KNOWLEDGE_GRAPH_ENABLED: Joi.boolean().default(true),
  FEATURE_ANALYTICS_ENABLED: Joi.boolean().default(true),
  FEATURE_STUDY_PLANS_ENABLED: Joi.boolean().default(true)
}).unknown().required();

const { value: envVars, error } = envVarsSchema.validate(process.env);

if (error) throw new Error(`Config validation error: ${error.message}`);

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  frontendPort: envVars.FRONTEND_PORT,
  api: {
    version: envVars.API_VERSION,
    baseUrl: envVars.API_BASE_URL
  },
  
  mongodb: {
    uri: envVars.MONGODB_URI,
    options: {
      maxPoolSize: envVars.MONGODB_POOL_SIZE,
      retryWrites: envVars.MONGODB_RETRY_WRITES,
      maxIdleTimeMS: envVars.MONGODB_MAX_IDLE_TIME,
      serverSelectionTimeoutMS: envVars.MONGODB_SERVER_SELECTION_TIMEOUT,
      socketTimeoutMS: envVars.MONGODB_SOCKET_TIMEOUT
    }
  },
  
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
    db: envVars.REDIS_DB,
    enabled: envVars.REDIS_ENABLED
  },
  
  oauth: {
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      callbackUrl: envVars.GOOGLE_CALLBACK_URL
    },
    github: {
      clientId: envVars.GITHUB_CLIENT_ID,
      clientSecret: envVars.GITHUB_CLIENT_SECRET,
      callbackUrl: envVars.GITHUB_CALLBACK_URL
    }
  },
  
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN
  },
  
  session: {
    secret: envVars.SESSION_SECRET,
    maxAge: envVars.SESSION_MAX_AGE
  },
  
  security: {
    corsOrigin: envVars.CORS_ORIGIN,
    rateLimit: {
      windowMs: envVars.RATE_LIMIT_WINDOW_MS,
      maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS
    }
  },
  
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      secure: envVars.SMTP_SECURE,
      auth: {
        user: envVars.SMTP_USER,
        pass: envVars.SMTP_PASSWORD
      }
    },
    from: envVars.EMAIL_FROM
  },
  
  logging: {
    level: envVars.LOG_LEVEL,
    toFile: envVars.LOG_TO_FILE,
    directory: envVars.LOG_DIRECTORY
  },
  
  monitoring: {
    sentryDsn: envVars.SENTRY_DSN,
    newRelicKey: envVars.NEW_RELIC_LICENSE_KEY
  },
  
  features: {
    notifications: envVars.FEATURE_NOTIFICATIONS_ENABLED,
    knowledgeGraph: envVars.FEATURE_KNOWLEDGE_GRAPH_ENABLED,
    analytics: envVars.FEATURE_ANALYTICS_ENABLED,
    studyPlans: envVars.FEATURE_STUDY_PLANS_ENABLED
  }
};

if (config.env === 'development') {
  console.log('Environment configuration loaded:', {
    env: config.env,
    port: config.port,
    mongodb: { uri: config.mongodb.uri.substring(0, 50) + '...' },
    features: config.features
  });
}

module.exports = config;
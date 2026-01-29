const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  isProduction: process.env.NODE_ENV === 'production',
  apiBaseUrl: process.env.API_BASE_URL || '/api/v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4000',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  
  database: {
    uri: process.env.MONGODB_URI,
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 500,
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 2,
    connectionTimeoutMs: parseInt(process.env.MONGODB_CONNECTION_TIMEOUT_MS) || 50000
  },
  
  redis: {
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0
  },
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackUrl: process.env.GITHUB_CALLBACK_URL
    }
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  
  session: {
    secret: process.env.SESSION_SECRET,
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 604800000
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    trustProxy: parseInt(process.env.RATE_LIMIT_TRUST_PROXY) || 1
  }
};
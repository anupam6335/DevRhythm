const cors = require('cors');
const config = require('../config/environment');
const logger = require('../utils/logger');

class CorsMiddleware {
  constructor() {
    this.corsOptions = {
      origin: (origin, callback) => {
        const allowedOrigins = [
          config.FRONTEND_URL,
          'http://localhost:4000',,
          'https://devrhythm.app',
          'https://www.devrhythm.app'
        ];

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // In development, also allow any localhost origin
        if (config.isDevelopment) {
          const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]):[0-9]+$/i.test(origin);
          if (isLocalhost) {
            logger.debug(`Allowing localhost origin in development: ${origin}`);
            return callback(null, true);
          }
        }

        logger.warn(`CORS blocked origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'X-Access-Token',
        'X-Refresh-Token',
        'X-Client-Version',
        'X-Timezone'
      ],
      exposedHeaders: [
        'X-Access-Token',
        'X-Refresh-Token',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset'
      ],
      maxAge: 86400,
      preflightContinue: false,
      optionsSuccessStatus: 204
    };
  }

  middleware() {
    return cors(this.corsOptions);
  }

  preflight() {
    return (req, res, next) => {
      if (req.method === 'OPTIONS') {
        // Dynamically set the origin based on the request
        const origin = req.headers.origin;
        const allowedOrigins = [
          config.FRONTEND_URL,
          'http://localhost:4000',
        ];

        if (origin && allowedOrigins.includes(origin)) {
          res.header('Access-Control-Allow-Origin', origin);
        } else if (config.isDevelopment && origin && /^https?:\/\/localhost/.test(origin)) {
          res.header('Access-Control-Allow-Origin', origin);
        } else {
          res.header('Access-Control-Allow-Origin', config.FRONTEND_URL);
        }

        res.header('Access-Control-Allow-Methods', this.corsOptions.methods.join(','));
        res.header('Access-Control-Allow-Headers', this.corsOptions.allowedHeaders.join(','));
        res.header('Access-Control-Max-Age', this.corsOptions.maxAge);
        res.header('Access-Control-Allow-Credentials', 'true');
        return res.status(204).send();
      }
      next();
    };
  }

  strict() {
    return cors({
      origin: [config.FRONTEND_URL, 'http://localhost:4000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    });
  }

  getMiddleware() {
    return {
      standard: this.middleware(),
      preflight: this.preflight(),
      strict: this.strict()
    };
  }
}

module.exports = new CorsMiddleware();
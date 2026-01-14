const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const constants = require('../config/constants');
const { User } = require('../models');
const logger = require('../utils/logger');
const apiResponse = require('../utils/apiResponse');

class AuthMiddleware {
  constructor() {
    this.authenticate = this.authenticate.bind(this);
    this.authorize = this.authorize.bind(this);
    this.optionalAuth = this.optionalAuth.bind(this);
    this.validateOAuthState = this.validateOAuthState.bind(this);
  }

  authenticate(strategy, options = {}) {
    return (req, res, next) => {
      if (strategy === 'jwt') {
        return passport.authenticate('jwt', { session: false, ...options })(req, res, next);
      }
      
      return passport.authenticate(strategy, { session: false, ...options })(req, res, next);
    };
  }

  authorize(roles = []) {
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return apiResponse.unauthorized(res, 'Authentication required');
        }

        const user = await User.findById(req.user._id);
        
        if (!user) {
          return apiResponse.unauthorized(res, 'User not found');
        }

        if (!user.isActive) {
          return apiResponse.forbidden(res, 'User account is inactive');
        }

        req.currentUser = user;
        next();
      } catch (error) {
        logger.error(`Authorization error: ${error.message}`);
        return apiResponse.serverError(res, 'Authorization failed');
      }
    };
  }

  optionalAuth() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          req.user = null;
          return next();
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, config.jwt.secret, {
          issuer: 'devrhythm',
          audience: 'devrhythm-users',
          algorithms: ['HS256']
        });

        const user = await User.findById(decoded.sub);
        
        if (user && user.isActive) {
          req.user = user;
          req.currentUser = user;
        } else {
          req.user = null;
        }

        next();
      } catch (error) {
        req.user = null;
        next();
      }
    };
  }

  validateOAuthState() {
    return (req, res, next) => {
      if (!req.query.state) {
        return apiResponse.badRequest(res, 'Missing OAuth state parameter');
      }

      try {
        const state = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
        
        if (!state.nonce || !state.redirectUrl) {
          return apiResponse.badRequest(res, 'Invalid OAuth state');
        }

        const currentTime = Date.now();
        if (currentTime - state.timestamp > 10 * 60 * 1000) {
          return apiResponse.badRequest(res, 'OAuth state expired');
        }

        req.oauthState = state;
        next();
      } catch (error) {
        logger.error(`OAuth state validation error: ${error.message}`);
        return apiResponse.badRequest(res, 'Invalid OAuth state');
      }
    };
  }

  checkResourceOwnership(modelName, idParam = 'id', userIdField = 'userId') {
    return async (req, res, next) => {
      try {
        const Model = require(`../models/${modelName}.model`);
        const resourceId = req.params[idParam];
        
        if (!resourceId) {
          return apiResponse.badRequest(res, 'Resource ID required');
        }

        const resource = await Model.findOne({
          _id: resourceId,
          isActive: true
        });

        if (!resource) {
          return apiResponse.notFound(res, 'Resource not found');
        }

        if (resource[userIdField].toString() !== req.user._id.toString()) {
          return apiResponse.forbidden(res, 'You do not have permission to access this resource');
        }

        req.resource = resource;
        next();
      } catch (error) {
        logger.error(`Resource ownership check error: ${error.message}`);
        
        if (error.name === 'CastError') {
          return apiResponse.badRequest(res, 'Invalid resource ID');
        }
        
        return apiResponse.serverError(res, 'Resource access check failed');
      }
    };
  }

  requireOnboarding(step = null) {
    return async (req, res, next) => {
      try {
        const user = await User.findById(req.user._id);
        
        if (!user.onboardingCompleted) {
          if (step !== null && user.onboardingStep < step) {
            return apiResponse.forbidden(res, 'Complete previous onboarding steps first');
          }
        }

        next();
      } catch (error) {
        logger.error(`Onboarding check error: ${error.message}`);
        return apiResponse.serverError(res, 'Onboarding check failed');
      }
    };
  }

  rateLimitByUser() {
    const RateLimiter = require('rate-limiter-flexible').RateLimiter;
    const redisClient = require('../config/redis');
    
    const rateLimiters = new Map();
    
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return next();
        }

        const userId = req.user._id.toString();
        const route = req.path;
        const key = `rate_limit:user:${userId}:${route}`;
        
        let limiter = rateLimiters.get(key);
        
        if (!limiter) {
          limiter = new RateLimiter({
            storeClient: redisClient.client || undefined,
            points: 100,
            duration: 900,
            keyPrefix: key
          });
          
          rateLimiters.set(key, limiter);
        }

        try {
          await limiter.consume(1);
          next();
        } catch (rlRejected) {
          const retryAfter = Math.ceil(rlRejected.msBeforeNext / 1000);
          res.set('Retry-After', String(retryAfter));
          return apiResponse.tooManyRequests(res, 'Too many requests');
        }
      } catch (error) {
        logger.error(`Rate limit error: ${error.message}`);
        next();
      }
    };
  }

  validateApiKey() {
    return async (req, res, next) => {
      const apiKey = req.headers['x-api-key'];
      
      if (!apiKey) {
        return apiResponse.unauthorized(res, 'API key required');
      }

      try {
        const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];
        
        if (!validApiKeys.includes(apiKey)) {
          return apiResponse.unauthorized(res, 'Invalid API key');
        }

        next();
      } catch (error) {
        logger.error(`API key validation error: ${error.message}`);
        return apiResponse.serverError(res, 'API key validation failed');
      }
    };
  }

  checkFeatureFlag(featureName) {
    return (req, res, next) => {
      const config = require('../config/environment');
      
      if (!config.features[featureName]) {
        return apiResponse.notFound(res, `Feature ${featureName} is not enabled`);
      }

      next();
    };
  }
}

const authMiddleware = new AuthMiddleware();
module.exports = authMiddleware;
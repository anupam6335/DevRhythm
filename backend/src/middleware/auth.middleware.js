const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const constants = require('../config/constants');
const apiResponse = require('../utils/apiResponse');

class AuthMiddleware {
  constructor() {
    this.generateTokens = this.generateTokens.bind(this);
    this.verifyToken = this.verifyToken.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.requireAuth = this.requireAuth.bind(this);
    this.optionalAuth = this.optionalAuth.bind(this);
    this.checkRole = this.checkRole.bind(this);
    this.checkOwnership = this.checkOwnership.bind(this);
  }

  generateTokens(user) {
    const accessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        type: constants.AUTH.TOKEN_TYPES.ACCESS
      },
      config.JWT_SECRET,
      {
        expiresIn: config.JWT_EXPIRES_IN,
        issuer: config.BACKEND_URL,
        audience: config.FRONTEND_URL
      }
    );

    const refreshToken = jwt.sign(
      {
        userId: user._id,
        type: constants.AUTH.TOKEN_TYPES.REFRESH
      },
      config.JWT_REFRESH_SECRET,
      {
        expiresIn: config.JWT_REFRESH_EXPIRES_IN,
        issuer: config.BACKEND_URL,
        audience: config.FRONTEND_URL
      }
    );

    return { accessToken, refreshToken };
  }

  verifyToken(token, type = constants.AUTH.TOKEN_TYPES.ACCESS) {
    try {
      const secret = type === constants.AUTH.TOKEN_TYPES.ACCESS 
        ? config.JWT_SECRET 
        : config.JWT_REFRESH_SECRET;
      
      const decoded = jwt.verify(token, secret, {
        issuer: config.BACKEND_URL,
        audience: config.FRONTEND_URL
      });

      if (decoded.type !== type) {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  refreshToken(refreshToken) {
    try {
      const decoded = this.verifyToken(refreshToken, constants.AUTH.TOKEN_TYPES.REFRESH);
      const newAccessToken = jwt.sign(
        {
          userId: decoded.userId,
          email: decoded.email,
          type: constants.AUTH.TOKEN_TYPES.ACCESS
        },
        config.JWT_SECRET,
        {
          expiresIn: config.JWT_EXPIRES_IN,
          issuer: config.BACKEND_URL,
          audience: config.FRONTEND_URL
        }
      );

      return { accessToken: newAccessToken };
    } catch (error) {
      throw error;
    }
  }

  requireAuth(req, res, next) {
    const token = this.extractToken(req);
    
    if (!token) {
      return apiResponse.error(res, {
        message: 'Authentication required',
        code: constants.ERROR_CODES.AUTH_ERROR,
        statusCode: constants.HTTP_STATUS.UNAUTHORIZED
      });
    }

    try {
      const decoded = this.verifyToken(token);
      req.user = { id: decoded.userId, email: decoded.email };
      next();
    } catch (error) {
      return apiResponse.error(res, {
        message: error.message,
        code: constants.ERROR_CODES.AUTH_ERROR,
        statusCode: constants.HTTP_STATUS.UNAUTHORIZED
      });
    }
  }

  optionalAuth(req, res, next) {
    const token = this.extractToken(req);
    
    if (token) {
      try {
        const decoded = this.verifyToken(token);
        req.user = { id: decoded.userId, email: decoded.email };
      } catch (error) {
      }
    }
    
    next();
  }

  checkRole(allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return apiResponse.error(res, {
          message: 'Authentication required',
          code: constants.ERROR_CODES.AUTH_ERROR,
          statusCode: constants.HTTP_STATUS.UNAUTHORIZED
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return apiResponse.error(res, {
          message: 'Insufficient permissions',
          code: constants.ERROR_CODES.AUTH_ERROR,
          statusCode: constants.HTTP_STATUS.FORBIDDEN
        });
      }

      next();
    };
  }

  checkOwnership(modelName, idField = 'userId') {
    return async (req, res, next) => {
      if (!req.user) {
        return apiResponse.error(res, {
          message: 'Authentication required',
          code: constants.ERROR_CODES.AUTH_ERROR,
          statusCode: constants.HTTP_STATUS.UNAUTHORIZED
        });
      }

      try {
        const model = require(`../models/${modelName}.model`);
        const resourceId = req.params.id || req.body.id;
        
        if (!resourceId) {
          return apiResponse.error(res, {
            message: 'Resource ID required',
            code: constants.ERROR_CODES.VALIDATION_ERROR,
            statusCode: constants.HTTP_STATUS.BAD_REQUEST
          });
        }

        const resource = await model.findOne({
          _id: resourceId,
          [idField]: req.user.id,
          isActive: true
        });

        if (!resource) {
          return apiResponse.error(res, {
            message: 'Resource not found or access denied',
            code: constants.ERROR_CODES.NOT_FOUND_ERROR,
            statusCode: constants.HTTP_STATUS.NOT_FOUND
          });
        }

        req.resource = resource;
        next();
      } catch (error) {
        return apiResponse.error(res, {
          message: 'Error checking ownership',
          code: constants.ERROR_CODES.SERVER_ERROR,
          statusCode: constants.HTTP_STATUS.INTERNAL_SERVER_ERROR,
          error: config.isDevelopment ? error.message : undefined
        });
      }
    };
  }

  extractToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    if (req.query.token) {
      return req.query.token;
    }
    if (req.cookies && req.cookies.token) {
      return req.cookies.token;
    }
    return null;
  }

  setTokenCookie(res, token) {
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'strict',
      maxAge: config.SESSION_MAX_AGE
    });
  }

  clearTokenCookie(res) {
    res.clearCookie('token');
  }
}

module.exports = new AuthMiddleware();
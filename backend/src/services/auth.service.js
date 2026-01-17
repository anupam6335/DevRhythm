const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const constants = require('../config/constants');
const { User } = require('../models');
const logger = require('../utils/logger');

class AuthService {
  constructor() {
    this.tokenBlacklist = new Set();
  }

  generateTokens(user) {
    const accessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        type: constants.AUTH.TOKEN_TYPES.ACCESS,
        provider: user.provider,
      },
      config.JWT_SECRET,
      {
        expiresIn: config.JWT_EXPIRES_IN,
        issuer: config.BACKEND_URL,
        audience: config.FRONTEND_URL,
      }
    );

    const refreshToken = jwt.sign(
      {
        userId: user._id,
        type: constants.AUTH.TOKEN_TYPES.REFRESH,
      },
      config.JWT_REFRESH_SECRET,
      {
        expiresIn: config.JWT_REFRESH_EXPIRES_IN,
        issuer: config.BACKEND_URL,
        audience: config.FRONTEND_URL,
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
        audience: config.FRONTEND_URL,
      });

      if (decoded.type !== type) {
        throw new Error('Invalid token type');
      }

      if (this.tokenBlacklist.has(token)) {
        throw new Error('Token blacklisted');
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

  async refreshAccessToken(refreshToken) {
    try {
      const decoded = this.verifyToken(refreshToken, constants.AUTH.TOKEN_TYPES.REFRESH);
      
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      const newAccessToken = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          type: constants.AUTH.TOKEN_TYPES.ACCESS,
          provider: user.provider,
        },
        config.JWT_SECRET,
        {
          expiresIn: config.JWT_EXPIRES_IN,
          issuer: config.BACKEND_URL,
          audience: config.FRONTEND_URL,
        }
      );

      return { accessToken: newAccessToken, user };
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  async logout(userId, token, allDevices = false) {
    try {
      if (token) {
        this.tokenBlacklist.add(token);
      }

      if (allDevices) {
        const user = await User.findById(userId);
        if (user) {
          user.sessions = [];
          await user.save();
        }
        
        this.clearAllUserTokens(userId);
      }

      return true;
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }

  clearAllUserTokens(userId) {
    const prefix = `blacklist:${userId}:`;
    const now = Date.now();
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    for (const [token, expiry] of this.tokenBlacklist.entries()) {
      if (expiry < oneMonthAgo) {
        this.tokenBlacklist.delete(token);
      }
    }
  }

  async validateSession(userId, sessionId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        return false;
      }

      const session = user.sessions.find(s => s.sessionId === sessionId);
      if (!session) {
        return false;
      }

      if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        return false;
      }

      session.lastActive = new Date();
      await user.save();

      return true;
    } catch (error) {
      logger.error('Session validation failed:', error);
      return false;
    }
  }

  async getActiveSessions(userId) {
    try {
      const user = await User.findById(userId).select('sessions');
      if (!user) {
        return [];
      }

      const now = new Date();
      return user.sessions.filter(session => 
        !session.expiresAt || new Date(session.expiresAt) > now
      );
    } catch (error) {
      logger.error('Failed to get active sessions:', error);
      return [];
    }
  }

  async terminateSession(userId, sessionId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const sessionIndex = user.sessions.findIndex(s => s.sessionId === sessionId);
      if (sessionIndex === -1) {
        throw new Error('Session not found');
      }

      user.sessions.splice(sessionIndex, 1);
      await user.save();

      return true;
    } catch (error) {
      logger.error('Failed to terminate session:', error);
      throw error;
    }
  }

  async checkAuthStatus(userId) {
    try {
      const user = await User.findById(userId).select('isActive lastLogin sessions');
      if (!user || !user.isActive) {
        return { isAuthenticated: false };
      }

      const hasActiveSession = user.sessions.some(session => {
        if (session.expiresAt) {
          return new Date(session.expiresAt) > new Date();
        }
        return true;
      });

      return {
        isAuthenticated: hasActiveSession,
        lastLogin: user.lastLogin,
        sessionCount: user.sessions.length,
      };
    } catch (error) {
      logger.error('Auth status check failed:', error);
      return { isAuthenticated: false };
    }
  }
}

module.exports = new AuthService();
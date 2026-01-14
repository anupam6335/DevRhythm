const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const config = require('./environment');
const logger = require('../utils/logger');
const { User } = require('../models');

class PassportConfig {
  constructor() {
    this.strategies = new Map();
    this.initialize();
  }

  initialize() {
    passport.serializeUser((user, done) => {
      done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
      try {
        const user = await User.findById(id);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });

    this.setupGoogleStrategy();
    this.setupGitHubStrategy();
    this.setupJwtStrategy();
  }

  setupGoogleStrategy() {
    const strategy = new GoogleStrategy(
      {
        clientID: config.oauth.google.clientId,
        clientSecret: config.oauth.google.clientSecret,
        callbackURL: config.oauth.google.callbackUrl,
        scope: ['profile', 'email'],
        state: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          await this.handleOAuthCallback('google', profile, done);
        } catch (error) {
          logger.error(`Google OAuth error: ${error.message}`);
          done(error, null);
        }
      }
    );

    passport.use('google', strategy);
    this.strategies.set('google', strategy);
    logger.debug('Google OAuth strategy configured');
  }

  setupGitHubStrategy() {
    const strategy = new GitHubStrategy(
      {
        clientID: config.oauth.github.clientId,
        clientSecret: config.oauth.github.clientSecret,
        callbackURL: config.oauth.github.callbackUrl,
        scope: ['user:email'],
        state: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          await this.handleOAuthCallback('github', profile, done);
        } catch (error) {
          logger.error(`GitHub OAuth error: ${error.message}`);
          done(error, null);
        }
      }
    );

    passport.use('github', strategy);
    this.strategies.set('github', strategy);
    logger.debug('GitHub OAuth strategy configured');
  }

  setupJwtStrategy() {
    const jwtOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.jwt.secret,
      issuer: 'devrhythm',
      audience: 'devrhythm-users',
      algorithms: ['HS256'],
      ignoreExpiration: false,
      passReqToCallback: false
    };

    const strategy = new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
      try {
        const user = await User.findById(jwtPayload.sub);
        
        if (!user) {
          return done(null, false, { message: 'User not found' });
        }

        if (!user.isActive) {
          return done(null, false, { message: 'User account is inactive' });
        }

        return done(null, user);
      } catch (error) {
        logger.error(`JWT authentication error: ${error.message}`);
        return done(error, false);
      }
    });

    passport.use('jwt', strategy);
    this.strategies.set('jwt', strategy);
    logger.debug('JWT strategy configured');
  }

  async handleOAuthCallback(provider, profile, done) {
    try {
      const email = this.extractEmail(profile, provider);
      const oauthId = profile.id;
      
      if (!email) {
        return done(new Error('Email is required but not provided by OAuth provider'), null);
      }

      let user = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { oauthId, provider }
        ]
      });

      const userData = this.extractUserData(profile, provider, email);

      if (user) {
        if (user.provider !== provider) {
          return done(new Error(`Account already exists with ${user.provider} OAuth`), null);
        }

        if (user.oauthId !== oauthId) {
          return done(new Error('OAuth ID mismatch'), null);
        }

        user = await this.updateExistingUser(user, userData);
      } else {
        user = await this.createNewUser(userData, provider, oauthId);
      }

      await user.updateLastLogin({
        sessionId: `oauth-${provider}-${Date.now()}`,
        deviceInfo: 'OAuth Login'
      });

      logger.info(`User ${user.email} logged in via ${provider}`);
      return done(null, user);
    } catch (error) {
      logger.error(`OAuth callback error for ${provider}: ${error.message}`);
      return done(error, null);
    }
  }

  extractEmail(profile, provider) {
    if (provider === 'google') {
      return profile.emails?.[0]?.value || null;
    } else if (provider === 'github') {
      if (profile.emails && profile.emails.length > 0) {
        return profile.emails.find(email => email.primary)?.value || profile.emails[0].value;
      }
      return profile._json?.email || null;
    }
    return null;
  }

  extractUserData(profile, provider, email) {
    const baseData = {
      email: email.toLowerCase(),
      name: profile.displayName || profile.username || 'User',
      avatar: this.extractAvatar(profile, provider),
      locale: profile._json?.locale || 'en',
      timezone: 'UTC'
    };

    if (provider === 'google') {
      baseData.avatar = profile.photos?.[0]?.value;
      baseData.locale = profile._json?.locale || 'en';
    } else if (provider === 'github') {
      baseData.avatar = profile._json?.avatar_url;
      baseData.name = profile._json?.name || profile.username;
    }

    return baseData;
  }

  extractAvatar(profile, provider) {
    if (provider === 'google') {
      return profile.photos?.[0]?.value?.replace('=s96-c', '=s400-c');
    } else if (provider === 'github') {
      return profile._json?.avatar_url;
    }
    return null;
  }

  async updateExistingUser(user, userData) {
    const updates = {};
    
    if (userData.name && user.name !== userData.name) {
      updates.name = userData.name;
    }
    
    if (userData.avatar && user.avatar !== userData.avatar) {
      updates.avatar = userData.avatar;
    }
    
    if (Object.keys(updates).length > 0) {
      Object.assign(user, updates);
      await user.save();
      logger.debug(`Updated user ${user.email} profile from OAuth`);
    }
    
    return user;
  }

  async createNewUser(userData, provider, oauthId) {
    const user = new User({
      ...userData,
      oauthId,
      provider,
      firstLoginDate: new Date(),
      onboardingCompleted: false,
      onboardingStep: 0
    });

    await user.save();
    logger.info(`Created new user ${user.email} via ${provider} OAuth`);
    
    return user;
  }

  getStrategy(name) {
    return this.strategies.get(name);
  }

  getMiddleware() {
    return passport.initialize();
  }

  getSessionMiddleware() {
    return passport.session();
  }

  authenticate(strategy, options = {}) {
    return passport.authenticate(strategy, options);
  }

  authenticateJWT(options = {}) {
    return passport.authenticate('jwt', { session: false, ...options });
  }

  generateJWT(user) {
    const jwt = require('jsonwebtoken');
    const config = require('./environment');
    
    const payload = {
      sub: user._id,
      email: user.email,
      name: user.name,
      provider: user.provider,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };

    return jwt.sign(payload, config.jwt.secret, {
      issuer: 'devrhythm',
      audience: 'devrhythm-users',
      algorithm: 'HS256'
    });
  }

  generateRefreshToken(user) {
    const jwt = require('jsonwebtoken');
    const config = require('./environment');
    
    const payload = {
      sub: user._id,
      tokenType: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: 'devrhythm',
      audience: 'devrhythm-users',
      algorithm: 'HS256'
    });
  }

  verifyRefreshToken(token) {
    const jwt = require('jsonwebtoken');
    const config = require('./environment');
    
    try {
      return jwt.verify(token, config.jwt.refreshSecret, {
        issuer: 'devrhythm',
        audience: 'devrhythm-users',
        algorithms: ['HS256']
      });
    } catch (error) {
      logger.error(`Refresh token verification failed: ${error.message}`);
      return null;
    }
  }

  decodeJWT(token) {
    const jwt = require('jsonwebtoken');
    
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error(`JWT decoding failed: ${error.message}`);
      return null;
    }
  }
}

const passportConfig = new PassportConfig();
module.exports = passportConfig;
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const config = require('./environment');
const constants = require('./constants');
const { User } = require('../models');

class PassportConfig {
  constructor() {
    this.passport = passport;
    this.strategies = {};
  }

  initialize() {
    this.setupGoogleStrategy();
    this.setupGitHubStrategy();
    this.setupJwtStrategy();
    
    this.passport.serializeUser((user, done) => {
      done(null, user.id);
    });

    this.passport.deserializeUser(async (id, done) => {
      try {
        const user = await User.findById(id);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });

    return this.passport.initialize();
  }

  setupGoogleStrategy() {
    const googleOptions = {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
      passReqToCallback: false
    };

    const googleVerify = async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }

        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
          if (existingUser.provider !== constants.AUTH.PROVIDERS.GOOGLE) {
            return done(new Error('Account exists with different provider'), null);
          }
          existingUser.lastLogin = new Date();
          existingUser.loginCount += 1;
          await existingUser.save();
          return done(null, existingUser);
        }

        const newUser = new User({
          oauthId: profile.id,
          provider: constants.AUTH.PROVIDERS.GOOGLE,
          email: email,
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value,
          locale: profile._json.locale,
          firstLoginDate: new Date(),
          lastLogin: new Date(),
          loginCount: 1
        });

        await newUser.save();
        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    };

    this.strategies.google = new GoogleStrategy(googleOptions, googleVerify);
    this.passport.use('google', this.strategies.google);
  }

  setupGitHubStrategy() {
    const githubOptions = {
      clientID: config.GITHUB_CLIENT_ID,
      clientSecret: config.GITHUB_CLIENT_SECRET,
      callbackURL: config.GITHUB_CALLBACK_URL,
      scope: ['user:email'],
      passReqToCallback: false
    };

    const githubVerify = async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || `${profile.username}@github.user`;
        
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
          if (existingUser.provider !== constants.AUTH.PROVIDERS.GITHUB) {
            return done(new Error('Account exists with different provider'), null);
          }
          existingUser.lastLogin = new Date();
          existingUser.loginCount += 1;
          await existingUser.save();
          return done(null, existingUser);
        }

        const newUser = new User({
          oauthId: profile.id,
          provider: constants.AUTH.PROVIDERS.GITHUB,
          email: email,
          name: profile.displayName || profile.username,
          avatar: profile.photos?.[0]?.value,
          firstLoginDate: new Date(),
          lastLogin: new Date(),
          loginCount: 1
        });

        await newUser.save();
        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    };

    this.strategies.github = new GitHubStrategy(githubOptions, githubVerify);
    this.passport.use('github', this.strategies.github);
  }

  setupJwtStrategy() {
    const jwtOptions = {
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token'),
        (req) => req.cookies?.token
      ]),
      secretOrKey: config.JWT_SECRET,
      issuer: config.BACKEND_URL,
      audience: config.FRONTEND_URL,
      passReqToCallback: true
    };

    const jwtVerify = async (req, jwtPayload, done) => {
      try {
        if (jwtPayload.type !== constants.AUTH.TOKEN_TYPES.ACCESS) {
          return done(new Error('Invalid token type'), null);
        }

        const user = await User.findById(jwtPayload.userId);
        if (!user || !user.isActive) {
          return done(new Error('User not found or inactive'), null);
        }

        req.user = user;
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    };

    this.strategies.jwt = new JwtStrategy(jwtOptions, jwtVerify);
    this.passport.use('jwt', this.strategies.jwt);
  }

  getPassport() {
    return this.passport;
  }

  authenticate(strategy, options = {}) {
    return this.passport.authenticate(strategy, options);
  }

  authenticateJWT() {
    return this.passport.authenticate('jwt', { session: false });
  }
}

module.exports = new PassportConfig();
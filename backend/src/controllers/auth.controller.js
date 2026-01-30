const passport = require('passport');
const crypto = require('crypto');
const redisClient = require('../config/redis');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { invalidateUserCache } = require('../middleware/cache');
const { formatResponse } = require('../utils/helpers/response');
const config = require('../config');

const initiateOAuth = (provider) => (req, res, next) => {
  const state = crypto.randomBytes(32).toString('hex');
  const redirectUri = req.query.redirect_uri || config.frontendUrl;
  
  // Store the frontend redirect URI with state
  redisClient.setEx(`devrhythm:auth:${provider}:state:${state}`, 300, redirectUri);
  
  const authParams = {
    state,
    callbackURL: config.oauth[provider].callbackUrl,
    scope: provider === 'google' ? ['profile', 'email'] : ['user:email', 'read:user']
  };
  
  // Use passport authenticate
  passport.authenticate(provider, authParams)(req, res, next);
};

const handleOAuthCallback = (provider) => (req, res, next) => {
  passport.authenticate(provider, { session: false }, async (err, user, info) => {
    try {
      if (err || !user) {
        console.error('OAuth error:', err || info);
        // Redirect to frontend with error
        const redirectUri = await redisClient.get(`devrhythm:auth:${provider}:state:${req.query.state}`);
        const frontendUrl = redirectUri || config.frontendUrl;
        return res.redirect(`${frontendUrl}?error=${encodeURIComponent(info?.message || 'Authentication failed')}`);
      }
      
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      
      // Get the stored frontend redirect URI
      const redirectUri = await redisClient.get(`devrhythm:auth:${provider}:state:${req.query.state}`);
      await redisClient.del(`devrhythm:auth:${provider}:state:${req.query.state}`);
      
      // Ensure we have a valid redirect URI
      let frontendUrl;
      if (redirectUri && (redirectUri.startsWith('http://') || redirectUri.startsWith('https://'))) {
        frontendUrl = redirectUri;
      } else {
        frontendUrl = config.frontendUrl;
      }
      
      // IMPORTANT: Redirect to frontend with tokens in URL
      const redirectUrl = new URL(frontendUrl);
      redirectUrl.searchParams.set('token', token);
      redirectUrl.searchParams.set('refreshToken', refreshToken);
      redirectUrl.searchParams.set('userId', user._id.toString());
      
      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${config.frontendUrl}?error=${encodeURIComponent('Internal server error')}`);
    }
  })(req, res, next);
};

const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await invalidateUserCache(req.user._id);
    }
    req.logout(() => {
      res.json(formatResponse('Logged out successfully'));
    });
  } catch (error) {
    next(error);
  }
};

const validateSession = async (req, res, next) => {
  try {
    res.json(formatResponse('Session is valid', {
      session: {
        userId: req.user._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isValid: true
      }
    }));
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = generateToken(req.user._id);
    const refreshToken = generateRefreshToken(req.user._id);
    
    res.json(formatResponse('Session refreshed successfully', {
      session: {
        token,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    }));
  } catch (error) {
    next(error);
  }
};

const getProviders = async (req, res, next) => {
  try {
    const providers = [
      {
        id: 'google',
        name: 'Google',
        authUrl: `${config.backendUrl}/api/v1/auth/google`,
        scopes: ['profile', 'email']
      },
      {
        id: 'github',
        name: 'GitHub',
        authUrl: `${config.backendUrl}/api/v1/auth/github`,
        scopes: ['user:email', 'read:user']
      }
    ];
    
    res.json(formatResponse('Available providers retrieved', { providers }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiateGoogleOAuth: initiateOAuth('google'),
  handleGoogleCallback: handleOAuthCallback('google'),
  initiateGitHubOAuth: initiateOAuth('github'),
  handleGitHubCallback: handleOAuthCallback('github'),
  logout,
  validateSession,
  refreshToken,
  getProviders
};
const passport = require('passport');
const crypto = require('crypto');
const { client: redisClient } = require('../config/redis');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { invalidateUserCache } = require('../middleware/cache');
const { formatResponse } = require('../utils/helpers/response');
const config = require('../config');
const AppError = require('../utils/errors/AppError'); // <-- ADD THIS LINE

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
        return res.redirect(`${config.frontendUrl}/auth/callback?error=${encodeURIComponent(info?.message || 'Authentication failed')}`);
      }
      
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      
      // Generate a one-time code
      const code = crypto.randomBytes(32).toString('hex');
      const codeKey = `devrhythm:auth:code:${code}`;
      
      // Store tokens in Redis with 5 minute TTL
      await redisClient.setEx(codeKey, 300, JSON.stringify({
        userId: user._id.toString(),
        token,
        refreshToken
      }));
      
      // Redirect to frontend with only the code
      const redirectUrl = new URL(`${config.frontendUrl}/auth/callback`);
      redirectUrl.searchParams.set('code', code);
      
      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${config.frontendUrl}/auth/callback?error=${encodeURIComponent('Internal server error')}`);
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

const exchangeCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      throw new AppError('Code is required', 400);
    }
    
    const codeKey = `devrhythm:auth:code:${code}`;
    const stored = await redisClient.get(codeKey);
    if (!stored) {
      throw new AppError('Invalid or expired code', 401);
    }
    
    // Delete code immediately to prevent replay
    await redisClient.del(codeKey);
    
    const { userId, token, refreshToken } = JSON.parse(stored);
    
    // Optionally set a secure HTTP‑only cookie for server‑side auth
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json(formatResponse('Code exchanged successfully', {
      token,
      refreshToken,
      userId
    }));
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
  getProviders,
  exchangeCode,
};
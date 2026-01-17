const ApiResponse = require('../utils/apiResponse');
const AuthService = require('../services/auth.service');
const OAuthService = require('../services/oauth.service');
const UserService = require('../services/user.service');
const OnboardingService = require('../services/onboarding.service');
const config = require('../config/environment');
const constants = require('../config/constants');
const logger = require('../utils/logger');

class AuthController {
  async googleAuth(req, res, next) {
    try {
      const state = req.query.state || 'default';
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${config.GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(config.GOOGLE_CALLBACK_URL)}&` +
        `response_type=code&` +
        `scope=profile%20email&` +
        `state=${encodeURIComponent(state)}&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      return ApiResponse.success(res, { authUrl }, 'Redirect to Google OAuth');
    } catch (error) {
      logger.error('Google auth initiation failed:', error);
      return ApiResponse.error(res, {
        message: 'Failed to initiate Google OAuth',
        error,
      });
    }
  }

  async googleCallback(req, res, next) {
    try {
      const { code, state } = req.query;

      if (!code) {
        logger.warn('No authorization code provided in Google callback');
        return ApiResponse.badRequest(res, 'Authorization code is required');
      }

      let processedCode = code;
      if (code.includes('&#x2F;')) {
        logger.warn('Code contains HTML entities, fixing encoding');
        processedCode = code.replace(/&#x2F;/g, '/');
      }
      
      const deviceInfo = {
        userAgent: req.headers['user-agent'],
        platform: req.headers['sec-ch-ua-platform'],
        timezone: req.headers['x-timezone'],
      };

      const result = await OAuthService.handleOAuthCallback(
        constants.AUTH.PROVIDERS.GOOGLE,
        processedCode,
        deviceInfo,
        req.ip
      );

      const tokens = AuthService.generateTokens(result.user);
      
      if (result.isNewUser) {
        await OnboardingService.initializeOnboarding(result.user._id);
      }

      const redirectUrl = `${config.FRONTEND_URL}?` +
        `accessToken=${encodeURIComponent(tokens.accessToken)}&` +
        `refreshToken=${encodeURIComponent(tokens.refreshToken)}&` +
        `isNewUser=${result.isNewUser}&` +
        `state=${encodeURIComponent(state || 'default')}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Google OAuth callback failed:', error);
      const errorRedirectUrl = `${config.FRONTEND_URL}/error.html?` +
        `message=${encodeURIComponent(error.message)}&` +
        `code=oauth_failed`;
      return res.redirect(errorRedirectUrl);
    }
  }

  async githubAuth(req, res, next) {
    try {
      const state = req.query.state || 'default';
      const authUrl = `https://github.com/login/oauth/authorize?` +
        `client_id=${config.GITHUB_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(config.GITHUB_CALLBACK_URL)}&` +
        `scope=user:email&` +
        `state=${encodeURIComponent(state)}`;
      
      return ApiResponse.success(res, { authUrl }, 'Redirect to GitHub OAuth');
    } catch (error) {
      logger.error('GitHub auth initiation failed:', error);
      return ApiResponse.error(res, {
        message: 'Failed to initiate GitHub OAuth',
        error,
      });
    }
  }

  async githubCallback(req, res, next) {
    try {
      const { code, state } = req.query;

      if (!code) {
        logger.warn('No authorization code provided in GitHub callback');
        return ApiResponse.badRequest(res, 'Authorization code is required');
      }

      const deviceInfo = {
        userAgent: req.headers['user-agent'],
        platform: req.headers['sec-ch-ua-platform'],
        timezone: req.headers['x-timezone'],
      };

      const result = await OAuthService.handleOAuthCallback(
        constants.AUTH.PROVIDERS.GITHUB,
        code,
        deviceInfo,
        req.ip
      );

      const tokens = AuthService.generateTokens(result.user);
      
      if (result.isNewUser) {
        await OnboardingService.initializeOnboarding(result.user._id);
      }

      const redirectUrl = `${config.FRONTEND_URL}?` +
        `accessToken=${encodeURIComponent(tokens.accessToken)}&` +
        `refreshToken=${encodeURIComponent(tokens.refreshToken)}&` +
        `isNewUser=${result.isNewUser}&` +
        `state=${encodeURIComponent(state || 'default')}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      logger.error('GitHub OAuth callback failed:', error);
      const errorRedirectUrl = `${config.FRONTEND_URL}/error.html?` +
        `message=${encodeURIComponent(error.message)}&` +
        `code=oauth_failed`;
      return res.redirect(errorRedirectUrl);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return ApiResponse.badRequest(res, 'Refresh token is required');
      }

      const result = await AuthService.refreshAccessToken(refreshToken);
      
      return ApiResponse.success(res, {
        accessToken: result.accessToken,
        user: result.user.getPublicProfile(),
      }, 'Token refreshed successfully');
    } catch (error) {
      logger.error('Token refresh failed:', error);
      if (error.message === 'Token expired' || error.message === 'Invalid token') {
        return ApiResponse.unauthorized(res, error.message);
      }
      return ApiResponse.error(res, {
        message: 'Failed to refresh token',
        error,
      });
    }
  }

  async logout(req, res, next) {
    try {
      const { allDevices = false } = req.body;
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      await AuthService.logout(req.user.id, token, allDevices);
      
      return ApiResponse.success(res, null, allDevices ? 'Logged out from all devices' : 'Logged out successfully');
    } catch (error) {
      logger.error('Logout failed:', error);
      return ApiResponse.error(res, {
        message: 'Failed to logout',
        error,
      });
    }
  }

  async getSessionInfo(req, res, next) {
    try {
      const sessions = await AuthService.getActiveSessions(req.user.id);
      
      return ApiResponse.success(res, {
        sessions,
        sessionCount: sessions.length,
        currentSession: req.sessionID,
      }, 'Session information retrieved');
    } catch (error) {
      logger.error('Failed to get session info:', error);
      return ApiResponse.error(res, {
        message: 'Failed to get session information',
        error,
      });
    }
  }

  async terminateSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        return ApiResponse.badRequest(res, 'Session ID is required');
      }

      await AuthService.terminateSession(req.user.id, sessionId);
      
      return ApiResponse.success(res, null, 'Session terminated successfully');
    } catch (error) {
      logger.error('Failed to terminate session:', error);
      return ApiResponse.error(res, {
        message: 'Failed to terminate session',
        error,
      });
    }
  }

  async linkProvider(req, res, next) {
    try {
      const { provider, code } = req.body;
      
      if (!provider || !code) {
        return ApiResponse.badRequest(res, 'Provider and code are required');
      }

      if (![constants.AUTH.PROVIDERS.GOOGLE, constants.AUTH.PROVIDERS.GITHUB].includes(provider)) {
        return ApiResponse.badRequest(res, 'Invalid provider');
      }

      await OAuthService.linkProvider(req.user.id, provider, code);
      
      return ApiResponse.success(res, null, 'Provider linked successfully');
    } catch (error) {
      logger.error('Failed to link provider:', error);
      if (error.message === 'Account exists with different provider') {
        return ApiResponse.conflict(res, error.message);
      }
      return ApiResponse.error(res, {
        message: 'Failed to link provider',
        error,
      });
    }
  }

  async getProviders(req, res, next) {
    try {
      const user = await UserService.getProfile(req.user.id);
      
      return ApiResponse.success(res, {
        currentProvider: user.provider,
        availableProviders: [constants.AUTH.PROVIDERS.GOOGLE, constants.AUTH.PROVIDERS.GITHUB],
        canLink: true,
      }, 'Providers retrieved');
    } catch (error) {
      logger.error('Failed to get providers:', error);
      return ApiResponse.error(res, {
        message: 'Failed to get providers',
        error,
      });
    }
  }

  async checkAuthStatus(req, res, next) {
    try {
      const status = await AuthService.checkAuthStatus(req.user.id);
      
      return ApiResponse.success(res, status, 'Auth status checked');
    } catch (error) {
      logger.error('Failed to check auth status:', error);
      return ApiResponse.error(res, {
        message: 'Failed to check auth status',
        error,
      });
    }
  }
}

module.exports = new AuthController();
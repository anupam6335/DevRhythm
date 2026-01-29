const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');
const { auth } = require('../../middleware/auth');
const rateLimiters = require('../../middleware/rateLimiter');
const { cache } = require('../../middleware/cache');

router.get('/google', rateLimiters.oauthLimiter, authController.initiateGoogleOAuth);
router.get('/google/callback', rateLimiters.oauthLimiter, authController.handleGoogleCallback);
router.get('/github', rateLimiters.oauthLimiter, authController.initiateGitHubOAuth);
router.get('/github/callback', rateLimiters.oauthLimiter, authController.handleGitHubCallback);

router.post('/logout', auth, rateLimiters.logoutLimiter, authController.logout);
router.get('/session', auth, rateLimiters.tokenLimiter, authController.validateSession);
router.post('/refresh', auth, rateLimiters.tokenLimiter, authController.refreshToken);
router.get('/providers', cache(3600, 'auth:providers'), authController.getProviders);

module.exports = router;
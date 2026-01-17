const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const authValidator = require('../validators/auth.validator');
const middleware = require('../middleware');
const config = require('../config/environment');

router.get('/google', middleware.wrap(authController.googleAuth));
router.get('/google/callback', middleware.wrap(authController.googleCallback));

router.get('/github', middleware.wrap(authController.githubAuth));
router.get('/github/callback', middleware.wrap(authController.githubCallback));

router.post('/refresh', 
  authValidator.validateRefreshToken,
  middleware.wrap(authController.refreshToken)
);

router.post('/logout',
  middleware.requireAuth,
  authValidator.validateLogout,
  middleware.wrap(authController.logout)
);

router.get('/session',
  middleware.requireAuth,
  middleware.wrap(authController.getSessionInfo)
);

router.delete('/session/:sessionId',
  middleware.requireAuth,
  middleware.wrap(authController.terminateSession)
);

router.post('/provider/link',
  middleware.requireAuth,
  authValidator.validateProviderLink,
  middleware.wrap(authController.linkProvider)
);

router.get('/providers',
  middleware.requireAuth,
  middleware.wrap(authController.getProviders)
);

router.get('/status',
  middleware.optionalAuth,
  middleware.wrap(authController.checkAuthStatus)
);

module.exports = router;
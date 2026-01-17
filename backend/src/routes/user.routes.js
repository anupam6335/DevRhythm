const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const userValidator = require('../validators/user.validator');
const middleware = require('../middleware');

router.get('/me',
  middleware.requireAuth,
  middleware.wrap(userController.getCurrentUser)
);

router.patch('/me',
  middleware.requireAuth,
  userValidator.validateUpdateProfile,
  middleware.wrap(userController.updateProfile)
);

router.get('/me/preferences',
  middleware.requireAuth,
  middleware.wrap(userController.getPreferences)
);

router.patch('/me/preferences',
  middleware.requireAuth,
  middleware.wrap(userController.updatePreferences)
);

router.post('/me/onboarding',
  middleware.requireAuth,
  userValidator.validateOnboarding,
  middleware.wrap(userController.updateOnboarding)
);

router.get('/me/onboarding',
  middleware.requireAuth,
  middleware.wrap(userController.getOnboardingStatus)
);

router.get('/me/sessions',
  middleware.requireAuth,
  middleware.wrap(userController.getSessions)
);

router.delete('/me/sessions/:sessionId',
  middleware.requireAuth,
  middleware.wrap(userController.removeSession)
);

router.post('/me/export',
  middleware.requireAuth,
  userValidator.validateExportData,
  middleware.wrap(userController.exportData)
);

router.delete('/me',
  middleware.requireAuth,
  middleware.wrap(userController.deleteAccount)
);

router.get('/me/stats',
  middleware.requireAuth,
  middleware.wrap(userController.getStats)
);

router.patch('/me/stats',
  middleware.requireAuth,
  middleware.wrap(userController.updateStats)
);

router.get('/me/streak',
  middleware.requireAuth,
  middleware.wrap(userController.getStreak)
);

router.patch('/me/streak',
  middleware.requireAuth,
  middleware.wrap(userController.updateStreak)
);

router.get('/me/notifications/preferences',
  middleware.requireAuth,
  middleware.wrap(userController.getNotificationPreferences)
);

router.patch('/me/notifications/preferences',
  middleware.requireAuth,
  middleware.wrap(userController.updateNotificationPreferences)
);

router.get('/me/learning-goals',
  middleware.requireAuth,
  middleware.wrap(userController.getLearningGoals)
);

router.patch('/me/learning-goals',
  middleware.requireAuth,
  userValidator.validateUpdateProfile,
  middleware.wrap(userController.updateLearningGoals)
);

router.get('/me/timezone',
  middleware.requireAuth,
  middleware.wrap(userController.getTimezone)
);

router.patch('/me/timezone',
  middleware.requireAuth,
  middleware.wrap(userController.updateTimezone)
);

module.exports = router;
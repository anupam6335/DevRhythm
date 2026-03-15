const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const followController = require('../../controllers/follow.controller');
const heatmapController = require('../../controllers/heatmap.controller');   
const studyGroupController = require('../../controllers/studyGroup.controller');
const { getUserPatternMastery } = require('../../controllers/patternMastery.controller');
const { auth, optionalAuth } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const userValidator = require('../../utils/validators/user.validator');
const rateLimiters = require('../../middleware/rateLimiter');
const { cache } = require('../../middleware/cache');
const Joi = require('joi');   

router.get('/me', auth, userController.getCurrentUser);
router.put('/me', auth, validate(userValidator.updateUser), userController.updateCurrentUser);
router.get('/me/stats', auth, userController.getUserStats);
router.put('/me/last-online', auth, userController.updateLastOnline);
router.delete('/me', auth, userController.deleteCurrentUser);

router.get('/search', auth, rateLimiters.userLimiter, validate(userValidator.searchUsers, 'query'), cache(300, 'user:search'), userController.searchUsers);
router.get('/top/streaks', auth, rateLimiters.userLimiter, validate(userValidator.topUsers, 'query'), cache(300, 'user:top:streaks'), userController.getTopStreaks);
router.get('/top/solved', auth, rateLimiters.userLimiter, validate(userValidator.topUsers, 'query'), cache(300, 'user:top:solved'), userController.getTopSolved);

router.get('/:userId/following', auth, rateLimiters.userLimiter, validate(userValidator.getPublicFollowing, 'params'), cache(300, 'user:public:following'), followController.getPublicFollowing);
router.get('/:userId/followers', auth, rateLimiters.userLimiter, validate(userValidator.getPublicFollowing, 'params'), cache(300, 'user:public:followers'), followController.getPublicFollowers);

router.get('/:userId/progress', validate(userValidator.getUserPublicProgress, 'params'), cache(30, 'user:public:progress'), userController.getUserPublicProgress);

router.get('/:userId/heatmap/:year',
  rateLimiters.publicLimiter,
  cache(300, 'user:heatmap:public'),
  validate(Joi.object({
    userId: Joi.string().hex().length(24).required(),
    year: Joi.number().integer().min(2000).max(2100).required()
  }), 'params'),
  heatmapController.getPublicUserHeatmap
);

router.get('/:userId/groups',
  rateLimiters.publicLimiter,
  validate(Joi.object({ userId: Joi.string().hex().length(24).required() }), 'params'),
  validate(Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(20).default(5),
    sortBy: Joi.string().valid('lastActivityAt', 'createdAt', 'name').default('lastActivityAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }), 'query'),
  studyGroupController.getUserPublicGroups
);

router.get('/:username', validate(userValidator.getUserByUsername, 'params'), cache(600, 'user:public'), userController.getUserByUsername);
router.get('/:username/availability', validate(userValidator.checkUsername, 'params'), cache(300, 'username:availability'), userController.checkUsernameAvailability);
router.get('/:userId/pattern-mastery', optionalAuth, getUserPatternMastery);

module.exports = router;
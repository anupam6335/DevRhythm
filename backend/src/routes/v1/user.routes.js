const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const followController = require('../../controllers/follow.controller');
const { auth } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const userValidator = require('../../utils/validators/user.validator');
const rateLimiters = require('../../middleware/rateLimiter');
const { cache } = require('../../middleware/cache');

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

router.get('/:username', auth, validate(userValidator.getUserByUsername, 'params'), cache(600, 'user:public'), userController.getUserByUsername);
router.get('/:username/availability', validate(userValidator.checkUsername, 'params'), cache(300, 'username:availability'), userController.checkUsernameAvailability);

module.exports = router;
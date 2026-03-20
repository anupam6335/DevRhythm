const express = require('express');
const router = express.Router();
const followController = require('../../controllers/follow.controller');
const { auth } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const userValidator = require('../../utils/validators/user.validator');
const rateLimiters = require('../../middleware/rateLimiter');
const { cache } = require('../../middleware/cache');

router.get('/following', auth, rateLimiters.followGetLimiter, cache(60, 'follow:following'), followController.getFollowing);
router.get('/followers', auth, rateLimiters.followGetLimiter, cache(60, 'follow:followers'), followController.getFollowers);
router.post('/:userId', auth, rateLimiters.followLimiter, validate(userValidator.followUser, 'params'), followController.followUser);
router.delete('/:userId', auth, rateLimiters.unfollowLimiter, validate(userValidator.followUser, 'params'), followController.unfollowUser);
router.get('/:userId/status', auth, rateLimiters.followGetLimiter, validate(userValidator.followUser, 'params'), cache(30, 'follow:status'), followController.getFollowStatus);
router.get('/suggestions', auth, rateLimiters.followGetLimiter, cache(300, 'follow:suggestions'), followController.getSuggestions);
router.get('/mutual/:userId', auth, rateLimiters.followGetLimiter, validate(userValidator.followUser, 'params'), cache(60, 'follow:mutual'), followController.getMutualFollows);
router.get('/stats', auth, rateLimiters.followGetLimiter, cache(60, 'follow:stats'), followController.getStats);

module.exports = router;
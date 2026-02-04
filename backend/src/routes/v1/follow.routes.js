const express = require('express');
const router = express.Router();
const followController = require('../../controllers/follow.controller');
const { auth } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const userValidator = require('../../utils/validators/user.validator');
const rateLimiters = require('../../middleware/rateLimiter');
const { cache } = require('../../middleware/cache');

const followLimiter = rateLimiters.createMemoryLimiter(15 * 60 * 1000, 60);
const getLimiter = rateLimiters.createMemoryLimiter(15 * 60 * 1000, 100);

router.get('/following', auth, getLimiter, cache(60, 'follow:following'), followController.getFollowing);
router.get('/followers', auth, getLimiter, cache(60, 'follow:followers'), followController.getFollowers);
router.post('/:userId', auth, followLimiter, validate(userValidator.followUser, 'params'), followController.followUser);
router.delete('/:userId', auth, followLimiter, validate(userValidator.followUser, 'params'), followController.unfollowUser);
router.get('/:userId/status', auth, getLimiter, validate(userValidator.followUser, 'params'), cache(30, 'follow:status'), followController.getFollowStatus);
router.get('/suggestions', auth, getLimiter, cache(300, 'follow:suggestions'), followController.getSuggestions);
router.get('/mutual/:userId', auth, getLimiter, validate(userValidator.followUser, 'params'), cache(60, 'follow:mutual'), followController.getMutualFollows);
router.get('/stats', auth, getLimiter, cache(60, 'follow:stats'), followController.getStats);

module.exports = router;
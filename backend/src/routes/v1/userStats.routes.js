const express = require('express');
const router = express.Router();
const userStatsController = require('../../controllers/userStats.controller');
const { auth } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const Joi = require('joi');
const { cache } = require('../../middleware/cache');
const rateLimiters = require('../../middleware/rateLimiter');

router.get('/me',
  auth,
  rateLimiters.userLimiter,
  cache(60, { privacy: 'private', maxAge: 60, keyPrefix: 'user-stats:me' }),
  userStatsController.getUserDetailedStats
);

router.get('/public/:userId',
  auth,
  rateLimiters.userLimiter,
  cache(300, { privacy: 'private', maxAge: 300, keyPrefix: 'user-stats:public' }),
  validate(Joi.object({ userId: Joi.string().hex().length(24).required() }), 'params'),
  userStatsController.getPublicUserStats
);

module.exports = router;
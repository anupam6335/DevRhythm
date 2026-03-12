const express = require('express');
const router = express.Router();
const leaderboardController = require('../../controllers/leaderboard.controller');
const { auth } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const Joi = require('joi');
const { cache } = require('../../middleware/cache');
const rateLimiters = require('../../middleware/rateLimiter');

const leaderboardParams = Joi.object({
  type: Joi.string().valid('weekly', 'monthly').required()
});

const leaderboardQuery = Joi.object({
  date: Joi.date().iso(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

router.get('/:type',
  auth,
  rateLimiters.leaderboardLimiter,
  cache(300, 'leaderboard'),
  validate(leaderboardParams, 'params'),
  validate(leaderboardQuery, 'query'),
  leaderboardController.getLeaderboard
);

router.get('/:type/my-rank',
  auth,
  rateLimiters.leaderboardLimiter,
  cache(60, 'leaderboard:my-rank'),
  validate(leaderboardParams, 'params'),
  validate(Joi.object({ date: Joi.date().iso() }), 'query'),
  leaderboardController.getUserRank
);

router.post('/:type/refresh',
  auth,
  rateLimiters.createMemoryLimiter(60 * 60 * 1000, 5),
  validate(leaderboardParams, 'params'),
  validate(Joi.object({ date: Joi.date().iso() }), 'query'),
  leaderboardController.refreshLeaderboard
);

module.exports = router;
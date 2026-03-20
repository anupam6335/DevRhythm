const express = require('express');
const router = express.Router();
const progressSnapshotController = require('../../controllers/progressSnapshot.controller');
const { auth } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const Joi = require('joi');
const { cache } = require('../../middleware/cache');
const rateLimiters = require('../../middleware/rateLimiter');

const getSnapshotsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  period: Joi.string().valid('daily', 'weekly', 'monthly'),
  startDate: Joi.date(),
  endDate: Joi.date()
});

const refreshSchema = Joi.object({
  period: Joi.string().valid('daily', 'weekly', 'monthly').required()
});

router.get('/',
  auth,
  rateLimiters.progressSnapshotLimiter,
  cache(60, 'progress-snapshots:list'),
  validate(getSnapshotsSchema, 'query'),
  progressSnapshotController.getSnapshots
);

router.get('/latest/:period',
  auth,
  rateLimiters.progressSnapshotLimiter,
  cache(60, 'progress-snapshots:latest'),
  validate(Joi.object({ period: Joi.string().valid('daily', 'weekly', 'monthly').required() }), 'params'),
  progressSnapshotController.getLatestSnapshot
);

router.post('/refresh',
  auth,
  rateLimiters.createRedisLimiter(60 * 60 * 1000, 5, 'snapshot:refresh'), // custom
  validate(refreshSchema),
  progressSnapshotController.refreshSnapshot
);

module.exports = router;
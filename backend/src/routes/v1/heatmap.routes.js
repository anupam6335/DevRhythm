const express = require('express');
const router = express.Router();
const heatmapController = require('../../controllers/heatmap.controller');
const { auth } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const Joi = require('joi');
const { cache } = require('../../middleware/cache');
const rateLimiters = require('../../middleware/rateLimiter');

const heatmapLimiter = rateLimiters.createMemoryLimiter(60 * 60 * 1000, 100);
const refreshLimiter = rateLimiters.createMemoryLimiter(60 * 60 * 1000, 10);
const exportLimiter = rateLimiters.createMemoryLimiter(60 * 60 * 1000, 5);
const statsLimiter = rateLimiters.createMemoryLimiter(60 * 60 * 1000, 150);
const filterLimiter = rateLimiters.createMemoryLimiter(60 * 60 * 1000, 100);

router.get('/', 
  auth, 
  heatmapLimiter,
  cache(15 * 60, 'heatmap:current'),
  validate(Joi.object({
    year: Joi.number().integer().min(2000).max(2100).optional(),
    includeCache: Joi.boolean().default(true)
  }), 'query'),
  heatmapController.getHeatmap
);

router.get('/stats', 
  auth, 
  statsLimiter,
  cache(10 * 60, 'heatmap:stats'),
  validate(Joi.object({
    year: Joi.number().integer().min(2000).max(2100).optional()
  }), 'query'),
  heatmapController.getHeatmapStats
);

router.get('/filter', 
  auth, 
  filterLimiter,
  cache(15 * 60, 'heatmap:filter'),
  validate(Joi.object({
    year: Joi.number().integer().min(2000).max(2100).optional(),
    viewType: Joi.string().valid(
      'all', 'new_problems', 'revisions', 'study_group',
      'leetcode', 'hackerrank', 'codeforces', 'easy', 'medium', 'hard'
    ).required(),
    weekStart: Joi.number().integer().min(1).max(53).optional(),
    weekEnd: Joi.number().integer().min(1).max(53).optional()
  }), 'query'),
  heatmapController.getFilteredHeatmap
);

router.get('/:year', 
  auth, 
  heatmapLimiter,
  cache(15 * 60, 'heatmap:year'),
  validate(Joi.object({
    year: Joi.number().integer().min(2000).max(2100).required()
  }), 'params'),
  validate(Joi.object({
    includeCache: Joi.boolean().default(true)
  }), 'query'),
  heatmapController.getHeatmapByYear
);

router.post('/refresh', 
  auth, 
  refreshLimiter,
  validate(Joi.object({
    year: Joi.number().integer().min(2000).max(2100).optional(),
    forceFullRefresh: Joi.boolean().default(false)
  }), 'body'),
  heatmapController.refreshHeatmap
);

router.post('/export', 
  auth, 
  exportLimiter,
  validate(Joi.object({
    year: Joi.number().integer().min(2000).max(2100).optional(),
    format: Joi.string().valid('json', 'csv').default('json'),
    includeDetails: Joi.boolean().default(false)
  }), 'body'),
  heatmapController.exportHeatmap
);

router.get('/export/:exportId', 
  auth,
  validate(Joi.object({
    exportId: Joi.string().required()
  }), 'params'),
  validate(Joi.object({
    format: Joi.string().valid('json', 'csv').default('json')
  }), 'query'),
  heatmapController.downloadExport
);

module.exports = router;
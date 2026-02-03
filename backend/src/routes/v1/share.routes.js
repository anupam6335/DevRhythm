const express = require('express');
const router = express.Router();
const shareController = require('../../controllers/share.controller');
const { auth, optionalAuth } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const { cache } = require('../../middleware/cache');
const rateLimiters = require('../../middleware/rateLimiter');
const Joi = require('joi');

const getShares = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  shareType: Joi.string().valid('profile', 'period'),
  periodType: Joi.string().valid('day', 'week', 'month', 'custom'),
  privacy: Joi.string().valid('public', 'private', 'link-only'),
  startDate: Joi.date(),
  endDate: Joi.date(),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'accessCount', 'startDate').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

const getShareById = Joi.object({
  id: Joi.string().hex().length(24).required()
});

const createShare = Joi.object({
  shareType: Joi.string().valid('profile', 'period').required(),
  periodType: Joi.string().valid('day', 'week', 'month', 'custom').when('shareType', {
    is: 'period',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  startDate: Joi.date().when('shareType', {
    is: 'period',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  endDate: Joi.date().when('shareType', {
    is: 'period',
    then: Joi.date().required().greater(Joi.ref('startDate')),
    otherwise: Joi.date().optional()
  }),
  customPeriodName: Joi.string().max(100),
  privacy: Joi.string().valid('public', 'private', 'link-only').default('link-only'),
  expiresInDays: Joi.number().integer().min(1).max(365).default(30),
  includeQuestions: Joi.boolean().default(true),
  questionLimit: Joi.number().integer().min(1).max(100).default(50)
});

const updateShare = Joi.object({
  privacy: Joi.string().valid('public', 'private', 'link-only'),
  expiresInDays: Joi.number().integer().min(1).max(365),
  customPeriodName: Joi.string().max(100)
});

const getShareByToken = Joi.object({
  token: Joi.string().required()
});

const getUserPublicShares = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  shareType: Joi.string().valid('profile', 'period'),
  periodType: Joi.string().valid('day', 'week', 'month', 'custom')
});

const refreshShare = Joi.object({
  includeQuestions: Joi.boolean().default(true),
  questionLimit: Joi.number().integer().min(1).max(100).default(50)
});

const resetShareToken = Joi.object({
  id: Joi.string().hex().length(24).required()
});

router.get('/', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 100), cache(60, 'shares:list'), validate(getShares, 'query'), shareController.getShares);
router.get('/stats', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 100), cache(300, 'shares:stats'), shareController.getShareStats);
router.get('/:id', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 100), cache(60, 'share'), validate(getShareById, 'params'), shareController.getShareById);
router.post('/', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 50), validate(createShare), shareController.createShare);
router.put('/:id', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 50), validate(updateShare), shareController.updateShare);
router.delete('/:id', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 50), validate(getShareById, 'params'), shareController.deleteShare);
router.get('/token/:token', optionalAuth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 100), cache(60, 'share:token'), validate(getShareByToken, 'params'), shareController.getShareByToken);
router.get('/user/:username', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 100), cache(300, 'shares:user:public'), validate(getUserPublicShares, 'params'), shareController.getUserPublicShares);
router.post('/:id/refresh', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 50), validate(refreshShare), shareController.refreshShare);
router.post('/:id/reset-token', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 50), validate(resetShareToken, 'params'), shareController.resetShareToken);

module.exports = router;
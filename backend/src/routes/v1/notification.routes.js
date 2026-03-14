const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/notification.controller');
const { auth } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const Joi = require('joi');
const { cache } = require('../../middleware/cache');
const rateLimiters = require('../../middleware/rateLimiter');

const getNotificationsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  unreadOnly: Joi.boolean().default(false),
  type: Joi.string().valid(
    'revision_reminder_daily', 'revision_reminder_urgent', 'goal_completion',
    'streak_reminder', 'new_follower', 'weekly_report'
  )
});

const markMultipleSchema = Joi.object({
  notificationIds: Joi.array().items(Joi.string().hex().length(24)).min(1).required()
});

router.get('/',
  auth,
  rateLimiters.notificationReadLimiter,
  cache(30, { privacy: 'private', maxAge: 30, keyPrefix: 'notifications:list' }),
  validate(getNotificationsSchema, 'query'),
  notificationController.getNotifications
);

router.get('/unread-count',
  auth,
  rateLimiters.notificationReadLimiter,
  cache(30, { privacy: 'private', maxAge: 30, keyPrefix: 'notifications:unread' }),
  notificationController.getUnreadCount
);

router.patch('/:notificationId/read',
  auth,
  rateLimiters.notificationReadLimiter,
  validate(Joi.object({ notificationId: Joi.string().hex().length(24).required() }), 'params'),
  notificationController.markAsRead
);

router.post('/read-multiple',
  auth,
  rateLimiters.notificationReadLimiter,
  validate(markMultipleSchema),
  notificationController.markMultipleAsRead
);

router.post('/read-all',
  auth,
  rateLimiters.notificationReadLimiter,
  notificationController.markAllAsRead
);

router.delete('/:notificationId',
  auth,
  rateLimiters.notificationReadLimiter,
  validate(Joi.object({ notificationId: Joi.string().hex().length(24).required() }), 'params'),
  notificationController.deleteNotification
);

module.exports = router;
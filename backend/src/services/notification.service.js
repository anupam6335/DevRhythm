const Notification = require('../models/Notification');
const { invalidateCache } = require('../middleware/cache');
const { invalidateDashboardCache } = require('../middleware/cache');   // NEW LINE

/**
 * Create an in-app notification.
 */
const createNotification = async ({ userId, type, title, message, data = {}, channel = 'in-app', scheduledAt = new Date() }) => {
  const status = channel === 'in-app' ? 'sent' : 'pending';
  const notification = await Notification.create({
    userId,
    type,
    title,
    message,
    data,
    channel,
    status,
    scheduledAt
  });

  await invalidateCache(`notifications:${userId}:*`);
  await invalidateDashboardCache(userId); 
  return notification;
};

/**
 * Send bulk notifications (creates notifications only, all in-app).
 */
const sendBulkNotifications = async (userIds, notificationData) => {
  const notifications = userIds.map(userId => ({
    userId,
    ...notificationData,
    channel: 'in-app',
    status: 'sent',
    scheduledAt: new Date()
  }));

  const inserted = await Notification.insertMany(notifications);

  for (const userId of userIds) {
    await invalidateCache(`notifications:${userId}:*`);
    await invalidateDashboardCache(userId);
  }

  return inserted;
};

module.exports = {
  createNotification,
  sendBulkNotifications,
};
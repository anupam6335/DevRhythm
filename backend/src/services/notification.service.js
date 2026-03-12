const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('./email.service');
const { invalidateCache } = require('../middleware/cache');

/**
 * Create an in-app notification and optionally send email
 * @param {Object} data - { userId, type, title, message, data, channel, scheduledAt }
 * @returns {Promise<Notification>}
 */
const createNotification = async ({ userId, type, title, message, data = {}, channel = 'in-app', scheduledAt = new Date() }) => {
  const notification = await Notification.create({
    userId,
    type,
    title,
    message,
    data,
    channel,
    status: channel === 'email' ? 'pending' : 'sent',
    scheduledAt
  });

  await invalidateCache(`notifications:${userId}:*`);

  // If channel includes email, trigger email sending (async, don't wait)
  if (channel === 'both' || channel === 'email') {
    sendNotificationEmail(userId, notification).catch(err => console.error('Email sending failed:', err));
  }

  return notification;
};

/**
 * Send email for a notification (used by queue or direct)
 */
const sendNotificationEmail = async (userId, notification) => {
  const user = await User.findById(userId).select('email displayName preferences');
  if (!user || !user.email || !user.preferences?.notifications?.email) return;

  let subject = notification.title;
  let html = `<p>${notification.message}</p>`;

  // Customize based on type if needed
  if (notification.type === 'revision_reminder_daily') {
    html = `<p>You have pending revisions for today. Check your dashboard to stay on track.</p>`;
  } else if (notification.type === 'goal_completion') {
    html = `<p>${notification.message} Great job!</p>`;
  }

  await sendEmail({
    to: user.email,
    subject,
    html
  });

  // Update notification status
  notification.status = 'sent';
  notification.sentAt = new Date();
  await notification.save();
};

/**
 * Send bulk notifications (e.g., to all users)
 */
const sendBulkNotifications = async (userIds, notificationData) => {
  const notifications = userIds.map(userId => ({
    userId,
    ...notificationData,
    status: notificationData.channel === 'email' ? 'pending' : 'sent',
    scheduledAt: new Date()
  }));

  const inserted = await Notification.insertMany(notifications);

  // Invalidate cache for each user
  for (const userId of userIds) {
    await invalidateCache(`notifications:${userId}:*`);
  }

  // Trigger emails if needed
  if (notificationData.channel === 'both' || notificationData.channel === 'email') {
    for (const notif of inserted) {
      sendNotificationEmail(notif.userId, notif).catch(err => console.error('Bulk email failed:', err));
    }
  }

  return inserted;
};

module.exports = {
  createNotification,
  sendNotificationEmail,
  sendBulkNotifications
};
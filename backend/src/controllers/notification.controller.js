const Notification = require('../models/Notification');
const { formatResponse } = require('../utils/helpers/response');
const { getPaginationParams, paginate } = require('../utils/helpers/pagination');
const AppError = require('../utils/errors/AppError');
const { invalidateCache, invalidateDashboardCache } = require('../middleware/cache');

/**
 * Get notifications for the authenticated user
 */
const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { unreadOnly, type } = req.query;
    const query = { userId: req.user._id };
    if (unreadOnly === 'true') query.readAt = null;
    if (type) query.type = type;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query)
    ]);

    const unreadCount = unreadOnly !== 'true' ? await Notification.countDocuments({ userId: req.user._id, readAt: null }) : undefined;

    res.json(formatResponse('Notifications retrieved', { notifications, unreadCount }, { pagination: paginate(total, page, limit) }));
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a specific notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user._id },
      { readAt: new Date() },
      { new: true }
    );
    if (!notification) throw new AppError('Notification not found', 404);

    await invalidateCache(`notifications:${req.user._id}:*`);
    await invalidateDashboardCache(req.user._id);
    res.json(formatResponse('Notification marked as read', { notification }));
  } catch (error) {
    next(error);
  }
};

/**
 * Mark multiple notifications as read
 */
const markMultipleAsRead = async (req, res, next) => {
  try {
    const { notificationIds } = req.body;
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      throw new AppError('notificationIds must be a non-empty array', 400);
    }

    const result = await Notification.updateMany(
      { _id: { $in: notificationIds }, userId: req.user._id, readAt: null },
      { readAt: new Date() }
    );

    await invalidateCache(`notifications:${req.user._id}:*`);
    await invalidateDashboardCache(req.user._id);
    res.json(formatResponse(`${result.modifiedCount} notifications marked as read`));
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, readAt: null },
      { readAt: new Date() }
    );

    await invalidateCache(`notifications:${req.user._id}:*`);
    await invalidateDashboardCache(req.user._id);
    res.json(formatResponse(`All ${result.modifiedCount} notifications marked as read`));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndDelete({ _id: notificationId, userId: req.user._id });
    if (!notification) throw new AppError('Notification not found', 404);

    await invalidateCache(`notifications:${req.user._id}:*`);
    await invalidateDashboardCache(req.user._id);
    res.json(formatResponse('Notification deleted'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread count only
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, readAt: null });
    res.json(formatResponse('Unread count retrieved', { unreadCount: count }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};
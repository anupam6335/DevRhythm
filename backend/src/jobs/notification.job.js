const cron = require('cron');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Follow = require('../models/Follow');

/**
 * Create daily revision reminder notifications for users who have enabled them.
 * These notifications are marked for both in-app and email (pending).
 */
const sendDailyRevisionReminders = async () => {
  try {
    const users = await User.find({
      'preferences.notifications.revisionReminders': true,
      isActive: true
    }).select('_id');

    for (const user of users) {
      // In a real implementation, you might want to count actual pending revisions
      // and include that count in the notification data.
      await Notification.create({
        userId: user._id,
        type: 'revision_reminder_daily',
        title: 'Daily Revision Reminder',
        message: 'Check your pending revisions for today',
        data: { revisionCount: 0, overdueCount: 0 },
        channel: 'in-app',
        status: 'sent',
        scheduledAt: new Date()
      });
    }

    console.log(`Daily revision reminders queued for ${users.length} users`);
  } catch (error) {
    console.error('Daily revision reminders job failed:', error);
  }
};

/**
 * Create weekly report notifications for users who have enabled them.
 */
const sendWeeklyReports = async () => {
  try {
    const users = await User.find({
      'preferences.notifications.weeklyReports': true,
      isActive: true
    }).select('_id');

    for (const user of users) {
      await Notification.create({
        userId: user._id,
        type: 'weekly_report',
        title: 'Weekly Progress Report',
        message: 'Your weekly progress report is ready',
        data: {},
        channel: 'in-app',
        status: 'sent',
        scheduledAt: new Date()
      });
    }

    console.log(`Weekly reports queued for ${users.length} users`);
  } catch (error) {
    console.error('Weekly reports job failed:', error);
  }
};

/**
 * Create new follower notifications for users who have been followed in the last 24 hours.
 */
const sendNewFollowerNotifications = async () => {
  try {
    const follows = await Follow.find({
      isActive: true,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      notificationSent: { $exists: false }
    }).populate('followerId followedId');

    for (const follow of follows) {
      const user = await User.findById(follow.followedId);
      if (user?.preferences?.notifications?.socialInteractions) {
        await Notification.create({
          userId: follow.followedId,
          type: 'new_follower',
          title: 'New Follower',
          message: `${follow.followerId.username} started following you`,
          data: { followerId: follow.followerId._id, followerName: follow.followerId.username },
          channel: 'in-app',
          status: 'sent',
          scheduledAt: new Date()
        });

        // Mark the follow as having had its notification sent
        follow.notificationSent = true;
        await follow.save();
      }
    }

    console.log(`New follower notifications queued for ${follows.length} follows`);
  } catch (error) {
    console.error('New follower notifications job failed:', error);
  }
};

/**
 * Clean up expired notifications from the database.
 */
const cleanExpiredNotifications = async () => {
  try {
    const result = await Notification.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    console.log(`Cleaned ${result.deletedCount} expired notifications`);
  } catch (error) {
    console.error('Clean expired notifications job failed:', error);
  }
};

// Cron job definitions
const dailyRevisionJob = new cron.CronJob('0 9 * * *', sendDailyRevisionReminders);
const weeklyReportJob = new cron.CronJob('0 10 * * 0', sendWeeklyReports);
const newFollowerJob = new cron.CronJob('*/30 * * * *', sendNewFollowerNotifications);
const cleanupJob = new cron.CronJob('0 0 * * *', cleanExpiredNotifications);

/**
 * Start all notification cron jobs.
 */
const startNotificationJobs = () => {
  dailyRevisionJob.start();
  weeklyReportJob.start();
  newFollowerJob.start();
  cleanupJob.start();
  console.log('Notification jobs started');
};

/**
 * Stop all notification cron jobs.
 */
const stopNotificationJobs = () => {
  dailyRevisionJob.stop();
  weeklyReportJob.stop();
  newFollowerJob.stop();
  cleanupJob.stop();
  console.log('Notification jobs stopped');
};

module.exports = {
  startNotificationJobs,
  stopNotificationJobs,
  sendDailyRevisionReminders,
  sendWeeklyReports,
  sendNewFollowerNotifications,
  cleanExpiredNotifications
};
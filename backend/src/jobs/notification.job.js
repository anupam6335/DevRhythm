const cron = require('cron');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Follow = require('../models/Follow');

const sendDailyRevisionReminders = async () => {
  try {
    const users = await User.find({
      'preferences.notifications.revisionReminders': true,
      isActive: true
    }).select('_id');
    
    for (const user of users) {
      const notification = new Notification({
        userId: user._id,
        type: 'revision_reminder_daily',
        title: 'Daily Revision Reminder',
        message: 'Check your pending revisions for today',
        data: { revisionCount: 0, overdueCount: 0 },
        channel: 'in-app',
        status: 'pending',
        scheduledAt: new Date()
      });
      await notification.save();
    }
    
    console.log(`Daily revision reminders queued for ${users.length} users`);
  } catch (error) {
    console.error('Daily revision reminders job failed:', error);
  }
};

const sendWeeklyReports = async () => {
  try {
    const users = await User.find({
      'preferences.notifications.weeklyReports': true,
      isActive: true
    }).select('_id');
    
    for (const user of users) {
      const notification = new Notification({
        userId: user._id,
        type: 'weekly_report',
        title: 'Weekly Progress Report',
        message: 'Your weekly progress report is ready',
        data: {},
        channel: 'in-app',
        status: 'pending',
        scheduledAt: new Date()
      });
      await notification.save();
    }
    
    console.log(`Weekly reports queued for ${users.length} users`);
  } catch (error) {
    console.error('Weekly reports job failed:', error);
  }
};

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
        const notification = new Notification({
          userId: follow.followedId,
          type: 'new_follower',
          title: 'New Follower',
          message: `${follow.followerId.username} started following you`,
          data: { followerId: follow.followerId._id, followerName: follow.followerId.username },
          channel: 'in-app',
          status: 'pending',
          scheduledAt: new Date()
        });
        await notification.save();
        follow.notificationSent = true;
        await follow.save();
      }
    }
    
    console.log(`New follower notifications sent for ${follows.length} follows`);
  } catch (error) {
    console.error('New follower notifications job failed:', error);
  }
};

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

const dailyRevisionJob = new cron.CronJob('0 9 * * *', sendDailyRevisionReminders);
const weeklyReportJob = new cron.CronJob('0 10 * * 0', sendWeeklyReports);
const newFollowerJob = new cron.CronJob('*/30 * * * *', sendNewFollowerNotifications);
const cleanupJob = new cron.CronJob('0 0 * * *', cleanExpiredNotifications);

const startNotificationJobs = () => {
  dailyRevisionJob.start();
  weeklyReportJob.start();
  newFollowerJob.start();
  cleanupJob.start();
  console.log('Notification jobs started');
};

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
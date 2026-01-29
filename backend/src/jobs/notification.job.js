const cron = require('cron');
const Notification = require('../models/Notification');
const User = require('../models/User');

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
const cleanupJob = new cron.CronJob('0 0 * * *', cleanExpiredNotifications);

const startNotificationJobs = () => {
  dailyRevisionJob.start();
  weeklyReportJob.start();
  cleanupJob.start();
  console.log('Notification jobs started');
};

const stopNotificationJobs = () => {
  dailyRevisionJob.stop();
  weeklyReportJob.stop();
  cleanupJob.stop();
  console.log('Notification jobs stopped');
};

module.exports = {
  startNotificationJobs,
  stopNotificationJobs,
  sendDailyRevisionReminders,
  sendWeeklyReports,
  cleanExpiredNotifications
};
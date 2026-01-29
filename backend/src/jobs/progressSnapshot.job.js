const cron = require('cron');
const ProgressSnapshot = require('../models/ProgressSnapshot');
const User = require('../models/User');
const { getEndOfDay, getEndOfWeek, getEndOfMonth } = require('../utils/helpers/date');

const generateDailySnapshot = async () => {
  try {
    const users = await User.find({ isActive: true }).select('_id');
    const snapshotDate = getEndOfDay();
    
    for (const user of users) {
      const existing = await ProgressSnapshot.findOne({
        userId: user._id,
        snapshotPeriod: 'daily',
        snapshotDate: { $gte: new Date(snapshotDate.getTime() - 24 * 60 * 60 * 1000) }
      });
      
      if (!existing) {
        const snapshot = new ProgressSnapshot({
          userId: user._id,
          snapshotDate,
          snapshotPeriod: 'daily',
          overallProgress: {
            totalProblemsSolved: 0,
            totalRevisionsCompleted: 0,
            totalStudyTimeSpent: 0,
            masteryPercentage: 0,
            activeDaysCount: 0
          },
          consistency: {
            currentStreak: 0,
            longestStreak: 0,
            consistencyScore: 0,
            accountAgeDays: 0
          }
        });
        await snapshot.save();
      }
    }
    
    console.log('Daily snapshots generated');
  } catch (error) {
    console.error('Daily snapshot job failed:', error);
  }
};

const generateWeeklySnapshot = async () => {
  try {
    const users = await User.find({ isActive: true }).select('_id');
    const snapshotDate = getEndOfWeek();
    
    for (const user of users) {
      const existing = await ProgressSnapshot.findOne({
        userId: user._id,
        snapshotPeriod: 'weekly',
        snapshotDate: { $gte: new Date(snapshotDate.getTime() - 7 * 24 * 60 * 60 * 1000) }
      });
      
      if (!existing) {
        const snapshot = new ProgressSnapshot({
          userId: user._id,
          snapshotDate,
          snapshotPeriod: 'weekly'
        });
        await snapshot.save();
      }
    }
    
    console.log('Weekly snapshots generated');
  } catch (error) {
    console.error('Weekly snapshot job failed:', error);
  }
};

const generateMonthlySnapshot = async () => {
  try {
    const users = await User.find({ isActive: true }).select('_id');
    const snapshotDate = getEndOfMonth();
    
    for (const user of users) {
      const existing = await ProgressSnapshot.findOne({
        userId: user._id,
        snapshotPeriod: 'monthly',
        snapshotDate: { $gte: new Date(snapshotDate.getTime() - 30 * 24 * 60 * 60 * 1000) }
      });
      
      if (!existing) {
        const snapshot = new ProgressSnapshot({
          userId: user._id,
          snapshotDate,
          snapshotPeriod: 'monthly'
        });
        await snapshot.save();
      }
    }
    
    console.log('Monthly snapshots generated');
  } catch (error) {
    console.error('Monthly snapshot job failed:', error);
  }
};

const dailySnapshotJob = new cron.CronJob('0 0 * * *', generateDailySnapshot);
const weeklySnapshotJob = new cron.CronJob('0 0 * * 0', generateWeeklySnapshot);
const monthlySnapshotJob = new cron.CronJob('0 0 1 * *', generateMonthlySnapshot);

const startSnapshotJobs = () => {
  dailySnapshotJob.start();
  weeklySnapshotJob.start();
  monthlySnapshotJob.start();
  console.log('Progress snapshot jobs started');
};

const stopSnapshotJobs = () => {
  dailySnapshotJob.stop();
  weeklySnapshotJob.stop();
  monthlySnapshotJob.stop();
  console.log('Progress snapshot jobs stopped');
};

module.exports = {
  startSnapshotJobs,
  stopSnapshotJobs,
  generateDailySnapshot,
  generateWeeklySnapshot,
  generateMonthlySnapshot
};
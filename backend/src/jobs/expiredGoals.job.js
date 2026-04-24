const cron = require('cron');
const Goal = require('../models/Goal');

const markExpiredGoals = async () => {
  try {
    const now = new Date();
    const result = await Goal.updateMany(
      {
        status: 'active',
        endDate: { $lt: now },
      },
      {
        $set: { status: 'failed', updatedAt: now },
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`Marked ${result.modifiedCount} expired goals as failed`);
    }
  } catch (error) {
    console.error('Failed to mark expired goals:', error);
  }
};

const expiredGoalsJob = new cron.CronJob('0 0 * * *', markExpiredGoals); // runs daily at midnight

const startExpiredGoalsJob = () => {
  expiredGoalsJob.start();
  console.log('Expired goals job started');
};

const stopExpiredGoalsJob = () => {
  expiredGoalsJob.stop();
  console.log('Expired goals job stopped');
};

module.exports = { startExpiredGoalsJob, stopExpiredGoalsJob, markExpiredGoals };
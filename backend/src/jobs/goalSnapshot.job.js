const cron = require('cron');
const GoalSnapshotService = require('../services/goalSnapshot.service');
const { getStartOfDay, getStartOfMonth } = require('../utils/helpers/date');

/**
 * Compute yesterday's monthly snapshot for all users and global.
 * Runs daily at 00:10 UTC.
 */
const updateDailySnapshot = async () => {
  try {
    // Use UTC as the reference timezone for cron jobs (consistent, deterministic)
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const timeZone = 'UTC';

    console.log(`[GoalSnapshot] Running daily update for date: ${yesterday.toISOString()}`);

    await GoalSnapshotService.generateForAllUsers(yesterday, 'monthly', timeZone);
    console.log('[GoalSnapshot] Daily monthly snapshots updated successfully');
  } catch (error) {
    console.error('[GoalSnapshot] Daily update failed:', error);
  }
};

/**
 * Compute previous month's snapshot for all users and global.
 * Runs on the 1st of every month at 00:15 UTC.
 */
const updateMonthlySnapshot = async () => {
  try {
    const timeZone = 'UTC';
    // First day of current month, then subtract one day to get last day of previous month
    const firstDayOfCurrentMonth = new Date();
    firstDayOfCurrentMonth.setUTCDate(1);
    firstDayOfCurrentMonth.setUTCHours(0, 0, 0, 0);

    const lastDayOfPreviousMonth = new Date(firstDayOfCurrentMonth);
    lastDayOfPreviousMonth.setUTCDate(0); // goes to last day of previous month

    const previousMonthYear = lastDayOfPreviousMonth.getUTCFullYear();
    const previousMonthNumber = lastDayOfPreviousMonth.getUTCMonth() + 1;

    console.log(`[GoalSnapshot] Running monthly update for ${previousMonthYear}-${previousMonthNumber}`);

    // Use the first day of the target month for `generateForAllUsers` (monthly snapshot)
    const targetDate = new Date(previousMonthYear, previousMonthNumber - 1, 1);
    await GoalSnapshotService.generateForAllUsers(targetDate, 'monthly', timeZone);

    // Also update yearly snapshots for the same year (if not already updated this month)
    await GoalSnapshotService.generateForAllUsers(
      new Date(previousMonthYear, 0, 1),
      'yearly',
      timeZone
    );

    console.log('[GoalSnapshot] Monthly and yearly snapshots updated successfully');
  } catch (error) {
    console.error('[GoalSnapshot] Monthly update failed:', error);
  }
};

// Schedule jobs
const dailySnapshotJob = new cron.CronJob('10 0 * * *', updateDailySnapshot); // 00:10 UTC daily
const monthlySnapshotJob = new cron.CronJob('15 0 1 * *', updateMonthlySnapshot); // 00:15 UTC on 1st of each month

const startGoalSnapshotJob = () => {
  dailySnapshotJob.start();
  monthlySnapshotJob.start();
  console.log('Goal snapshot cron jobs started (daily at 00:10 UTC, monthly on 1st at 00:15 UTC)');
};

const stopGoalSnapshotJob = () => {
  dailySnapshotJob.stop();
  monthlySnapshotJob.stop();
  console.log('Goal snapshot cron jobs stopped');
};

module.exports = {
  startGoalSnapshotJob,
  stopGoalSnapshotJob,
  updateDailySnapshot,   // exported for manual triggering if needed
  updateMonthlySnapshot,
};
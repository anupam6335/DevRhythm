const cron = require('cron');
const LeaderboardSnapshot = require('../models/LeaderboardSnapshot');
const User = require('../models/User');
const { getStartOfWeek, getEndOfWeek, getStartOfMonth, getEndOfMonth } = require('../utils/helpers/date');
const { invalidateLeaderboardCache } = require('../services/cache.service');

const calculateLeaderboard = async (type, periodStart, periodEnd) => {
  const users = await User.find({ privacy: { $in: ['public', 'link-only'] } })
    .select('username displayName avatarUrl streak stats')
    .lean();
  
  const rankings = users
    .map(user => ({
      userId: user._id,
      solvedCount: user.stats.totalSolved || 0,
      consistencyScore: user.stats.masteryRate || 0,
      streak: user.streak.current || 0,
      totalTimeSpent: user.stats.totalTimeSpent || 0,
      masteryRate: user.stats.masteryRate || 0,
      activeDays: user.stats.activeDays || 0
    }))
    .sort((a, b) => b.solvedCount - a.solvedCount)
    .map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      solvedCount: user.solvedCount,
      consistencyScore: user.consistencyScore,
      streak: user.streak,
      totalTimeSpent: user.totalTimeSpent,
      masteryRate: user.masteryRate,
      activeDays: user.activeDays
    }));
  
  const expiresAt = new Date(periodEnd);
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await LeaderboardSnapshot.findOneAndUpdate(
    { leaderboardType: type, periodStart, periodEnd },
    {
      leaderboardType: type,
      periodStart,
      periodEnd,
      rankings: rankings.slice(0, 100),
      totalParticipants: users.length,
      expiresAt,
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  );
  
  await invalidateLeaderboardCache(type, periodStart.toISOString());
};

const weeklyLeaderboardJob = new cron.CronJob('0 0 * * 0', async () => {
  try {
    const periodStart = getStartOfWeek();
    const periodEnd = getEndOfWeek();
    await calculateLeaderboard('weekly', periodStart, periodEnd);
    console.log('Weekly leaderboard updated');
  } catch (error) {
    console.error('Weekly leaderboard job failed:', error);
  }
});

const monthlyLeaderboardJob = new cron.CronJob('0 0 1 * *', async () => {
  try {
    const periodStart = getStartOfMonth();
    const periodEnd = getEndOfMonth();
    await calculateLeaderboard('monthly', periodStart, periodEnd);
    console.log('Monthly leaderboard updated');
  } catch (error) {
    console.error('Monthly leaderboard job failed:', error);
  }
});

const startLeaderboardJobs = () => {
  weeklyLeaderboardJob.start();
  monthlyLeaderboardJob.start();
  console.log('Leaderboard jobs started');
};

const stopLeaderboardJobs = () => {
  weeklyLeaderboardJob.stop();
  monthlyLeaderboardJob.stop();
  console.log('Leaderboard jobs stopped');
};

module.exports = {
  startLeaderboardJobs,
  stopLeaderboardJobs,
  calculateLeaderboard
};
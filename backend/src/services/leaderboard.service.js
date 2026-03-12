const LeaderboardSnapshot = require('../models/LeaderboardSnapshot');
const User = require('../models/User');
const { invalidateLeaderboardCache } = require('./cache.service');

/**
 * Calculate leaderboard rankings for a given type and period
 * @param {string} type - 'weekly' or 'monthly'
 * @param {Date} periodStart
 * @param {Date} periodEnd
 * @param {boolean} force - force recalculation even if snapshot exists
 * @returns {Promise<Object>} saved snapshot
 */
const calculateLeaderboard = async (type, periodStart, periodEnd, force = false) => {
  // Check if snapshot already exists and not forced
  if (!force) {
    const existing = await LeaderboardSnapshot.findOne({ leaderboardType: type, periodStart, periodEnd });
    if (existing) return existing;
  }

  // Get all public users
  const users = await User.find({ privacy: { $in: ['public', 'link-only'] } })
    .select('username displayName avatarUrl streak stats')
    .lean();

  // Calculate rankings based on totalSolved (primary), masteryRate (secondary), streak (tertiary)
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
    .sort((a, b) => {
      if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
      if (b.masteryRate !== a.masteryRate) return b.masteryRate - a.masteryRate;
      return b.streak - a.streak;
    })
    .map((user, index) => ({
      rank: index + 1,
      ...user
    }));

  const expiresAt = new Date(periodEnd);
  expiresAt.setDate(expiresAt.getDate() + 7); // keep for a week after period ends

  const snapshot = await LeaderboardSnapshot.findOneAndUpdate(
    { leaderboardType: type, periodStart, periodEnd },
    {
      leaderboardType: type,
      periodStart,
      periodEnd,
      rankings: rankings.slice(0, 100), // store top 100
      totalParticipants: users.length,
      expiresAt,
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  );

  // Invalidate cache
  await invalidateLeaderboardCache(type, periodStart.toISOString());

  return snapshot;
};

module.exports = {
  calculateLeaderboard
};
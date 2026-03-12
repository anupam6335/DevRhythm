const mongoose = require('mongoose');

const LeaderboardSnapshotSchema = new mongoose.Schema({
  leaderboardType: {
    type: String,
    enum: ['weekly', 'monthly'],
    required: true,
  },
  periodStart: {
    type: Date,
    required: true,
  },
  periodEnd: {
    type: Date,
    required: true,
  },
  rankings: [{
    rank: Number,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    solvedCount: Number,
    consistencyScore: Number,
    streak: Number,
    totalTimeSpent: Number,
    masteryRate: Number,
    activeDays: Number,
  }],
  totalParticipants: Number,
  expiresAt: Date,
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

LeaderboardSnapshotSchema.index({ leaderboardType: 1, periodStart: 1, periodEnd: 1 }, { unique: true });
LeaderboardSnapshotSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('LeaderboardSnapshot', LeaderboardSnapshotSchema);
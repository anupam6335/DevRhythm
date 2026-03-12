const mongoose = require('mongoose');

const UserStatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalSolved: {
    type: Number,
    default: 0
  },
  totalAttempts: {
    type: Number,
    default: 0
  },
  totalRevisions: {
    type: Number,
    default: 0
  },
  totalTimeSpent: {
    type: Number,
    default: 0
  },
  byDifficulty: {
    easy: { solved: Number, attempted: Number },
    medium: { solved: Number, attempted: Number },
    hard: { solved: Number, attempted: Number }
  },
  byPlatform: {
    leetcode: Number,
    hackerrank: Number,
    codeforces: Number,
    other: Number
  },
  successRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  retentionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  averageTimePerQuestion: Number,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserStats', UserStatsSchema);
const mongoose = require('mongoose');

const ProgressSnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  snapshotDate: {
    type: Date,
    required: true,
  },
  snapshotPeriod: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true,
  },
  overallProgress: {
    totalProblemsSolved: { type: Number, default: 0 },
    totalRevisionsCompleted: { type: Number, default: 0 },
    totalStudyTimeSpent: { type: Number, default: 0 },
    masteryPercentage: { type: Number, default: 0, min: 0, max: 100 },
    activeDaysCount: { type: Number, default: 0 },
  },
  byDifficulty: {
    easy: { solved: Number, mastered: Number, totalTime: Number },
    medium: { solved: Number, mastered: Number, totalTime: Number },
    hard: { solved: Number, mastered: Number, totalTime: Number },
  },
  byPlatform: {
    LeetCode: Number,
    HackerRank: Number,
    Codeforces: Number,
    Other: Number,
  },
  byPattern: [{
    patternName: String,
    solved: Number,
    mastered: Number,
    confidence: Number,
  }],
  consistency: {
    currentStreak: Number,
    longestStreak: Number,
    consistencyScore: { type: Number, min: 0, max: 100 },
    accountAgeDays: Number,
  },
  goals: {
    daily: { achieved: Number, missed: Number },
    weekly: { achieved: Number, missed: Number },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ProgressSnapshotSchema.index({ userId: 1, snapshotPeriod: 1, snapshotDate: -1 });

module.exports = mongoose.model('ProgressSnapshot', ProgressSnapshotSchema);
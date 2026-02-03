const mongoose = require('mongoose');

const ShareSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shareType: {
    type: String,
    enum: ['profile', 'period'],
    required: true
  },
  periodType: {
    type: String,
    enum: ['day', 'week', 'month', 'custom'],
    required: function() {
      return this.shareType === 'period';
    }
  },
  startDate: {
    type: Date,
    required: function() {
      return this.shareType === 'period';
    }
  },
  endDate: {
    type: Date,
    required: function() {
      return this.shareType === 'period';
    }
  },
  customPeriodName: {
    type: String,
    default: ''
  },
  sharedData: {
    userInfo: {
      username: String,
      displayName: String,
      avatarUrl: String,
      totalSolved: Number,
      streak: {
        current: Number,
        longest: Number
      }
    },
    questions: [{
      title: String,
      problemLink: String,
      platform: String,
      difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard']
      },
      solvedDate: Date,
      tags: [String],
      pattern: String
    }],
    totalSolved: {
      type: Number,
      default: 0
    },
    breakdown: {
      easy: Number,
      medium: Number,
      hard: Number
    },
    platformBreakdown: {
      LeetCode: Number,
      HackerRank: Number,
      CodeForces: Number,
      Other: Number
    },
    dateRange: {
      start: Date,
      end: Date
    }
  },
  privacy: {
    type: String,
    enum: ['public', 'private', 'link-only'],
    default: 'link-only'
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  },
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessedAt: Date,
  expiresAt: {
    type: Date,
    default: function() {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  }
}, {
  timestamps: true
});

ShareSchema.index({ userId: 1, createdAt: -1 });
ShareSchema.index({ shareToken: 1 }, { unique: true, sparse: true });
ShareSchema.index({ privacy: 1, createdAt: -1 });
ShareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
ShareSchema.index({ userId: 1, shareType: 1, createdAt: -1 });
ShareSchema.index({ userId: 1, 'sharedData.userInfo.username': 1 });
ShareSchema.index({ 'sharedData.dateRange.start': 1, 'sharedData.dateRange.end': 1 });

module.exports = mongoose.model('Share', ShareSchema);
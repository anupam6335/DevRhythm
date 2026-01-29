const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  authProvider: {
    type: String,
    enum: ['google', 'github'],
    required: true
  },
  providerId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  avatarUrl: String,
  streak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    },
    lastActiveDate: {
      type: Date,
      default: null
    }
  },
  stats: {
    totalSolved: {
      type: Number,
      default: 0
    },
    masteryRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    totalRevisions: {
      type: Number,
      default: 0
    },
    totalTimeSpent: {
      type: Number,
      default: 0
    },
    activeDays: {
      type: Number,
      default: 0
    }
  },
  preferences: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      revisionReminders: {
        type: Boolean,
        default: true
      },
      goalTracking: {
        type: Boolean,
        default: true
      },
      socialInteractions: {
        type: Boolean,
        default: true
      },
      weeklyReports: {
        type: Boolean,
        default: true
      }
    },
    dailyGoal: {
      type: Number,
      default: 3,
      min: 1,
      max: 50
    },
    weeklyGoal: {
      type: Number,
      default: 15,
      min: 5,
      max: 100
    }
  },
  lastOnline: {
    type: Date,
    default: Date.now
  },
  accountCreated: {
    type: Date,
    default: Date.now
  },
  followersCount: {
    type: Number,
    default: 0
  },
  followingCount: {
    type: Number,
    default: 0
  },
  privacy: {
    type: String,
    enum: ['public', 'private', 'link-only'],
    default: 'public'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ providerId: 1 }, { unique: true });
UserSchema.index({ 'streak.current': -1 });
UserSchema.index({ 'stats.totalSolved': -1 });
UserSchema.index({ 'stats.masteryRate': -1 });
UserSchema.index({ lastOnline: -1 });
UserSchema.index({ 'preferences.timezone': 1 });
UserSchema.index({ privacy: 1, 'stats.totalSolved': -1 });

module.exports = mongoose.model('User', UserSchema);
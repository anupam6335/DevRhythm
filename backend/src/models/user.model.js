const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new mongoose.Schema({
  // OAuth Identity
  oauthId: { type: String, required: true, index: true },
  provider: { type: String, required: true, enum: ['google', 'github'] },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  
  // Profile (from OAuth)
  name: { type: String, required: true },
  avatar: { type: String },
  locale: { type: String },
  timezone: { type: String, default: 'UTC' },
  
  // Session & Security
  sessions: [{
    sessionId: { type: String },
    deviceInfo: { type: String },
    ipAddress: { type: String },
    lastActive: { type: Date },
    expiresAt: { type: Date }
  }],
  lastLogin: { type: Date },
  loginCount: { type: Number, default: 0 },
  
  // Onboarding State
  onboardingCompleted: { type: Boolean, default: false },
  onboardingStep: { type: Number, default: 0 },
  firstLoginDate: { type: Date, required: true },
  
  // Learning Goals & Preferences
  learningGoals: {
    targetCompanies: [{ type: String }],
    timeline: { type: String, enum: ['1m', '3m', '6m', '1y', 'custom'] },
    focusAreas: [{ type: String }],
    goalType: { type: String, enum: ['interview', 'competition', 'skill', 'promotion'] }
  },
  
  // Study Preferences
  preferences: {
    difficultyProgression: { type: String, enum: ['sequential', 'mixed'], default: 'sequential' },
    dailyTimeCommitment: { type: Number, default: 60 }, // minutes
    studyIntensity: { type: String, enum: ['light', 'moderate', 'intense'], default: 'moderate' },
    defaultQuestionsPerDay: { type: Number, default: 5, min: 1, max: 50 },
    notificationPreferences: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
      quietHours: { from: { type: String }, to: { type: String } }
    }
  },
  
  // UI/UX Preferences
  uiPreferences: {
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    density: { type: String, enum: ['compact', 'comfortable', 'spacious'], default: 'compact' },
    shortcutsEnabled: { type: Boolean, default: true },
    autoSave: { type: Boolean, default: true },
    defaultView: { type: String, enum: ['dashboard', 'day', 'questions', 'analytics'], default: 'dashboard' }
  },
  
  // Streak & Motivation
  streak: {
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    productivityStreak: { type: Number, default: 0 }, // consecutive productive days
    consistencyScore: { type: Number, default: 0 } // days active vs total
  },
  
  // Statistics (cached for performance)
  stats: {
    totalQuestions: { type: Number, default: 0 },
    solvedQuestions: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 }, // minutes
    averageSolveTime: { type: Number, default: 0 },
    accuracyRate: { type: Number, default: 0 }
  },
  
  // System
  isActive: { type: Boolean, default: true },
  dataExportToken: { type: String },
  lastDataExport: { type: Date },
  deletedAt: { type: Date }, // soft delete
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  strict: true
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ 'oauthId': 1, 'provider': 1 }, { unique: true });
UserSchema.index({ 'streak.lastActiveDate': 1 });
UserSchema.index({ 'onboardingCompleted': 1 });
UserSchema.index({ createdAt: 1 });

// Method to get public profile (exclude sensitive data)
UserSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  delete user.sessions;
  delete user.dataExportToken;
  delete user.deletedAt;
  delete user.isActive;
  return user;
};

// Method to update last login
UserSchema.methods.updateLastLogin = function(sessionData = {}) {
  this.lastLogin = new Date();
  this.loginCount += 1;
  
  // Add or update session
  if (sessionData.sessionId) {
    const sessionIndex = this.sessions.findIndex(s => s.sessionId === sessionData.sessionId);
    const sessionInfo = {
      sessionId: sessionData.sessionId,
      deviceInfo: sessionData.deviceInfo || 'Unknown',
      ipAddress: sessionData.ipAddress || 'Unknown',
      lastActive: new Date(),
      expiresAt: sessionData.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days default
    };
    
    if (sessionIndex >= 0) {
      this.sessions[sessionIndex] = sessionInfo;
    } else {
      this.sessions.push(sessionInfo);
    }
  }
  
  return this.save();
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
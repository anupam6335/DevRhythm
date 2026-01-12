const mongoose = require('mongoose');
const { Schema } = mongoose;

const AchievementSchema = new mongoose.Schema({
  // Ownership
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  // Achievement Definition
  achievementType: { 
    type: String, 
    required: true,
    enum: [
      'streak', 'questions-solved', 'revisions-completed', 'time-spent',
      'topic-mastery', 'difficulty-conquered', 'consistency', 'speed',
      'milestone', 'challenge', 'special'
    ],
    index: true 
  },
  
  // Achievement Details
  name: { type: String, required: true },
  description: { type: String, required: true },
  tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'] },
  
  // Progress Tracking
  progress: {
    current: { type: Number, default: 0 },
    target: { type: Number, required: true },
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    isCompleted: { type: Boolean, default: false, index: true }
  },
  
  // Completion Data
  completedAt: { type: Date },
  completionOrder: { type: Number }, // which achievement number this is for user
  
  // Rewards & Display
  badgeIcon: { type: String }, // URL or icon name
  badgeColor: { type: String },
  pointsAwarded: { type: Number, default: 0 },
  displayPriority: { type: Number, default: 0 },
  
  // Context
  contextData: {
    streakDays: { type: Number },
    questionCount: { type: Number },
    topic: { type: String },
    difficulty: { type: String },
    timeFrame: { type: String }
  },
  
  // Sharing
  shared: { type: Boolean, default: false },
  sharedAt: { type: Date },
  shareToken: { type: String },
  
  // System
  isActive: { type: Boolean, default: true },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  strict: true
});

// Indexes
AchievementSchema.index({ userId: 1, achievementType: 1 });
AchievementSchema.index({ userId: 1, 'progress.isCompleted': 1 });
AchievementSchema.index({ userId: 1, completedAt: -1 });
AchievementSchema.index({ userId: 1, tier: 1 });
AchievementSchema.index({ achievementType: 1, tier: 1 });

// Static method to get predefined achievements
AchievementSchema.statics.getPredefinedAchievements = function() {
  return [
    // Streak achievements
    {
      achievementType: 'streak',
      name: 'Consistency Starter',
      description: 'Maintain a 3-day study streak',
      tier: 'bronze',
      target: 3,
      badgeIcon: 'streak-3',
      badgeColor: '#CD7F32',
      pointsAwarded: 10,
      displayPriority: 1
    },
    {
      achievementType: 'streak',
      name: 'Weekly Warrior',
      description: 'Maintain a 7-day study streak',
      tier: 'silver',
      target: 7,
      badgeIcon: 'streak-7',
      badgeColor: '#C0C0C0',
      pointsAwarded: 25,
      displayPriority: 2
    },
    {
      achievementType: 'streak',
      name: 'Monthly Master',
      description: 'Maintain a 30-day study streak',
      tier: 'gold',
      target: 30,
      badgeIcon: 'streak-30',
      badgeColor: '#FFD700',
      pointsAwarded: 100,
      displayPriority: 3
    },
    
    // Questions solved achievements
    {
      achievementType: 'questions-solved',
      name: 'Problem Solver',
      description: 'Solve 10 problems',
      tier: 'bronze',
      target: 10,
      badgeIcon: 'problems-10',
      badgeColor: '#CD7F32',
      pointsAwarded: 15,
      displayPriority: 1
    },
    {
      achievementType: 'questions-solved',
      name: 'Code Crusher',
      description: 'Solve 50 problems',
      tier: 'silver',
      target: 50,
      badgeIcon: 'problems-50',
      badgeColor: '#C0C0C0',
      pointsAwarded: 50,
      displayPriority: 2
    },
    {
      achievementType: 'questions-solved',
      name: 'Algorithm Ace',
      description: 'Solve 100 problems',
      tier: 'gold',
      target: 100,
      badgeIcon: 'problems-100',
      badgeColor: '#FFD700',
      pointsAwarded: 200,
      displayPriority: 3
    },
    {
      achievementType: 'questions-solved',
      name: 'Grand Master',
      description: 'Solve 500 problems',
      tier: 'platinum',
      target: 500,
      badgeIcon: 'problems-500',
      badgeColor: '#E5E4E2',
      pointsAwarded: 1000,
      displayPriority: 4
    },
    
    // Difficulty conquered achievements
    {
      achievementType: 'difficulty-conquered',
      name: 'Easy Expert',
      description: 'Solve 20 easy problems',
      tier: 'bronze',
      target: 20,
      badgeIcon: 'easy-expert',
      badgeColor: '#CD7F32',
      pointsAwarded: 20,
      displayPriority: 1,
      contextData: { difficulty: 'easy' }
    },
    {
      achievementType: 'difficulty-conquered',
      name: 'Medium Maestro',
      description: 'Solve 20 medium problems',
      tier: 'silver',
      target: 20,
      badgeIcon: 'medium-maestro',
      badgeColor: '#C0C0C0',
      pointsAwarded: 50,
      displayPriority: 2,
      contextData: { difficulty: 'medium' }
    },
    {
      achievementType: 'difficulty-conquered',
      name: 'Hard Hero',
      description: 'Solve 10 hard problems',
      tier: 'gold',
      target: 10,
      badgeIcon: 'hard-hero',
      badgeColor: '#FFD700',
      pointsAwarded: 100,
      displayPriority: 3,
      contextData: { difficulty: 'hard' }
    },
    
    // Time spent achievements
    {
      achievementType: 'time-spent',
      name: 'Dedicated Learner',
      description: 'Spend 10 hours studying',
      tier: 'bronze',
      target: 600, // minutes
      badgeIcon: 'time-10h',
      badgeColor: '#CD7F32',
      pointsAwarded: 30,
      displayPriority: 1
    },
    {
      achievementType: 'time-spent',
      name: 'Time Titan',
      description: 'Spend 50 hours studying',
      tier: 'silver',
      target: 3000, // minutes
      badgeIcon: 'time-50h',
      badgeColor: '#C0C0C0',
      pointsAwarded: 150,
      displayPriority: 2
    },
    {
      achievementType: 'time-spent',
      name: 'Master of Time',
      description: 'Spend 100 hours studying',
      tier: 'gold',
      target: 6000, // minutes
      badgeIcon: 'time-100h',
      badgeColor: '#FFD700',
      pointsAwarded: 300,
      displayPriority: 3
    },
    
    // Revision achievements
    {
      achievementType: 'revisions-completed',
      name: 'Revision Rookie',
      description: 'Complete 10 revisions',
      tier: 'bronze',
      target: 10,
      badgeIcon: 'revisions-10',
      badgeColor: '#CD7F32',
      pointsAwarded: 20,
      displayPriority: 1
    },
    {
      achievementType: 'revisions-completed',
      name: 'Revision Regular',
      description: 'Complete 50 revisions',
      tier: 'silver',
      target: 50,
      badgeIcon: 'revisions-50',
      badgeColor: '#C0C0C0',
      pointsAwarded: 75,
      displayPriority: 2
    },
    
    // Consistency achievements
    {
      achievementType: 'consistency',
      name: 'Weekend Warrior',
      description: 'Study on 4 consecutive weekends',
      tier: 'silver',
      target: 4,
      badgeIcon: 'weekend-warrior',
      badgeColor: '#C0C0C0',
      pointsAwarded: 40,
      displayPriority: 2
    },
    
    // Milestone achievements
    {
      achievementType: 'milestone',
      name: 'First Problem',
      description: 'Solve your first problem',
      tier: 'bronze',
      target: 1,
      badgeIcon: 'first-problem',
      badgeColor: '#CD7F32',
      pointsAwarded: 5,
      displayPriority: 1
    },
    {
      achievementType: 'milestone',
      name: 'First Hard Problem',
      description: 'Solve your first hard problem',
      tier: 'silver',
      target: 1,
      badgeIcon: 'first-hard',
      badgeColor: '#C0C0C0',
      pointsAwarded: 25,
      displayPriority: 2
    }
  ];
};

// Static method to initialize achievements for a user
AchievementSchema.statics.initializeForUser = async function(userId) {
  const predefinedAchievements = this.getPredefinedAchievements();
  const achievements = [];
  
  for (const predefined of predefinedAchievements) {
    const achievement = new this({
      userId,
      achievementType: predefined.achievementType,
      name: predefined.name,
      description: predefined.description,
      tier: predefined.tier,
      progress: {
        current: 0,
        target: predefined.target,
        percentage: 0,
        isCompleted: false
      },
      badgeIcon: predefined.badgeIcon,
      badgeColor: predefined.badgeColor,
      pointsAwarded: predefined.pointsAwarded,
      displayPriority: predefined.displayPriority,
      contextData: predefined.contextData || {}
    });
    
    achievements.push(await achievement.save());
  }
  
  return achievements;
};

// Method to update achievement progress
AchievementSchema.methods.updateProgress = function(newCurrentValue, triggerData = {}) {
  // Don't update if already completed
  if (this.progress.isCompleted) {
    return this;
  }
  
  // Update current value (ensure it doesn't exceed target)
  this.progress.current = Math.min(newCurrentValue, this.progress.target);
  
  // Update percentage
  this.progress.percentage = Math.round((this.progress.current / this.progress.target) * 100);
  
  // Check if achievement is completed
  if (this.progress.current >= this.progress.target && !this.progress.isCompleted) {
    this.progress.isCompleted = true;
    this.completedAt = new Date();
    
    // Update context data with trigger data
    if (triggerData) {
      this.contextData = { ...this.contextData, ...triggerData };
    }
    
    // Get completion order
    this.setCompletionOrder();
  }
  
  return this.save();
};

// Method to set completion order
AchievementSchema.methods.setCompletionOrder = async function() {
  const Achievement = mongoose.model('Achievement');
  
  // Count how many achievements this user has completed
  const completedCount = await Achievement.countDocuments({
    userId: this.userId,
    'progress.isCompleted': true
  });
  
  this.completionOrder = completedCount;
  return this.save();
};

// Method to mark as shared
AchievementSchema.methods.markAsShared = function() {
  this.shared = true;
  this.sharedAt = new Date();
  this.shareToken = generateShareToken();
  return this.save();
};

// Method to get achievement display data
AchievementSchema.methods.getDisplayData = function() {
  const achievement = this.toObject();
  
  return {
    id: achievement._id,
    name: achievement.name,
    description: achievement.description,
    tier: achievement.tier,
    progress: achievement.progress,
    badgeIcon: achievement.badgeIcon,
    badgeColor: achievement.badgeColor,
    pointsAwarded: achievement.pointsAwarded,
    completedAt: achievement.completedAt,
    shared: achievement.shared,
    displayPriority: achievement.displayPriority,
    contextData: achievement.contextData
  };
};

// Method to get shareable data
AchievementSchema.methods.getShareableData = function() {
  const displayData = this.getDisplayData();
  
  return {
    achievement: displayData.name,
    description: displayData.description,
    tier: displayData.tier,
    completedAt: displayData.completedAt,
    badgeIcon: displayData.badgeIcon,
    shareUrl: this.shareToken ? `/achievements/share/${this.shareToken}` : null
  };
};

// Helper function to generate share token
function generateShareToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Static method to check and update achievements for a user
AchievementSchema.statics.checkAndUpdateAchievements = async function(userId, achievementType, currentValue, triggerData = {}) {
  const Achievement = mongoose.model('Achievement');
  
  // Find all achievements of this type for the user that are not completed
  const achievements = await Achievement.find({
    userId,
    achievementType,
    'progress.isCompleted': false
  });
  
  const updatedAchievements = [];
  
  for (const achievement of achievements) {
    // Update progress for each achievement
    await achievement.updateProgress(currentValue, triggerData);
    updatedAchievements.push(achievement);
  }
  
  return updatedAchievements;
};

// Static method to get user's achievement summary
AchievementSchema.statics.getUserAchievementSummary = async function(userId) {
  const Achievement = mongoose.model('Achievement');
  
  const achievements = await Achievement.find({ userId, isActive: true });
  
  const summary = {
    total: achievements.length,
    completed: achievements.filter(a => a.progress.isCompleted).length,
    inProgress: achievements.filter(a => !a.progress.isCompleted).length,
    totalPoints: achievements
      .filter(a => a.progress.isCompleted)
      .reduce((sum, a) => sum + a.pointsAwarded, 0),
    byTier: {
      bronze: achievements.filter(a => a.tier === 'bronze' && a.progress.isCompleted).length,
      silver: achievements.filter(a => a.tier === 'silver' && a.progress.isCompleted).length,
      gold: achievements.filter(a => a.tier === 'gold' && a.progress.isCompleted).length,
      platinum: achievements.filter(a => a.tier === 'platinum' && a.progress.isCompleted).length,
      diamond: achievements.filter(a => a.tier === 'diamond' && a.progress.isCompleted).length
    },
    recentCompletions: achievements
      .filter(a => a.progress.isCompleted)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 5)
      .map(a => a.getDisplayData()),
    nextAchievements: achievements
      .filter(a => !a.progress.isCompleted)
      .sort((a, b) => a.progress.percentage - b.progress.percentage)
      .slice(0, 3)
      .map(a => a.getDisplayData())
  };
  
  summary.completionPercentage = summary.total > 0 ? 
    Math.round((summary.completed / summary.total) * 100) : 0;
  
  return summary;
};

const Achievement = mongoose.model('Achievement', AchievementSchema);

module.exports = Achievement;
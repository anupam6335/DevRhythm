const mongoose = require('mongoose');
const { Schema } = mongoose;

const StudyPlanSchema = new mongoose.Schema({
  // Ownership & Sharing
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  isPublic: { type: Boolean, default: false, index: true },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Plan Identity
  name: { type: String, required: true },
  description: { type: String },
  version: { type: String, default: '1.0.0' },
  
  // Plan Type
  planType: {
    type: String,
    required: true,
    enum: ['predefined', 'custom', 'company-specific', 'topic-based', 'adaptive'],
    index: true
  },
  
  // Goal & Context
  goal: {
    type: { type: String, enum: ['interview', 'competition', 'skill', 'promotion'] },
    targetCompanies: [{ type: String }],
    timeframe: { type: String, enum: ['30-day', '60-day', '90-day', 'custom'] },
    customDays: { type: Number },
    difficultyProgression: { type: String, enum: ['sequential', 'mixed'] }
  },
  
  // Structure
  structure: {
    totalDays: { type: Number, required: true },
    questionsPerDay: { type: Number, default: 5 },
    revisionDays: [{ type: Number }], // day numbers for revision
    assessmentDays: [{ type: Number }],
    restDays: [{ type: Number }]
  },
  
  // Days Configuration
  days: [{
    dayNumber: { type: Number, required: true },
    dayType: { 
      type: String, 
      enum: ['learning', 'revision', 'mock', 'rest', 'assessment'] 
    },
    focusTopics: [{ type: String }],
    difficultyLevel: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'] },
    targetQuestionCount: { type: Number },
    prerequisites: [{ type: String }], // topics that should be mastered before
    notes: { type: String }
  }],
  
  // Question Assignments
  questionAssignments: [{
    dayNumber: { type: Number, required: true },
    questionType: { type: String, enum: ['specific', 'category', 'adaptive'] },
    specificQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuestionLibrary' }],
    categories: {
      topics: [{ type: String }],
      difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'] },
      companies: [{ type: String }],
      problemPatterns: [{ type: String }]
    },
    count: { type: Number }
  }],
  
  // User Progress Tracking (when plan is assigned to user)
  userProgress: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    assignedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    currentDay: { type: Number, default: 1 },
    progress: {
      daysCompleted: { type: Number, default: 0 },
      questionsCompleted: { type: Number, default: 0 },
      completionPercentage: { type: Number, default: 0, min: 0, max: 100 }
    },
    performance: {
      averageAccuracy: { type: Number, default: 0 },
      averageTimePerQuestion: { type: Number, default: 0 },
      weakAreas: [{ type: String }]
    },
    adjustments: {
      difficultyAdjusted: { type: Boolean, default: false },
      paceAdjusted: { type: Boolean, default: false },
      topicsAdded: [{ type: String }],
      topicsRemoved: [{ type: String }]
    },
    isActive: { type: Boolean, default: true }
  }],
  
  // Adaptive Features
  adaptiveSettings: {
    enabled: { type: Boolean, default: false },
    adjustmentFrequency: { type: String, enum: ['weekly', 'bi-weekly', 'monthly'] },
    performanceThresholds: {
      accuracyLow: { type: Number, default: 60 },
      accuracyHigh: { type: Number, default: 90 },
      timeSlow: { type: Number, default: 1800 } // seconds
    }
  },
  
  // Statistics
  stats: {
    totalUsers: { type: Number, default: 0 },
    averageCompletionRate: { type: Number, default: 0 },
    averageTimeToComplete: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 }
  },
  
  // Metadata
  tags: [{ type: String, index: true }],
  popularityScore: { type: Number, default: 0 },
  
  // System
  isActive: { type: Boolean, default: true },
  isArchived: { type: Boolean, default: false },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  strict: true
});

// Indexes
StudyPlanSchema.index({ createdBy: 1, planType: 1 });
StudyPlanSchema.index({ isPublic: 1, popularityScore: -1 });
StudyPlanSchema.index({ tags: 1 });
StudyPlanSchema.index({ 'goal.type': 1, 'goal.timeframe': 1 });
StudyPlanSchema.index({ 'userProgress.userId': 1, 'userProgress.isActive': 1 });
StudyPlanSchema.index({ createdAt: -1 });

// Static method to get predefined study plans
StudyPlanSchema.statics.getPredefinedPlans = function() {
  return [
    {
      name: '30-Day Coding Interview Prep',
      description: 'Comprehensive plan to prepare for coding interviews in 30 days',
      planType: 'predefined',
      goal: {
        type: 'interview',
        timeframe: '30-day',
        difficultyProgression: 'sequential'
      },
      structure: {
        totalDays: 30,
        questionsPerDay: 5,
        revisionDays: [7, 14, 21, 28],
        assessmentDays: [10, 20, 30],
        restDays: [6, 13, 20, 27]
      },
      tags: ['interview', 'beginner', '30-day', 'comprehensive']
    },
    {
      name: '60-Day Advanced Algorithms',
      description: 'Master advanced algorithms and data structures in 60 days',
      planType: 'predefined',
      goal: {
        type: 'competition',
        timeframe: '60-day',
        difficultyProgression: 'mixed'
      },
      structure: {
        totalDays: 60,
        questionsPerDay: 3,
        revisionDays: [15, 30, 45, 60],
        assessmentDays: [20, 40, 60],
        restDays: [7, 14, 21, 28, 35, 42, 49, 56]
      },
      tags: ['algorithms', 'advanced', 'competition', '60-day']
    },
    {
      name: '90-Day FAANG Preparation',
      description: 'Targeted preparation for FAANG company interviews',
      planType: 'company-specific',
      goal: {
        type: 'interview',
        targetCompanies: ['Google', 'Facebook', 'Amazon', 'Apple', 'Netflix', 'Microsoft'],
        timeframe: '90-day',
        difficultyProgression: 'mixed'
      },
      structure: {
        totalDays: 90,
        questionsPerDay: 4,
        revisionDays: [15, 30, 45, 60, 75, 90],
        assessmentDays: [30, 60, 90],
        restDays: [7, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84]
      },
      tags: ['faang', 'interview', 'company-specific', '90-day']
    },
    {
      name: 'Data Structures Mastery',
      description: 'Master all essential data structures with practical problems',
      planType: 'topic-based',
      goal: {
        type: 'skill',
        timeframe: 'custom',
        customDays: 45,
        difficultyProgression: 'sequential'
      },
      structure: {
        totalDays: 45,
        questionsPerDay: 4,
        revisionDays: [10, 20, 30, 40],
        assessmentDays: [15, 30, 45],
        restDays: [7, 14, 21, 28, 35, 42]
      },
      tags: ['data-structures', 'fundamentals', 'skill-building']
    }
  ];
};

// Method to assign plan to user
StudyPlanSchema.methods.assignToUser = async function(userId) {
  // Check if user already has this plan assigned and active
  const existingProgress = this.userProgress.find(
    progress => progress.userId.toString() === userId.toString() && progress.isActive
  );
  
  if (existingProgress) {
    throw new Error('User already has this study plan assigned');
  }
  
  // Create user progress entry
  const userProgress = {
    userId,
    assignedAt: new Date(),
    startedAt: new Date(),
    currentDay: 1,
    progress: {
      daysCompleted: 0,
      questionsCompleted: 0,
      completionPercentage: 0
    },
    performance: {
      averageAccuracy: 0,
      averageTimePerQuestion: 0,
      weakAreas: []
    },
    adjustments: {
      difficultyAdjusted: false,
      paceAdjusted: false,
      topicsAdded: [],
      topicsRemoved: []
    },
    isActive: true
  };
  
  this.userProgress.push(userProgress);
  
  // Update stats
  this.stats.totalUsers += 1;
  
  return this.save();
};

// Method to update user progress
StudyPlanSchema.methods.updateUserProgress = function(userId, dayCompleted = false, questionsCompleted = 0) {
  const userProgress = this.userProgress.find(
    progress => progress.userId.toString() === userId.toString() && progress.isActive
  );
  
  if (!userProgress) {
    throw new Error('User does not have this study plan assigned');
  }
  
  // Update progress
  if (dayCompleted) {
    userProgress.progress.daysCompleted += 1;
    userProgress.currentDay += 1;
  }
  
  userProgress.progress.questionsCompleted += questionsCompleted;
  
  // Calculate completion percentage
  userProgress.progress.completionPercentage = Math.round(
    (userProgress.progress.daysCompleted / this.structure.totalDays) * 100
  );
  
  // Check if plan is completed
  if (userProgress.progress.daysCompleted >= this.structure.totalDays) {
    userProgress.completedAt = new Date();
    userProgress.isActive = false;
    
    // Update plan stats
    this.updateCompletionStats(userId, true);
  }
  
  return this.save();
};

// Method to update performance metrics
StudyPlanSchema.methods.updateUserPerformance = function(userId, accuracy, timePerQuestion, weakAreas = []) {
  const userProgress = this.userProgress.find(
    progress => progress.userId.toString() === userId.toString() && progress.isActive
  );
  
  if (!userProgress) {
    throw new Error('User does not have this study plan assigned');
  }
  
  // Update performance metrics (weighted average)
  const totalQuestions = userProgress.progress.questionsCompleted;
  const currentAccuracy = userProgress.performance.averageAccuracy;
  
  if (totalQuestions > 0) {
    userProgress.performance.averageAccuracy = 
      ((currentAccuracy * (totalQuestions - 1)) + accuracy) / totalQuestions;
    
    const currentTime = userProgress.performance.averageTimePerQuestion;
    userProgress.performance.averageTimePerQuestion = 
      ((currentTime * (totalQuestions - 1)) + timePerQuestion) / totalQuestions;
  } else {
    userProgress.performance.averageAccuracy = accuracy;
    userProgress.performance.averageTimePerQuestion = timePerQuestion;
  }
  
  // Update weak areas
  userProgress.performance.weakAreas = [
    ...new Set([...userProgress.performance.weakAreas, ...weakAreas])
  ];
  
  // Check if adaptive adjustments are needed
  if (this.adaptiveSettings.enabled) {
    this.checkAdaptiveAdjustments(userId);
  }
  
  return this.save();
};

// Method to check and apply adaptive adjustments
StudyPlanSchema.methods.checkAdaptiveAdjustments = function(userId) {
  const userProgress = this.userProgress.find(
    progress => progress.userId.toString() === userId.toString() && progress.isActive
  );
  
  if (!userProgress) {
    return;
  }
  
  const { averageAccuracy, averageTimePerQuestion } = userProgress.performance;
  const { accuracyLow, accuracyHigh, timeSlow } = this.adaptiveSettings.performanceThresholds;
  
  // Check accuracy-based adjustments
  if (averageAccuracy < accuracyLow && !userProgress.adjustments.difficultyAdjusted) {
    // User is struggling - adjust difficulty
    this.adjustDifficultyForUser(userId, 'easier');
    userProgress.adjustments.difficultyAdjusted = true;
  } else if (averageAccuracy > accuracyHigh && !userProgress.adjustments.difficultyAdjusted) {
    // User is excelling - increase difficulty
    this.adjustDifficultyForUser(userId, 'harder');
    userProgress.adjustments.difficultyAdjusted = true;
  }
  
  // Check pace-based adjustments
  if (averageTimePerQuestion > timeSlow && !userProgress.adjustments.paceAdjusted) {
    // User is taking too long - adjust pace
    this.adjustPaceForUser(userId, 'slower');
    userProgress.adjustments.paceAdjusted = true;
  }
  
  // Update weak areas in adjustments
  userProgress.adjustments.topicsAdded = userProgress.performance.weakAreas;
};

// Method to adjust difficulty for a user
StudyPlanSchema.methods.adjustDifficultyForUser = function(userId, direction) {
  // This would adjust the difficulty level of future questions
  // For now, just mark the adjustment
  const userProgress = this.userProgress.find(
    progress => progress.userId.toString() === userId.toString() && progress.isActive
  );
  
  if (userProgress) {
    userProgress.adjustments.difficultyAdjusted = true;
    // In a real implementation, this would modify the question assignments
  }
};

// Method to adjust pace for a user
StudyPlanSchema.methods.adjustPaceForUser = function(userId, pace) {
  const userProgress = this.userProgress.find(
    progress => progress.userId.toString() === userId.toString() && progress.isActive
  );
  
  if (userProgress) {
    userProgress.adjustments.paceAdjusted = true;
    // In a real implementation, this would adjust the daily question count
  }
};

// Method to update completion stats
StudyPlanSchema.methods.updateCompletionStats = function(userId, completedSuccessfully) {
  // Calculate average completion rate
  const activeUsers = this.userProgress.filter(up => !up.isActive && up.completedAt);
  const totalCompleted = activeUsers.length;
  
  if (totalCompleted > 0) {
    const totalDaysTaken = activeUsers.reduce((sum, up) => {
      const daysTaken = Math.ceil((up.completedAt - up.startedAt) / (1000 * 60 * 60 * 24));
      return sum + daysTaken;
    }, 0);
    
    this.stats.averageTimeToComplete = Math.round(totalDaysTaken / totalCompleted);
    this.stats.averageCompletionRate = Math.round(
      (totalCompleted / this.stats.totalUsers) * 100
    );
  }
  
  // Update success rate if completed successfully
  if (completedSuccessfully) {
    const successfulCompletions = this.userProgress.filter(
      up => !up.isActive && up.completedAt && up.progress.completionPercentage >= 80
    ).length;
    
    this.stats.successRate = Math.round(
      (successfulCompletions / totalCompleted) * 100
    );
  }
};

// Method to get plan details for user
StudyPlanSchema.methods.getUserPlanDetails = function(userId) {
  const userProgress = this.userProgress.find(
    progress => progress.userId.toString() === userId.toString()
  );
  
  const plan = this.toObject();
  
  return {
    id: plan._id,
    name: plan.name,
    description: plan.description,
    planType: plan.planType,
    goal: plan.goal,
    structure: plan.structure,
    currentDay: userProgress ? userProgress.currentDay : 1,
    progress: userProgress ? userProgress.progress : {
      daysCompleted: 0,
      questionsCompleted: 0,
      completionPercentage: 0
    },
    performance: userProgress ? userProgress.performance : null,
    adjustments: userProgress ? userProgress.adjustments : null,
    isActive: userProgress ? userProgress.isActive : false,
    assignedAt: userProgress ? userProgress.assignedAt : null,
    startedAt: userProgress ? userProgress.startedAt : null,
    completedAt: userProgress ? userProgress.completedAt : null,
    days: plan.days,
    questionAssignments: plan.questionAssignments.filter(qa => 
      !userProgress || qa.dayNumber <= userProgress.currentDay
    ),
    adaptiveSettings: plan.adaptiveSettings,
    tags: plan.tags
  };
};

// Method to get daily plan
StudyPlanSchema.methods.getDailyPlan = function(userId, dayNumber = null) {
  const userProgress = this.userProgress.find(
    progress => progress.userId.toString() === userId.toString() && progress.isActive
  );
  
  if (!userProgress) {
    throw new Error('User does not have this study plan assigned');
  }
  
  const targetDay = dayNumber || userProgress.currentDay;
  
  // Find day configuration
  const dayConfig = this.days.find(d => d.dayNumber === targetDay);
  
  if (!dayConfig) {
    throw new Error(`Day ${targetDay} not found in study plan`);
  }
  
  // Find question assignments for this day
  const dayAssignments = this.questionAssignments.filter(qa => qa.dayNumber === targetDay);
  
  return {
    dayNumber: targetDay,
    dayType: dayConfig.dayType,
    focusTopics: dayConfig.focusTopics,
    difficultyLevel: dayConfig.difficultyLevel,
    targetQuestionCount: dayConfig.targetQuestionCount || this.structure.questionsPerDay,
    prerequisites: dayConfig.prerequisites,
    notes: dayConfig.notes,
    assignments: dayAssignments,
    isRevisionDay: this.structure.revisionDays.includes(targetDay),
    isAssessmentDay: this.structure.assessmentDays.includes(targetDay),
    isRestDay: this.structure.restDays.includes(targetDay)
  };
};

// Method to share plan with other users
StudyPlanSchema.methods.shareWithUsers = function(userIds) {
  // Add users to sharedWith array if not already there
  userIds.forEach(userId => {
    if (!this.sharedWith.some(id => id.toString() === userId.toString())) {
      this.sharedWith.push(userId);
    }
  });
  
  return this.save();
};

// Method to make plan public
StudyPlanSchema.methods.makePublic = function() {
  this.isPublic = true;
  this.popularityScore = calculatePopularityScore(this);
  return this.save();
};

// Method to archive plan
StudyPlanSchema.methods.archive = function() {
  this.isArchived = true;
  this.isActive = false;
  
  // Also archive all user progress
  this.userProgress.forEach(progress => {
    progress.isActive = false;
  });
  
  return this.save();
};

// Helper function to calculate popularity score
function calculatePopularityScore(plan) {
  let score = 0;
  
  // Base score for being public
  score += 10;
  
  // Score based on number of users
  score += Math.min(plan.stats.totalUsers * 2, 50);
  
  // Score based on completion rate
  score += plan.stats.averageCompletionRate * 0.5;
  
  // Score based on success rate
  score += plan.stats.successRate * 0.3;
  
  // Bonus for popular tags
  const popularTags = ['interview', 'faang', 'beginner', '30-day'];
  const tagBonus = plan.tags.filter(tag => popularTags.includes(tag)).length * 5;
  score += tagBonus;
  
  return Math.round(score);
}

const StudyPlan = mongoose.model('StudyPlan', StudyPlanSchema);

module.exports = StudyPlan;
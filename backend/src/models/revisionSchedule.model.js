const mongoose = require('mongoose');
const { Schema } = mongoose;

const RevisionScheduleSchema = new mongoose.Schema({
  // Ownership & Context
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
  
  // Spaced Repetition Schedule
  intervals: {
    sameDay: { 
      scheduled: { type: Boolean, default: true },
      completed: { type: Boolean, default: false },
      scheduledAt: { type: Date },
      completedAt: { type: Date },
      effectiveness: { type: Number, min: 0, max: 1 } // 0-1 rating
    },
    day3: {
      scheduled: { type: Boolean, default: true },
      completed: { type: Boolean, default: false },
      scheduledAt: { type: Date },
      completedAt: { type: Date },
      effectiveness: { type: Number, min: 0, max: 1 }
    },
    day7: {
      scheduled: { type: Boolean, default: true },
      completed: { type: Boolean, default: false },
      scheduledAt: { type: Date },
      completedAt: { type: Date },
      effectiveness: { type: Number, min: 0, max: 1 }
    },
    day14: {
      scheduled: { type: Boolean, default: false },
      completed: { type: Boolean, default: false },
      scheduledAt: { type: Date },
      completedAt: { type: Date },
      effectiveness: { type: Number, min: 0, max: 1 }
    },
    day30: {
      scheduled: { type: Boolean, default: false },
      completed: { type: Boolean, default: false },
      scheduledAt: { type: Date },
      completedAt: { type: Date },
      effectiveness: { type: Number, min: 0, max: 1 }
    }
  },
  
  // Adaptive Scheduling
  adaptiveSchedule: {
    baseInterval: { type: Number, default: 1 }, // days
    currentInterval: { type: Number },
    nextReviewDue: { type: Date, index: true },
    easeFactor: { type: Number, default: 2.5 }, // SM-2 algorithm
    intervalModifier: { type: Number, default: 1 }
  },
  
  // Revision History
  revisionHistory: [{
    revisionNumber: { type: Number },
    scheduledFor: { type: Date },
    completedAt: { type: Date },
    timeTaken: { type: Number }, // seconds
    confidenceBefore: { type: Number, min: 1, max: 5 },
    confidenceAfter: { type: Number, min: 1, max: 5 },
    remembered: { type: Boolean }, // did you remember?
    notes: { type: String },
    effectivenessScore: { type: Number, min: 0, max: 1 }
  }],
  
  // Performance Metrics
  performanceMetrics: {
    totalRevisions: { type: Number, default: 0 },
    successfulRevisions: { type: Number, default: 0 },
    averageEffectiveness: { type: Number, default: 0 },
    forgettingRate: { type: Number, default: 0 },
    lastDifficulty: { type: String, enum: ['easy', 'medium', 'hard'] }
  },
  
  // Queue Management
  inQueue: { type: Boolean, default: false, index: true },
  queuePriority: { type: Number, default: 0 },
  queuePosition: { type: Number },
  
  // Manual Overrides
  manuallyRescheduled: { type: Boolean, default: false },
  rescheduledTo: { type: Date },
  pauseUntil: { type: Date },
  
  // Status
  status: { 
    type: String, 
    enum: ['active', 'paused', 'completed', 'overdue'],
    default: 'active',
    index: true 
  },
  
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
RevisionScheduleSchema.index({ userId: 1, questionId: 1 }, { unique: true });
RevisionScheduleSchema.index({ userId: 1, 'adaptiveSchedule.nextReviewDue': 1 });
RevisionScheduleSchema.index({ userId: 1, status: 1, 'adaptiveSchedule.nextReviewDue': 1 });
RevisionScheduleSchema.index({ userId: 1, inQueue: 1, queuePriority: -1 });
RevisionScheduleSchema.index({ 'adaptiveSchedule.nextReviewDue': 1, status: 'active' });

// Method to initialize schedule for a new question
RevisionScheduleSchema.statics.initializeForQuestion = async function(userId, questionId, questionDifficulty) {
  const now = new Date();
  
  // Calculate initial schedule based on difficulty
  const difficultyMultipliers = {
    easy: 1.0,
    medium: 0.8,
    hard: 0.6
  };
  
  const multiplier = difficultyMultipliers[questionDifficulty] || 1.0;
  
  // Create schedule
  const schedule = new this({
    userId,
    questionId,
    intervals: {
      sameDay: {
        scheduled: true,
        scheduledAt: now,
        completed: false
      },
      day3: {
        scheduled: true,
        scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        completed: false
      },
      day7: {
        scheduled: true,
        scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        completed: false
      },
      day14: {
        scheduled: questionDifficulty === 'hard', // Only schedule day14 for hard questions initially
        scheduledAt: questionDifficulty === 'hard' ? 
          new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : null,
        completed: false
      }
    },
    adaptiveSchedule: {
      baseInterval: 1 * multiplier,
      currentInterval: 1 * multiplier,
      nextReviewDue: now,
      easeFactor: 2.5,
      intervalModifier: multiplier
    },
    performanceMetrics: {
      lastDifficulty: questionDifficulty
    }
  });
  
  return schedule.save();
};

// Method to mark revision as completed
RevisionScheduleSchema.methods.markRevisionCompleted = function(
  intervalName, 
  effectiveness = 0.8, 
  timeTaken = null,
  confidenceBefore = null,
  confidenceAfter = null,
  remembered = true,
  notes = ''
) {
  const now = new Date();
  
  // Update the specific interval
  if (this.intervals[intervalName]) {
    this.intervals[intervalName].completed = true;
    this.intervals[intervalName].completedAt = now;
    this.intervals[intervalName].effectiveness = effectiveness;
  }
  
  // Add to revision history
  const revisionNumber = this.revisionHistory.length + 1;
  this.revisionHistory.push({
    revisionNumber,
    scheduledFor: this.intervals[intervalName]?.scheduledAt || now,
    completedAt: now,
    timeTaken,
    confidenceBefore,
    confidenceAfter,
    remembered,
    notes,
    effectivenessScore: effectiveness
  });
  
  // Update performance metrics
  this.performanceMetrics.totalRevisions += 1;
  if (remembered) {
    this.performanceMetrics.successfulRevisions += 1;
  }
  
  // Calculate average effectiveness
  const totalEffectiveness = this.revisionHistory.reduce((sum, rev) => sum + (rev.effectivenessScore || 0), 0);
  this.performanceMetrics.averageEffectiveness = totalEffectiveness / this.revisionHistory.length;
  
  // Update adaptive schedule using SM-2 algorithm
  this.updateAdaptiveSchedule(effectiveness, remembered);
  
  // Update status
  if (this.isAllRevisionsCompleted()) {
    this.status = 'completed';
  }
  
  return this.save();
};

// Method to update adaptive schedule using SM-2 algorithm
RevisionScheduleSchema.methods.updateAdaptiveSchedule = function(effectiveness, remembered) {
  // Simplified SM-2 algorithm for spaced repetition
  
  if (effectiveness >= 0.9 && remembered) {
    // Excellent recall - increase interval significantly
    this.adaptiveSchedule.easeFactor *= 1.3;
    this.adaptiveSchedule.currentInterval = Math.ceil(
      this.adaptiveSchedule.currentInterval * this.adaptiveSchedule.easeFactor
    );
  } else if (effectiveness >= 0.7 && remembered) {
    // Good recall - increase interval moderately
    this.adaptiveSchedule.easeFactor *= 1.1;
    this.adaptiveSchedule.currentInterval = Math.ceil(
      this.adaptiveSchedule.currentInterval * this.adaptiveSchedule.easeFactor
    );
  } else if (effectiveness >= 0.5 || !remembered) {
    // Poor recall or forgot - decrease interval
    this.adaptiveSchedule.easeFactor *= 0.8;
    this.adaptiveSchedule.currentInterval = Math.max(
      1, 
      Math.floor(this.adaptiveSchedule.currentInterval * 0.5)
    );
  } else {
    // Very poor recall - reset to base interval
    this.adaptiveSchedule.currentInterval = this.adaptiveSchedule.baseInterval;
    this.adaptiveSchedule.easeFactor = 2.5;
  }
  
  // Clamp ease factor between 1.3 and 3.0
  this.adaptiveSchedule.easeFactor = Math.max(1.3, Math.min(3.0, this.adaptiveSchedule.easeFactor));
  
  // Schedule next review
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + this.adaptiveSchedule.currentInterval);
  this.adaptiveSchedule.nextReviewDue = nextReview;
  
  // If we have day intervals scheduled, update them
  this.updateDayIntervals();
};

// Method to update day intervals based on adaptive schedule
RevisionScheduleSchema.methods.updateDayIntervals = function() {
  const now = new Date();
  const nextDue = this.adaptiveSchedule.nextReviewDue || now;
  
  // Enable/disable day intervals based on current adaptive interval
  const daysUntilNext = Math.ceil((nextDue - now) / (24 * 60 * 60 * 1000));
  
  // Schedule day14 if next review is more than 10 days away
  if (daysUntilNext > 10 && !this.intervals.day14.scheduled) {
    this.intervals.day14.scheduled = true;
    this.intervals.day14.scheduledAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  }
  
  // Schedule day30 if next review is more than 20 days away
  if (daysUntilNext > 20 && !this.intervals.day30.scheduled) {
    this.intervals.day30.scheduled = true;
    this.intervals.day30.scheduledAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
};

// Method to check if all revisions are completed
RevisionScheduleSchema.methods.isAllRevisionsCompleted = function() {
  const intervals = this.intervals;
  return (
    (!intervals.sameDay.scheduled || intervals.sameDay.completed) &&
    (!intervals.day3.scheduled || intervals.day3.completed) &&
    (!intervals.day7.scheduled || intervals.day7.completed) &&
    (!intervals.day14.scheduled || intervals.day14.completed) &&
    (!intervals.day30.scheduled || intervals.day30.completed)
  );
};

// Method to get next due revision
RevisionScheduleSchema.methods.getNextDueRevision = function() {
  const now = new Date();
  const intervals = this.intervals;
  
  // Check day intervals in order
  const intervalOrder = ['sameDay', 'day3', 'day7', 'day14', 'day30'];
  
  for (const intervalName of intervalOrder) {
    const interval = intervals[intervalName];
    if (interval.scheduled && !interval.completed && interval.scheduledAt <= now) {
      return {
        interval: intervalName,
        scheduledAt: interval.scheduledAt,
        isOverdue: true,
        daysOverdue: Math.ceil((now - interval.scheduledAt) / (24 * 60 * 60 * 1000))
      };
    }
  }
  
  // Check adaptive schedule
  if (this.adaptiveSchedule.nextReviewDue && this.adaptiveSchedule.nextReviewDue <= now) {
    return {
      interval: 'adaptive',
      scheduledAt: this.adaptiveSchedule.nextReviewDue,
      isOverdue: true,
      daysOverdue: Math.ceil((now - this.adaptiveSchedule.nextReviewDue) / (24 * 60 * 60 * 1000))
    };
  }
  
  // No overdue revisions, return next scheduled
  for (const intervalName of intervalOrder) {
    const interval = intervals[intervalName];
    if (interval.scheduled && !interval.completed) {
      return {
        interval: intervalName,
        scheduledAt: interval.scheduledAt,
        isOverdue: false,
        daysUntil: Math.ceil((interval.scheduledAt - now) / (24 * 60 * 60 * 1000))
      };
    }
  }
  
  // Return adaptive schedule if no day intervals left
  if (this.adaptiveSchedule.nextReviewDue) {
    return {
      interval: 'adaptive',
      scheduledAt: this.adaptiveSchedule.nextReviewDue,
      isOverdue: false,
      daysUntil: Math.ceil((this.adaptiveSchedule.nextReviewDue - now) / (24 * 60 * 60 * 1000))
    };
  }
  
  return null;
};

// Method to get schedule summary
RevisionScheduleSchema.methods.getSummary = function() {
  const nextDue = this.getNextDueRevision();
  
  return {
    questionId: this.questionId,
    status: this.status,
    nextDueRevision: nextDue,
    totalRevisions: this.performanceMetrics.totalRevisions,
    successfulRevisions: this.performanceMetrics.successfulRevisions,
    successRate: this.performanceMetrics.totalRevisions > 0 ? 
      (this.performanceMetrics.successfulRevisions / this.performanceMetrics.totalRevisions) * 100 : 0,
    averageEffectiveness: this.performanceMetrics.averageEffectiveness,
    intervals: this.intervals,
    inQueue: this.inQueue,
    queuePriority: this.queuePriority
  };
};

const RevisionSchedule = mongoose.model('RevisionSchedule', RevisionScheduleSchema);

module.exports = RevisionSchedule;
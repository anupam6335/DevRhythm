const mongoose = require('mongoose');
const { Schema } = mongoose;

const DaySchema = new mongoose.Schema({
  // Ownership
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  // Day Identity
  dayNumber: { type: Number, required: true, min: 1 },
  date: { type: Date, required: true, index: true },
  title: { type: String, default: '' },
  
  // Metadata
  type: { 
    type: String, 
    enum: ['learning', 'revision', 'mock', 'rest', 'assessment'], 
    default: 'learning' 
  },
  difficultyRating: { type: Number, min: 1, max: 5 }, // self-assessed 1-5
  productivityScore: { type: Number, min: 0, max: 100 }, // based on completion
  
  // Content
  notes: { type: String, maxlength: 2000 },
  focusTopics: [{ type: String }],
  
  // Planning
  targetQuestionCount: { type: Number, default: 5, min: 0 },
  studyPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan' },
  
  // Completion Tracking
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  
  // Questions Summary (cached)
  questionStats: {
    total: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    done: { type: Number, default: 0 },
    notSolved: { type: Number, default: 0 },
    partiallySolved: { type: Number, default: 0 },
    needHelp: { type: Number, default: 0 }
  },
  
  // Time Tracking
  totalTimeSpent: { type: Number, default: 0 }, // minutes
  startTime: { type: Date },
  endTime: { type: Date },
  
  // Revision Stats
  revisionsCompleted: { type: Number, default: 0 },
  revisionsPending: { type: Number, default: 0 },
  
  // System
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date },
  
  // Ordering
  orderIndex: { type: Number, default: 0 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  strict: true
});

// Indexes
DaySchema.index({ userId: 1, date: -1 });
DaySchema.index({ userId: 1, dayNumber: -1 });
DaySchema.index({ userId: 1, isCompleted: 1 });
DaySchema.index({ userId: 1, type: 1 });
DaySchema.index({ userId: 1, studyPlanId: 1 });
DaySchema.index({ date: 1, isCompleted: 1 });
DaySchema.index({ userId: 1, 'questionStats.done': -1 });

// Method to update question stats
DaySchema.methods.updateQuestionStats = async function() {
  const Question = mongoose.model('Question');
  
  const stats = await Question.aggregate([
    { $match: { dayId: this._id, isActive: true } },
    { 
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Initialize stats object
  const questionStats = {
    total: 0,
    pending: 0,
    done: 0,
    notSolved: 0,
    partiallySolved: 0,
    needHelp: 0
  };
  
  // Update counts based on aggregation
  stats.forEach(stat => {
    questionStats.total += stat.count;
    questionStats[stat._id.replace('-', '')] = stat.count; // Convert 'not-solved' to 'notSolved'
  });
  
  // Calculate completion percentage
  if (questionStats.total > 0) {
    this.completionPercentage = Math.round((questionStats.done / questionStats.total) * 100);
  } else {
    this.completionPercentage = 0;
  }
  
  // Update day stats
  this.questionStats = questionStats;
  
  // Auto-complete if all questions are done
  if (questionStats.total > 0 && questionStats.done === questionStats.total) {
    this.isCompleted = true;
    this.completedAt = new Date();
  }
  
  return this.save();
};

// Method to get day summary
DaySchema.methods.getSummary = function() {
  const day = this.toObject();
  return {
    id: day._id,
    dayNumber: day.dayNumber,
    date: day.date,
    title: day.title,
    type: day.type,
    difficultyRating: day.difficultyRating,
    productivityScore: day.productivityScore,
    questionStats: day.questionStats,
    completionPercentage: day.completionPercentage,
    isCompleted: day.isCompleted,
    totalTimeSpent: day.totalTimeSpent,
    focusTopics: day.focusTopics,
    notes: day.notes
  };
};

const Day = mongoose.model('Day', DaySchema);

module.exports = Day;
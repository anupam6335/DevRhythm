const mongoose = require('mongoose');

const PatternMasterySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  patternName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  solvedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  masteredCount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAttempts: {
    type: Number,
    default: 0,
    min: 0
  },
  successfulAttempts: {
    type: Number,
    default: 0,
    min: 0
  },
  successRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  masteryRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  confidenceLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 1,
    index: true
  },
  totalTimeSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  averageTimePerQuestion: {
    type: Number,
    default: 0,
    min: 0
  },
  lastPracticed: {
    type: Date,
    default: null,
    index: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true
  },
  recentQuestions: [{
    questionProgressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserQuestionProgress'
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    title: {
      type: String,
      trim: true
    },
    problemLink: {
      type: String,
      trim: true
    },
    platform: {
      type: String,
      enum: ['LeetCode', 'Codeforces', 'HackerRank', 'AtCoder', 'CodeChef', 'Other']
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard']
    },
    solvedAt: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['Solved', 'Mastered']
    },
    timeSpent: {
      type: Number,
      min: 0
    }
  }],
  difficultyBreakdown: {
    easy: {
      solved: { type: Number, default: 0 },
      mastered: { type: Number, default: 0 },
      totalTime: { type: Number, default: 0 },
      successRate: { type: Number, default: 0, min: 0, max: 100 }
    },
    medium: {
      solved: { type: Number, default: 0 },
      mastered: { type: Number, default: 0 },
      totalTime: { type: Number, default: 0 },
      successRate: { type: Number, default: 0, min: 0, max: 100 }
    },
    hard: {
      solved: { type: Number, default: 0 },
      mastered: { type: Number, default: 0 },
      totalTime: { type: Number, default: 0 },
      successRate: { type: Number, default: 0, min: 0, max: 100 }
    }
  },
  platformDistribution: {
    LeetCode: { type: Number, default: 0 },
    HackerRank: { type: Number, default: 0 },
    CodeForces: { type: Number, default: 0 },
    Other: { type: Number, default: 0 }
  },
  trend: {
    last7Days: {
      solved: { type: Number, default: 0 },
      mastered: { type: Number, default: 0 },
      successRate: { type: Number, default: 0, min: 0, max: 100 }
    },
    last30Days: {
      solved: { type: Number, default: 0 },
      mastered: { type: Number, default: 0 },
      successRate: { type: Number, default: 0, min: 0, max: 100 }
    },
    improvementRate: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  strict: 'throw'
});

PatternMasterySchema.index({ userId: 1, patternName: 1 }, { unique: true });
PatternMasterySchema.index({ userId: 1, confidenceLevel: -1 });
PatternMasterySchema.index({ userId: 1, masteryRate: -1 });
PatternMasterySchema.index({ userId: 1, lastPracticed: -1 });
PatternMasterySchema.index({ userId: 1, solvedCount: -1 });
PatternMasterySchema.index({ patternName: 1, masteryRate: -1 });
PatternMasterySchema.index({ userId: 1, updatedAt: -1 });

PatternMasterySchema.virtual('questionCount').get(function() {
  return this.solvedCount;
});

module.exports = mongoose.model('PatternMastery', PatternMasterySchema);
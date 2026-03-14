const mongoose = require("mongoose");

const UserQuestionProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  status: {
    type: String,
    enum: ["Not Started", "Attempted", "Solved", "Mastered"],
    default: "Not Started",
  },
  attempts: {
    count: {
      type: Number,
      default: 0,
    },
    lastAttemptAt: Date,
    firstAttemptAt: Date,
    solvedAt: Date,
    masteredAt: Date,
  },
  attemptHistory: [{
    timestamp: {
      type: Date,
      default: Date.now,
    },
    outcome: {
      type: String,
      enum: ['success', 'failure'],
      required: true,
    },
    timeSpent: {
      type: Number,
      min: 0,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  }],
  notes: String,
  keyInsights: String,
  savedCode: {
    language: String,
    code: String,
    lastUpdated: Date,
  },
  lastRevisedAt: Date,
  revisionCount: {
    type: Number,
    default: 0,
  },
  totalTimeSpent: {
    type: Number,
    default: 0,
  },
  confidenceLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 1,
  },
  userDifficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: null,
  },
  userTags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  userPatterns: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
});

UserQuestionProgressSchema.index({ userId: 1, questionId: 1 }, { unique: true });
UserQuestionProgressSchema.index({ userId: 1, status: 1 });
UserQuestionProgressSchema.index({ userId: 1, updatedAt: -1 });
UserQuestionProgressSchema.index({ userId: 1, lastRevisedAt: 1 });
UserQuestionProgressSchema.index({ userId: 1, "attempts.count": -1 });
UserQuestionProgressSchema.index({ questionId: 1, status: 1 });
UserQuestionProgressSchema.index({ userId: 1, confidenceLevel: -1 });
UserQuestionProgressSchema.index({ userId: 1, "attempts.count": 1 });
UserQuestionProgressSchema.index({ userId: 1, userTags: 1 });

// Helper to enqueue a pattern‑mastery recalculation job
const enqueuePatternMasteryRecalc = (userId) => {
  try {
    const { jobQueue } = require('../services/queue.service');
    if (jobQueue) {
      jobQueue.add({
        type: 'pattern-mastery.recalc',
        userId,
      }).catch(err => console.error('Failed to enqueue pattern mastery recalc:', err));
    } else {
      console.warn('Job queue not available, pattern mastery not updated');
    }
  } catch (err) {
    console.error('Error enqueuing pattern mastery recalc:', err);
  }
};

// Post-save hook – trigger recalculation
UserQuestionProgressSchema.post('save', async function(doc) {
  enqueuePatternMasteryRecalc(doc.userId);
});

// Post-update hook – trigger recalculation
UserQuestionProgressSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    enqueuePatternMasteryRecalc(doc.userId);
  }
});

// Post-delete hook – trigger recalculation
UserQuestionProgressSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    enqueuePatternMasteryRecalc(doc.userId);
  }
});

module.exports = mongoose.model("UserQuestionProgress", UserQuestionProgressSchema);
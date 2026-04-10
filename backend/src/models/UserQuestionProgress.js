const mongoose = require("mongoose");
const { recalculateProgress } = require('../services/progressAuto.service');

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
  personalDifficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: false,
  },
  personalContentRef: {
    type: String,
    trim: true,
    required: false,
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
  customTestCases: [{
    stdin: { type: String, required: true },
    expected: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
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
UserQuestionProgressSchema.index({ userId: 1, personalDifficulty: 1 });

// ----- Auto‑recalculation hooks -----
UserQuestionProgressSchema.post('save', async function(doc) {
  if (doc.__recursing) return;
  doc.__recursing = true;
  try {
    const changed = recalculateProgress(doc);
    if (changed) {
      await doc.save();
    }
  } catch (error) {
    console.error('Progress auto‑recalc error (save):', error);
  } finally {
    delete doc.__recursing;
  }
});

UserQuestionProgressSchema.post('findOneAndUpdate', async function(doc) {
  if (!doc) return;
  if (doc.__recursing) return;
  doc.__recursing = true;
  try {
    const changed = recalculateProgress(doc);
    if (changed) {
      await doc.save();
    }
  } catch (error) {
    console.error('Progress auto‑recalc error (update):', error);
  } finally {
    delete doc.__recursing;
  }
});

// ----- Existing pattern‑mastery hooks -----
UserQuestionProgressSchema.post('save', async function(doc) {
  try {
    const patternMasteryService = require('../services/patternMastery.service');
    setTimeout(async () => {
      await patternMasteryService.updatePatternMasteryFromProgress(doc.userId, doc._id);
    }, 100);
  } catch (error) {
    console.error('Pattern mastery post‑save sync error:', error);
  }
});

UserQuestionProgressSchema.post('findOneAndUpdate', async function(doc) {
  try {
    if (doc) {
      const patternMasteryService = require('../services/patternMastery.service');
      setTimeout(async () => {
        await patternMasteryService.updatePatternMasteryFromProgress(doc.userId, doc._id);
      }, 100);
    }
  } catch (error) {
    console.error('Pattern mastery post‑update sync error:', error);
  }
});

UserQuestionProgressSchema.post('findOneAndDelete', async function(doc) {
  try {
    if (doc) {
      const patternMasteryService = require('../services/patternMastery.service');
      setTimeout(async () => {
        await patternMasteryService.updatePatternMasteryFromProgress(doc.userId, doc._id);
      }, 100);
    }
  } catch (error) {
    console.error('Pattern mastery post‑delete sync error:', error);
  }
});

module.exports = mongoose.model("UserQuestionProgress", UserQuestionProgressSchema);
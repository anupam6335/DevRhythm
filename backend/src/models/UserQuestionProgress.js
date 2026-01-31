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

module.exports = mongoose.model("UserQuestionProgress", UserQuestionProgressSchema);
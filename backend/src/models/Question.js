const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  problemLink: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  platform: {
    type: String,
    enum: ["LeetCode", "Codeforces", "HackerRank", "AtCoder", "CodeChef", "GeeksForGeeks", "Other"],
    required: true,
  },
  platformQuestionId: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    required: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  pattern: {
    type: String,
    trim: true,
  },
  solutionLinks: [{
    type: String,
    trim: true,
  }],
  similarQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
  }],
  contentRef: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

QuestionSchema.index({ platform: 1, platformQuestionId: 1 }, { unique: true });
QuestionSchema.index({ difficulty: 1 });
QuestionSchema.index({ pattern: 1 });
QuestionSchema.index({ tags: 1 });
QuestionSchema.index({ title: "text", pattern: "text" });
QuestionSchema.index({ platform: 1, difficulty: 1, pattern: 1 });

module.exports = mongoose.model("Question", QuestionSchema);
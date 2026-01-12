const mongoose = require('mongoose');
const { Schema } = mongoose;

const QuestionSchema = new mongoose.Schema({
  // Ownership & Context
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  dayId: { type: mongoose.Schema.Types.ObjectId, ref: 'Day', index: true },
  
  // Basic Info
  title: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 5000 },
  
  // Source & Links
  platform: { 
    type: String, 
    enum: ['leetcode', 'codeforces', 'hackerrank', 'atcoder', 'codewars', 'custom', 'other'],
    required: true 
  },
  platformId: { type: String }, // ID on the external platform
  primaryLink: { type: String, required: true },
  resourceLinks: [{ type: String }],
  
  // Categorization
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    required: true,
    index: true 
  },
  
  // Tags & Classification
  tags: [{ type: String, index: true }],
  problemType: [{ type: String }], // Two Pointers, DP, BFS, etc.
  dataStructure: [{ type: String }], // Array, Tree, Graph, etc.
  algorithmCategory: [{ type: String }], // Sorting, Searching, etc.
  companyTags: [{ type: String, index: true }], // Google, Meta, Amazon
  frequencyTag: { type: String, enum: ['high', 'medium', 'low'] },
  
  // Popular Lists
  inLists: [{
    listName: { type: String }, // Blind 75, NeetCode 150, etc.
    listId: { type: String }
  }],
  
  // Status & Progress
  status: { 
    type: String, 
    enum: ['pending', 'done', 'not-solved', 'partially-solved', 'need-help'],
    default: 'pending',
    index: true 
  },
  solvedAt: { type: Date },
  firstAttemptTime: { type: Number }, // seconds on first attempt
  
  // Understanding & Confidence
  confidenceScore: { type: Number, min: 1, max: 5 }, // 1-5 how well understood
  personalRating: { type: Number, min: 1, max: 5 }, // 1-5 importance to user
  understandingLevel: { 
    type: String, 
    enum: ['memorized', 'understood', 'mastered'] 
  },
  solutionCompleteness: {
    code: { type: Boolean, default: false },
    explanation: { type: Boolean, default: false },
    both: { type: Boolean, default: false }
  },
  
  // Notes & Solution
  notes: { type: String, maxlength: 10000 },
  solutionCode: { type: String },
  solutionExplanation: { type: String },
  
  // Ordering & Presentation
  orderIndex: { type: Number, default: 0 }, // within day
  isPinned: { type: Boolean, default: false },
  
  // Revision State
  lastRevisedAt: { type: Date },
  revisionCount: { type: Number, default: 0 },
  nextRevisionDue: { type: Date },
  
  // Relationships
  prerequisites: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Question',
    index: true 
  }],
  relatedQuestions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Question',
    index: true 
  }],
  similarQuestions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'QuestionLibrary',
    index: true 
  }],
  
  // Template Reference
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionLibrary' },
  
  // System
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  strict: true
});

// Indexes
QuestionSchema.index({ userId: 1, dayId: 1 });
QuestionSchema.index({ userId: 1, status: 1 });
QuestionSchema.index({ userId: 1, difficulty: 1 });
QuestionSchema.index({ userId: 1, platform: 1 });
QuestionSchema.index({ userId: 1, 'companyTags': 1 });
QuestionSchema.index({ userId: 1, 'problemType': 1 });
QuestionSchema.index({ userId: 1, nextRevisionDue: 1 });
QuestionSchema.index({ userId: 1, 'tags': 1 });
QuestionSchema.index({ userId: 1, createdAt: -1 });
QuestionSchema.index({ platform: 1, platformId: 1 }, { sparse: true });

// Method to mark as solved
QuestionSchema.methods.markAsSolved = function(timeTaken = null) {
  this.status = 'done';
  this.solvedAt = new Date();
  
  if (timeTaken && !this.firstAttemptTime) {
    this.firstAttemptTime = timeTaken;
  }
  
  // Update solution completeness if code or explanation exists
  if (this.solutionCode || this.solutionExplanation) {
    this.solutionCompleteness.code = !!this.solutionCode;
    this.solutionCompleteness.explanation = !!this.solutionExplanation;
    this.solutionCompleteness.both = !!this.solutionCode && !!this.solutionExplanation;
  }
  
  return this.save();
};

// Method to update revision schedule
QuestionSchema.methods.scheduleRevision = function() {
  const now = new Date();
  this.lastRevisedAt = now;
  
  // Simple spaced repetition: schedule next revision based on current revision count
  const intervals = [1, 3, 7, 14, 30]; // days
  const nextInterval = this.revisionCount < intervals.length ? intervals[this.revisionCount] : 30;
  
  const nextRevision = new Date(now);
  nextRevision.setDate(nextRevision.getDate() + nextInterval);
  this.nextRevisionDue = nextRevision;
  
  this.revisionCount += 1;
  
  return this.save();
};

// Method to get question preview
QuestionSchema.methods.getPreview = function() {
  const question = this.toObject();
  return {
    id: question._id,
    title: question.title,
    difficulty: question.difficulty,
    platform: question.platform,
    status: question.status,
    tags: question.tags,
    confidenceScore: question.confidenceScore,
    solvedAt: question.solvedAt,
    primaryLink: question.primaryLink
  };
};

const Question = mongoose.model('Question', QuestionSchema);

module.exports = Question;
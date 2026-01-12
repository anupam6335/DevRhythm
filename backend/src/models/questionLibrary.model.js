const mongoose = require('mongoose');
const { Schema } = mongoose;

const QuestionLibrarySchema = new mongoose.Schema({
  // Source & Identity
  platform: { 
    type: String, 
    required: true,
    enum: ['leetcode', 'codeforces', 'hackerrank', 'atcoder', 'codewars', 'custom'],
    index: true 
  },
  platformId: { type: String, required: true, index: true },
  externalUrl: { type: String, required: true },
  
  // Basic Info
  title: { type: String, required: true, index: true },
  description: { type: String, maxlength: 10000 },
  problemStatement: { type: String, maxlength: 20000 },
  
  // Categorization
  difficulty: { 
    type: String, 
    required: true,
    enum: ['easy', 'medium', 'hard'],
    index: true 
  },
  
  // Comprehensive Tags
  tags: [{ type: String, index: true }],
  problemType: [{ type: String, index: true }], // Two Pointers, DP, BFS, etc.
  dataStructure: [{ type: String, index: true }], // Array, Tree, Graph, etc.
  algorithmCategory: [{ type: String, index: true }], // Sorting, Searching, etc.
  companyTags: [{ type: String, index: true }], // Google, Meta, Amazon
  
  // Popular Lists Inclusion
  inLists: [{
    listName: { type: String, required: true }, // Blind 75, NeetCode 150, etc.
    listId: { type: String },
    listPosition: { type: Number }
  }],
  
  // Frequency & Importance
  interviewFrequency: { 
    type: String, 
    enum: ['high', 'medium', 'low'],
    index: true 
  },
  popularityScore: { type: Number, default: 0, index: true },
  mustSolve: { type: Boolean, default: false, index: true },
  
  // Solution & Resources
  solutionApproaches: [{
    approachName: { type: String },
    timeComplexity: { type: String },
    spaceComplexity: { type: String },
    explanation: { type: String },
    codeSnippet: { type: String },
    language: { type: String }
  }],
  resourceLinks: [{
    type: { type: String, enum: ['video', 'article', 'forum', 'official'] },
    url: { type: String },
    title: { type: String },
    language: { type: String }
  }],
  
  // Relationships
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuestionLibrary' }],
  relatedQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuestionLibrary' }],
  similarQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuestionLibrary' }],
  followUpQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuestionLibrary' }],
  
  // Community Data
  communityStats: {
    totalAttempts: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 }
  },
  
  // Difficulty Calibration
  difficultyCalibration: {
    communityRating: { type: Number, min: 1, max: 10 },
    calibratedDifficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    calibrationConfidence: { type: Number, min: 0, max: 1 }
  },
  
  // Template Properties
  isTemplate: { type: Boolean, default: false },
  templateFor: [{ type: String }], // problem patterns this serves as template for
  
  // AI & Recommendations
  aiMetadata: {
    embeddingVector: [{ type: Number }], // for similarity search
    keywords: [{ type: String }],
    topicConfidence: { type: mongoose.Schema.Types.Mixed } // topic -> confidence score
  },
  
  // Metadata
  metadata: {
    createdAtSource: { type: Date },
    lastUpdatedAtSource: { type: Date },
    isPremium: { type: Boolean, default: false },
    languagesSupported: [{ type: String }]
  },
  
  // System
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  lastSynced: { type: Date },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  strict: true
});

// Indexes
QuestionLibrarySchema.index({ platform: 1, platformId: 1 }, { unique: true });
QuestionLibrarySchema.index({ difficulty: 1, popularityScore: -1 });
QuestionLibrarySchema.index({ tags: 1, difficulty: 1 });
QuestionLibrarySchema.index({ companyTags: 1 });
QuestionLibrarySchema.index({ problemType: 1 });
QuestionLibrarySchema.index({ 'inLists.listName': 1, 'inLists.listPosition': 1 });
QuestionLibrarySchema.index({ interviewFrequency: 1, popularityScore: -1 });
QuestionLibrarySchema.index({ mustSolve: 1, difficulty: 1 });

// Static method to find similar questions
QuestionLibrarySchema.statics.findSimilarQuestions = async function(questionId, limit = 5) {
  const QuestionLibrary = mongoose.model('QuestionLibrary');
  const sourceQuestion = await QuestionLibrary.findById(questionId);
  
  if (!sourceQuestion) {
    return [];
  }
  
  // Find questions with similar tags
  const similarByTags = await QuestionLibrary.find({
    _id: { $ne: questionId },
    tags: { $in: sourceQuestion.tags },
    difficulty: sourceQuestion.difficulty,
    isActive: true
  })
  .limit(limit)
  .sort({ popularityScore: -1 });
  
  // If we have AI embeddings, use them for better similarity
  if (sourceQuestion.aiMetadata?.embeddingVector && sourceQuestion.aiMetadata.embeddingVector.length > 0) {
    // In a real implementation, use vector similarity search
    // For now, return tag-based similarity
    return similarByTags;
  }
  
  return similarByTags;
};

// Static method to get questions by list
QuestionLibrarySchema.statics.getQuestionsByList = async function(listName, filters = {}) {
  const query = {
    'inLists.listName': listName,
    isActive: true
  };
  
  // Apply filters
  if (filters.difficulty) {
    query.difficulty = filters.difficulty;
  }
  
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }
  
  if (filters.companyTags && filters.companyTags.length > 0) {
    query.companyTags = { $in: filters.companyTags };
  }
  
  return this.find(query)
    .sort({ 'inLists.listPosition': 1 })
    .select('title difficulty tags companyTags platform externalUrl inLists popularityScore');
};

// Static method to update community stats
QuestionLibrarySchema.statics.updateCommunityStats = async function(questionId, attemptData) {
  const QuestionLibrary = mongoose.model('QuestionLibrary');
  
  const question = await QuestionLibrary.findById(questionId);
  if (!question) {
    throw new Error('Question not found');
  }
  
  // Update community stats
  question.communityStats.totalAttempts += 1;
  
  if (attemptData.success) {
    const currentSuccessRate = question.communityStats.successRate;
    const newSuccessRate = ((currentSuccessRate * (question.communityStats.totalAttempts - 1)) + 100) / question.communityStats.totalAttempts;
    question.communityStats.successRate = Math.round(newSuccessRate);
  } else {
    const currentSuccessRate = question.communityStats.successRate;
    const newSuccessRate = (currentSuccessRate * (question.communityStats.totalAttempts - 1)) / question.communityStats.totalAttempts;
    question.communityStats.successRate = Math.round(newSuccessRate);
  }
  
  if (attemptData.timeTaken) {
    const currentAverage = question.communityStats.averageTime;
    const newAverage = ((currentAverage * (question.communityStats.totalAttempts - 1)) + attemptData.timeTaken) / question.communityStats.totalAttempts;
    question.communityStats.averageTime = Math.round(newAverage);
  }
  
  if (attemptData.upvote) {
    question.communityStats.upvotes += 1;
  }
  
  if (attemptData.downvote) {
    question.communityStats.downvotes += 1;
  }
  
  if (attemptData.rating) {
    const currentRating = question.communityStats.rating;
    const newRating = ((currentRating * (question.communityStats.totalAttempts - 1)) + attemptData.rating) / question.communityStats.totalAttempts;
    question.communityStats.rating = Math.round(newRating * 10) / 10; // Keep 1 decimal place
  }
  
  // Recalculate difficulty calibration based on community stats
  await question.recalibrateDifficulty();
  
  return question.save();
};

// Method to recalibrate difficulty based on community stats
QuestionLibrarySchema.methods.recalibrateDifficulty = async function() {
  if (this.communityStats.totalAttempts < 10) {
    // Not enough data to recalibrate
    return;
  }
  
  // Calculate calibration based on success rate and average time
  const successRate = this.communityStats.successRate;
  const averageTime = this.communityStats.averageTime;
  
  // Define thresholds for difficulty calibration
  // These are example thresholds, should be tuned based on actual data
  const difficultyScores = {
    easy: { minSuccess: 70, maxTime: 900 }, // 70% success, 15 min average
    medium: { minSuccess: 40, maxTime: 1800 }, // 40% success, 30 min average
    hard: { minSuccess: 20, maxTime: 3600 } // 20% success, 60 min average
  };
  
  let calibratedDifficulty = this.difficulty;
  let calibrationConfidence = 0.5; // Default confidence
  
  // Check if current difficulty matches community performance
  const expectedThresholds = difficultyScores[this.difficulty];
  
  if (expectedThresholds) {
    const successDiff = Math.abs(successRate - expectedThresholds.minSuccess);
    const timeDiff = Math.abs(averageTime - expectedThresholds.maxTime);
    
    // Calculate confidence based on how close performance is to expected
    const successConfidence = 1 - (successDiff / 100); // 0-1 scale
    const timeConfidence = 1 - (timeDiff / (expectedThresholds.maxTime * 2)); // Normalized
    
    calibrationConfidence = (successConfidence + timeConfidence) / 2;
    
    // If confidence is low, consider recalibrating
    if (calibrationConfidence < 0.3) {
      // Find better matching difficulty
      let bestMatch = this.difficulty;
      let bestScore = 0;
      
      for (const [difficulty, thresholds] of Object.entries(difficultyScores)) {
        const matchScore = calculateMatchScore(successRate, averageTime, thresholds);
        if (matchScore > bestScore) {
          bestScore = matchScore;
          bestMatch = difficulty;
        }
      }
      
      if (bestMatch !== this.difficulty && bestScore > 0.6) {
        calibratedDifficulty = bestMatch;
        calibrationConfidence = bestScore;
      }
    }
  }
  
  // Update calibration data
  this.difficultyCalibration = {
    communityRating: this.communityStats.rating,
    calibratedDifficulty,
    calibrationConfidence: Math.round(calibrationConfidence * 100) / 100
  };
  
  // Only update main difficulty if confidence is high
  if (calibrationConfidence > 0.7 && calibratedDifficulty !== this.difficulty) {
    this.difficulty = calibratedDifficulty;
  }
};

// Helper function to calculate match score
function calculateMatchScore(successRate, averageTime, thresholds) {
  const successScore = 1 - (Math.abs(successRate - thresholds.minSuccess) / 100);
  const timeScore = 1 - (Math.abs(averageTime - thresholds.maxTime) / (thresholds.maxTime * 2));
  
  // Weight success rate more heavily
  return (successScore * 0.7) + (timeScore * 0.3);
}

// Method to get question preview
QuestionLibrarySchema.methods.getPreview = function() {
  const question = this.toObject();
  
  return {
    id: question._id,
    title: question.title,
    difficulty: question.difficulty,
    platform: question.platform,
    externalUrl: question.externalUrl,
    tags: question.tags,
    problemType: question.problemType,
    dataStructure: question.dataStructure,
    companyTags: question.companyTags,
    interviewFrequency: question.interviewFrequency,
    popularityScore: question.popularityScore,
    mustSolve: question.mustSolve,
    inLists: question.inLists,
    communityStats: {
      successRate: question.communityStats.successRate,
      rating: question.communityStats.rating,
      totalAttempts: question.communityStats.totalAttempts
    },
    difficultyCalibration: question.difficultyCalibration
  };
};

// Method to get detailed question info
QuestionLibrarySchema.methods.getDetailedInfo = function() {
  const preview = this.getPreview();
  
  return {
    ...preview,
    description: this.description,
    problemStatement: this.problemStatement,
    solutionApproaches: this.solutionApproaches,
    resourceLinks: this.resourceLinks,
    prerequisites: this.prerequisites,
    relatedQuestions: this.relatedQuestions,
    similarQuestions: this.similarQuestions,
    followUpQuestions: this.followUpQuestions,
    metadata: this.metadata,
    isTemplate: this.isTemplate,
    templateFor: this.templateFor
  };
};

// Method to get question as template
QuestionLibrarySchema.methods.asTemplate = function(userId, customizations = {}) {
  const templateData = {
    title: customizations.title || this.title,
    description: customizations.description || this.description,
    platform: this.platform,
    platformId: this.platformId,
    primaryLink: this.externalUrl,
    resourceLinks: this.resourceLinks.map(rl => rl.url),
    difficulty: customizations.difficulty || this.difficulty,
    tags: customizations.tags || this.tags,
    problemType: customizations.problemType || this.problemType,
    dataStructure: customizations.dataStructure || this.dataStructure,
    algorithmCategory: customizations.algorithmCategory || this.algorithmCategory,
    companyTags: customizations.companyTags || this.companyTags,
    frequencyTag: this.interviewFrequency,
    inLists: this.inLists,
    templateId: this._id
  };
  
  return templateData;
};

// Static method to search questions
QuestionLibrarySchema.statics.searchQuestions = async function(searchParams, page = 1, limit = 20) {
  const query = { isActive: true };
  const sort = { popularityScore: -1 };
  
  // Text search
  if (searchParams.query) {
    query.$text = { $search: searchParams.query };
    sort.score = { $meta: 'textScore' };
  }
  
  // Difficulty filter
  if (searchParams.difficulty) {
    query.difficulty = Array.isArray(searchParams.difficulty) 
      ? { $in: searchParams.difficulty }
      : searchParams.difficulty;
  }
  
  // Tags filter
  if (searchParams.tags && searchParams.tags.length > 0) {
    query.tags = { $in: searchParams.tags };
  }
  
  // Company filter
  if (searchParams.companies && searchParams.companies.length > 0) {
    query.companyTags = { $in: searchParams.companies };
  }
  
  // Problem type filter
  if (searchParams.problemTypes && searchParams.problemTypes.length > 0) {
    query.problemType = { $in: searchParams.problemTypes };
  }
  
  // List filter
  if (searchParams.list) {
    query['inLists.listName'] = searchParams.list;
  }
  
  // Must-solve filter
  if (searchParams.mustSolve !== undefined) {
    query.mustSolve = searchParams.mustSolve;
  }
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Execute query
  const [questions, total] = await Promise.all([
    this.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('title difficulty tags companyTags platform externalUrl popularityScore mustSolve inLists communityStats'),
    this.countDocuments(query)
  ]);
  
  return {
    questions: questions.map(q => q.getPreview()),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

// Static method to get recommended questions for user
QuestionLibrarySchema.statics.getRecommendationsForUser = async function(userId, limit = 10) {
  // In a real implementation, this would use the user's performance data
  // and AI to generate personalized recommendations
  
  // For now, return popular questions across different categories
  const Question = mongoose.model('Question');
  
  // Get user's solved questions to avoid recommending them
  const solvedQuestions = await Question.find({
    userId,
    status: 'done',
    isActive: true
  }).select('templateId');
  
  const solvedTemplateIds = solvedQuestions
    .map(q => q.templateId)
    .filter(id => id)
    .map(id => id.toString());
  
  // Get questions the user hasn't solved yet
  const query = {
    isActive: true,
    _id: { $nin: solvedTemplateIds }
  };
  
  // Return a mix of difficulties and categories
  const recommendations = await this.aggregate([
    { $match: query },
    { $sample: { size: limit * 2 } }, // Get more than needed for variety
    { 
      $project: {
        title: 1,
        difficulty: 1,
        tags: 1,
        companyTags: 1,
        popularityScore: 1,
        mustSolve: 1,
        externalUrl: 1,
        platform: 1,
        difficultyScore: {
          $switch: {
            branches: [
              { case: { $eq: ['$difficulty', 'easy'] }, then: 1 },
              { case: { $eq: ['$difficulty', 'medium'] }, then: 2 },
              { case: { $eq: ['$difficulty', 'hard'] }, then: 3 }
            ],
            default: 0
          }
        }
      }
    },
    { $sort: { mustSolve: -1, popularityScore: -1, difficultyScore: 1 } },
    { $limit: limit }
  ]);
  
  return recommendations;
};

const QuestionLibrary = mongoose.model('QuestionLibrary', QuestionLibrarySchema);

module.exports = QuestionLibrary;
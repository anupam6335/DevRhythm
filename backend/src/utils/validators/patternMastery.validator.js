const Joi = require('joi');

const getPatternMasteryList = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  minConfidence: Joi.number().integer().min(1).max(5),
  maxConfidence: Joi.number().integer().min(1).max(5),
  minSolved: Joi.number().integer().min(0),
  minMasteryRate: Joi.number().min(0).max(100),
  sortBy: Joi.string().valid('confidenceLevel', 'masteryRate', 'solvedCount', 'lastPracticed').default('confidenceLevel'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().trim().min(1).max(50)
});

const getPatternMastery = Joi.object({
  patternName: Joi.string().trim().required()
});

const getRecommendations = Joi.object({
  limit: Joi.number().integer().min(1).max(10).default(5),
  focus: Joi.string().valid('weakest', 'needsPractice', 'highestPotential').default('weakest')
});

const getWeakestPatterns = Joi.object({
  limit: Joi.number().integer().min(1).max(20).default(5),
  metric: Joi.string().valid('confidence', 'masteryRate', 'lastPracticed').default('confidence')
});

const getStrongestPatterns = Joi.object({
  limit: Joi.number().integer().min(1).max(20).default(5),
  metric: Joi.string().valid('confidence', 'masteryRate', 'lastPracticed').default('confidence')
});

const getPatternProgress = Joi.object({
  patternName: Joi.string().trim(),
  startDate: Joi.date(),
  endDate: Joi.date(),
  period: Joi.string().valid('week', 'month', 'quarter').default('month')
});

module.exports = {
  getPatternMasteryList,
  getPatternMastery,
  getRecommendations,
  getWeakestPatterns,
  getStrongestPatterns,
  getPatternProgress
};
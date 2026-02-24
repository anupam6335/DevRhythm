const PatternMastery = require('../models/PatternMastery');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const Question = require('../models/Question');
const { formatResponse } = require('../utils/helpers/response');
const { getPaginationParams, paginate } = require('../utils/helpers/pagination');
const { getStartOfDay, getEndOfDay, getDaysBetween } = require('../utils/helpers/date');
const AppError = require('../utils/errors/AppError');
const { invalidateCache } = require('../middleware/cache');

const getPatternMasteryList = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { minConfidence, maxConfidence, minSolved, minMasteryRate, sortBy = 'confidenceLevel', sortOrder = 'desc', search } = req.query;
    const query = { userId: req.user._id };
    
    if (minConfidence) query.confidenceLevel = { $gte: parseInt(minConfidence) };
    if (maxConfidence) query.confidenceLevel = { ...query.confidenceLevel, $lte: parseInt(maxConfidence) };
    if (minSolved) query.solvedCount = { $gte: parseInt(minSolved) };
    if (minMasteryRate) query.masteryRate = { $gte: parseFloat(minMasteryRate) };
    if (search) query.patternName = { $regex: search, $options: 'i' };
    
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const [patterns, total] = await Promise.all([
      PatternMastery.find(query).sort(sort).skip(skip).limit(limit).lean(),
      PatternMastery.countDocuments(query)
    ]);
    
    res.json(formatResponse('Pattern mastery list retrieved', { patterns }, { pagination: paginate(total, page, limit) }));
  } catch (error) { next(error); }
};

const getPatternMastery = async (req, res, next) => {
  try {
    const pattern = await PatternMastery.findOne({
      userId: req.user._id,
      patternName: req.params.patternName
    }).lean();
    
    if (!pattern) throw new AppError('Pattern mastery not found', 404);
    
    res.json(formatResponse('Pattern mastery retrieved', { pattern }));
  } catch (error) { next(error); }
};

const getPatternStats = async (req, res, next) => {
  try {
    const patterns = await PatternMastery.find({ userId: req.user._id }).lean();
    
    const stats = {
      totalPatterns: patterns.length,
      totalSolved: patterns.reduce((sum, p) => sum + p.solvedCount, 0),
      totalMastered: patterns.reduce((sum, p) => sum + p.masteredCount, 0),
      averageConfidence: patterns.length ? patterns.reduce((sum, p) => sum + p.confidenceLevel, 0) / patterns.length : 0,
      averageMasteryRate: patterns.length ? patterns.reduce((sum, p) => sum + p.masteryRate, 0) / patterns.length : 0,
      strongestPattern: patterns.length ? patterns.reduce((a, b) => a.masteryRate > b.masteryRate ? a : b) : null,
      weakestPattern: patterns.length ? patterns.reduce((a, b) => a.masteryRate < b.masteryRate ? a : b) : null,
      patternsByConfidence: {
        1: patterns.filter(p => p.confidenceLevel === 1).length,
        2: patterns.filter(p => p.confidenceLevel === 2).length,
        3: patterns.filter(p => p.confidenceLevel === 3).length,
        4: patterns.filter(p => p.confidenceLevel === 4).length,
        5: patterns.filter(p => p.confidenceLevel === 5).length
      }
    };
    
    res.json(formatResponse('Pattern mastery stats retrieved', { stats }));
  } catch (error) { next(error); }
};

const getRecommendations = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const focus = req.query.focus || 'weakest';
    
    const patterns = await PatternMastery.find({ userId: req.user._id }).lean();
    
    let recommendations = [];
    if (focus === 'weakest') {
      recommendations = patterns
        .sort((a, b) => a.confidenceLevel - b.confidenceLevel || a.masteryRate - b.masteryRate)
        .slice(0, limit);
    } else if (focus === 'needsPractice') {
      recommendations = patterns
        .filter(p => p.lastPracticed && getDaysBetween(p.lastPracticed, new Date()) > 7)
        .sort((a, b) => getDaysBetween(a.lastPracticed, new Date()) - getDaysBetween(b.lastPracticed, new Date()))
        .slice(0, limit);
    } else if (focus === 'highestPotential') {
      recommendations = patterns
        .filter(p => p.solvedCount > 0 && p.masteryRate < 50)
        .sort((a, b) => (b.solvedCount - a.solvedCount) || (b.masteryRate - a.masteryRate))
        .slice(0, limit);
    }
    
    res.json(formatResponse('Pattern recommendations retrieved', { recommendations }));
  } catch (error) { next(error); }
};

const getWeakestPatterns = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const metric = req.query.metric || 'confidence';
    
    const patterns = await PatternMastery.find({ userId: req.user._id }).lean();
    
    let weakest = [];
    if (metric === 'confidence') {
      weakest = patterns.sort((a, b) => a.confidenceLevel - b.confidenceLevel).slice(0, limit);
    } else if (metric === 'masteryRate') {
      weakest = patterns.sort((a, b) => a.masteryRate - b.masteryRate).slice(0, limit);
    } else if (metric === 'lastPracticed') {
      weakest = patterns
        .sort((a, b) => new Date(a.lastPracticed || 0) - new Date(b.lastPracticed || 0))
        .slice(0, limit);
    }
    
    res.json(formatResponse('Weakest patterns retrieved', { weakest }));
  } catch (error) { next(error); }
};

const getStrongestPatterns = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const metric = req.query.metric || 'confidence';
    
    const patterns = await PatternMastery.find({ userId: req.user._id }).lean();
    
    let strongest = [];
    if (metric === 'confidence') {
      strongest = patterns.sort((a, b) => b.confidenceLevel - a.confidenceLevel).slice(0, limit);
    } else if (metric === 'masteryRate') {
      strongest = patterns.sort((a, b) => b.masteryRate - a.masteryRate).slice(0, limit);
    } else if (metric === 'lastPracticed') {
      strongest = patterns
        .filter(p => p.lastPracticed)
        .sort((a, b) => new Date(b.lastPracticed) - new Date(a.lastPracticed))
        .slice(0, limit);
    }
    
    res.json(formatResponse('Strongest patterns retrieved', { strongest }));
  } catch (error) { next(error); }
};

const getPatternProgress = async (req, res, next) => {
  try {
    const { patternName, startDate, endDate, period = 'month' } = req.query;
    const query = { userId: req.user._id };
    if (patternName) query.patternName = patternName;
    
    const patterns = await PatternMastery.find(query).lean();
    
    const now = new Date();
    let progressData = [];
    
    patterns.forEach(pattern => {
      const progress = {
        patternName: pattern.patternName,
        solvedCount: pattern.solvedCount,
        masteredCount: pattern.masteredCount,
        masteryRate: pattern.masteryRate,
        confidenceLevel: pattern.confidenceLevel,
        lastPracticed: pattern.lastPracticed,
        trend: pattern.trend
      };
      
      if (period === 'week') {
        progress.weeklyChange = pattern.trend.last7Days.improvementRate;
      } else if (period === 'month') {
        progress.monthlyChange = pattern.trend.last30Days.improvementRate;
      }
      
      progressData.push(progress);
    });
    
    res.json(formatResponse('Pattern progress retrieved', { progress: progressData }));
  } catch (error) { next(error); }
};

const syncPatternMastery = async (userId, questionProgress) => {
  try {
    const question = await Question.findById(questionProgress.questionId);
    if (!question || !question.pattern) return;
    
    const patternName = question.pattern;
    let patternMastery = await PatternMastery.findOne({ userId, patternName });
    
    if (!patternMastery) {
      patternMastery = new PatternMastery({
        userId,
        patternName,
        solvedCount: 0,
        masteredCount: 0,
        totalAttempts: 0,
        successfulAttempts: 0,
        confidenceLevel: 1,
        lastPracticed: new Date()
      });
    }
    
    const patternProgress = await UserQuestionProgress.find({
      userId,
      questionId: { $in: await Question.find({ pattern: patternName }).distinct('_id') }
    }).populate('questionId');
    
    const solvedProgress = patternProgress.filter(p => p.status === 'Solved' || p.status === 'Mastered');
    const masteredProgress = patternProgress.filter(p => p.status === 'Mastered');
    
    patternMastery.solvedCount = solvedProgress.length;
    patternMastery.masteredCount = masteredProgress.length;
    patternMastery.totalAttempts = patternProgress.reduce((sum, p) => sum + (p.attempts?.count || 0), 0);
    patternMastery.successfulAttempts = solvedProgress.length;
    patternMastery.totalTimeSpent = patternProgress.reduce((sum, p) => sum + (p.totalTimeSpent || 0), 0);
    
    patternMastery.successRate = patternMastery.totalAttempts > 0
      ? (patternMastery.successfulAttempts / patternMastery.totalAttempts) * 100
      : 0;
    
    const totalPatternQuestions = await Question.countDocuments({ pattern: patternName });
    patternMastery.masteryRate = totalPatternQuestions > 0
      ? (patternMastery.masteredCount / totalPatternQuestions) * 100
      : 0;
    
    patternMastery.averageTimePerQuestion = patternMastery.solvedCount > 0
      ? patternMastery.totalTimeSpent / patternMastery.solvedCount
      : 0;
    
    patternMastery.lastPracticed = new Date();
    patternMastery.lastUpdated = new Date();
    
    await patternMastery.save();
    await invalidateCache(`pattern-mastery:*:user:${userId}:*`);
    
    return patternMastery;
  } catch (error) {
    console.error('Pattern mastery sync error:', error);
  }
};

module.exports = {
  getPatternMasteryList,
  getPatternMastery,
  getPatternStats,
  getRecommendations,
  getWeakestPatterns,
  getStrongestPatterns,
  getPatternProgress,
  syncPatternMastery
};
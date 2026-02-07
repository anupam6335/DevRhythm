const PatternMastery = require('../models/PatternMastery');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const Question = require('../models/Question');
const { getStartOfDay, getDaysBetween } = require('../utils/helpers/date');

const calculatePatternStats = async (userId, patternName) => {
  try {
    const patternQuestions = await Question.find({ pattern: patternName }).distinct('_id');
    const progressRecords = await UserQuestionProgress.find({
      userId,
      questionId: { $in: patternQuestions }
    }).populate('questionId', 'difficulty platform');
    
    const solved = progressRecords.filter(p => p.status === 'Solved' || p.status === 'Mastered');
    const mastered = progressRecords.filter(p => p.status === 'Mastered');
    
    const difficultyBreakdown = { easy: { solved: 0, mastered: 0, totalTime: 0 }, medium: { solved: 0, mastered: 0, totalTime: 0 }, hard: { solved: 0, mastered: 0, totalTime: 0 } };
    const platformDistribution = { LeetCode: 0, HackerRank: 0, CodeForces: 0, Other: 0 };
    let totalTimeSpent = 0;
    let totalAttempts = 0;
    
    solved.forEach(record => {
      const difficulty = record.questionId?.difficulty?.toLowerCase();
      const platform = record.questionId?.platform;
      
      if (difficulty && difficultyBreakdown[difficulty]) {
        difficultyBreakdown[difficulty].solved++;
        if (record.status === 'Mastered') difficultyBreakdown[difficulty].mastered++;
        difficultyBreakdown[difficulty].totalTime += record.totalTimeSpent || 0;
      }
      
      if (platform) {
        if (platformDistribution[platform] !== undefined) {
          platformDistribution[platform]++;
        } else {
          platformDistribution.Other++;
        }
      }
      
      totalTimeSpent += record.totalTimeSpent || 0;
      totalAttempts += record.attempts?.count || 0;
    });
    
    const totalPatternQuestions = patternQuestions.length;
    const successRate = totalAttempts > 0 ? (solved.length / totalAttempts) * 100 : 0;
    const masteryRate = totalPatternQuestions > 0 ? (mastered.length / totalPatternQuestions) * 100 : 0;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSolved30 = solved.filter(p => p.attempts?.solvedAt >= thirtyDaysAgo);
    const recentSolved7 = solved.filter(p => p.attempts?.solvedAt >= sevenDaysAgo);
    
    const recentMastered30 = mastered.filter(p => p.attempts?.masteredAt >= thirtyDaysAgo);
    const recentMastered7 = mastered.filter(p => p.attempts?.masteredAt >= sevenDaysAgo);
    
    const recentSuccessRate30 = recentSolved30.length > 0 ? 
      (recentSolved30.length / recentSolved30.reduce((sum, p) => sum + (p.attempts?.count || 1), 0)) * 100 : 0;
    const recentSuccessRate7 = recentSolved7.length > 0 ? 
      (recentSolved7.length / recentSolved7.reduce((sum, p) => sum + (p.attempts?.count || 1), 0)) * 100 : 0;
    
    const confidenceLevel = calculateConfidenceLevel(masteryRate, successRate, recentSuccessRate7);
    
    return {
      solvedCount: solved.length,
      masteredCount: mastered.length,
      totalAttempts,
      successfulAttempts: solved.length,
      successRate,
      masteryRate,
      confidenceLevel,
      totalTimeSpent,
      averageTimePerQuestion: solved.length > 0 ? totalTimeSpent / solved.length : 0,
      difficultyBreakdown,
      platformDistribution,
      trend: {
        last7Days: {
          solved: recentSolved7.length,
          mastered: recentMastered7.length,
          successRate: recentSuccessRate7
        },
        last30Days: {
          solved: recentSolved30.length,
          mastered: recentMastered30.length,
          successRate: recentSuccessRate30
        },
        improvementRate: recentSuccessRate7 - (recentSuccessRate30 - recentSuccessRate7)
      }
    };
  } catch (error) {
    console.error('Pattern stats calculation error:', error);
    return null;
  }
};

const calculateConfidenceLevel = (masteryRate, successRate, recentSuccessRate) => {
  if (masteryRate >= 80 && successRate >= 90) return 5;
  if (masteryRate >= 60 && successRate >= 80) return 4;
  if (masteryRate >= 40 && successRate >= 70) return 3;
  if (masteryRate >= 20 && successRate >= 60) return 2;
  return 1;
};

const updatePatternMasteryFromProgress = async (userId, questionProgressId) => {
  try {
    const progress = await UserQuestionProgress.findById(questionProgressId)
      .populate('questionId', 'pattern difficulty platform title problemLink');
    
    if (!progress || !progress.questionId?.pattern) return null;
    
    const patternName = progress.questionId.pattern;
    const stats = await calculatePatternStats(userId, patternName);
    if (!stats) return null;
    
    const recentQuestions = await UserQuestionProgress.find({
      userId,
      questionId: { $in: await Question.find({ pattern: patternName }).distinct('_id') },
      $or: [{ status: 'Solved' }, { status: 'Mastered' }]
    })
      .populate('questionId', 'title problemLink platform difficulty')
      .sort({ 'attempts.solvedAt': -1 })
      .limit(5)
      .lean();
    
    const recentQuestionsFormatted = recentQuestions.map(rq => ({
      questionProgressId: rq._id,
      questionId: rq.questionId._id,
      title: rq.questionId.title,
      problemLink: rq.questionId.problemLink,
      platform: rq.questionId.platform,
      difficulty: rq.questionId.difficulty,
      solvedAt: rq.attempts?.solvedAt || rq.updatedAt,
      status: rq.status,
      timeSpent: rq.totalTimeSpent || 0
    }));
    
    const lastPracticed = recentQuestionsFormatted[0]?.solvedAt || new Date();
    
    const updateData = {
      ...stats,
      lastPracticed,
      lastUpdated: new Date(),
      recentQuestions: recentQuestionsFormatted
    };
    
    const patternMastery = await PatternMastery.findOneAndUpdate(
      { userId, patternName },
      updateData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    return patternMastery;
  } catch (error) {
    console.error('Pattern mastery update error:', error);
    return null;
  }
};

const getPatternRecommendations = async (userId, limit = 5) => {
  try {
    const patterns = await PatternMastery.find({ userId }).lean();
    const allPatterns = await Question.distinct('pattern', { pattern: { $ne: '' } });
    
    const userPatterns = patterns.map(p => p.patternName);
    const missingPatterns = allPatterns.filter(p => !userPatterns.includes(p));
    
    const recommendations = [];
    
    patterns.sort((a, b) => a.confidenceLevel - b.confidenceLevel || a.masteryRate - b.masteryRate)
      .slice(0, limit)
      .forEach(pattern => {
        recommendations.push({
          patternName: pattern.patternName,
          type: 'weakest',
          reason: 'Low confidence and mastery rate',
          confidenceLevel: pattern.confidenceLevel,
          masteryRate: pattern.masteryRate,
          suggestedAction: 'Practice more problems in this pattern'
        });
      });
    
    if (recommendations.length < limit && missingPatterns.length > 0) {
      missingPatterns.slice(0, limit - recommendations.length).forEach(pattern => {
        recommendations.push({
          patternName: pattern,
          type: 'new',
          reason: 'You have not practiced this pattern yet',
          confidenceLevel: 1,
          masteryRate: 0,
          suggestedAction: 'Start learning this pattern with basic problems'
        });
      });
    }
    
    return recommendations;
  } catch (error) {
    console.error('Pattern recommendations error:', error);
    return [];
  }
};

module.exports = {
  calculatePatternStats,
  updatePatternMasteryFromProgress,
  getPatternRecommendations,
  calculateConfidenceLevel
};
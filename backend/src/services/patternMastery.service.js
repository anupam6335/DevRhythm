const PatternMastery = require('../models/PatternMastery');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const Question = require('../models/Question');
const constants = require('../config/constants');

/**
 * Recalculate all pattern mastery data for a user from scratch.
 * Called via background job after any progress change.
 */
const recalculateAllPatternsForUser = async (userId) => {
  try {
    // 1. Fetch all progress records with question data
    const progressRecords = await UserQuestionProgress.find({ userId })
      .populate('questionId', 'pattern difficulty platform title problemLink')
      .lean();

    // 2. Build a map: patternName -> aggregated stats
    const patternStats = new Map();

    for (const record of progressRecords) {
      const patterns = new Set();

      // Add question's pattern if exists
      if (record.questionId?.pattern) {
        patterns.add(record.questionId.pattern);
      }

      // Add user-defined patterns
      if (record.userPatterns && Array.isArray(record.userPatterns)) {
        record.userPatterns.forEach(p => patterns.add(p));
      }

      for (const patternName of patterns) {
        if (!patternStats.has(patternName)) {
          patternStats.set(patternName, {
            solvedCount: 0,
            masteredCount: 0,
            totalAttempts: 0,
            successfulAttempts: 0,
            totalTimeSpent: 0,
            lastPracticed: null,
            difficultyBreakdown: {
              easy: { solved: 0, mastered: 0, totalTime: 0 },
              medium: { solved: 0, mastered: 0, totalTime: 0 },
              hard: { solved: 0, mastered: 0, totalTime: 0 }
            },
            platformDistribution: { LeetCode: 0, HackerRank: 0, CodeForces: 0, Other: 0 },
            recentQuestions: [],
            // For trend calculation
            solvedDates: [],          // store solvedAt dates for trend
          });
        }

        const stats = patternStats.get(patternName);
        const isSolved = record.status === 'Solved' || record.status === 'Mastered';
        const isMastered = record.status === 'Mastered';

        if (isSolved) {
          stats.solvedCount++;
          if (isMastered) stats.masteredCount++;

          // Update difficulty breakdown
          const difficulty = record.questionId?.difficulty?.toLowerCase();
          if (difficulty && stats.difficultyBreakdown[difficulty]) {
            stats.difficultyBreakdown[difficulty].solved++;
            if (isMastered) stats.difficultyBreakdown[difficulty].mastered++;
            stats.difficultyBreakdown[difficulty].totalTime += record.totalTimeSpent || 0;
          }

          // Update platform distribution
          const platform = record.questionId?.platform;
          if (platform) {
            if (stats.platformDistribution.hasOwnProperty(platform)) {
              stats.platformDistribution[platform]++;
            } else {
              stats.platformDistribution.Other++;
            }
          }

          // Track last practiced
          const solvedDate = record.attempts?.solvedAt || record.updatedAt;
          if (!stats.lastPracticed || solvedDate > stats.lastPracticed) {
            stats.lastPracticed = solvedDate;
          }

          // Store solved date for trends
          stats.solvedDates.push(solvedDate);

          // Add to recent questions
          stats.recentQuestions.push({
            questionProgressId: record._id,
            questionId: record.questionId._id,
            title: record.questionId.title,
            problemLink: record.questionId.problemLink,
            platform: record.questionId.platform,
            difficulty: record.questionId.difficulty,
            solvedAt: solvedDate,
            status: record.status,
            timeSpent: record.totalTimeSpent || 0,
          });
        }

        // Always update attempt counts
        stats.totalAttempts += record.attempts?.count || 0;
        stats.successfulAttempts += isSolved ? 1 : 0;
        stats.totalTimeSpent += record.totalTimeSpent || 0;
      }
    }

    // 3. Sort and limit recent questions for each pattern
    for (const stats of patternStats.values()) {
      stats.recentQuestions.sort((a, b) => new Date(b.solvedAt) - new Date(a.solvedAt));
      if (stats.recentQuestions.length > 10) stats.recentQuestions.pop();
    }

    // 4. Pre‑fetch global pattern totals (only for patterns that exist in Question model)
    const globalPatternTotals = await Question.aggregate([
      { $match: { pattern: { $ne: '' } } },
      { $group: { _id: '$pattern', count: { $sum: 1 } } }
    ]);
    const globalPatternCountMap = new Map(globalPatternTotals.map(p => [p._id, p.count]));

    const existingPatterns = await PatternMastery.find({ userId }).select('patternName').lean();
    const existingNames = new Set(existingPatterns.map(p => p.patternName));

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (const [patternName, stats] of patternStats) {
      const successRate = stats.totalAttempts > 0 ? (stats.successfulAttempts / stats.totalAttempts) * 100 : 0;

      // Compute masteryRate
      let masteryRate;
      if (globalPatternCountMap.has(patternName)) {
        const totalPatternQuestions = globalPatternCountMap.get(patternName);
        masteryRate = totalPatternQuestions > 0 ? (stats.masteredCount / totalPatternQuestions) * 100 : 0;
      } else {
        // User-defined pattern
        masteryRate = stats.solvedCount > 0 ? (stats.masteredCount / stats.solvedCount) * 100 : 0;
      }

      // Calculate trends
      const solvedDates = stats.solvedDates; // all solved dates
      const last7DaysSolved = solvedDates.filter(d => d >= sevenDaysAgo).length;
      const last30DaysSolved = solvedDates.filter(d => d >= thirtyDaysAgo).length;

      // Count mastered in last periods
      const last7DaysMastered = stats.recentQuestions.filter(
        q => q.status === 'Mastered' && q.solvedAt >= sevenDaysAgo
      ).length;
      const last30DaysMastered = stats.recentQuestions.filter(
        q => q.status === 'Mastered' && q.solvedAt >= thirtyDaysAgo
      ).length;

      // For success rate in trends, we need attempts within those periods. We don't have per-attempt dates, so we approximate using solved counts.
      // A better approximation: assume each solved question corresponds to one successful attempt, and total attempts in period = solved * (average attempts per solved). But that's complex.
      // We'll set trend successRate to the overall successRate for now.
      const trendLast7Days = {
        solved: last7DaysSolved,
        mastered: last7DaysMastered,
        successRate: successRate
      };
      const trendLast30Days = {
        solved: last30DaysSolved,
        mastered: last30DaysMastered,
        successRate: successRate
      };
      const improvementRate = trendLast7Days.solved - (trendLast30Days.solved / 30 * 7); // simple weekly average comparison

      const confidenceLevel = calculateConfidenceLevel(masteryRate, successRate, trendLast7Days.successRate);

      const averageTimePerQuestion = stats.solvedCount > 0 ? stats.totalTimeSpent / stats.solvedCount : 0;

      await PatternMastery.findOneAndUpdate(
        { userId, patternName },
        {
          $set: {
            solvedCount: stats.solvedCount,
            masteredCount: stats.masteredCount,
            totalAttempts: stats.totalAttempts,
            successfulAttempts: stats.successfulAttempts,
            successRate,
            masteryRate,
            confidenceLevel,
            totalTimeSpent: stats.totalTimeSpent,
            averageTimePerQuestion,
            lastPracticed: stats.lastPracticed,
            lastUpdated: new Date(),
            recentQuestions: stats.recentQuestions,
            difficultyBreakdown: stats.difficultyBreakdown,
            platformDistribution: stats.platformDistribution,
            trend: {
              last7Days: trendLast7Days,
              last30Days: trendLast30Days,
              improvementRate
            }
          }
        },
        { upsert: true }
      );
    }

    // Remove patterns no longer present
    for (const name of existingNames) {
      if (!patternStats.has(name)) {
        await PatternMastery.deleteOne({ userId, patternName: name });
      }
    }

    console.log(`Pattern mastery recalculated for user ${userId}`);
  } catch (error) {
    console.error(`Error recalculating pattern mastery for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Calculate confidence level (1–5) based on masteryRate, successRate, and recent success.
 */
const calculateConfidenceLevel = (masteryRate, successRate, recentSuccessRate) => {
  const thresholds = constants.CONFIDENCE_THRESHOLDS || {
    LEVEL_5: { mastery: 80, success: 90 },
    LEVEL_4: { mastery: 60, success: 80 },
    LEVEL_3: { mastery: 40, success: 70 },
    LEVEL_2: { mastery: 20, success: 60 }
  };
  if (masteryRate >= thresholds.LEVEL_5.mastery && successRate >= thresholds.LEVEL_5.success) return 5;
  if (masteryRate >= thresholds.LEVEL_4.mastery && successRate >= thresholds.LEVEL_4.success) return 4;
  if (masteryRate >= thresholds.LEVEL_3.mastery && successRate >= thresholds.LEVEL_3.success) return 3;
  if (masteryRate >= thresholds.LEVEL_2.mastery && successRate >= thresholds.LEVEL_2.success) return 2;
  return 1;
};

/**
 * Calculate pattern stats for a single pattern (legacy function, kept for backward compatibility).
 */
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

/**
 * Update pattern mastery from a single progress record (legacy function, kept for backward compatibility).
 */
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

/**
 * Get pattern recommendations for a user (weakest, needs practice, etc.)
 */
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
  calculateConfidenceLevel,
  recalculateAllPatternsForUser,
};
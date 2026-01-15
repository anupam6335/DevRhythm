const mongoose = require('mongoose');
const { Schema } = mongoose;

const AnalyticsSummarySchema = new mongoose.Schema({
  // Ownership & Period
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  periodType: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
    required: true,
    index: true 
  },
  periodStart: { type: Date, required: true, index: true },
  periodEnd: { type: Date, required: true },
  
  // Identification
  weekNumber: { type: Number }, // ISO week
  month: { type: Number }, // 1-12
  year: { type: Number },
  customLabel: { type: String },
  
  // Overall Progress
  totals: {
    daysActive: { type: Number, default: 0 },
    questionsAttempted: { type: Number, default: 0 },
    questionsSolved: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 }, // minutes
    revisionsCompleted: { type: Number, default: 0 }
  },
  
  // Difficulty Breakdown
  byDifficulty: {
    easy: {
      attempted: { type: Number, default: 0 },
      solved: { type: Number, default: 0 },
      timeSpent: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 }
    },
    medium: {
      attempted: { type: Number, default: 0 },
      solved: { type: Number, default: 0 },
      timeSpent: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 }
    },
    hard: {
      attempted: { type: Number, default: 0 },
      solved: { type: Number, default: 0 },
      timeSpent: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 }
    }
  },
  
  // Topic Performance
  byTopic: [{
    topic: { type: String, required: true },
    attempted: { type: Number, default: 0 },
    solved: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 }, // minutes
    accuracy: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    weaknessScore: { type: Number, default: 0 } // 0-100, higher = weaker
  }],
  
  // Company Focus
  byCompany: [{
    company: { type: String },
    questionCount: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 }
  }],
  
  // Time Analytics
  timeDistribution: {
    learning: { type: Number, default: 0 }, // minutes
    revision: { type: Number, default: 0 },
    mockTests: { type: Number, default: 0 },
    planning: { type: Number, default: 0 }
  },
  
  // Daily Patterns
  dailyPatterns: [{
    dayOfWeek: { type: Number, min: 0, max: 6 }, // 0 = Sunday
    averageQuestions: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 },
    productivityScore: { type: Number, default: 0 }
  }],
  
  // Revision Effectiveness
  revisionMetrics: {
    totalScheduled: { type: Number, default: 0 },
    totalCompleted: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    averageEffectiveness: { type: Number, default: 0 },
    retentionRate: { type: Number, default: 0 }
  },
  
  // Streak & Consistency
  streakData: {
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    consistencyScore: { type: Number, default: 0 },
    productiveDays: { type: Number, default: 0 }
  },
  
  // Velocity & Improvement
  improvementMetrics: {
    questionsPerDayVelocity: { type: Number, default: 0 },
    accuracyImprovement: { type: Number, default: 0 },
    timeEfficiencyImprovement: { type: Number, default: 0 },
    confidenceGrowth: { type: Number, default: 0 }
  },
  
  // Weakness Detection
  identifiedWeaknesses: [{
    topic: { type: String },
    weaknessLevel: { type: String, enum: ['high', 'medium', 'low'] },
    suggestedActions: [{ type: String }],
    improvementTarget: { type: Number }
  }],
  
  // Benchmarks & Comparison
  benchmarks: {
    peerAverageQuestions: { type: Number },
    peerAverageTime: { type: Number },
    percentileRank: { type: Number }, // 0-100
    trendVsLastPeriod: { type: String, enum: ['improving', 'stable', 'declining'] }
  },
  
  // Heatmap Data (for calendar view)
  heatmapData: [{
    date: { type: Date },
    activityLevel: { type: Number, min: 0, max: 4 }, // 0-4 intensity
    questionCount: { type: Number },
    timeSpent: { type: Number }
  }],
  
  // Recommendations
  recommendations: [{
    type: { type: String, enum: ['focus-area', 'next-topic', 'practice-method', 'pace-adjustment'] },
    priority: { type: String, enum: ['high', 'medium', 'low'] },
    description: { type: String },
    actionItems: [{ type: String }]
  }],
  
  // Export & Sharing
  exportMetadata: { // Renamed from exportData to avoid conflict
    lastExported: { type: Date },
    exportFormat: { type: String },
    shareToken: { type: String }
  },
  
  // System
  isActive: { type: Boolean, default: true },
  lastUpdated: { type: Date },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  strict: true
});

// Indexes
AnalyticsSummarySchema.index({ userId: 1, periodType: 1, periodStart: -1 });
AnalyticsSummarySchema.index({ userId: 1, year: 1, weekNumber: 1 }, { sparse: true });
AnalyticsSummarySchema.index({ userId: 1, year: 1, month: 1 }, { sparse: true });
AnalyticsSummarySchema.index({ userId: 1, 'periodStart': 1, 'periodEnd': 1 });
AnalyticsSummarySchema.index({ periodType: 1, periodStart: 1 });

// Static method to generate analytics for a period
AnalyticsSummarySchema.statics.generateForPeriod = async function(
  userId, 
  periodType, 
  periodStart, 
  periodEnd,
  customLabel = null
) {
  const Question = mongoose.model('Question');
  const Day = mongoose.model('Day');
  const Timer = mongoose.model('Timer');
  const RevisionSchedule = mongoose.model('RevisionSchedule');
  
  // Calculate week number, month, year
  const periodDate = new Date(periodStart);
  const weekNumber = getWeekNumber(periodDate);
  const month = periodDate.getMonth() + 1;
  const year = periodDate.getFullYear();
  
  // Get questions for period
  const questions = await Question.find({
    userId,
    createdAt: { $gte: periodStart, $lte: periodEnd },
    isActive: true
  }).populate('dayId');
  
  // Get days for period
  const days = await Day.find({
    userId,
    date: { $gte: periodStart, $lte: periodEnd },
    isActive: true
  });
  
  // Get timers for period
  const timers = await Timer.find({
    userId,
    createdAt: { $gte: periodStart, $lte: periodEnd },
    isActive: true
  });
  
  // Get revision schedules
  const revisionSchedules = await RevisionSchedule.find({
    userId,
    'intervals.sameDay.completedAt': { $gte: periodStart, $lte: periodEnd },
    isActive: true
  });
  
  // Calculate totals
  const totals = {
    daysActive: days.length,
    questionsAttempted: questions.length,
    questionsSolved: questions.filter(q => q.status === 'done').length,
    timeSpent: Math.floor(timers.reduce((sum, timer) => sum + (timer.totalElapsedTime || 0), 0) / (1000 * 60)), // convert ms to minutes
    revisionsCompleted: revisionSchedules.filter(rs => 
      rs.intervals.sameDay.completed || 
      rs.intervals.day3.completed || 
      rs.intervals.day7.completed
    ).length
  };
  
  // Calculate by difficulty
  const byDifficulty = {
    easy: calculateDifficultyStats(questions, timers, 'easy'),
    medium: calculateDifficultyStats(questions, timers, 'medium'),
    hard: calculateDifficultyStats(questions, timers, 'hard')
  };
  
  // Calculate by topic (simplified - using tags as topics)
  const topicMap = new Map();
  questions.forEach(question => {
    question.tags?.forEach(tag => {
      if (!topicMap.has(tag)) {
        topicMap.set(tag, {
          attempted: 0,
          solved: 0,
          timeSpent: 0,
          confidenceSum: 0,
          count: 0
        });
      }
      
      const stats = topicMap.get(tag);
      stats.attempted++;
      if (question.status === 'done') {
        stats.solved++;
      }
      
      // Find timer for this question to get time spent
      const questionTimer = timers.find(t => t.questionId.equals(question._id));
      if (questionTimer) {
        stats.timeSpent += questionTimer.totalElapsedTime || 0;
      }
      
      if (question.confidenceScore) {
        stats.confidenceSum += question.confidenceScore;
        stats.count++;
      }
    });
  });
  
  const byTopic = Array.from(topicMap.entries()).map(([topic, stats]) => ({
    topic,
    attempted: stats.attempted,
    solved: stats.solved,
    timeSpent: Math.floor(stats.timeSpent / (1000 * 60)), // minutes
    accuracy: stats.attempted > 0 ? (stats.solved / stats.attempted) * 100 : 0,
    confidence: stats.count > 0 ? stats.confidenceSum / stats.count : 0,
    weaknessScore: calculateWeaknessScore(stats.attempted, stats.solved, stats.confidenceSum / stats.count || 0)
  }));
  
  // Calculate daily patterns
  const dailyPatterns = calculateDailyPatterns(days, questions, timers);
  
  // Calculate revision metrics
  const revisionMetrics = calculateRevisionMetrics(revisionSchedules);
  
  // Calculate time distribution
  const timeDistribution = {
    learning: calculateTimeByDayType(days, timers, 'learning'),
    revision: calculateTimeByDayType(days, timers, 'revision'),
    mockTests: calculateTimeByDayType(days, timers, 'mock'),
    planning: 0 // Placeholder - would need planning data
  };
  
  // Get user streak data
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  const streakData = user ? {
    currentStreak: user.streak.currentStreak || 0,
    longestStreak: user.streak.longestStreak || 0,
    consistencyScore: user.streak.consistencyScore || 0,
    productiveDays: days.filter(d => d.productivityScore > 50).length
  } : {
    currentStreak: 0,
    longestStreak: 0,
    consistencyScore: 0,
    productiveDays: 0
  };
  
  // Calculate improvement metrics (compared to previous period)
  const improvementMetrics = await calculateImprovementMetrics(
    userId, periodType, periodStart, periodEnd
  );
  
  // Identify weaknesses
  const identifiedWeaknesses = identifyWeaknesses(byTopic, byDifficulty);
  
  // Generate recommendations
  const recommendations = generateRecommendations(identifiedWeaknesses, improvementMetrics, totals);
  
  // Create heatmap data
  const heatmapData = generateHeatmapData(days, questions, periodStart, periodEnd);
  
  // Create analytics summary
  const analyticsSummary = new this({
    userId,
    periodType,
    periodStart,
    periodEnd,
    weekNumber,
    month,
    year,
    customLabel,
    totals,
    byDifficulty,
    byTopic,
    byCompany: [], // Would need company tag data
    timeDistribution,
    dailyPatterns,
    revisionMetrics,
    streakData,
    improvementMetrics,
    identifiedWeaknesses,
    benchmarks: {
      // Placeholder benchmarks - would need peer data
      peerAverageQuestions: 15,
      peerAverageTime: 120,
      percentileRank: calculatePercentileRank(totals.questionsSolved),
      trendVsLastPeriod: improvementMetrics.questionsPerDayVelocity > 0 ? 'improving' : 
                        improvementMetrics.questionsPerDayVelocity < 0 ? 'declining' : 'stable'
    },
    heatmapData,
    recommendations,
    lastUpdated: new Date()
  });
  
  return analyticsSummary.save();
};

// Helper functions
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function calculateDifficultyStats(questions, timers, difficulty) {
  const difficultyQuestions = questions.filter(q => q.difficulty === difficulty);
  const solved = difficultyQuestions.filter(q => q.status === 'done').length;
  
  // Calculate total time for this difficulty
  const difficultyTimers = timers.filter(t => {
    const question = questions.find(q => q._id.equals(t.questionId));
    return question && question.difficulty === difficulty;
  });
  
  const timeSpent = Math.floor(
    difficultyTimers.reduce((sum, timer) => sum + (timer.totalElapsedTime || 0), 0) / (1000 * 60)
  );
  
  return {
    attempted: difficultyQuestions.length,
    solved,
    timeSpent,
    accuracy: difficultyQuestions.length > 0 ? (solved / difficultyQuestions.length) * 100 : 0
  };
}

function calculateWeaknessScore(attempted, solved, confidence) {
  if (attempted === 0) return 100; // Highest weakness if not attempted
  
  const accuracy = solved / attempted;
  const accuracyScore = (1 - accuracy) * 50; // 0-50 based on accuracy
  const confidenceScore = (1 - (confidence / 5)) * 50; // 0-50 based on confidence
  
  return Math.min(100, accuracyScore + confidenceScore);
}

function calculateDailyPatterns(days, questions, timers) {
  const patterns = Array(7).fill().map((_, i) => ({
    dayOfWeek: i,
    averageQuestions: 0,
    averageTime: 0,
    productivityScore: 0,
    count: 0
  }));
  
  days.forEach(day => {
    const dayOfWeek = day.date.getDay();
    const pattern = patterns[dayOfWeek];
    
    // Count questions for this day
    const dayQuestions = questions.filter(q => q.dayId && q.dayId.equals(day._id));
    
    // Count timers for this day
    const dayTimers = timers.filter(t => t.dayId && t.dayId.equals(day._id));
    const dayTime = Math.floor(
      dayTimers.reduce((sum, timer) => sum + (timer.totalElapsedTime || 0), 0) / (1000 * 60)
    );
    
    pattern.count++;
    pattern.averageQuestions += dayQuestions.length;
    pattern.averageTime += dayTime;
    pattern.productivityScore += day.productivityScore || 0;
  });
  
  // Calculate averages
  return patterns.map(pattern => ({
    dayOfWeek: pattern.dayOfWeek,
    averageQuestions: pattern.count > 0 ? pattern.averageQuestions / pattern.count : 0,
    averageTime: pattern.count > 0 ? pattern.averageTime / pattern.count : 0,
    productivityScore: pattern.count > 0 ? pattern.productivityScore / pattern.count : 0
  }));
}

function calculateRevisionMetrics(revisionSchedules) {
  const totalScheduled = revisionSchedules.length;
  const totalCompleted = revisionSchedules.filter(rs => 
    rs.intervals.sameDay.completed || 
    rs.intervals.day3.completed || 
    rs.intervals.day7.completed
  ).length;
  
  // Calculate average effectiveness
  let totalEffectiveness = 0;
  let effectivenessCount = 0;
  
  revisionSchedules.forEach(rs => {
    const intervals = ['sameDay', 'day3', 'day7', 'day14', 'day30'];
    intervals.forEach(interval => {
      if (rs.intervals[interval]?.effectiveness) {
        totalEffectiveness += rs.intervals[interval].effectiveness;
        effectivenessCount++;
      }
    });
  });
  
  const averageEffectiveness = effectivenessCount > 0 ? totalEffectiveness / effectivenessCount : 0;
  
  // Calculate retention rate (simplified)
  const retentionRate = totalScheduled > 0 ? 
    (revisionSchedules.filter(rs => 
      rs.performanceMetrics.successfulRevisions > 0
    ).length / totalScheduled) * 100 : 0;
  
  return {
    totalScheduled,
    totalCompleted,
    completionRate: totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0,
    averageEffectiveness,
    retentionRate
  };
}

function calculateTimeByDayType(days, timers, dayType) {
  const typeDays = days.filter(d => d.type === dayType);
  const typeDayIds = typeDays.map(d => d._id);
  
  const typeTimers = timers.filter(t => t.dayId && typeDayIds.some(id => id.equals(t.dayId)));
  
  return Math.floor(
    typeTimers.reduce((sum, timer) => sum + (timer.totalElapsedTime || 0), 0) / (1000 * 60)
  );
}

async function calculateImprovementMetrics(userId, periodType, periodStart, periodEnd) {
  // Find previous period
  let previousPeriodStart, previousPeriodEnd;
  
  if (periodType === 'weekly') {
    previousPeriodStart = new Date(periodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
    previousPeriodEnd = new Date(periodEnd);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 7);
  } else if (periodType === 'monthly') {
    previousPeriodStart = new Date(periodStart);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
    previousPeriodEnd = new Date(periodEnd);
    previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 1);
  } else {
    // For daily or custom, can't calculate improvement
    return {
      questionsPerDayVelocity: 0,
      accuracyImprovement: 0,
      timeEfficiencyImprovement: 0,
      confidenceGrowth: 0
    };
  }
  
  // Get previous period analytics
  const previousAnalytics = await mongoose.model('AnalyticsSummary').findOne({
    userId,
    periodType,
    periodStart: previousPeriodStart
  });
  
  if (!previousAnalytics) {
    return {
      questionsPerDayVelocity: 0,
      accuracyImprovement: 0,
      timeEfficiencyImprovement: 0,
      confidenceGrowth: 0
    };
  }
  
  // Calculate improvements
  const currentDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
  const previousDays = Math.ceil((previousPeriodEnd - previousPeriodStart) / (1000 * 60 * 60 * 24));
  
  const currentQPD = currentDays > 0 ? previousAnalytics.totals.questionsAttempted / currentDays : 0;
  const previousQPD = previousDays > 0 ? previousAnalytics.totals.questionsAttempted / previousDays : 0;
  
  const currentAccuracy = previousAnalytics.totals.questionsAttempted > 0 ? 
    (previousAnalytics.totals.questionsSolved / previousAnalytics.totals.questionsAttempted) * 100 : 0;
  
  const previousAccuracy = previousAnalytics.totals.questionsAttempted > 0 ? 
    (previousAnalytics.totals.questionsSolved / previousAnalytics.totals.questionsAttempted) * 100 : 0;
  
  // Calculate time efficiency (questions per hour)
  const currentTimeEfficiency = previousAnalytics.totals.timeSpent > 0 ? 
    (previousAnalytics.totals.questionsSolved / previousAnalytics.totals.timeSpent) * 60 : 0;
  
  const previousTimeEfficiency = previousAnalytics.totals.timeSpent > 0 ? 
    (previousAnalytics.totals.questionsSolved / previousAnalytics.totals.timeSpent) * 60 : 0;
  
  return {
    questionsPerDayVelocity: currentQPD - previousQPD,
    accuracyImprovement: currentAccuracy - previousAccuracy,
    timeEfficiencyImprovement: currentTimeEfficiency - previousTimeEfficiency,
    confidenceGrowth: 0 // Would need to track confidence over time
  };
}

function identifyWeaknesses(byTopic, byDifficulty) {
  const weaknesses = [];
  
  // Identify weak topics (accuracy < 60% or confidence < 3)
  byTopic.forEach(topic => {
    if (topic.accuracy < 60 || topic.confidence < 3) {
      const weaknessLevel = topic.accuracy < 40 ? 'high' : 
                           topic.accuracy < 60 ? 'medium' : 'low';
      
      weaknesses.push({
        topic: topic.topic,
        weaknessLevel,
        suggestedActions: [
          `Review basic concepts of ${topic.topic}`,
          `Practice more ${topic.topic} problems`,
          `Watch tutorial videos on ${topic.topic}`
        ],
        improvementTarget: Math.min(100, topic.accuracy + 20)
      });
    }
  });
  
  // Identify weak difficulties
  if (byDifficulty.hard.accuracy < 40) {
    weaknesses.push({
      topic: 'Hard Problems',
      weaknessLevel: 'high',
      suggestedActions: [
        'Break down hard problems into smaller parts',
        'Study solution approaches for hard problems',
        'Practice time management on hard problems'
      ],
      improvementTarget: 50
    });
  }
  
  return weaknesses;
}

function generateRecommendations(weaknesses, improvementMetrics, totals) {
  const recommendations = [];
  
  // Based on weaknesses
  if (weaknesses.length > 0) {
    const highPriorityWeaknesses = weaknesses.filter(w => w.weaknessLevel === 'high');
    if (highPriorityWeaknesses.length > 0) {
      recommendations.push({
        type: 'focus-area',
        priority: 'high',
        description: `Focus on ${highPriorityWeaknesses[0].topic} to address critical weakness`,
        actionItems: highPriorityWeaknesses[0].suggestedActions.slice(0, 2)
      });
    }
  }
  
  // Based on improvement metrics
  if (improvementMetrics.questionsPerDayVelocity < 0) {
    recommendations.push({
      type: 'pace-adjustment',
      priority: 'medium',
      description: 'Your problem-solving pace has decreased. Consider adjusting your daily goals.',
      actionItems: [
        'Review your daily question target',
        'Take breaks to avoid burnout',
        'Focus on quality over quantity'
      ]
    });
  }
  
  // Based on totals
  if (totals.timeSpent > 300) { // More than 5 hours
    recommendations.push({
      type: 'practice-method',
      priority: 'low',
      description: 'You\'re spending significant time practicing. Consider incorporating active recall techniques.',
      actionItems: [
        'Try explaining solutions out loud',
        'Practice without looking at solutions first',
        'Teach concepts to someone else'
      ]
    });
  }
  
  return recommendations;
}

function generateHeatmapData(days, questions, periodStart, periodEnd) {
  const heatmapData = [];
  const currentDate = new Date(periodStart);
  
  while (currentDate <= periodEnd) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const day = days.find(d => d.date.toISOString().split('T')[0] === dateStr);
    
    if (day) {
      const dayQuestions = questions.filter(q => q.dayId && q.dayId.equals(day._id));
      const solvedQuestions = dayQuestions.filter(q => q.status === 'done').length;
      
      // Calculate activity level (0-4)
      let activityLevel = 0;
      if (solvedQuestions > 0) activityLevel = 1;
      if (solvedQuestions >= 3) activityLevel = 2;
      if (solvedQuestions >= 5) activityLevel = 3;
      if (solvedQuestions >= 8) activityLevel = 4;
      
      heatmapData.push({
        date: new Date(currentDate),
        activityLevel,
        questionCount: dayQuestions.length,
        timeSpent: day.totalTimeSpent || 0
      });
    } else {
      heatmapData.push({
        date: new Date(currentDate),
        activityLevel: 0,
        questionCount: 0,
        timeSpent: 0
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return heatmapData;
}

function calculatePercentileRank(questionsSolved) {
  // Simplified percentile calculation
  // In a real app, this would compare with peer data
  if (questionsSolved < 10) return 25;
  if (questionsSolved < 30) return 50;
  if (questionsSolved < 50) return 75;
  return 90;
}

// Method to get analytics summary for display
AnalyticsSummarySchema.methods.getDisplaySummary = function() {
  const summary = this.toObject();
  
  // Calculate additional derived metrics
  const efficiency = summary.totals.timeSpent > 0 ? 
    (summary.totals.questionsSolved / summary.totals.timeSpent) * 60 : 0; // questions per hour
  
  const consistency = summary.totals.daysActive > 0 ? 
    (summary.totals.daysActive / ((summary.periodEnd - summary.periodStart) / (1000 * 60 * 60 * 24))) * 100 : 0;
  
  const retention = summary.revisionMetrics.retentionRate;
  
  return {
    periodType: summary.periodType,
    periodStart: summary.periodStart,
    periodEnd: summary.periodEnd,
    totals: {
      ...summary.totals,
      efficiency: Math.round(efficiency * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
      retention: Math.round(retention * 100) / 100
    },
    byDifficulty: summary.byDifficulty,
    topTopics: summary.byTopic.sort((a, b) => b.attempted - a.attempted).slice(0, 5),
    topWeaknesses: summary.identifiedWeaknesses
      .filter(w => w.weaknessLevel === 'high')
      .slice(0, 3),
    recommendations: summary.recommendations,
    heatmapData: summary.heatmapData,
    benchmarks: summary.benchmarks,
    improvementMetrics: summary.improvementMetrics
  };
};

// Method to export analytics data - Renamed from exportData to exportAnalytics
AnalyticsSummarySchema.methods.exportAnalytics = function(format = 'json') {
  const summary = this.getDisplaySummary();
  
  if (format === 'json') {
    return JSON.stringify(summary, null, 2);
  } else if (format === 'csv') {
    // Simplified CSV export
    let csv = 'Metric,Value\n';
    csv += `Questions Attempted,${summary.totals.questionsAttempted}\n`;
    csv += `Questions Solved,${summary.totals.questionsSolved}\n`;
    csv += `Accuracy,${summary.totals.questionsAttempted > 0 ? 
      Math.round((summary.totals.questionsSolved / summary.totals.questionsAttempted) * 100) : 0}%\n`;
    csv += `Time Spent,${summary.totals.timeSpent} minutes\n`;
    csv += `Days Active,${summary.totals.daysActive}\n`;
    csv += `Efficiency,${summary.totals.efficiency} questions/hour\n`;
    csv += `Consistency,${summary.totals.consistency}%\n`;
    csv += `Retention,${summary.totals.retention}%\n`;
    
    return csv;
  }
  
  return summary;
};

const AnalyticsSummary = mongoose.model('AnalyticsSummary', AnalyticsSummarySchema);

module.exports = AnalyticsSummary;
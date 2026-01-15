class AnalyticsUtils {
  static calculateAccuracy(totalQuestions, solvedQuestions) {
    if (totalQuestions === 0) return 0;
    return Math.round((solvedQuestions / totalQuestions) * 100);
  }

  static calculateEfficiency(totalTime, questionsSolved) {
    if (questionsSolved === 0) return 0;
    const hours = totalTime / 60;
    return Math.round((questionsSolved / hours) * 100) / 100;
  }

  static calculateConsistency(daysActive, totalDays) {
    if (totalDays === 0) return 0;
    return Math.round((daysActive / totalDays) * 100);
  }

  static calculateRetentionRate(revisionsCompleted, revisionsScheduled) {
    if (revisionsScheduled === 0) return 0;
    return Math.round((revisionsCompleted / revisionsScheduled) * 100);
  }

  static calculateMasteryLevel(accuracy, confidence, completeness) {
    const score = (accuracy * 0.4) + (confidence * 0.3) + (completeness * 0.3);
    
    if (score >= 90) return 'master';
    if (score >= 75) return 'advanced';
    if (score >= 60) return 'intermediate';
    if (score >= 40) return 'beginner';
    return 'novice';
  }

  static calculateProductivityScore(questionsCompleted, timeSpent, targetQuestions) {
    const completionRatio = targetQuestions > 0 ? questionsCompleted / targetQuestions : 0;
    const timeEfficiency = timeSpent > 0 ? questionsCompleted / (timeSpent / 60) : 0;
    
    return Math.min(100, Math.round((completionRatio * 60) + (timeEfficiency * 40)));
  }

  static calculateWeaknessScore(accuracy, confidence, frequency) {
    const accuracyScore = (100 - accuracy) * 0.5;
    const confidenceScore = (5 - confidence) * 10;
    const frequencyScore = frequency === 'high' ? 30 : frequency === 'medium' ? 20 : 10;
    
    return Math.min(100, accuracyScore + confidenceScore + frequencyScore);
  }

  static calculateStreakBonus(currentStreak) {
    if (currentStreak >= 30) return 1.3;
    if (currentStreak >= 7) return 1.2;
    if (currentStreak >= 3) return 1.1;
    return 1;
  }

  static calculateDifficultyMultiplier(difficulty) {
    switch (difficulty) {
      case 'hard': return 1.5;
      case 'medium': return 1.2;
      case 'easy': return 1;
      default: return 1;
    }
  }

  static aggregateDailyData(dailyStats) {
    return dailyStats.reduce((acc, day) => {
      acc.totalQuestions += day.questions || 0;
      acc.solvedQuestions += day.solved || 0;
      acc.totalTime += day.timeSpent || 0;
      acc.daysActive += day.questions > 0 ? 1 : 0;
      return acc;
    }, { totalQuestions: 0, solvedQuestions: 0, totalTime: 0, daysActive: 0 });
  }

  static calculateTrend(currentValue, previousValue) {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    
    const change = ((currentValue - previousValue) / previousValue) * 100;
    return Math.round(change * 10) / 10;
  }

  static generateHeatmapData(days, periodStart, periodEnd) {
    const heatmap = [];
    const currentDate = new Date(periodStart);
    
    while (currentDate <= periodEnd) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const day = days.find(d => d.date.toISOString().split('T')[0] === dateStr);
      
      let activityLevel = 0;
      if (day) {
        const solvedRatio = day.questionStats?.solved / day.questionStats?.total || 0;
        if (solvedRatio >= 0.8) activityLevel = 4;
        else if (solvedRatio >= 0.6) activityLevel = 3;
        else if (solvedRatio >= 0.4) activityLevel = 2;
        else if (solvedRatio > 0) activityLevel = 1;
      }
      
      heatmap.push({
        date: new Date(currentDate),
        activityLevel,
        count: day?.questionStats?.total || 0,
        solved: day?.questionStats?.solved || 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return heatmap;
  }

  static calculatePercentileRank(userValue, peerValues) {
    if (!peerValues || peerValues.length === 0) return 50;
    
    const sorted = [...peerValues].sort((a, b) => a - b);
    const lowerCount = sorted.filter(v => v < userValue).length;
    const sameCount = sorted.filter(v => v === userValue).length;
    
    return Math.round(((lowerCount + (0.5 * sameCount)) / sorted.length) * 100);
  }

  static predictNextMilestone(currentProgress, rate) {
    if (rate <= 0) return null;
    
    const milestones = [10, 25, 50, 100, 250, 500, 1000];
    const nextMilestone = milestones.find(m => m > currentProgress);
    
    if (!nextMilestone) return null;
    
    const remaining = nextMilestone - currentProgress;
    const daysNeeded = Math.ceil(remaining / rate);
    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + daysNeeded);
    
    return {
      milestone: nextMilestone,
      remaining,
      daysNeeded,
      predictedDate
    };
  }

  static generateRecommendations(analytics) {
    const recommendations = [];
    
    if (analytics.accuracy < 60) {
      recommendations.push({
        type: 'focus-area',
        priority: 'high',
        description: 'Focus on improving accuracy',
        action: 'Review incorrect solutions and understand mistakes'
      });
    }
    
    if (analytics.consistency < 50) {
      recommendations.push({
        type: 'consistency',
        priority: 'medium',
        description: 'Improve study consistency',
        action: 'Set daily reminders and establish a routine'
      });
    }
    
    if (analytics.timeSpent > 300 && analytics.efficiency < 2) {
      recommendations.push({
        type: 'efficiency',
        priority: 'medium',
        description: 'Improve time efficiency',
        action: 'Use timer and focus on problem-solving techniques'
      });
    }
    
    if (analytics.weakAreas && analytics.weakAreas.length > 0) {
      recommendations.push({
        type: 'weakness',
        priority: 'high',
        description: `Focus on: ${analytics.weakAreas.slice(0, 2).join(', ')}`,
        action: 'Practice more problems in weak areas'
      });
    }
    
    return recommendations;
  }
}

module.exports = AnalyticsUtils;
const HeatmapData = require('../models/HeatmapData');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const RevisionSchedule = require('../models/RevisionSchedule');
const Goal = require('../models/Goal');
const StudyGroup = require('../models/StudyGroup');
const Question = require('../models/Question');
const User = require('../models/User');
const redisClient = require('../config/redis');
const { getStartOfDay, getEndOfDay, formatDate, isSameDay } = require('../utils/helpers/date');

const calculateIntensityLevel = (activityCount) => {
  if (activityCount === 0) return 0;
  if (activityCount <= 2) return 1;
  if (activityCount <= 4) return 2;
  if (activityCount <= 9) return 3;
  return 4;
};

const generateDailyData = (year) => {
  const dailyData = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dailyData.push({
      date: new Date(currentDate),
      dayOfWeek: currentDate.getDay(),
      totalActivities: 0,
      newProblemsSolved: 0,
      revisionProblems: 0,
      totalSubmissions: 0,
      totalTimeSpent: 0,
      difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
      platformBreakdown: { leetcode: 0, hackerrank: 0, codeforces: 0, other: 0 },
      studyGroupActivity: 0,
      dailyGoalAchieved: false,
      goalTarget: 0,
      goalCompletion: 0,
      intensityLevel: 0,
      streakCount: 0
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dailyData;
};

const calculateStreak = (dailyData) => {
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = dailyData.length - 1; i >= 0; i--) {
    const day = dailyData[i];
    const dayDate = new Date(day.date);
    
    if (day.totalActivities > 0) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      
      if (isSameDay(dayDate, today) || (dayDate < today && i === dailyData.length - 1)) {
        currentStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
    
    day.streakCount = tempStreak;
  }
  
  return { currentStreak, longestStreak };
};

const aggregateQuestionData = async (userId, startDate, endDate) => {
  const progressData = await UserQuestionProgress.aggregate([
    {
      $match: {
        userId: userId,
        updatedAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['Solved', 'Mastered'] }
      }
    },
    {
      $lookup: {
        from: 'questions',
        localField: 'questionId',
        foreignField: '_id',
        as: 'question'
      }
    },
    {
      $unwind: '$question'
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
          difficulty: '$question.difficulty',
          platform: '$question.platform'
        },
        count: { $sum: 1 },
        totalTime: { $sum: '$totalTimeSpent' }
      }
    }
  ]);
  
  const result = {};
  progressData.forEach(item => {
    const dateStr = item._id.date;
    if (!result[dateStr]) {
      result[dateStr] = {
        newProblemsSolved: 0,
        totalTimeSpent: 0,
        difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
        platformBreakdown: { leetcode: 0, hackerrank: 0, codeforces: 0, other: 0 }
      };
    }
    
    result[dateStr].newProblemsSolved += item.count;
    result[dateStr].totalTimeSpent += item.totalTime;
    
    const difficulty = item._id.difficulty?.toLowerCase();
    if (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') {
      result[dateStr].difficultyBreakdown[difficulty] += item.count;
    }
    
    const platform = item._id.platform?.toLowerCase();
    if (platform === 'leetcode') {
      result[dateStr].platformBreakdown.leetcode += item.count;
    } else if (platform === 'hackerrank') {
      result[dateStr].platformBreakdown.hackerrank += item.count;
    } else if (platform === 'codeforces') {
      result[dateStr].platformBreakdown.codeforces += item.count;
    } else {
      result[dateStr].platformBreakdown.other += item.count;
    }
  });
  
  return result;
};

const aggregateRevisionData = async (userId, startDate, endDate) => {
  const revisionData = await RevisionSchedule.aggregate([
    {
      $match: {
        userId: userId,
        'completedRevisions.completedAt': { $gte: startDate, $lte: endDate }
      }
    },
    {
      $unwind: '$completedRevisions'
    },
    {
      $match: {
        'completedRevisions.completedAt': { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$completedRevisions.completedAt' } }
        },
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {};
  revisionData.forEach(item => {
    result[item._id.date] = { revisionProblems: item.count };
  });
  
  return result;
};

const aggregateGoalData = async (userId, startDate, endDate) => {
  const goalData = await Goal.aggregate([
    {
      $match: {
        userId: userId,
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
        goalType: 'daily'
      }
    },
    {
      $project: {
        date: { $dateToString: { format: '%Y-%m-%d', date: '$startDate' } },
        targetCount: 1,
        completedCount: 1,
        status: 1
      }
    }
  ]);
  
  const result = {};
  goalData.forEach(goal => {
    result[goal.date] = {
      dailyGoalAchieved: goal.status === 'completed',
      goalTarget: goal.targetCount,
      goalCompletion: goal.targetCount > 0 ? Math.round((goal.completedCount / goal.targetCount) * 100) : 0
    };
  });
  
  return result;
};

const aggregateStudyGroupData = async (userId, startDate, endDate) => {
  const studyGroupData = await StudyGroup.aggregate([
    {
      $match: {
        'members.userId': userId,
        lastActivityAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $project: {
        date: { $dateToString: { format: '%Y-%m-%d', date: '$lastActivityAt' } },
        hasActivity: 1
      }
    },
    {
      $group: {
        _id: '$date',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {};
  studyGroupData.forEach(item => {
    result[item._id] = { studyGroupActivity: item.count };
  });
  
  return result;
};

const generateCachedRenderData = (dailyData) => {
  const colorScale = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const tooltipData = dailyData.map(day => ({
    date: day.date,
    summary: `${day.totalActivities} activity${day.totalActivities !== 1 ? 'ies' : ''} on ${formatDate(day.date)}`,
    details: `New: ${day.newProblemsSolved}, Revisions: ${day.revisionProblems}, Time: ${day.totalTimeSpent}min`
  }));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentDayIndex = dailyData.findIndex(day => isSameDay(day.date, today));
  
  return {
    colorScale,
    monthLabels,
    weekLabels,
    tooltipData,
    currentDayIndex: currentDayIndex >= 0 ? currentDayIndex : -1
  };
};

const calculateFilterViews = (dailyData) => {
  const allActivity = dailyData.map(day => day.totalActivities);
  const newProblemsOnly = dailyData.map(day => day.newProblemsSolved);
  const revisionsOnly = dailyData.map(day => day.revisionProblems);
  const studyGroupOnly = dailyData.map(day => day.studyGroupActivity);
  
  const platformViews = {
    leetcode: dailyData.map(day => day.platformBreakdown.leetcode || 0),
    hackerrank: dailyData.map(day => day.platformBreakdown.hackerrank || 0),
    codeforces: dailyData.map(day => day.platformBreakdown.codeforces || 0)
  };
  
  const difficultyViews = {
    easy: dailyData.map(day => day.difficultyBreakdown.easy || 0),
    medium: dailyData.map(day => day.difficultyBreakdown.medium || 0),
    hard: dailyData.map(day => day.difficultyBreakdown.hard || 0)
  };
  
  return {
    allActivity,
    newProblemsOnly,
    revisionsOnly,
    studyGroupOnly,
    platformViews,
    difficultyViews
  };
};

const calculateStatsPanel = (dailyData, year, consistency) => {
  const totalDays = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
  const activeDays = dailyData.filter(day => day.totalActivities > 0).length;
  const totalProblems = dailyData.reduce((sum, day) => sum + day.newProblemsSolved, 0);
  const goalDays = dailyData.filter(day => day.goalTarget > 0).length;
  const achievedDays = dailyData.filter(day => day.dailyGoalAchieved).length;
  
  return {
    currentStreak: consistency.currentStreak,
    longestStreak: consistency.longestStreak,
    yearlyProblems: totalProblems,
    activeDays: {
      count: activeDays,
      total: totalDays,
      percentage: Math.round((activeDays / totalDays) * 1000) / 10
    },
    goalCompletion: {
      percentage: goalDays > 0 ? Math.round((achievedDays / goalDays) * 100) : 0,
      achievedDays,
      totalDays: goalDays
    }
  };
};

const generateHeatmapData = async (userId, year) => {
  try {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    
    const dailyData = generateDailyData(year);
    
    const [
      questionData,
      revisionData,
      goalData,
      studyGroupData
    ] = await Promise.all([
      aggregateQuestionData(userId, startDate, endDate),
      aggregateRevisionData(userId, startDate, endDate),
      aggregateGoalData(userId, startDate, endDate),
      aggregateStudyGroupData(userId, startDate, endDate)
    ]);
    
    dailyData.forEach(day => {
      const dateStr = formatDate(day.date);
      
      if (questionData[dateStr]) {
        day.newProblemsSolved = questionData[dateStr].newProblemsSolved;
        day.totalTimeSpent = questionData[dateStr].totalTimeSpent;
        day.difficultyBreakdown = questionData[dateStr].difficultyBreakdown;
        day.platformBreakdown = questionData[dateStr].platformBreakdown;
      }
      
      if (revisionData[dateStr]) {
        day.revisionProblems = revisionData[dateStr].revisionProblems;
      }
      
      if (goalData[dateStr]) {
        day.dailyGoalAchieved = goalData[dateStr].dailyGoalAchieved;
        day.goalTarget = goalData[dateStr].goalTarget;
        day.goalCompletion = goalData[dateStr].goalCompletion;
      }
      
      if (studyGroupData[dateStr]) {
        day.studyGroupActivity = studyGroupData[dateStr].studyGroupActivity;
      }
      
      day.totalActivities = day.newProblemsSolved + day.revisionProblems + day.studyGroupActivity;
      day.totalSubmissions = day.newProblemsSolved + day.revisionProblems;
      day.intensityLevel = calculateIntensityLevel(day.totalActivities);
    });
    
    const { currentStreak, longestStreak } = calculateStreak(dailyData);
    
    const activeDaysCount = dailyData.filter(day => day.totalActivities > 0).length;
    const totalYearlyActivities = dailyData.reduce((sum, day) => sum + day.totalActivities, 0);
    const totalProblemsSolved = dailyData.reduce((sum, day) => sum + day.newProblemsSolved, 0);
    const totalRevisionsCompleted = dailyData.reduce((sum, day) => sum + day.revisionProblems, 0);
    const totalTimeInvested = dailyData.reduce((sum, day) => sum + day.totalTimeSpent, 0);
    const averageDailyActivities = dailyData.length > 0 ? totalYearlyActivities / dailyData.length : 0;
    const consistencyScore = dailyData.length > 0 ? Math.round((activeDaysCount / dailyData.length) * 100) : 0;
    const breakDays = dailyData.length - activeDaysCount;
    
    let engagementLevel = 'low';
    if (consistencyScore >= 80) engagementLevel = 'very-high';
    else if (consistencyScore >= 60) engagementLevel = 'high';
    else if (consistencyScore >= 40) engagementLevel = 'medium';
    
    const monthlyDistribution = [];
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      const monthDays = dailyData.filter(day => 
        day.date >= monthStart && day.date <= monthEnd
      );
      
      monthlyDistribution.push({
        month: month + 1,
        activityCount: monthDays.reduce((sum, day) => sum + day.totalActivities, 0),
        problemsSolved: monthDays.reduce((sum, day) => sum + day.newProblemsSolved, 0)
      });
    }
    
    const cachedRenderData = generateCachedRenderData(dailyData);
    const filterViews = calculateFilterViews(dailyData);
    const statsPanel = calculateStatsPanel(dailyData, year, { currentStreak, longestStreak });
    
    const heatmapData = {
      userId,
      year,
      weekCount: 53,
      firstDate: startDate,
      lastDate: endDate,
      dailyData,
      performance: {
        totalYearlyActivities,
        totalProblemsSolved,
        totalRevisionsCompleted,
        totalTimeInvested,
        averageDailyActivities: parseFloat(averageDailyActivities.toFixed(1)),
        monthlyDistribution
      },
      consistency: {
        activeDaysCount,
        consistencyScore,
        currentStreak,
        longestStreak,
        breakDays,
        engagementLevel
      },
      lastUpdated: new Date(),
      updateFrequency: 1,
      syncStatus: 'synced',
      cachedRenderData,
      filterViews,
      statsPanel
    };
    
    const heatmap = await HeatmapData.findOneAndUpdate(
      { userId, year },
      heatmapData,
      { upsert: true, new: true }
    );
    
    const cacheKey = `heatmap:${userId}:${year}:true`;
    await redisClient.setEx(cacheKey, 15 * 60, JSON.stringify(heatmap.toObject()));
    
    return heatmap.toObject();
  } catch (error) {
    console.error('Error generating heatmap data:', error);
    throw error;
  }
};

const regenerateHeatmapData = async (userId, year, forceFullRefresh = false) => {
  try {
    await HeatmapData.deleteOne({ userId, year });
    const heatmap = await generateHeatmapData(userId, year);
    return heatmap;
  } catch (error) {
    console.error('Error regenerating heatmap data:', error);
    throw error;
  }
};

const calculateFilteredData = async (userId, year, viewType) => {
  const heatmap = await HeatmapData.findOne({ userId, year }).lean();
  if (!heatmap) return [];
  
  const filteredData = heatmap.dailyData.map(day => {
    let activityCount = 0;
    
    switch (viewType) {
      case 'new_problems':
        activityCount = day.newProblemsSolved;
        break;
      case 'revisions':
        activityCount = day.revisionProblems;
        break;
      case 'study_group':
        activityCount = day.studyGroupActivity;
        break;
      case 'leetcode':
        activityCount = day.platformBreakdown.leetcode || 0;
        break;
      case 'hackerrank':
        activityCount = day.platformBreakdown.hackerrank || 0;
        break;
      case 'codeforces':
        activityCount = day.platformBreakdown.codeforces || 0;
        break;
      case 'easy':
        activityCount = day.difficultyBreakdown.easy || 0;
        break;
      case 'medium':
        activityCount = day.difficultyBreakdown.medium || 0;
        break;
      case 'hard':
        activityCount = day.difficultyBreakdown.hard || 0;
        break;
      default:
        activityCount = day.totalActivities;
    }
    
    return {
      ...day,
      totalActivities: activityCount,
      intensityLevel: calculateIntensityLevel(activityCount)
    };
  });
  
  return filteredData;
};

const convertToCSV = (heatmap, includeDetails) => {
  const headers = ['Date', 'Day', 'Total Activities', 'New Problems', 'Revisions', 'Study Group', 'Time Spent (min)'];
  if (includeDetails) {
    headers.push('Easy', 'Medium', 'Hard', 'LeetCode', 'HackerRank', 'CodeForces', 'Goal Achieved', 'Goal %');
  }
  
  const rows = [headers.join(',')];
  
  heatmap.dailyData.forEach(day => {
    const dateStr = formatDate(day.date);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[day.dayOfWeek];
    
    const row = [
      `"${dateStr}"`,
      `"${dayName}"`,
      day.totalActivities,
      day.newProblemsSolved,
      day.revisionProblems,
      day.studyGroupActivity,
      day.totalTimeSpent
    ];
    
    if (includeDetails) {
      row.push(
        day.difficultyBreakdown.easy || 0,
        day.difficultyBreakdown.medium || 0,
        day.difficultyBreakdown.hard || 0,
        day.platformBreakdown.leetcode || 0,
        day.platformBreakdown.hackerrank || 0,
        day.platformBreakdown.codeforces || 0,
        day.dailyGoalAchieved ? 'Yes' : 'No',
        day.goalCompletion || 0
      );
    }
    
    rows.push(row.join(','));
  });
  
  return rows.join('\n');
};

const warmHeatmapCache = async (userId) => {
  try {
    const year = new Date().getFullYear();
    const cacheKey = `heatmap:${userId}:${year}:true`;
    
    const cached = await redisClient.get(cacheKey);
    if (!cached) {
      const heatmap = await HeatmapData.findOne({ userId, year }).lean();
      if (heatmap) {
        await redisClient.setEx(cacheKey, 24 * 60 * 60, JSON.stringify(heatmap));
      }
    }
    
    const filterTypes = ['all', 'new_problems', 'revisions'];
    for (const filterType of filterTypes) {
      const filterKey = `heatmap:filter:${userId}:${year}:${filterType}:1:53`;
      const filterCached = await redisClient.get(filterKey);
      if (!filterCached && heatmap) {
        const filteredData = await calculateFilteredData(userId, year, filterType);
        await redisClient.setEx(filterKey, 30 * 60, JSON.stringify(filteredData));
      }
    }
  } catch (error) {
    console.error('Error warming heatmap cache:', error);
  }
};

module.exports = {
  calculateIntensityLevel,
  generateHeatmapData,
  regenerateHeatmapData,
  calculateFilteredData,
  convertToCSV,
  warmHeatmapCache
};
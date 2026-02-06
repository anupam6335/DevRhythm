const mongoose = require('mongoose');

const HeatmapDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  year: {
    type: Number,
    required: true,
    min: 2000,
    max: 2100
  },
  weekCount: {
    type: Number,
    min: 1,
    max: 53,
    default: 53
  },
  firstDate: {
    type: Date,
    required: true
  },
  lastDate: {
    type: Date,
    required: true
  },
  dailyData: [{
    date: {
      type: Date,
      required: true
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      required: true
    },
    totalActivities: {
      type: Number,
      default: 0,
      min: 0
    },
    newProblemsSolved: {
      type: Number,
      default: 0,
      min: 0
    },
    revisionProblems: {
      type: Number,
      default: 0,
      min: 0
    },
    totalSubmissions: {
      type: Number,
      default: 0,
      min: 0
    },
    totalTimeSpent: {
      type: Number,
      default: 0,
      min: 0
    },
    difficultyBreakdown: {
      easy: {
        type: Number,
        default: 0,
        min: 0
      },
      medium: {
        type: Number,
        default: 0,
        min: 0
      },
      hard: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    platformBreakdown: {
      leetcode: {
        type: Number,
        default: 0,
        min: 0
      },
      hackerrank: {
        type: Number,
        default: 0,
        min: 0
      },
      codeforces: {
        type: Number,
        default: 0,
        min: 0
      },
      other: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    studyGroupActivity: {
      type: Number,
      default: 0,
      min: 0
    },
    dailyGoalAchieved: {
      type: Boolean,
      default: false
    },
    goalTarget: {
      type: Number,
      default: 0,
      min: 0
    },
    goalCompletion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    intensityLevel: {
      type: Number,
      enum: [0, 1, 2, 3, 4],
      default: 0
    },
    streakCount: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  performance: {
    totalYearlyActivities: {
      type: Number,
      default: 0,
      min: 0
    },
    totalProblemsSolved: {
      type: Number,
      default: 0,
      min: 0
    },
    totalRevisionsCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    totalTimeInvested: {
      type: Number,
      default: 0,
      min: 0
    },
    averageDailyActivities: {
      type: Number,
      default: 0,
      min: 0
    },
    bestPerformingDay: {
      date: Date,
      activityCount: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    mostActiveDayOfWeek: {
      day: {
        type: Number,
        min: 0,
        max: 6
      },
      averageActivity: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    maximumDailyActivity: {
      type: Number,
      default: 0,
      min: 0
    },
    monthlyDistribution: [{
      month: Number,
      activityCount: Number,
      problemsSolved: Number
    }]
  },
  consistency: {
    activeDaysCount: {
      type: Number,
      default: 0,
      min: 0
    },
    consistencyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    breakDays: {
      type: Number,
      default: 0,
      min: 0
    },
    engagementLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'very-high'],
      default: 'low'
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updateFrequency: {
    type: Number,
    default: 1
  },
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'error'],
    default: 'synced'
  },
  cachedRenderData: {
    colorScale: [String],
    monthLabels: [String],
    weekLabels: [String],
    tooltipData: [{
      date: Date,
      summary: String,
      details: String
    }],
    currentDayIndex: Number
  },
  filterViews: {
    allActivity: [Number],
    newProblemsOnly: [Number],
    revisionsOnly: [Number],
    studyGroupOnly: [Number],
    platformViews: {
      leetcode: [Number],
      hackerrank: [Number],
      codeforces: [Number]
    },
    difficultyViews: {
      easy: [Number],
      medium: [Number],
      hard: [Number]
    }
  },
  statsPanel: {
    currentStreak: Number,
    longestStreak: Number,
    yearlyProblems: Number,
    activeDays: {
      count: Number,
      total: Number,
      percentage: Number
    },
    goalCompletion: {
      percentage: Number,
      achievedDays: Number,
      totalDays: Number
    }
  }
}, {
  timestamps: true
});

HeatmapDataSchema.index({ userId: 1, year: 1 }, { unique: true });
HeatmapDataSchema.index({ userId: 1, lastUpdated: -1 });
HeatmapDataSchema.index({ userId: 1, 'dailyData.date': 1 });
HeatmapDataSchema.index({ userId: 1, 'consistency.currentStreak': -1 });
HeatmapDataSchema.index({ userId: 1, 'performance.totalProblemsSolved': -1 });
HeatmapDataSchema.index({ userId: 1, 'performance.bestPerformingDay.activityCount': -1 });

HeatmapDataSchema.pre('save', function(next) {
  if (!this.firstDate || !this.lastDate) {
    const year = this.year || new Date().getFullYear();
    this.firstDate = new Date(year, 0, 1);
    this.lastDate = new Date(year, 11, 31);
  }
  
  if (this.dailyData && this.dailyData.length > 0) {
    let maxActivities = 0;
    let bestDay = null;
    const dayActivity = new Array(7).fill(0);
    const dayCount = new Array(7).fill(0);
    
    this.dailyData.forEach(day => {
      if (day.totalActivities > maxActivities) {
        maxActivities = day.totalActivities;
        bestDay = day.date;
      }
      
      dayActivity[day.dayOfWeek] += day.totalActivities;
      dayCount[day.dayOfWeek]++;
    });
    
    this.performance.bestPerformingDay = {
      date: bestDay,
      activityCount: maxActivities
    };
    
    let mostActiveDay = 0;
    let maxAvg = 0;
    for (let i = 0; i < 7; i++) {
      const avg = dayCount[i] > 0 ? dayActivity[i] / dayCount[i] : 0;
      if (avg > maxAvg) {
        maxAvg = avg;
        mostActiveDay = i;
      }
    }
    
    this.performance.mostActiveDayOfWeek = {
      day: mostActiveDay,
      averageActivity: maxAvg
    };
    
    this.performance.maximumDailyActivity = maxActivities;
  }
  
  next();
});

module.exports = mongoose.model('HeatmapData', HeatmapDataSchema);
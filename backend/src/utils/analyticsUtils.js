const logger = require('./logger');
const config = require('../config/environment');
const constants = require('../config/constants');

class AnalyticsUtils {
  constructor() {
    this.metrics = new Map();
    this.analyticsEnabled = config.features.analytics;
  }

  trackEvent(userId, eventName, properties = {}) {
    if (!this.analyticsEnabled) return;

    const event = {
      userId,
      eventName,
      properties,
      timestamp: new Date().toISOString(),
      ip: 'server'
    };

    logger.info('Analytics Event', event);
    
    this.recordMetric(eventName);
    
    if (config.env === 'production') {
      this.sendToExternalAnalytics(event);
    }
  }

  trackPageView(userId, pageName, properties = {}) {
    this.trackEvent(userId, `page_view_${pageName}`, {
      ...properties,
      page: pageName
    });
  }

  trackApiCall(userId, endpoint, method, duration, statusCode, properties = {}) {
    this.trackEvent(userId, 'api_call', {
      endpoint,
      method,
      duration,
      statusCode,
      ...properties
    });

    if (duration > 1000) {
      logger.warn('Slow API call', {
        endpoint,
        method,
        duration,
        userId,
        statusCode
      });
    }
  }

  trackError(userId, errorType, errorMessage, context = {}) {
    this.trackEvent(userId, 'error', {
      errorType,
      errorMessage,
      ...context
    });
  }

  trackUserAction(userId, action, resourceType, resourceId, metadata = {}) {
    this.trackEvent(userId, 'user_action', {
      action,
      resourceType,
      resourceId,
      ...metadata
    });
  }

  trackPerformance(metricName, value, tags = {}) {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }

    const metricData = this.metrics.get(metricName);
    metricData.push({
      value,
      tags,
      timestamp: Date.now()
    });

    if (metricData.length > 1000) {
      metricData.splice(0, metricData.length - 1000);
    }
  }

  recordMetric(eventName) {
    const now = Date.now();
    const minuteKey = Math.floor(now / 60000);

    if (!this.metrics.has(eventName)) {
      this.metrics.set(eventName, new Map());
    }

    const eventMetrics = this.metrics.get(eventName);
    if (!eventMetrics.has(minuteKey)) {
      eventMetrics.set(minuteKey, 0);
    }

    eventMetrics.set(minuteKey, eventMetrics.get(minuteKey) + 1);
  }

  getMetrics(eventName, timeRange = 'hour') {
    if (!this.metrics.has(eventName)) {
      return [];
    }

    const eventMetrics = this.metrics.get(eventName);
    const now = Date.now();
    let rangeMs;

    switch (timeRange) {
      case 'minute': rangeMs = 60000; break;
      case 'hour': rangeMs = 3600000; break;
      case 'day': rangeMs = 86400000; break;
      case 'week': rangeMs = 604800000; break;
      default: rangeMs = 3600000;
    }

    const cutoff = now - rangeMs;
    const minuteCutoff = Math.floor(cutoff / 60000);

    const result = [];
    for (const [minuteKey, count] of eventMetrics.entries()) {
      if (minuteKey >= minuteCutoff) {
        result.push({
          timestamp: new Date(minuteKey * 60000).toISOString(),
          count
        });
      }
    }

    return result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  calculateStats(data, field) {
    if (!data || data.length === 0) {
      return {
        count: 0,
        sum: 0,
        average: 0,
        min: 0,
        max: 0,
        median: 0
      };
    }

    const values = data.map(item => item[field]).filter(val => typeof val === 'number');
    
    if (values.length === 0) {
      return {
        count: 0,
        sum: 0,
        average: 0,
        min: 0,
        max: 0,
        median: 0
      };
    }

    values.sort((a, b) => a - b);
    
    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = sum / values.length;
    const min = values[0];
    const max = values[values.length - 1];
    
    let median;
    const mid = Math.floor(values.length / 2);
    if (values.length % 2 === 0) {
      median = (values[mid - 1] + values[mid]) / 2;
    } else {
      median = values[mid];
    }

    const variance = values.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      count: values.length,
      sum,
      average: Number(average.toFixed(2)),
      min,
      max,
      median: Number(median.toFixed(2)),
      variance: Number(variance.toFixed(2)),
      stdDev: Number(stdDev.toFixed(2))
    };
  }

  generateHeatmapData(data, dateField, valueField, startDate, endDate) {
    const heatmap = {};
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      heatmap[dateStr] = {
        date: new Date(currentDate),
        value: 0,
        count: 0
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    data.forEach(item => {
      const date = new Date(item[dateField]);
      const dateStr = date.toISOString().split('T')[0];
      
      if (heatmap[dateStr]) {
        heatmap[dateStr].value += item[valueField] || 0;
        heatmap[dateStr].count += 1;
      }
    });

    const maxValue = Math.max(...Object.values(heatmap).map(h => h.value));
    
    return Object.values(heatmap).map(entry => ({
      date: entry.date,
      value: entry.value,
      count: entry.count,
      intensity: maxValue > 0 ? Math.round((entry.value / maxValue) * 4) : 0
    }));
  }

  calculateTrend(data, valueField) {
    if (!data || data.length < 2) {
      return {
        trend: 'stable',
        slope: 0,
        rSquared: 0
      };
    }

    const x = data.map((_, index) => index);
    const y = data.map(item => item[valueField] || 0);
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const yMean = sumY / n;
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
    const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
    
    let trend;
    if (Math.abs(slope) < 0.01) {
      trend = 'stable';
    } else if (slope > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    return {
      trend,
      slope: Number(slope.toFixed(4)),
      intercept: Number(intercept.toFixed(2)),
      rSquared: Number(rSquared.toFixed(4))
    };
  }

  identifyPatterns(data, windowSize = 7) {
    if (!data || data.length < windowSize * 2) {
      return [];
    }

    const patterns = [];
    const values = data.map(item => item.value || 0);
    
    for (let i = 0; i <= values.length - windowSize; i++) {
      const window = values.slice(i, i + windowSize);
      const nextWindow = values.slice(i + windowSize, i + windowSize * 2);
      
      if (nextWindow.length === windowSize) {
        const windowAvg = window.reduce((a, b) => a + b, 0) / windowSize;
        const nextAvg = nextWindow.reduce((a, b) => a + b, 0) / windowSize;
        
        const changePercent = ((nextAvg - windowAvg) / windowAvg) * 100;
        
        if (Math.abs(changePercent) > 20) {
          patterns.push({
            startIndex: i,
            endIndex: i + windowSize - 1,
            windowAvg: Number(windowAvg.toFixed(2)),
            nextAvg: Number(nextAvg.toFixed(2)),
            changePercent: Number(changePercent.toFixed(2)),
            trend: changePercent > 0 ? 'increasing' : 'decreasing'
          });
        }
      }
    }
    
    return patterns;
  }

  generateInsights(metrics, userData) {
    const insights = [];
    
    if (metrics.questionsSolved && metrics.questionsSolved.daily > 10) {
      insights.push({
        type: 'high_activity',
        message: 'Great job! You solved more than 10 questions today.',
        priority: 'high',
        suggestion: 'Consider taking a short break to avoid burnout.'
      });
    }
    
    if (metrics.accuracy && metrics.accuracy.average < 60) {
      insights.push({
        type: 'low_accuracy',
        message: 'Your accuracy is below 60%. Consider reviewing topics you find challenging.',
        priority: 'medium',
        suggestion: 'Focus on easier problems first to build confidence.'
      });
    }
    
    if (metrics.timeSpent && metrics.timeSpent.average > 180) {
      insights.push({
        type: 'long_sessions',
        message: 'Your average session length is over 3 hours.',
        priority: 'low',
        suggestion: 'Try breaking your study sessions into smaller, focused blocks.'
      });
    }
    
    if (metrics.streak && metrics.streak.current >= 7) {
      insights.push({
        type: 'streak_milestone',
        message: `You're on a ${metrics.streak.current}-day streak! Keep up the great work!`,
        priority: 'high',
        suggestion: 'Maintain your consistency for long-term improvement.'
      });
    }
    
    if (userData.weakTopics && userData.weakTopics.length > 0) {
      insights.push({
        type: 'weak_topics',
        message: `You have ${userData.weakTopics.length} topics that need more attention.`,
        priority: 'medium',
        suggestion: `Focus on: ${userData.weakTopics.slice(0, 3).join(', ')}`,
        data: userData.weakTopics.slice(0, 5)
      });
    }
    
    return insights;
  }

  sendToExternalAnalytics(event) {
    if (config.monitoring.sentryDsn && (event.eventName === 'error' || event.properties.errorType)) {
      const Sentry = require('@sentry/node');
      Sentry.captureMessage(event.eventName, {
        extra: event.properties,
        user: { id: event.userId }
      });
    }
  }

  cleanupOldMetrics() {
    const now = Date.now();
    const hourAgo = now - 3600000;
    const minuteCutoff = Math.floor(hourAgo / 60000);
    
    for (const [eventName, eventMetrics] of this.metrics.entries()) {
      for (const [minuteKey] of eventMetrics.entries()) {
        if (minuteKey < minuteCutoff) {
          eventMetrics.delete(minuteKey);
        }
      }
      
      if (eventMetrics.size === 0) {
        this.metrics.delete(eventName);
      }
    }
  }
}

const analyticsUtils = new AnalyticsUtils();
setInterval(() => analyticsUtils.cleanupOldMetrics(), 5 * 60 * 1000);

module.exports = analyticsUtils;
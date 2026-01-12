const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationTemplateSchema = new mongoose.Schema({
  // Template Identity
  templateKey: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  
  // Classification
  category: {
    type: String,
    required: true,
    enum: [
      'daily-study', 'revision', 'progress-motivation', 'timer-question',
      'study-plan', 'knowledge-map', 'system-account', 'achievement'
    ],
    index: true
  },
  subType: { type: String, index: true }, // e.g., 'streak-reminder', 'revision-overdue'
  
  // Content Templates
  content: {
    titleTemplate: { type: String, required: true },
    messageTemplate: { type: String, required: true },
    variables: [{
      name: { type: String, required: true },
      description: { type: String },
      dataType: { type: String, enum: ['string', 'number', 'date', 'boolean', 'array'] },
      required: { type: Boolean, default: false },
      defaultValue: { type: mongoose.Schema.Types.Mixed }
    }]
  },
  
  // Delivery Configuration
  delivery: {
    defaultChannels: [{
      channel: { type: String, enum: ['in-app', 'email', 'push', 'browser'] },
      enabled: { type: Boolean, default: true },
      templateOverride: { type: String } // channel-specific template
    }],
    
    scheduling: {
      canBeScheduled: { type: Boolean, default: false },
      defaultSchedule: { 
        type: String, 
        enum: ['immediate', 'daily', 'weekly', 'monthly', 'custom'] 
      },
      defaultTime: { type: String }, // HH:MM format
      timezoneAware: { type: Boolean, default: true }
    },
    
    priority: { 
      type: String, 
      enum: ['high', 'medium', 'low'],
      default: 'medium' 
    },
    ttl: { type: Number, default: 604800 }, // seconds (7 days)
    
    grouping: {
      groupKey: { type: String },
      canGroup: { type: Boolean, default: false },
      groupStrategy: { type: String, enum: ['same-day', 'same-type', 'custom'] }
    }
  },
  
  // Triggers & Conditions
  triggers: [{
    triggerType: { 
      type: String, 
      enum: ['time-based', 'event-based', 'condition-based', 'manual'] 
    },
    condition: { type: String }, // e.g., "streak.currentStreak > 0"
    eventName: { type: String }, // for event-based triggers
    cronExpression: { type: String }, // for time-based triggers
  }],
  
  // Personalization Rules
  personalization: {
    enabled: { type: Boolean, default: false },
    rules: [{
      condition: { type: String }, // e.g., "user.preferences.studyIntensity == 'intense'"
      contentModifications: { type: mongoose.Schema.Types.Mixed }
    }]
  },
  
  // Smart Features
  smartFeatures: {
    adaptiveTiming: { type: Boolean, default: false },
    timingRules: { type: String }, // when to send based on user activity
    fatiguePrevention: { type: Boolean, default: true },
    maxFrequency: { type: String }, // e.g., "1 per day"
    contextAware: { type: Boolean, default: false }
  },
  
  // User Preferences Integration
  userPreferences: {
    canDisable: { type: Boolean, default: true },
    defaultEnabled: { type: Boolean, default: true },
    quietHoursRespected: { type: Boolean, default: true },
    channelPreferences: { type: mongoose.Schema.Types.Mixed } // default channel settings
  },
  
  // Analytics & Optimization
  analytics: {
    totalSent: { type: Number, default: 0 },
    openRate: { type: Number, default: 0 },
    actionRate: { type: Number, default: 0 },
    lastOptimized: { type: Date },
    aBTestEnabled: { type: Boolean, default: false },
    aBTestVariants: [{ type: mongoose.Schema.Types.Mixed }]
  },
  
  // Localization
  localization: {
    supportedLocales: [{ type: String }], // ['en', 'es', 'fr', etc.]
    defaultLocale: { type: String, default: 'en' },
    translations: { type: mongoose.Schema.Types.Mixed } // locale -> translated content
  },
  
  // System
  version: { type: String, default: '1.0.0' },
  isActive: { type: Boolean, default: true, index: true },
  deprecated: { type: Boolean, default: false },
  deprecatedAt: { type: Date },
  replacementTemplateKey: { type: String },
  
  // Metadata
  createdBy: { type: String, default: 'system' },
  tags: [{ type: String, index: true }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  strict: true
});

// Indexes
NotificationTemplateSchema.index({ templateKey: 1, version: 1 });
NotificationTemplateSchema.index({ category: 1, subType: 1 });
NotificationTemplateSchema.index({ isActive: 1, deprecated: 1 });
NotificationTemplateSchema.index({ tags: 1 });
NotificationTemplateSchema.index({ 'delivery.scheduling.defaultSchedule': 1 });
NotificationTemplateSchema.index({ 'analytics.totalSent': -1 });

// Static method to get default templates
NotificationTemplateSchema.statics.getDefaultTemplates = function() {
  return [
    // Daily Study Notifications
    {
      templateKey: 'daily-study-reminder',
      name: 'Daily Study Reminder',
      description: 'Reminder to start daily study session',
      category: 'daily-study',
      subType: 'daily-reminder',
      content: {
        titleTemplate: 'Time for your daily coding practice!',
        messageTemplate: 'You have {{pendingCount}} pending questions for today. Ready to tackle them?',
        variables: [
          { name: 'pendingCount', description: 'Number of pending questions', dataType: 'number', required: true }
        ]
      },
      delivery: {
        defaultChannels: [
          { channel: 'in-app', enabled: true },
          { channel: 'push', enabled: true }
        ],
        scheduling: {
          canBeScheduled: true,
          defaultSchedule: 'daily',
          defaultTime: '09:00',
          timezoneAware: true
        },
        priority: 'medium',
        ttl: 86400, // 1 day
        grouping: {
          groupKey: 'daily-study',
          canGroup: true,
          groupStrategy: 'same-day'
        }
      },
      triggers: [
        {
          triggerType: 'time-based',
          cronExpression: '0 9 * * *' // 9 AM daily
        }
      ],
      smartFeatures: {
        adaptiveTiming: true,
        timingRules: 'Send at optimal study time based on user activity',
        fatiguePrevention: true,
        maxFrequency: '1 per day',
        contextAware: true
      },
      userPreferences: {
        canDisable: true,
        defaultEnabled: true,
        quietHoursRespected: true
      }
    },
    
    // Revision Notifications
    {
      templateKey: 'revision-due',
      name: 'Revision Due',
      description: 'Notification when a revision is due',
      category: 'revision',
      subType: 'revision-due',
      content: {
        titleTemplate: 'Revision time!',
        messageTemplate: 'You have {{revisionCount}} questions due for revision today.',
        variables: [
          { name: 'revisionCount', description: 'Number of revisions due', dataType: 'number', required: true },
          { name: 'questionTitles', description: 'Titles of questions due', dataType: 'array', defaultValue: [] }
        ]
      },
      delivery: {
        defaultChannels: [
          { channel: 'in-app', enabled: true },
          { channel: 'email', enabled: false }
        ],
        scheduling: {
          canBeScheduled: false,
          defaultSchedule: 'immediate'
        },
        priority: 'high',
        ttl: 86400, // 1 day
        grouping: {
          groupKey: 'revision-due',
          canGroup: true,
          groupStrategy: 'same-day'
        }
      },
      triggers: [
        {
          triggerType: 'condition-based',
          condition: 'revisionCount > 0'
        }
      ]
    },
    
    // Streak Notifications
    {
      templateKey: 'streak-milestone',
      name: 'Streak Milestone',
      description: 'Celebration for streak milestones',
      category: 'progress-motivation',
      subType: 'streak-milestone',
      content: {
        titleTemplate: 'Streak milestone! 🎉',
        messageTemplate: 'You\'ve maintained a {{streakDays}}-day study streak! Keep up the great work!',
        variables: [
          { name: 'streakDays', description: 'Current streak length', dataType: 'number', required: true }
        ]
      },
      delivery: {
        defaultChannels: [
          { channel: 'in-app', enabled: true },
          { channel: 'push', enabled: true }
        ],
        scheduling: {
          canBeScheduled: false,
          defaultSchedule: 'immediate'
        },
        priority: 'medium',
        ttl: 172800, // 2 days
        grouping: {
          canGroup: false
        }
      },
      triggers: [
        {
          triggerType: 'condition-based',
          condition: 'streakDays % 7 == 0 || streakDays % 30 == 0'
        }
      ],
      personalization: {
        enabled: true,
        rules: [
          {
            condition: "streakDays >= 30",
            contentModifications: {
              titleTemplate: "Incredible! {{streakDays}}-day streak! 🏆",
              messageTemplate: "You've been consistent for {{streakDays}} days! You're a coding machine!"
            }
          }
        ]
      }
    },
    
    // Achievement Notifications
    {
      templateKey: 'achievement-unlocked',
      name: 'Achievement Unlocked',
      description: 'Notification when user unlocks an achievement',
      category: 'achievement',
      subType: 'achievement-unlocked',
      content: {
        titleTemplate: 'Achievement unlocked! 🏅',
        messageTemplate: 'You earned the "{{achievementName}}" achievement! {{achievementDescription}}',
        variables: [
          { name: 'achievementName', description: 'Name of the achievement', dataType: 'string', required: true },
          { name: 'achievementDescription', description: 'Description of the achievement', dataType: 'string', required: true },
          { name: 'tier', description: 'Achievement tier', dataType: 'string', defaultValue: 'bronze' }
        ]
      },
      delivery: {
        defaultChannels: [
          { channel: 'in-app', enabled: true },
          { channel: 'push', enabled: true }
        ],
        scheduling: {
          canBeScheduled: false,
          defaultSchedule: 'immediate'
        },
        priority: 'medium',
        ttl: 259200, // 3 days
        grouping: {
          canGroup: false
        }
      },
      triggers: [
        {
          triggerType: 'event-based',
          eventName: 'achievement.completed'
        }
      ],
      personalization: {
        enabled: true,
        rules: [
          {
            condition: "tier == 'gold' || tier == 'platinum' || tier == 'diamond'",
            contentModifications: {
              titleTemplate: "EPIC achievement unlocked! {{achievementName}} ⭐",
              messageTemplate: "WOW! You earned the {{tier}} tier achievement: {{achievementName}}. {{achievementDescription}}"
            }
          }
        ]
      }
    },
    
    // Timer Notifications
    {
      templateKey: 'timer-long-running',
      name: 'Long Running Timer',
      description: 'Notification when timer has been running for too long',
      category: 'timer-question',
      subType: 'timer-long-running',
      content: {
        titleTemplate: 'Still working?',
        messageTemplate: 'You\'ve been working on "{{questionTitle}}" for {{timeSpent}} minutes. Need a break?',
        variables: [
          { name: 'questionTitle', description: 'Title of the question', dataType: 'string', required: true },
          { name: 'timeSpent', description: 'Time spent in minutes', dataType: 'number', required: true }
        ]
      },
      delivery: {
        defaultChannels: [
          { channel: 'in-app', enabled: true }
        ],
        scheduling: {
          canBeScheduled: false,
          defaultSchedule: 'immediate'
        },
        priority: 'low',
        ttl: 3600, // 1 hour
        grouping: {
          canGroup: false
        }
      },
      triggers: [
        {
          triggerType: 'condition-based',
          condition: 'timeSpent > 45' // More than 45 minutes
        }
      ]
    },
    
    // Study Plan Notifications
    {
      templateKey: 'study-plan-progress',
      name: 'Study Plan Progress',
      description: 'Weekly progress update for study plans',
      category: 'study-plan',
      subType: 'weekly-progress',
      content: {
        titleTemplate: 'Weekly progress update',
        messageTemplate: 'You completed {{completedDays}} days of your "{{planName}}" study plan this week. {{motivationMessage}}',
        variables: [
          { name: 'completedDays', description: 'Days completed this week', dataType: 'number', required: true },
          { name: 'planName', description: 'Name of the study plan', dataType: 'string', required: true },
          { name: 'motivationMessage', description: 'Motivational message', dataType: 'string', required: true }
        ]
      },
      delivery: {
        defaultChannels: [
          { channel: 'in-app', enabled: true },
          { channel: 'email', enabled: false }
        ],
        scheduling: {
          canBeScheduled: true,
          defaultSchedule: 'weekly',
          defaultTime: '18:00',
          timezoneAware: true
        },
        priority: 'low',
        ttl: 172800, // 2 days
        grouping: {
          groupKey: 'study-plan-weekly',
          canGroup: true,
          groupStrategy: 'same-type'
        }
      },
      triggers: [
        {
          triggerType: 'time-based',
          cronExpression: '0 18 * * 0' // Sunday at 6 PM
        }
      ]
    },
    
    // Knowledge Map Notifications
    {
      templateKey: 'knowledge-gap-detected',
      name: 'Knowledge Gap Detected',
      description: 'Notification when knowledge gap is detected',
      category: 'knowledge-map',
      subType: 'gap-detected',
      content: {
        titleTemplate: 'Knowledge gap detected',
        messageTemplate: 'We detected a gap in your understanding of {{topic}}. Consider reviewing this topic.',
        variables: [
          { name: 'topic', description: 'Topic with knowledge gap', dataType: 'string', required: true },
          { name: 'severity', description: 'Severity of gap', dataType: 'string', defaultValue: 'medium' }
        ]
      },
      delivery: {
        defaultChannels: [
          { channel: 'in-app', enabled: true }
        ],
        scheduling: {
          canBeScheduled: false,
          defaultSchedule: 'immediate'
        },
        priority: 'medium',
        ttl: 604800, // 7 days
        grouping: {
          groupKey: 'knowledge-gaps',
          canGroup: true,
          groupStrategy: 'same-type'
        }
      },
      triggers: [
        {
          triggerType: 'event-based',
          eventName: 'knowledge-gap.detected'
        }
      ]
    },
    
    // System Notifications
    {
      templateKey: 'welcome-new-user',
      name: 'Welcome New User',
      description: 'Welcome notification for new users',
      category: 'system-account',
      subType: 'welcome',
      content: {
        titleTemplate: 'Welcome to DevRhythm! 🎉',
        messageTemplate: 'Hi {{userName}}, welcome to DevRhythm! Let\'s start your coding journey.',
        variables: [
          { name: 'userName', description: 'User\'s name', dataType: 'string', required: true }
        ]
      },
      delivery: {
        defaultChannels: [
          { channel: 'in-app', enabled: true },
          { channel: 'email', enabled: true }
        ],
        scheduling: {
          canBeScheduled: false,
          defaultSchedule: 'immediate'
        },
        priority: 'high',
        ttl: 604800, // 7 days
        grouping: {
          canGroup: false
        }
      },
      triggers: [
        {
          triggerType: 'event-based',
          eventName: 'user.created'
        }
      ]
    }
  ];
};

// Static method to initialize default templates
NotificationTemplateSchema.statics.initializeDefaultTemplates = async function() {
  const defaultTemplates = this.getDefaultTemplates();
  const results = [];
  
  for (const templateData of defaultTemplates) {
    // Check if template already exists
    const existingTemplate = await this.findOne({ templateKey: templateData.templateKey });
    
    if (!existingTemplate) {
      const template = new this(templateData);
      results.push(await template.save());
    } else {
      results.push(existingTemplate);
    }
  }
  
  return results;
};

// Method to get template for a specific locale
NotificationTemplateSchema.methods.getForLocale = function(locale) {
  const template = this.toObject();
  
  // Check if we have translations for this locale
  if (this.localization.translations && this.localization.translations[locale]) {
    const translation = this.localization.translations[locale];
    
    if (translation.titleTemplate) {
      template.content.titleTemplate = translation.titleTemplate;
    }
    
    if (translation.messageTemplate) {
      template.content.messageTemplate = translation.messageTemplate;
    }
  }
  
  return template;
};

// Method to increment analytics
NotificationTemplateSchema.methods.incrementAnalytics = function(sent = false, opened = false, actionTaken = false) {
  if (sent) {
    this.analytics.totalSent += 1;
  }
  
  // Calculate open rate
  if (this.analytics.totalSent > 0) {
    // This would be updated by external analytics in a real system
    // For now, just increment when we know it was opened
    if (opened) {
      const currentOpens = this.analytics.openRate * this.analytics.totalSent / 100;
      this.analytics.openRate = ((currentOpens + 1) / this.analytics.totalSent) * 100;
    }
    
    if (actionTaken) {
      const currentActions = this.analytics.actionRate * this.analytics.totalSent / 100;
      this.analytics.actionRate = ((currentActions + 1) / this.analytics.totalSent) * 100;
    }
  }
  
  return this.save();
};

// Method to optimize template based on analytics
NotificationTemplateSchema.methods.optimize = function() {
  // Check if optimization is needed
  const now = new Date();
  const lastOptimized = this.analytics.lastOptimized;
  const daysSinceLastOptimization = lastOptimized ? 
    (now - lastOptimized) / (1000 * 60 * 60 * 24) : Infinity;
  
  // Only optimize if we have enough data and it's been a while
  if (this.analytics.totalSent < 100 || daysSinceLastOptimization < 30) {
    return this;
  }
  
  // Analyze performance
  const openRate = this.analytics.openRate;
  const actionRate = this.analytics.actionRate;
  
  // Simple optimization rules
  if (openRate < 20) {
    // Low open rate - consider changing title or timing
    this.smartFeatures.adaptiveTiming = true;
  }
  
  if (actionRate < 10) {
    // Low action rate - consider improving message or call-to-action
    this.smartFeatures.contextAware = true;
  }
  
  // Update last optimized timestamp
  this.analytics.lastOptimized = now;
  
  return this.save();
};

// Method to deprecate template
NotificationTemplateSchema.methods.deprecate = function(replacementTemplateKey = null) {
  this.deprecated = true;
  this.deprecatedAt = new Date();
  this.isActive = false;
  
  if (replacementTemplateKey) {
    this.replacementTemplateKey = replacementTemplateKey;
  }
  
  return this.save();
};

// Method to clone template
NotificationTemplateSchema.methods.clone = function(newTemplateKey, changes = {}) {
  const clonedData = this.toObject();
  
  // Remove MongoDB specific fields
  delete clonedData._id;
  delete clonedData.createdAt;
  delete clonedData.updatedAt;
  delete clonedData.__v;
  
  // Apply changes
  Object.assign(clonedData, changes);
  
  // Set new template key
  clonedData.templateKey = newTemplateKey;
  
  // Reset analytics
  clonedData.analytics = {
    totalSent: 0,
    openRate: 0,
    actionRate: 0,
    lastOptimized: null,
    aBTestEnabled: false,
    aBTestVariants: []
  };
  
  // Increment version
  const versionParts = clonedData.version.split('.');
  versionParts[2] = parseInt(versionParts[2]) + 1;
  clonedData.version = versionParts.join('.');
  
  return new this.constructor(clonedData);
};

// Method to get template preview
NotificationTemplateSchema.methods.getPreview = function() {
  const template = this.toObject();
  
  return {
    templateKey: template.templateKey,
    name: template.name,
    description: template.description,
    category: template.category,
    subType: template.subType,
    content: {
      titleTemplate: template.content.titleTemplate,
      messageTemplate: template.content.messageTemplate
    },
    delivery: {
      defaultChannels: template.delivery.defaultChannels,
      priority: template.delivery.priority,
      scheduling: template.delivery.scheduling
    },
    analytics: {
      totalSent: template.analytics.totalSent,
      openRate: template.analytics.openRate,
      actionRate: template.analytics.actionRate
    },
    isActive: template.isActive,
    deprecated: template.deprecated,
    version: template.version,
    tags: template.tags
  };
};

// Static method to find templates by trigger
NotificationTemplateSchema.statics.findByTrigger = async function(eventName, conditionData = {}) {
  const templates = await this.find({
    'triggers.triggerType': { $in: ['event-based', 'condition-based'] },
    isActive: true,
    deprecated: false
  });
  
  // Filter templates based on trigger conditions
  return templates.filter(template => {
    return template.triggers.some(trigger => {
      if (trigger.triggerType === 'event-based' && trigger.eventName === eventName) {
        return true;
      }
      
      if (trigger.triggerType === 'condition-based') {
        // Simple condition evaluation (in a real system, use a proper expression evaluator)
        try {
          return evaluateCondition(trigger.condition, conditionData);
        } catch (error) {
          console.error('Error evaluating condition:', error);
          return false;
        }
      }
      
      return false;
    });
  });
};

// Helper function to evaluate conditions
function evaluateCondition(condition, data) {
  if (!condition) return true;
  
  // Simple equality check for now
  // In a real system, use a proper expression evaluator like expr-eval
  const conditions = condition.split('&&').map(c => c.trim());
  
  for (const cond of conditions) {
    if (cond.includes('==')) {
      const [key, value] = cond.split('==').map(part => part.trim().replace(/['"]/g, ''));
      if (data[key] != value) return false;
    } else if (cond.includes('>')) {
      const [key, value] = cond.split('>').map(part => part.trim());
      if (!(parseFloat(data[key]) > parseFloat(value))) return false;
    } else if (cond.includes('<')) {
      const [key, value] = cond.split('<').map(part => part.trim());
      if (!(parseFloat(data[key]) < parseFloat(value))) return false;
    } else if (cond.includes('>=')) {
      const [key, value] = cond.split('>=').map(part => part.trim());
      if (!(parseFloat(data[key]) >= parseFloat(value))) return false;
    } else if (cond.includes('<=')) {
      const [key, value] = cond.split('<=').map(part => part.trim());
      if (!(parseFloat(data[key]) <= parseFloat(value))) return false;
    }
  }
  
  return true;
}

const NotificationTemplate = mongoose.model('NotificationTemplate', NotificationTemplateSchema);

module.exports = NotificationTemplate;
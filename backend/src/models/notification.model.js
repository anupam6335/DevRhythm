const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationSchema = new mongoose.Schema({
  // Ownership
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  // Notification Type
  notificationType: {
    category: {
      type: String,
      required: true,
      enum: [
        'daily-study', 'revision', 'progress-motivation', 'timer-question',
        'study-plan', 'knowledge-map', 'system-account', 'achievement'
      ],
      index: true
    },
    subType: { type: String }, // e.g., 'streak-reminder', 'revision-overdue'
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'NotificationTemplate' }
  },
  
  // Content
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed }, // flexible payload
  metadata: {
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    urgency: { type: String, enum: ['immediate', 'scheduled', 'background'] },
    groupKey: { type: String } // for grouping notifications
  },
  
  // Delivery Status
  delivery: {
    channels: [{
      channel: { type: String, enum: ['in-app', 'email', 'push', 'browser'] },
      status: { 
        type: String, 
        enum: ['pending', 'sent', 'delivered', 'read', 'failed', 'skipped'] 
      },
      sentAt: { type: Date },
      readAt: { type: Date },
      failureReason: { type: String }
    }],
    scheduledFor: { type: Date, index: true },
    sentAt: { type: Date },
    expiresAt: { type: Date }
  },
  
  // User Interaction
  interaction: {
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    actionTaken: { type: Boolean, default: false },
    actionType: { type: String }, // e.g., 'opened-day', 'started-timer'
    actionAt: { type: Date },
    dismissed: { type: Boolean, default: false },
    dismissedAt: { type: Date }
  },
  
  // Context & References
  context: {
    dayId: { type: mongoose.Schema.Types.ObjectId, ref: 'Day' },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    timerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Timer' },
    revisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'RevisionSchedule' },
    achievementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' },
    studyPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan' }
  },
  
  // Smart Features
  smartFeatures: {
    isAdaptive: { type: Boolean, default: false },
    adaptiveData: { type: mongoose.Schema.Types.Mixed },
    personalizationScore: { type: Number, min: 0, max: 1 }
  },
  
  // System
  isActive: { type: Boolean, default: true },
  retryCount: { type: Number, default: 0 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  strict: true
});

// Indexes
NotificationSchema.index({ userId: 1, 'interaction.isRead': 1 });
NotificationSchema.index({ userId: 1, 'notificationType.category': 1 });
NotificationSchema.index({ userId: 1, 'delivery.scheduledFor': 1 });
NotificationSchema.index({ 'delivery.scheduledFor': 1, 'delivery.channels.status': 'pending' });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ 'context.dayId': 1 });
NotificationSchema.index({ 'context.questionId': 1 });

// Static method to create notification from template
NotificationSchema.statics.createFromTemplate = async function(
  userId, 
  template, 
  variables = {}, 
  context = {},
  deliveryOptions = {}
) {
  // Replace variables in title and message
  let title = template.content.titleTemplate;
  let message = template.content.messageTemplate;
  
  // Replace variable placeholders
  template.content.variables.forEach(variable => {
    const placeholder = `{{${variable.name}}}`;
    const value = variables[variable.name] || variable.defaultValue || '';
    
    title = title.replace(new RegExp(placeholder, 'g'), value);
    message = message.replace(new RegExp(placeholder, 'g'), value);
  });
  
  // Set up delivery channels
  const channels = template.delivery.defaultChannels
    .filter(channel => channel.enabled)
    .map(channel => ({
      channel: channel.channel,
      status: 'pending'
    }));
  
  // Calculate scheduled time
  let scheduledFor = new Date();
  if (deliveryOptions.scheduledFor) {
    scheduledFor = deliveryOptions.scheduledFor;
  } else if (template.delivery.scheduling.canBeScheduled) {
    // Apply default schedule
    if (template.delivery.scheduling.defaultTime) {
      const [hours, minutes] = template.delivery.scheduling.defaultTime.split(':');
      scheduledFor.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
  }
  
  // Set expiration (TTL)
  const expiresAt = new Date(scheduledFor.getTime() + (template.delivery.ttl * 1000));
  
  // Create notification
  const notification = new this({
    userId,
    notificationType: {
      category: template.category,
      subType: template.subType,
      templateId: template._id
    },
    title,
    message,
    data: variables,
    metadata: {
      priority: deliveryOptions.priority || template.delivery.priority,
      urgency: deliveryOptions.urgency || 'immediate',
      groupKey: template.delivery.grouping.groupKey
    },
    delivery: {
      channels,
      scheduledFor,
      expiresAt
    },
    context,
    smartFeatures: {
      isAdaptive: template.smartFeatures.adaptiveTiming,
      adaptiveData: deliveryOptions.adaptiveData || {},
      personalizationScore: calculatePersonalizationScore(template, variables)
    }
  });
  
  return notification.save();
};

// Method to mark as sent
NotificationSchema.methods.markAsSent = function(channel) {
  const channelIndex = this.delivery.channels.findIndex(c => c.channel === channel);
  
  if (channelIndex >= 0) {
    this.delivery.channels[channelIndex].status = 'sent';
    this.delivery.channels[channelIndex].sentAt = new Date();
    
    // If this is the first channel being sent, update sentAt
    if (!this.delivery.sentAt) {
      this.delivery.sentAt = new Date();
    }
  }
  
  return this.save();
};

// Method to mark as delivered
NotificationSchema.methods.markAsDelivered = function(channel) {
  const channelIndex = this.delivery.channels.findIndex(c => c.channel === channel);
  
  if (channelIndex >= 0) {
    this.delivery.channels[channelIndex].status = 'delivered';
  }
  
  return this.save();
};

// Method to mark as read
NotificationSchema.methods.markAsRead = function() {
  this.interaction.isRead = true;
  this.interaction.readAt = new Date();
  
  // Also mark in-app channel as read if it exists
  const inAppChannel = this.delivery.channels.find(c => c.channel === 'in-app');
  if (inAppChannel) {
    inAppChannel.status = 'read';
    inAppChannel.readAt = new Date();
  }
  
  return this.save();
};

// Method to mark action taken
NotificationSchema.methods.markActionTaken = function(actionType) {
  this.interaction.actionTaken = true;
  this.interaction.actionType = actionType;
  this.interaction.actionAt = new Date();
  return this.save();
};

// Method to dismiss notification
NotificationSchema.methods.dismiss = function() {
  this.interaction.dismissed = true;
  this.interaction.dismissedAt = new Date();
  return this.save();
};

// Method to retry failed delivery
NotificationSchema.methods.retryDelivery = function() {
  if (this.retryCount >= 3) {
    throw new Error('Maximum retry count reached');
  }
  
  // Reset failed channels to pending
  this.delivery.channels.forEach(channel => {
    if (channel.status === 'failed') {
      channel.status = 'pending';
      channel.sentAt = null;
      channel.failureReason = null;
    }
  });
  
  this.retryCount += 1;
  return this.save();
};

// Method to get notification for display
NotificationSchema.methods.getDisplayData = function() {
  const notification = this.toObject();
  
  return {
    id: notification._id,
    title: notification.title,
    message: notification.message,
    category: notification.notificationType.category,
    subType: notification.notificationType.subType,
    priority: notification.metadata.priority,
    isRead: notification.interaction.isRead,
    actionTaken: notification.interaction.actionTaken,
    dismissed: notification.interaction.dismissed,
    createdAt: notification.createdAt,
    scheduledFor: notification.delivery.scheduledFor,
    context: notification.context,
    data: notification.data
  };
};

// Method to check if notification is actionable
NotificationSchema.methods.isActionable = function() {
  // Not actionable if dismissed or already action taken
  if (this.interaction.dismissed || this.interaction.actionTaken) {
    return false;
  }
  
  // Check if notification has expired
  if (this.delivery.expiresAt && new Date() > this.delivery.expiresAt) {
    return false;
  }
  
  // Check if notification has been sent
  const hasBeenSent = this.delivery.channels.some(c => 
    ['sent', 'delivered', 'read'].includes(c.status)
  );
  
  return hasBeenSent;
};

// Method to get action URL based on context
NotificationSchema.methods.getActionUrl = function() {
  if (!this.context) return null;
  
  const { category, subType } = this.notificationType;
  
  // Daily study notifications
  if (category === 'daily-study') {
    if (this.context.dayId) {
      return `/day/${this.context.dayId}`;
    }
    return '/today';
  }
  
  // Revision notifications
  if (category === 'revision') {
    if (this.context.questionId) {
      return `/question/${this.context.questionId}/revise`;
    }
    if (this.context.revisionId) {
      return `/revisions/${this.context.revisionId}`;
    }
    return '/revisions';
  }
  
  // Progress/motivation notifications
  if (category === 'progress-motivation') {
    if (subType === 'streak-reminder') {
      return '/streak';
    }
    if (subType === 'milestone-celebration' && this.context.achievementId) {
      return `/achievements/${this.context.achievementId}`;
    }
    return '/dashboard';
  }
  
  // Timer/question notifications
  if (category === 'timer-question') {
    if (this.context.questionId) {
      return `/question/${this.context.questionId}`;
    }
    if (this.context.timerId) {
      return `/timer/${this.context.timerId}`;
    }
    return '/questions';
  }
  
  // Study plan notifications
  if (category === 'study-plan') {
    if (this.context.studyPlanId) {
      return `/study-plans/${this.context.studyPlanId}`;
    }
    return '/study-plans';
  }
  
  // Knowledge map notifications
  if (category === 'knowledge-map') {
    return '/knowledge-map';
  }
  
  // Achievement notifications
  if (category === 'achievement') {
    if (this.context.achievementId) {
      return `/achievements/${this.context.achievementId}`;
    }
    return '/achievements';
  }
  
  // System/account notifications
  if (category === 'system-account') {
    return '/profile';
  }
  
  return null;
};

// Static method to get pending notifications for delivery
NotificationSchema.statics.getPendingNotifications = async function(batchSize = 100) {
  const now = new Date();
  
  return this.find({
    'delivery.scheduledFor': { $lte: now },
    'delivery.channels.status': 'pending',
    'interaction.dismissed': false,
    isActive: true,
    $or: [
      { 'delivery.expiresAt': { $gt: now } },
      { 'delivery.expiresAt': null }
    ]
  })
  .sort({ 'metadata.priority': -1, 'delivery.scheduledFor': 1 })
  .limit(batchSize)
  .populate('userId', 'email name preferences.notificationPreferences')
  .populate('notificationType.templateId');
};

// Static method to clean up expired notifications
NotificationSchema.statics.cleanupExpired = async function() {
  const expiredDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
  
  return this.updateMany(
    {
      $or: [
        { 'delivery.expiresAt': { $lt: new Date() } },
        { createdAt: { $lt: expiredDate } }
      ],
      isActive: true
    },
    {
      isActive: false,
      updatedAt: new Date()
    }
  );
};

// Helper function to calculate personalization score
function calculatePersonalizationScore(template, variables) {
  if (!template.personalization.enabled) {
    return 0.5; // Default score for non-personalized notifications
  }
  
  let score = 0;
  let matchedRules = 0;
  
  template.personalization.rules.forEach(rule => {
    // Simple rule matching (in a real app, use a proper expression evaluator)
    if (rule.condition.includes('==') && variables[rule.condition.split('==')[0].trim()]) {
      matchedRules++;
    }
  });
  
  if (template.personalization.rules.length > 0) {
    score = matchedRules / template.personalization.rules.length;
  }
  
  return score;
}

const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification;
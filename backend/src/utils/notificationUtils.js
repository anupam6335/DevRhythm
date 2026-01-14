const nodemailer = require('nodemailer');
const config = require('../config/environment');
const logger = require('./logger');
const { Notification, NotificationTemplate } = require('../models');

class NotificationUtils {
  constructor() {
    this.emailTransporter = null;
    this.initializeEmailTransporter();
    this.notificationQueue = [];
    this.processingQueue = false;
  }

  initializeEmailTransporter() {
    if (config.email.smtp.host) {
      this.emailTransporter = nodemailer.createTransport(config.email.smtp);
      
      this.emailTransporter.verify((error) => {
        if (error) {
          logger.error('Email transporter failed to initialize:', error);
          this.emailTransporter = null;
        } else {
          logger.info('Email transporter initialized');
        }
      });
    }
  }

  async createNotification(userId, type, data, context = {}, deliveryOptions = {}) {
    try {
      const template = await NotificationTemplate.findOne({
        templateKey: type,
        isActive: true,
        deprecated: false
      });

      if (!template) {
        logger.warn(`Notification template not found: ${type}`);
        return null;
      }

      const notification = await Notification.createFromTemplate(
        userId,
        template,
        data,
        context,
        deliveryOptions
      );

      logger.info(`Notification created: ${type} for user ${userId}`, {
        notificationId: notification._id,
        scheduledFor: notification.delivery.scheduledFor
      });

      this.queueNotification(notification);
      
      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  queueNotification(notification) {
    this.notificationQueue.push(notification);
    
    if (!this.processingQueue) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.processingQueue || this.notificationQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      while (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift();
        await this.deliverNotification(notification);
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      logger.error('Notification queue processing error:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  async deliverNotification(notification) {
    try {
      for (const channelConfig of notification.delivery.channels) {
        if (channelConfig.status !== 'pending') {
          continue;
        }

        switch (channelConfig.channel) {
          case 'in-app':
            await this.deliverInApp(notification, channelConfig);
            break;
          case 'email':
            await this.deliverEmail(notification, channelConfig);
            break;
          case 'push':
            await this.deliverPush(notification, channelConfig);
            break;
          case 'browser':
            await this.deliverBrowser(notification, channelConfig);
            break;
        }
      }

      await notification.markAsSent('in-app');
      logger.debug(`Notification delivered: ${notification._id}`);
    } catch (error) {
      logger.error('Failed to deliver notification:', {
        notificationId: notification._id,
        error: error.message
      });
      
      await notification.retryDelivery();
    }
  }

  async deliverInApp(notification, channelConfig) {
    await notification.markAsSent('in-app');
    logger.debug(`In-app notification sent: ${notification._id}`);
  }

  async deliverEmail(notification, channelConfig) {
    if (!this.emailTransporter) {
      logger.warn('Email transporter not available');
      channelConfig.status = 'skipped';
      channelConfig.failureReason = 'Email transporter not configured';
      await notification.save();
      return;
    }

    try {
      const user = await notification.populate('userId');
      const email = user.userId.email;
      
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: notification.title,
        html: this.generateEmailHtml(notification),
        text: notification.message
      };

      await this.emailTransporter.sendMail(mailOptions);
      await notification.markAsSent('email');
      
      logger.info(`Email notification sent: ${notification._id} to ${email}`);
    } catch (error) {
      logger.error('Email delivery failed:', {
        notificationId: notification._id,
        error: error.message
      });
      
      channelConfig.status = 'failed';
      channelConfig.failureReason = error.message;
      await notification.save();
      
      throw error;
    }
  }

  async deliverPush(notification, channelConfig) {
    logger.debug('Push notifications require additional setup');
    channelConfig.status = 'skipped';
    channelConfig.failureReason = 'Push notifications not implemented';
    await notification.save();
  }

  async deliverBrowser(notification, channelConfig) {
    logger.debug('Browser notifications require additional setup');
    channelConfig.status = 'skipped';
    channelConfig.failureReason = 'Browser notifications not implemented';
    await notification.save();
  }

  generateEmailHtml(notification) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DevRhythm</h1>
            <p>Coding Practice & Spaced Repetition System</p>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            
            ${this.generateEmailActions(notification)}
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Happy coding!<br>The DevRhythm Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} DevRhythm. All rights reserved.</p>
            <p>You received this email because you're a registered user of DevRhythm.</p>
            <p><a href="[UNSUBSCRIBE_URL]">Unsubscribe from these notifications</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateEmailActions(notification) {
    const actionUrl = notification.getActionUrl();
    
    if (!actionUrl) {
      return '';
    }
    
    return `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${actionUrl}" class="button" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Take Action
        </a>
      </div>
    `;
  }

  async sendDailyStudyReminder(userId, pendingCount) {
    return this.createNotification(userId, 'daily-study-reminder', {
      pendingCount: pendingCount
    }, {}, {
      scheduledFor: this.calculateOptimalStudyTime(userId)
    });
  }

  async sendRevisionDue(userId, revisionCount, questionTitles = []) {
    return this.createNotification(userId, 'revision-due', {
      revisionCount: revisionCount,
      questionTitles: questionTitles.slice(0, 3)
    });
  }

  async sendStreakMilestone(userId, streakDays) {
    return this.createNotification(userId, 'streak-milestone', {
      streakDays: streakDays
    });
  }

  async sendAchievementUnlocked(userId, achievement) {
    return this.createNotification(userId, 'achievement-unlocked', {
      achievementName: achievement.name,
      achievementDescription: achievement.description,
      tier: achievement.tier
    }, {
      achievementId: achievement._id
    });
  }

  async sendWelcomeNotification(userId, userName) {
    return this.createNotification(userId, 'welcome-new-user', {
      userName: userName
    });
  }

  calculateOptimalStudyTime(userId) {
    const now = new Date();
    const optimalTime = new Date(now);
    
    optimalTime.setHours(9, 0, 0, 0);
    
    if (optimalTime < now) {
      optimalTime.setDate(optimalTime.getDate() + 1);
    }
    
    return optimalTime;
  }

  async getUserNotifications(userId, filters = {}) {
    const query = {
      userId,
      isActive: true,
      'interaction.dismissed': false
    };
    
    if (filters.category) {
      query['notificationType.category'] = filters.category;
    }
    
    if (filters.isRead !== undefined) {
      query['interaction.isRead'] = filters.isRead;
    }
    
    if (filters.since) {
      query.createdAt = { $gte: new Date(filters.since) };
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 50)
      .populate('context.dayId')
      .populate('context.questionId')
      .populate('context.achievementId');
    
    return notifications.map(n => n.getDisplayData());
  }

  async markNotificationsAsRead(userId, notificationIds = null) {
    const query = {
      userId,
      'interaction.isRead': false
    };
    
    if (notificationIds) {
      query._id = { $in: notificationIds };
    }
    
    const result = await Notification.updateMany(
      query,
      {
        $set: {
          'interaction.isRead': true,
          'interaction.readAt': new Date()
        }
      }
    );
    
    logger.info(`Marked ${result.modifiedCount} notifications as read for user ${userId}`);
    return result.modifiedCount;
  }

  async dismissNotification(userId, notificationId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      userId,
      isActive: true
    });
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    await notification.dismiss();
    return true;
  }

  async cleanupOldNotifications(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const result = await Notification.updateMany(
      {
        createdAt: { $lt: cutoffDate },
        isActive: true
      },
      {
        isActive: false,
        updatedAt: new Date()
      }
    );
    
    logger.info(`Cleaned up ${result.modifiedCount} old notifications`);
    return result.modifiedCount;
  }

  async getNotificationStats(userId = null) {
    const match = userId ? { userId } : {};
    
    const stats = await Notification.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$notificationType.category',
          total: { $sum: 1 },
          read: {
            $sum: { $cond: ['$interaction.isRead', 1, 0] }
          },
          actionTaken: {
            $sum: { $cond: ['$interaction.actionTaken', 1, 0] }
          },
          delivered: {
            $sum: {
              $cond: [
                { $in: ['$delivery.channels.status', ['sent', 'delivered', 'read']] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          category: '$_id',
          total: 1,
          read: 1,
          readRate: { $cond: [{ $eq: ['$total', 0] }, 0, { $divide: ['$read', '$total'] }] },
          actionRate: { $cond: [{ $eq: ['$total', 0] }, 0, { $divide: ['$actionTaken', '$total'] }] },
          deliveryRate: { $cond: [{ $eq: ['$total', 0] }, 0, { $divide: ['$delivered', '$total'] }] },
          _id: 0
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    return stats;
  }
}

const notificationUtils = new NotificationUtils();
module.exports = notificationUtils;
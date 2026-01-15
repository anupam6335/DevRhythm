const nodemailer = require('nodemailer');
const config = require('../config/environment');
const logger = require('./logger');

class NotificationUtils {
  constructor() {
    this.emailTransporter = null;
    this.initEmailTransporter();
  }

  initEmailTransporter() {
    if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
      this.emailTransporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_SECURE,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS
        }
      });
    }
  }

  async sendEmail(to, subject, html, text = null) {
    if (!this.emailTransporter) {
      logger.warn('Email transporter not configured');
      return false;
    }

    try {
      const mailOptions = {
        from: config.EMAIL_FROM,
        to,
        subject,
        html,
        text: text || this.htmlToText(html)
      };

      const info = await this.emailTransporter.sendMail(mailOptions);
      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: info.messageId
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to send email', { to, subject, error: error.message });
      return false;
    }
  }

  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  formatNotificationMessage(template, variables = {}) {
    let message = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      message = message.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return message;
  }

  generateDailyStudyNotification(user, pendingCount) {
    return {
      title: 'Time for your daily coding practice!',
      message: `You have ${pendingCount} pending questions for today. Ready to tackle them?`,
      data: { pendingCount },
      priority: 'medium'
    };
  }

  generateRevisionNotification(user, revisionCount, questionTitles = []) {
    return {
      title: 'Revision time!',
      message: `You have ${revisionCount} questions due for revision today.`,
      data: { revisionCount, questionTitles },
      priority: 'high'
    };
  }

  generateStreakNotification(user, streakDays) {
    const messages = {
      3: '🎉 3-day streak! Keep it up!',
      7: '🔥 7-day streak! You\'re on fire!',
      30: '🏆 30-day streak! Amazing consistency!'
    };

    const message = messages[streakDays] || `Great job! ${streakDays}-day streak!`;

    return {
      title: 'Streak milestone!',
      message,
      data: { streakDays },
      priority: 'medium'
    };
  }

  generateAchievementNotification(user, achievement) {
    return {
      title: 'Achievement unlocked! 🏅',
      message: `You earned the "${achievement.name}" achievement!`,
      data: { achievement },
      priority: 'medium'
    };
  }

  generateProgressNotification(user, progressData) {
    const { improvement, milestone } = progressData;
    
    let title = 'Progress update';
    let message = 'Keep up the good work!';
    
    if (improvement > 10) {
      title = 'Significant improvement!';
      message = `Your performance improved by ${improvement}% this week!`;
    } else if (milestone) {
      title = 'Milestone reached!';
      message = `You reached ${milestone} questions solved!`;
    }

    return {
      title,
      message,
      data: progressData,
      priority: 'low'
    };
  }

  generateSystemNotification(title, message, priority = 'medium') {
    return {
      title,
      message,
      priority
    };
  }

  shouldSendNotification(user, notificationType, lastSent = null) {
    if (!user.preferences?.notificationPreferences) {
      return true;
    }

    const preferences = user.preferences.notificationPreferences;

    if (!preferences.inApp && notificationType.channel === 'in-app') {
      return false;
    }

    if (!preferences.email && notificationType.channel === 'email') {
      return false;
    }

    if (!preferences.push && notificationType.channel === 'push') {
      return false;
    }

    if (preferences.quietHours) {
      const now = new Date();
      const currentHour = now.getHours();
      const [startHour, startMinute] = preferences.quietHours.from.split(':').map(Number);
      const [endHour, endMinute] = preferences.quietHours.to.split(':').map(Number);
      
      const currentMinutes = currentHour * 60 + now.getMinutes();
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
        return false;
      }
    }

    if (lastSent) {
      const hoursSinceLast = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
      
      if (notificationType.frequency === 'daily' && hoursSinceLast < 24) {
        return false;
      }
      
      if (notificationType.frequency === 'weekly' && hoursSinceLast < 168) {
        return false;
      }
    }

    return true;
  }

  async sendNotification(user, notification, channels = ['in-app']) {
    const results = {
      sent: false,
      channels: {}
    };

    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            if (user.email && this.shouldSendNotification(user, { channel: 'email' })) {
              const emailSent = await this.sendEmail(
                user.email,
                notification.title,
                notification.message
              );
              results.channels.email = emailSent ? 'sent' : 'failed';
            }
            break;

          case 'in-app':
            results.channels.inApp = 'queued';
            break;

          case 'push':
            results.channels.push = 'not_implemented';
            break;

          default:
            results.channels[channel] = 'unsupported';
        }
      } catch (error) {
        logger.error(`Failed to send ${channel} notification`, {
          userId: user._id,
          error: error.message
        });
        results.channels[channel] = 'failed';
      }
    }

    results.sent = Object.values(results.channels).some(status => 
      status === 'sent' || status === 'queued'
    );

    return results;
  }

  async batchSendNotifications(users, notificationGenerator) {
    const results = [];
    
    for (const user of users) {
      const notification = notificationGenerator(user);
      const result = await this.sendNotification(user, notification);
      results.push({
        userId: user._id,
        success: result.sent,
        channels: result.channels
      });
    }
    
    return results;
  }
}

module.exports = new NotificationUtils();
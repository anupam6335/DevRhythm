const { User } = require('../models');
const DateUtils = require('../utils/dateUtils');
const logger = require('../utils/logger');

class UserService {
  async getProfile(userId) {
    try {
      const user = await User.findById(userId).select('-sessions -dataExportToken');
      if (!user || !user.isActive) {
        throw new Error('User not found');
      }
      return user.getPublicProfile();
    } catch (error) {
      logger.error('Failed to get user profile:', error);
      throw error;
    }
  }

  async updateProfile(userId, updates) {
    try {
      const allowedUpdates = [
        'name',
        'timezone',
        'learningGoals',
        'preferences',
        'uiPreferences',
      ];

      const updateData = {};
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          if (key === 'learningGoals' || key === 'preferences' || key === 'uiPreferences') {
            updateData[key] = { ...updates[key] };
          } else {
            updateData[key] = updates[key];
          }
        }
      });

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).select('-sessions -dataExportToken');

      if (!user) {
        throw new Error('User not found');
      }

      return user.getPublicProfile();
    } catch (error) {
      logger.error('Failed to update user profile:', error);
      throw error;
    }
  }

  async getPreferences(userId) {
    try {
      const user = await User.findById(userId).select('preferences uiPreferences learningGoals timezone');
      if (!user) {
        throw new Error('User not found');
      }

      return {
        preferences: user.preferences,
        uiPreferences: user.uiPreferences,
        learningGoals: user.learningGoals,
        timezone: user.timezone,
      };
    } catch (error) {
      logger.error('Failed to get user preferences:', error);
      throw error;
    }
  }

  async updatePreferences(userId, updates) {
    try {
      const allowedUpdates = [
        'preferences',
        'uiPreferences',
        'learningGoals',
        'timezone',
      ];

      const updateData = {};
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          if (key === 'preferences' || key === 'uiPreferences' || key === 'learningGoals') {
            updateData[key] = { ...updates[key] };
          } else {
            updateData[key] = updates[key];
          }
        }
      });

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).select('preferences uiPreferences learningGoals timezone');

      if (!user) {
        throw new Error('User not found');
      }

      return {
        preferences: user.preferences,
        uiPreferences: user.uiPreferences,
        learningGoals: user.learningGoals,
        timezone: user.timezone,
      };
    } catch (error) {
      logger.error('Failed to update user preferences:', error);
      throw error;
    }
  }

  async updateOnboarding(userId, step, data = {}) {
    try {
      const updateData = {
        onboardingStep: step,
        updatedAt: new Date(),
      };

      if (step >= 10) {
        updateData.onboardingCompleted = true;
      }

      if (data.learningGoals) {
        updateData.learningGoals = data.learningGoals;
      }

      if (data.preferences) {
        updateData.preferences = { ...data.preferences };
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('onboardingCompleted onboardingStep learningGoals preferences');

      if (!user) {
        throw new Error('User not found');
      }

      return {
        onboardingCompleted: user.onboardingCompleted,
        onboardingStep: user.onboardingStep,
        learningGoals: user.learningGoals,
        preferences: user.preferences,
      };
    } catch (error) {
      logger.error('Failed to update onboarding:', error);
      throw error;
    }
  }

  async getOnboardingStatus(userId) {
    try {
      const user = await User.findById(userId).select('onboardingCompleted onboardingStep learningGoals preferences');
      if (!user) {
        throw new Error('User not found');
      }

      return {
        onboardingCompleted: user.onboardingCompleted,
        onboardingStep: user.onboardingStep,
        learningGoals: user.learningGoals,
        preferences: user.preferences,
      };
    } catch (error) {
      logger.error('Failed to get onboarding status:', error);
      throw error;
    }
  }

  async getSessions(userId) {
    try {
      const user = await User.findById(userId).select('sessions');
      if (!user) {
        throw new Error('User not found');
      }

      const now = new Date();
      return user.sessions
        .filter(session => !session.expiresAt || new Date(session.expiresAt) > now)
        .map(session => ({
          sessionId: session.sessionId,
          deviceInfo: session.deviceInfo,
          ipAddress: session.ipAddress,
          lastActive: session.lastActive,
          expiresAt: session.expiresAt,
        }));
    } catch (error) {
      logger.error('Failed to get user sessions:', error);
      throw error;
    }
  }

  async exportData(userId, options = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const exportData = {
        profile: user.getPublicProfile(),
        exportedAt: new Date().toISOString(),
        format: options.format || 'json',
        includes: options.include || ['profile', 'days', 'questions'],
      };

      const token = require('crypto').randomBytes(32).toString('hex');
      user.dataExportToken = token;
      user.lastDataExport = new Date();
      await user.save();

      return { data: exportData, token };
    } catch (error) {
      logger.error('Failed to export user data:', error);
      throw error;
    }
  }

  async softDeleteAccount(userId) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            isActive: false,
            deletedAt: new Date(),
            sessions: [],
            dataExportToken: null,
          },
        },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return { success: true, message: 'Account deactivated successfully' };
    } catch (error) {
      logger.error('Failed to delete account:', error);
      throw error;
    }
  }

  async getStats(userId) {
    try {
      const user = await User.findById(userId).select('stats streak loginCount createdAt');
      if (!user) {
        throw new Error('User not found');
      }

      const daysSinceJoin = DateUtils.differenceInDays(user.createdAt, new Date());
      const consistency = daysSinceJoin > 0 
        ? Math.round((user.streak.consistencyScore || 0) / daysSinceJoin * 100)
        : 0;

      return {
        ...user.stats.toObject(),
        streak: user.streak,
        loginCount: user.loginCount,
        daysSinceJoin,
        consistency,
      };
    } catch (error) {
      logger.error('Failed to get user stats:', error);
      throw error;
    }
  }

  async updateStats(userId, stats) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      Object.keys(stats).forEach(key => {
        if (user.stats[key] !== undefined) {
          user.stats[key] = stats[key];
        }
      });

      await user.save();
      return user.stats;
    } catch (error) {
      logger.error('Failed to update user stats:', error);
      throw error;
    }
  }

  async updateStreak(userId, streakData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      Object.keys(streakData).forEach(key => {
        if (user.streak[key] !== undefined) {
          user.streak[key] = streakData[key];
        }
      });

      await user.save();
      return user.streak;
    } catch (error) {
      logger.error('Failed to update streak:', error);
      throw error;
    }
  }

  async getLearningGoals(userId) {
    try {
      const user = await User.findById(userId).select('learningGoals');
      if (!user) {
        throw new Error('User not found');
      }
      return user.learningGoals;
    } catch (error) {
      logger.error('Failed to get learning goals:', error);
      throw error;
    }
  }

  async updateLearningGoals(userId, learningGoals) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            learningGoals,
            updatedAt: new Date(),
          },
        },
        { new: true, runValidators: true }
      ).select('learningGoals');

      if (!user) {
        throw new Error('User not found');
      }

      return user.learningGoals;
    } catch (error) {
      logger.error('Failed to update learning goals:', error);
      throw error;
    }
  }

  async updateTimezone(userId, timezone) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            timezone,
            updatedAt: new Date(),
          },
        },
        { new: true, runValidators: true }
      ).select('timezone');

      if (!user) {
        throw new Error('User not found');
      }

      return { timezone: user.timezone };
    } catch (error) {
      logger.error('Failed to update timezone:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
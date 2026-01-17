const ApiResponse = require('../utils/apiResponse');
const UserService = require('../services/user.service');
const OnboardingService = require('../services/onboarding.service');
const ExportUtils = require('../utils/exportUtils');
const logger = require('../utils/logger');

class UserController {
  async getCurrentUser(req, res, next) {
    try {
      const profile = await UserService.getProfile(req.user.id);
      return ApiResponse.success(res, profile, 'User profile retrieved');
    } catch (error) {
      logger.error('Failed to get current user:', error);
      return ApiResponse.error(res, {
        message: 'Failed to get user profile',
        error,
      });
    }
  }

  async updateProfile(req, res, next) {
    try {
      const updates = req.body;
      const profile = await UserService.updateProfile(req.user.id, updates);
      return ApiResponse.success(res, profile, 'Profile updated successfully');
    } catch (error) {
      logger.error('Failed to update profile:', error);
      if (error.name === 'ValidationError') {
        return ApiResponse.badRequest(res, error.message);
      }
      return ApiResponse.error(res, {
        message: 'Failed to update profile',
        error,
      });
    }
  }

  async getPreferences(req, res, next) {
    try {
      const preferences = await UserService.getPreferences(req.user.id);
      return ApiResponse.success(res, preferences, 'Preferences retrieved');
    } catch (error) {
      logger.error('Failed to get preferences:', error);
      return ApiResponse.error(res, {
        message: 'Failed to get preferences',
        error,
      });
    }
  }

  async updatePreferences(req, res, next) {
    try {
      const updates = req.body;
      const preferences = await UserService.updatePreferences(req.user.id, updates);
      return ApiResponse.success(res, preferences, 'Preferences updated successfully');
    } catch (error) {
      logger.error('Failed to update preferences:', error);
      if (error.name === 'ValidationError') {
        return ApiResponse.badRequest(res, error.message);
      }
      return ApiResponse.error(res, {
        message: 'Failed to update preferences',
        error,
      });
    }
  }

  async updateOnboarding(req, res, next) {
    try {
      const { step, data } = req.body;
      
      if (step === undefined) {
        return ApiResponse.badRequest(res, 'Step is required');
      }

      const result = await OnboardingService.completeOnboardingStep(req.user.id, step, data);
      
      if (result.alreadyCompleted) {
        return ApiResponse.success(res, result, 'Onboarding already completed');
      }

      return ApiResponse.success(res, result, 'Onboarding step updated');
    } catch (error) {
      logger.error('Failed to update onboarding:', error);
      return ApiResponse.error(res, {
        message: 'Failed to update onboarding',
        error,
      });
    }
  }

  async getOnboardingStatus(req, res, next) {
    try {
      const status = await OnboardingService.getOnboardingProgress(req.user.id);
      return ApiResponse.success(res, status, 'Onboarding status retrieved');
    } catch (error) {
      logger.error('Failed to get onboarding status:', error);
      return ApiResponse.error(res, {
        message: 'Failed to get onboarding status',
        error,
      });
    }
  }

  async getSessions(req, res, next) {
    try {
      const sessions = await UserService.getSessions(req.user.id);
      return ApiResponse.success(res, sessions, 'Sessions retrieved');
    } catch (error) {
      logger.error('Failed to get sessions:', error);
      return ApiResponse.error(res, {
        message: 'Failed to get sessions',
        error,
      });
    }
  }

  async removeSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return ApiResponse.badRequest(res, 'Session ID is required');
      }

      const result = await UserService.terminateSession(req.user.id, sessionId);
      return ApiResponse.success(res, null, 'Session removed successfully');
    } catch (error) {
      logger.error('Failed to remove session:', error);
      return ApiResponse.error(res, {
        message: 'Failed to remove session',
        error,
      });
    }
  }

  async exportData(req, res, next) {
    try {
      const { format = 'json', include = ['profile', 'days', 'questions'] } = req.body;
      
      const result = await UserService.exportData(req.user.id, { format, include });
      
      let exportedData;
      if (format === 'csv') {
        exportedData = await ExportUtils.toCSV([result.data], Object.keys(result.data));
      } else {
        exportedData = await ExportUtils.toJSON(result.data);
      }

      const filename = ExportUtils.generateExportFilename('user_data', format);
      
      res.setHeader('Content-Type', ExportUtils.getExportContentType(format));
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('X-Export-Token', result.token);
      
      return res.send(exportedData);
    } catch (error) {
      logger.error('Failed to export data:', error);
      return ApiResponse.error(res, {
        message: 'Failed to export data',
        error,
      });
    }
  }

  async deleteAccount(req, res, next) {
    try {
      const result = await UserService.softDeleteAccount(req.user.id);
      return ApiResponse.success(res, result, 'Account deactivated successfully');
    } catch (error) {
      logger.error('Failed to delete account:', error);
      return ApiResponse.error(res, {
        message: 'Failed to delete account',
        error,
      });
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await UserService.getStats(req.user.id);
      return ApiResponse.success(res, stats, 'User stats retrieved');
    } catch (error) {
      logger.error('Failed to get stats:', error);
      return ApiResponse.error(res, {
        message: 'Failed to get stats',
        error,
      });
    }
  }

  async updateStats(req, res, next) {
    try {
      const stats = req.body;
      const updatedStats = await UserService.updateStats(req.user.id, stats);
      return ApiResponse.success(res, updatedStats, 'Stats updated successfully');
    } catch (error) {
      logger.error('Failed to update stats:', error);
      return ApiResponse.error(res, {
        message: 'Failed to update stats',
        error,
      });
    }
  }

  async getStreak(req, res, next) {
    try {
      const user = await UserService.getProfile(req.user.id);
      return ApiResponse.success(res, user.streak, 'Streak information retrieved');
    } catch (error) {
      logger.error('Failed to get streak:', error);
      return ApiResponse.error(res, {
        message: 'Failed to get streak',
        error,
      });
    }
  }

  async updateStreak(req, res, next) {
    try {
      const streakData = req.body;
      const updatedStreak = await UserService.updateStreak(req.user.id, streakData);
      return ApiResponse.success(res, updatedStreak, 'Streak updated successfully');
    } catch (error) {
      logger.error('Failed to update streak:', error);
      return ApiResponse.error(res, {
        message: 'Failed to update streak',
        error,
      });
    }
  }

  async getNotificationPreferences(req, res, next) {
    try {
      const preferences = await UserService.getPreferences(req.user.id);
      return ApiResponse.success(res, {
        notificationPreferences: preferences.preferences.notificationPreferences,
      }, 'Notification preferences retrieved');
    } catch (error) {
      logger.error('Failed to get notification preferences:', error);
      return ApiResponse.error(res, {
        message: 'Failed to get notification preferences',
        error,
      });
    }
  }

  async updateNotificationPreferences(req, res, next) {
    try {
      const { notificationPreferences } = req.body;
      
      if (!notificationPreferences) {
        return ApiResponse.badRequest(res, 'Notification preferences are required');
      }

      const updates = {
        preferences: {
          notificationPreferences,
        },
      };

      const result = await UserService.updatePreferences(req.user.id, updates);
      
      return ApiResponse.success(res, {
        notificationPreferences: result.preferences.notificationPreferences,
      }, 'Notification preferences updated successfully');
    } catch (error) {
      logger.error('Failed to update notification preferences:', error);
      return ApiResponse.error(res, {
        message: 'Failed to update notification preferences',
        error,
      });
    }
  }

  async getLearningGoals(req, res, next) {
    try {
      const learningGoals = await UserService.getLearningGoals(req.user.id);
      return ApiResponse.success(res, learningGoals, 'Learning goals retrieved');
    } catch (error) {
      logger.error('Failed to get learning goals:', error);
      return ApiResponse.error(res, {
        message: 'Failed to get learning goals',
        error,
      });
    }
  }

  async updateLearningGoals(req, res, next) {
    try {
      const learningGoals = req.body;
      const updatedGoals = await UserService.updateLearningGoals(req.user.id, learningGoals);
      return ApiResponse.success(res, updatedGoals, 'Learning goals updated successfully');
    } catch (error) {
      logger.error('Failed to update learning goals:', error);
      if (error.name === 'ValidationError') {
        return ApiResponse.badRequest(res, error.message);
      }
      return ApiResponse.error(res, {
        message: 'Failed to update learning goals',
        error,
      });
    }
  }

  async getTimezone(req, res, next) {
    try {
      const preferences = await UserService.getPreferences(req.user.id);
      return ApiResponse.success(res, { timezone: preferences.timezone }, 'Timezone retrieved');
    } catch (error) {
      logger.error('Failed to get timezone:', error);
      return ApiResponse.error(res, {
        message: 'Failed to get timezone',
        error,
      });
    }
  }

  async updateTimezone(req, res, next) {
    try {
      const { timezone } = req.body;
      
      if (!timezone) {
        return ApiResponse.badRequest(res, 'Timezone is required');
      }

      const result = await UserService.updateTimezone(req.user.id, timezone);
      return ApiResponse.success(res, result, 'Timezone updated successfully');
    } catch (error) {
      logger.error('Failed to update timezone:', error);
      return ApiResponse.error(res, {
        message: 'Failed to update timezone',
        error,
      });
    }
  }
}

module.exports = new UserController();
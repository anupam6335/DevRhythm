const { User, Day, Question } = require('../models');
const DateUtils = require('../utils/dateUtils');
const logger = require('../utils/logger');

class OnboardingService {
  async initializeOnboarding(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.onboardingCompleted) {
        return { alreadyCompleted: true };
      }

      const onboardingTasks = [
        this.setDefaultPreferences.bind(this, user),
        this.createInitialDay.bind(this, user),
        this.createInitialQuestions.bind(this, user),
        this.setLearningGoals.bind(this, user),
        this.setNotificationPreferences.bind(this, user),
      ];

      for (const task of onboardingTasks) {
        try {
          await task();
        } catch (error) {
          logger.warn(`Onboarding task failed:`, error);
        }
      }

      user.onboardingStep = 1;
      await user.save();

      return {
        success: true,
        step: user.onboardingStep,
        tasksCompleted: onboardingTasks.length,
      };
    } catch (error) {
      logger.error('Onboarding initialization failed:', error);
      throw error;
    }
  }

  async setDefaultPreferences(user) {
    if (!user.preferences.difficultyProgression) {
      user.preferences.difficultyProgression = 'sequential';
    }
    if (!user.preferences.dailyTimeCommitment) {
      user.preferences.dailyTimeCommitment = 60;
    }
    if (!user.preferences.studyIntensity) {
      user.preferences.studyIntensity = 'moderate';
    }
    if (!user.preferences.defaultQuestionsPerDay) {
      user.preferences.defaultQuestionsPerDay = 5;
    }

    if (!user.uiPreferences.theme) {
      user.uiPreferences.theme = 'auto';
    }
    if (!user.uiPreferences.density) {
      user.uiPreferences.density = 'compact';
    }
    if (!user.uiPreferences.shortcutsEnabled) {
      user.uiPreferences.shortcutsEnabled = true;
    }
    if (!user.uiPreferences.autoSave) {
      user.uiPreferences.autoSave = true;
    }
    if (!user.uiPreferences.defaultView) {
      user.uiPreferences.defaultView = 'dashboard';
    }

    await user.save();
  }

  async createInitialDay(user) {
    const existingDay = await Day.findOne({ userId: user._id, dayNumber: 1 });
    if (existingDay) {
      return existingDay;
    }

    const day = new Day({
      userId: user._id,
      dayNumber: 1,
      date: new Date(),
      targetQuestions: user.preferences.defaultQuestionsPerDay || 5,
      status: 'active',
      streakMaintained: true,
    });

    await day.save();
    return day;
  }

  async createInitialQuestions(user) {
    const day = await Day.findOne({ userId: user._id, dayNumber: 1 });
    if (!day) {
      throw new Error('Initial day not found');
    }

    const existingQuestions = await Question.countDocuments({ userId: user._id });
    if (existingQuestions > 0) {
      return { count: existingQuestions };
    }

    const sampleQuestions = [
      {
        title: 'Two Sum',
        difficulty: 'easy',
        topic: 'Array',
        source: 'LeetCode',
        status: 'pending',
      },
      {
        title: 'Valid Parentheses',
        difficulty: 'easy',
        topic: 'Stack',
        source: 'LeetCode',
        status: 'pending',
      },
      {
        title: 'Reverse Linked List',
        difficulty: 'easy',
        topic: 'Linked List',
        source: 'LeetCode',
        status: 'pending',
      },
      {
        title: 'Merge Two Sorted Lists',
        difficulty: 'easy',
        topic: 'Linked List',
        source: 'LeetCode',
        status: 'pending',
      },
      {
        title: 'Binary Search',
        difficulty: 'easy',
        topic: 'Binary Search',
        source: 'LeetCode',
        status: 'pending',
      },
    ];

    const questions = sampleQuestions.map((q, index) => ({
      ...q,
      userId: user._id,
      dayId: day._id,
      order: index + 1,
      estimatedTime: 30,
    }));

    await Question.insertMany(questions);
    return { count: questions.length };
  }

  async setLearningGoals(user) {
    if (!user.learningGoals.goalType) {
      user.learningGoals.goalType = 'skill';
    }
    if (!user.learningGoals.timeline) {
      user.learningGoals.timeline = '3m';
    }
    if (!user.learningGoals.focusAreas) {
      user.learningGoals.focusAreas = ['Data Structures', 'Algorithms'];
    }
    if (!user.learningGoals.targetCompanies) {
      user.learningGoals.targetCompanies = ['FAANG'];
    }

    await user.save();
  }

  async setNotificationPreferences(user) {
    if (!user.preferences.notificationPreferences) {
      user.preferences.notificationPreferences = {
        inApp: true,
        email: false,
        push: false,
        quietHours: null,
      };
    }

    await user.save();
  }

  async resumeOnboarding(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.onboardingCompleted) {
        return { alreadyCompleted: true };
      }

      const currentStep = user.onboardingStep || 0;
      const tasksToComplete = [];

      if (currentStep < 1) {
        tasksToComplete.push(this.setDefaultPreferences.bind(this, user));
      }
      if (currentStep < 2) {
        tasksToComplete.push(this.createInitialDay.bind(this, user));
      }
      if (currentStep < 3) {
        tasksToComplete.push(this.createInitialQuestions.bind(this, user));
      }
      if (currentStep < 4) {
        tasksToComplete.push(this.setLearningGoals.bind(this, user));
      }
      if (currentStep < 5) {
        tasksToComplete.push(this.setNotificationPreferences.bind(this, user));
      }

      for (const task of tasksToComplete) {
        try {
          await task();
        } catch (error) {
          logger.warn(`Resume onboarding task failed:`, error);
        }
      }

      return {
        success: true,
        step: user.onboardingStep,
        tasksRemaining: tasksToComplete.length,
      };
    } catch (error) {
      logger.error('Resume onboarding failed:', error);
      throw error;
    }
  }

  async completeOnboardingStep(userId, step, stepData = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.onboardingCompleted) {
        return { alreadyCompleted: true };
      }

      user.onboardingStep = step;
      
      if (stepData.learningGoals) {
        user.learningGoals = { ...user.learningGoals, ...stepData.learningGoals };
      }
      
      if (stepData.preferences) {
        user.preferences = { ...user.preferences, ...stepData.preferences };
      }
      
      if (step >= 10) {
        user.onboardingCompleted = true;
      }

      await user.save();

      return {
        success: true,
        step: user.onboardingStep,
        onboardingCompleted: user.onboardingCompleted,
      };
    } catch (error) {
      logger.error('Failed to complete onboarding step:', error);
      throw error;
    }
  }

  async getOnboardingProgress(userId) {
    try {
      const user = await User.findById(userId).select('onboardingCompleted onboardingStep learningGoals preferences');
      if (!user) {
        throw new Error('User not found');
      }

      const totalSteps = 10;
      const progressPercentage = Math.round((user.onboardingStep / totalSteps) * 100);

      return {
        completed: user.onboardingCompleted,
        currentStep: user.onboardingStep,
        totalSteps,
        progressPercentage,
        learningGoals: user.learningGoals,
        preferences: user.preferences,
      };
    } catch (error) {
      logger.error('Failed to get onboarding progress:', error);
      throw error;
    }
  }

  async validateBaselineAssessment(assessmentData) {
    const validations = {
      difficultyPreference: ['easy', 'medium', 'hard', 'mixed'],
      studyFrequency: ['daily', 'weekly', 'custom'],
      timeCommitment: value => value >= 15 && value <= 480,
      focusAreas: value => Array.isArray(value) && value.length > 0,
    };

    const errors = [];

    Object.keys(validations).forEach(key => {
      if (assessmentData[key] !== undefined) {
        if (typeof validations[key] === 'function') {
          if (!validations[key](assessmentData[key])) {
            errors.push(`${key} is invalid`);
          }
        } else if (Array.isArray(validations[key])) {
          if (!validations[key].includes(assessmentData[key])) {
            errors.push(`${key} must be one of: ${validations[key].join(', ')}`);
          }
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : null,
    };
  }
}

module.exports = new OnboardingService();
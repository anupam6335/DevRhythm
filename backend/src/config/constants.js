module.exports = {
  DIFFICULTY: {
    EASY: 'Easy',
    MEDIUM: 'Medium',
    HARD: 'Hard'
  },
  STATUS: {
    NOT_STARTED: 'Not Started',
    ATTEMPTED: 'Attempted',
    SOLVED: 'Solved',
    MASTERED: 'Mastered'
  },
  PLATFORMS: ['LeetCode', 'Codeforces', 'HackerRank', 'AtCoder', 'CodeChef', 'Other'],
  REVISION_SCHEDULE: [1, 3, 7, 14, 30],
  PRIVACY_SETTINGS: ['public', 'private', 'link-only'],
  NOTIFICATION_TYPES: {
    REVISION_DAILY: 'revision_reminder_daily',
    REVISION_URGENT: 'revision_reminder_urgent',
    GOAL_COMPLETION: 'goal_completion',
    STREAK_REMINDER: 'streak_reminder',
    NEW_FOLLOWER: 'new_follower',
    WEEKLY_REPORT: 'weekly_report'
  },
  LEADERBOARD_TYPES: ['weekly', 'monthly'],
  SNAPSHOT_PERIODS: ['daily', 'weekly', 'monthly'],
  DEFAULT_DAILY_GOAL: 3,
  DEFAULT_WEEKLY_GOAL: 15,
  MAX_DAILY_GOAL: 50,
  MAX_WEEKLY_GOAL: 100
};
const mongoose = require('../src/config/database');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    await User.deleteMany({});
    
    const testUsers = [
      {
        authProvider: 'google',
        providerId: 'google_123456789',
        email: 'test1@example.com',
        username: 'testuser1',
        displayName: 'Test User 1',
        avatarUrl: 'https://example.com/avatar1.jpg',
        streak: { current: 15, longest: 30, lastActiveDate: new Date() },
        stats: { totalSolved: 150, masteryRate: 65, totalRevisions: 300, totalTimeSpent: 4500, activeDays: 45 },
        preferences: { timezone: 'UTC+05:30', notifications: { revisionReminders: true, goalTracking: true, socialInteractions: true, weeklyReports: true }, dailyGoal: 3, weeklyGoal: 15 },
        privacy: 'public'
      },
      {
        authProvider: 'github',
        providerId: 'github_987654321',
        email: 'test2@example.com',
        username: 'testuser2',
        displayName: 'Test User 2',
        avatarUrl: 'https://example.com/avatar2.jpg',
        streak: { current: 7, longest: 14, lastActiveDate: new Date() },
        stats: { totalSolved: 75, masteryRate: 45, totalRevisions: 150, totalTimeSpent: 2250, activeDays: 30 },
        preferences: { timezone: 'UTC-08:00', notifications: { revisionReminders: true, goalTracking: false, socialInteractions: true, weeklyReports: false }, dailyGoal: 2, weeklyGoal: 10 },
        privacy: 'public'
      }
    ];
    
    await User.insertMany(testUsers);
    
    console.log('Database seeded successfully');
    console.log(`Created ${testUsers.length} test users`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
const mongoose = require('../src/config/database');
const Notification = require('../src/models/Notification');
const ProgressSnapshot = require('../src/models/ProgressSnapshot');
const LeaderboardSnapshot = require('../src/models/LeaderboardSnapshot');

const cleanupDatabase = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const notificationResult = await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      status: { $in: ['read', 'failed'] }
    });
    
    const snapshotResult = await ProgressSnapshot.deleteMany({
      snapshotPeriod: 'daily',
      createdAt: { $lt: sixMonthsAgo }
    });
    
    const leaderboardResult = await LeaderboardSnapshot.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    console.log('Cleanup completed:');
    console.log(`- Deleted ${notificationResult.deletedCount} old notifications`);
    console.log(`- Deleted ${snapshotResult.deletedCount} old daily snapshots`);
    console.log(`- Deleted ${leaderboardResult.deletedCount} expired leaderboard snapshots`);
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const stats = await db.command({ collStats: collection.name });
      console.log(`Collection: ${collection.name}`);
      console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Count: ${stats.count}`);
      console.log(`  Storage: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Indexes: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
};

cleanupDatabase();
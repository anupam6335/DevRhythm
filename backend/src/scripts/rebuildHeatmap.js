/**
 * src/scripts/rebuildHeatmap.js
 *
 * Deletes all HeatmapData documents and regenerates them from raw activity logs.
 * Run with: node src/scripts/rebuildHeatmap.js [--dry-run] [--userId=...]
 *
 * Options:
 *   --dry-run      : Only report what would be deleted/regenerated, without making changes.
 *   --userId=...   : Restrict to a specific user (by ObjectId). If omitted, processes all users.
 */

const mongoose = require('mongoose');
const config = require('../config');

async function rebuildHeatmap(dryRun = false, userId = null) {
  const HeatmapData = mongoose.model('HeatmapData', require('../models/HeatmapData').schema);
  const User = mongoose.model('User', require('../models/User').schema);
  const heatmapService = require('../services/heatmap.service');

  const filter = userId ? { userId: new mongoose.Types.ObjectId(userId) } : {};
  const users = await User.find(filter).select('_id preferences.timezone').lean();

  if (!users.length) {
    console.log(`[Rebuild] No users found${userId ? ` for userId ${userId}` : ''}. Exiting.`);
    return { deletedCount: 0, regeneratedCount: 0 };
  }

  // Count documents to delete
  let deletedCount = 0;
  if (!dryRun) {
    const deleteResult = await HeatmapData.deleteMany(filter);
    deletedCount = deleteResult.deletedCount;
    console.log(`[Rebuild] Deleted ${deletedCount} heatmap documents${userId ? ` for user ${userId}` : ''}.`);
  } else {
    const count = await HeatmapData.countDocuments(filter);
    console.log(`[Rebuild] DRY RUN: Would delete ${count} heatmap documents${userId ? ` for user ${userId}` : ''}.`);
  }

  let regeneratedCount = 0;
  for (const user of users) {
    const timeZone = user.preferences?.timezone || 'UTC';
    const currentYear = new Date().getUTCFullYear();
    // Regenerate for the current year and the previous year (to cover any activity in the past)
    const years = [currentYear - 1, currentYear];
    for (const year of years) {
      if (!dryRun) {
        await heatmapService.generateHeatmapData(user._id, year, timeZone);
        console.log(`[Rebuild] Regenerated heatmap for user ${user._id}, year ${year}`);
      } else {
        console.log(`[Rebuild] DRY RUN: Would regenerate heatmap for user ${user._id}, year ${year}`);
      }
    }
    regeneratedCount++;
  }

  console.log(`[Rebuild] Completed. Deleted: ${dryRun ? 'would delete ' + deletedCount : deletedCount}, Regenerated: ${regeneratedCount} users.`);
  return { deletedCount, regeneratedCount };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const userIdArg = args.find(arg => arg.startsWith('--userId='));
  const userId = userIdArg ? userIdArg.split('=')[1] : null;

  if (dryRun) {
    console.log('[Rebuild] DRY RUN mode – no changes will be persisted.');
  }

  try {
    await mongoose.connect(config.database.uri, config.database.connectionOptions);
    console.log('[Rebuild] Connected to MongoDB');

    await rebuildHeatmap(dryRun, userId);

    await mongoose.disconnect();
    console.log('[Rebuild] Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('[Rebuild] Fatal error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { rebuildHeatmap };
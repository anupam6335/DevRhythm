const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../src/models/User');
const HeatmapData = require('../src/models/HeatmapData');
const heatmapService = require('../src/services/heatmap.service');
const { client: redisClient, waitForRedis } = require('../src/config/redis');

async function generateMissingHeatmaps(targetTz = 'Asia/Kolkata') {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not defined');

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    await waitForRedis();
    console.log('✅ Connected to Redis');

    // Get all users with target timezone
    const users = await User.find({ 'preferences.timezone': targetTz });
    console.log(`📊 Found ${users.length} users with timezone = ${targetTz}`);

    const currentYear = new Date().getUTCFullYear();

    for (const user of users) {
      console.log(`\n🔄 Checking user: ${user.email} (${user._id})`);

      // Get existing heatmap years for this user
      const existingYears = await HeatmapData.distinct('year', { userId: user._id });
      console.log(`   Existing heatmap years: ${existingYears.join(', ') || 'none'}`);

      // Determine years that need generation
      // We generate: currentYear and any year where the user has activity (based on progress/ revisions)
      // Simpler: generate currentYear and also years 2024,2025,2026 (as needed)
      // But to be complete, we can generate for a range of years (2020 to currentYear)
      let yearsToGenerate = [];

      // Always generate current year if missing
      if (!existingYears.includes(currentYear)) {
        yearsToGenerate.push(currentYear);
      }

      // Also generate previous 3 years if missing (2023-2025)
      for (let y = currentYear - 3; y <= currentYear; y++) {
        if (!existingYears.includes(y) && y >= 2020 && y <= currentYear) {
          if (!yearsToGenerate.includes(y)) yearsToGenerate.push(y);
        }
      }

      if (yearsToGenerate.length === 0) {
        console.log(`   ✅ Heatmap data is complete (no missing years).`);
        continue;
      }

      console.log(`   Generating heatmap for missing years: ${yearsToGenerate.join(', ')}`);

      for (const year of yearsToGenerate) {
        await heatmapService.generateHeatmapData(user._id, year, targetTz);
        console.log(`   ✓ Regenerated heatmap for year ${year}`);
      }
    }

    console.log('\n✅ Missing heatmap generation complete');
    await mongoose.disconnect();
    if (redisClient) await redisClient.quit();
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    if (redisClient) await redisClient.quit();
    process.exit(1);
  }
}

generateMissingHeatmaps('Asia/Kolkata');
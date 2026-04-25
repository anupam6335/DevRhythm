const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const HeatmapData = require('../src/models/HeatmapData');
const User = require('../src/models/User');

async function checkHeatmap() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find the user by email (change if needed)
    const user = await User.findOne({ email: 'anupamdebnath6335@gmail.com' });
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }
    console.log(`User: ${user.email} (${user._id})`);

    const year = 2026;
    const heatmap = await HeatmapData.findOne({ userId: user._id, year }).lean();
    if (!heatmap) {
      console.log(`❌ No heatmap document for year ${year}`);
      process.exit(0);
    }

    console.log(`✅ Heatmap exists for year ${year}`);
    const totalActivities = heatmap.dailyData.reduce((sum, d) => sum + d.totalActivities, 0);
    const totalSolved = heatmap.dailyData.reduce((sum, d) => sum + d.newProblemsSolved, 0);
    const totalRevisions = heatmap.dailyData.reduce((sum, d) => sum + d.revisionProblems, 0);
    console.log(`Total activities in ${year}: ${totalActivities}`);
    console.log(`   - New problems solved: ${totalSolved}`);
    console.log(`   - Revisions: ${totalRevisions}`);
    console.log(`   - Study group: ${heatmap.dailyData.reduce((sum, d) => sum + d.studyGroupActivity, 0)}`);

    // Show first few days with activity
    const activeDays = heatmap.dailyData.filter(d => d.totalActivities > 0);
    console.log(`\nActive days (${activeDays.length}):`);
    activeDays.slice(0, 10).forEach(day => {
      console.log(`   ${day.date.toISOString().split('T')[0]} : ${day.totalActivities} activities (${day.newProblemsSolved} new, ${day.revisionProblems} rev, ${day.studyGroupActivity} group)`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkHeatmap();
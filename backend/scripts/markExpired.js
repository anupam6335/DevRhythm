const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Goal = require('../src/models/Goal');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const now = new Date();

    const result = await Goal.updateMany(
      {
        status: 'active',
        endDate: { $lt: now },
      },
      {
        $set: {
          status: 'failed',
          updatedAt: now,
        },
      }
    );

    console.log(`✅ Marked ${result.modifiedCount} expired goals as failed`);
    console.log(`📊 Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run();
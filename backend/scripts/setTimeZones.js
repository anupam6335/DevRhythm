const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../src/models/User');

// Backup model for timezone changes
const backupSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  originalTimezone: String,
  backedUpAt: Date,
});
const Backup = mongoose.model('TimezoneBackup', backupSchema);

/**
 * Detect timezone based on email domain (.in) or registration IP
 * @param {Object} user - User document
 * @returns {string} IANA timezone
 */
function detectTimezone(user) {
  // 1. Email heuristic
  if (user.email && user.email.toLowerCase().endsWith('.in')) {
    return 'Asia/Kolkata';
  }
  // 2. IP‑based detection (enable if you store registrationIp)
  // if (user.registrationIp) {
  //   const geo = geoip.lookup(user.registrationIp);
  //   if (geo && geo.country === 'IN') return 'Asia/Kolkata';
  // }
  return 'UTC';
}

/**
 * Main migration: set timezones for all users (backup first)
 */
async function setTimezones() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not defined');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get ALL users (timezone already exists or not)
    const users = await User.find({});
    console.log(`📊 Found ${users.length} total users`);

    let updated = 0;
    let backedUp = 0;

    for (const user of users) {
      const newTz = detectTimezone(user);
      const oldTz = user.preferences?.timezone || null;

      // Skip if already correct (optional)
      if (oldTz === newTz) {
        console.log(`  ⊘ ${user.email} – already ${newTz}`);
        continue;
      }

      // Backup original timezone
      await Backup.create({
        userId: user._id,
        originalTimezone: oldTz,
        backedUpAt: new Date(),
      });
      backedUp++;

      // Update user
      if (!user.preferences) user.preferences = {};
      user.preferences.timezone = newTz;
      await user.save();
      updated++;
      console.log(`  ✓ ${user.email} : ${oldTz || 'null'} → ${newTz}`);
    }

    console.log(`✅ Migration complete: updated ${updated} users, backed up ${backedUp} records`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Restore: revert timezone changes from backup
 */
async function restore() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not defined');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for restore');

    const backups = await Backup.find({});
    console.log(`📊 Found ${backups.length} backup records`);

    let restored = 0;
    for (const backup of backups) {
      const user = await User.findById(backup.userId);
      if (user) {
        if (!user.preferences) user.preferences = {};
        if (backup.originalTimezone === null) {
          delete user.preferences.timezone;
        } else {
          user.preferences.timezone = backup.originalTimezone;
        }
        await user.save();
        restored++;
        console.log(`  ✓ ${user.email} → ${backup.originalTimezone || 'unset'}`);
      }
    }
    console.log(`✅ Restored timezone for ${restored} users`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Restore failed:', error);
    process.exit(1);
  }
}

// Run appropriate command
const args = process.argv.slice(2);
if (args[0] === 'restore') {
  restore();
} else {
  setTimezones();
}
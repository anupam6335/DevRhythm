const cron = require('cron');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendBatchEmail } = require('../services/email.service');

/**
 * For each user with new notifications since their last digest,
 * send a single email containing all those notifications,
 * then update their lastDigestSentAt.
 */
const sendDailyDigests = async () => {
  try {
    // Find all active users who have any notifications created after their last digest
    // (or ever, if they've never received a digest)
    const users = await User.find({
      isActive: true,
      $or: [
        { lastDigestSentAt: { $exists: false } },
        { lastDigestSentAt: null }
      ]
    }).select('_id lastDigestSentAt email displayName preferences');

    // Also users who have a lastDigestSentAt but might have new notifications
    // We'll query per user in loop to avoid huge memory usage

    for (const user of users) {
      const since = user.lastDigestSentAt || new Date(0); // beginning of time if never sent

      // Find notifications created after the last digest, that are not already emailed?
      // Since all notifications are in-app, we just consider any created after.
      const notifications = await Notification.find({
        userId: user._id,
        createdAt: { $gt: since },
        channel: 'in-app'   // optional, but safe
      }).lean();

      if (notifications.length === 0) continue;

      // Check user preferences for email digests (you may add a preference field)
      if (user.preferences?.notifications?.weeklyReports === false) {
        // If they don't want emails, skip (or you can have a separate digest preference)
        continue;
      }

      // Send email
      try {
        await sendBatchEmail(user._id, notifications);
        // Update last digest time
        user.lastDigestSentAt = new Date();
        await user.save();
        console.log(`Digest email sent to user ${user._id} with ${notifications.length} notifications`);
      } catch (emailError) {
        console.error(`Failed to send digest email for user ${user._id}:`, emailError);
      }

      // Small delay to avoid overwhelming email provider
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('Daily digest job completed');
  } catch (error) {
    console.error('Daily digest job failed:', error);
  }
};

// Schedule at 5 PM every day
const digestJob = new cron.CronJob('0 17 * * *', sendDailyDigests);

const startDigestJob = () => {
  digestJob.start();
  console.log('Daily digest email job started (5 PM)');
};

const stopDigestJob = () => {
  digestJob.stop();
  console.log('Daily digest email job stopped');
};

module.exports = {
  startDigestJob,
  stopDigestJob,
  sendDailyDigests,
};
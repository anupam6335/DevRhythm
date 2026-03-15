const config = require('../config');
const EmailProviderFactory = require('./email/providers/provider.factory');

let provider = null;

const getProvider = () => {
  if (!provider) {
    provider = EmailProviderFactory.createProvider();
  }
  return provider;
};

/**
 * Send a single email (used by batch sender)
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const from = {
    email: config.email.fromAddress,
    name: config.email.fromName,
  };
  return getProvider().sendEmail({ to, subject, html, text, from });
};

/**
 * Send a consolidated email containing multiple notifications for a user
 * @param {string} userId - user ID
 * @param {Array} notifications - array of notification objects (from DB)
 */
const sendBatchEmail = async (userId, notifications) => {
  if (!notifications || notifications.length === 0) return;

  // Fetch user email (assuming we have userId)
  const User = require('../models/User');
  const user = await User.findById(userId).select('email displayName preferences');
  if (!user || !user.email) return;

  // Respect user's email preferences (already filtered in query)

  // Build email content
  const subject = `Your DevRhythm Digest (${new Date().toLocaleDateString()})`;

  let html = `<h2>Hello ${user.displayName || user.username},</h2>`;
  html += '<p>Here are your recent notifications:</p><ul>';

  notifications.forEach(notif => {
    html += `<li><strong>${notif.title}</strong>: ${notif.message}</li>`;
  });

  html += '</ul><p>Check your dashboard for details.</p>';

  const text = notifications.map(n => `${n.title}: ${n.message}`).join('\n');

  try {
    await sendEmail({ to: user.email, subject, html, text });
    console.log(`Batch email sent to user ${userId} with ${notifications.length} notifications`);
  } catch (error) {
    console.error(`Batch email failed for user ${userId}:`, error);
    throw error;
  }
};

// Keep sendNotificationEmail for backward compatibility but mark as deprecated
const sendNotificationEmail = async (userId, notification) => {
  console.warn('sendNotificationEmail is deprecated; use batching instead');
  await sendBatchEmail(userId, [notification]);
};

module.exports = { sendEmail, sendBatchEmail, sendNotificationEmail };
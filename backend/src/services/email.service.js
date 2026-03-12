const nodemailer = require('nodemailer');
const config = require('../config');

// Gmail transporter (replaceable)
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // App password for Gmail
  },
});

// Generic send function
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject,
      html,
      text,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

// Notification-specific email builder
const sendNotificationEmail = async (userId, notification) => {
  const user = await User.findById(userId).select('email displayName preferences');
  if (!user || !user.preferences?.notifications?.email) return;

  let subject, html;
  switch (notification.type) {
    case 'revision_reminder_daily':
      subject = 'Daily Revision Reminder';
      html = `<p>You have pending revisions for today. Check your dashboard.</p>`;
      break;
    case 'goal_completion':
      subject = 'Goal Achieved!';
      html = `<p>${notification.message}</p>`;
      break;
    // ... other types
    default:
      return;
  }
  await sendEmail({ to: user.email, subject, html });
};

module.exports = { sendEmail, sendNotificationEmail };
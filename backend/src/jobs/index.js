const leaderboardJobs = require('./leaderboard.job');
const notificationJobs = require('./notification.job');
const progressSnapshotJobs = require('./progressSnapshot.job');

const startAllJobs = () => {
  if (process.env.NODE_ENV === 'production') {
    leaderboardJobs.startLeaderboardJobs();
    notificationJobs.startNotificationJobs();
    progressSnapshotJobs.startSnapshotJobs();
  }
};

const stopAllJobs = () => {
  leaderboardJobs.stopLeaderboardJobs();
  notificationJobs.stopNotificationJobs();
  progressSnapshotJobs.stopSnapshotJobs();
};

module.exports = {
  startAllJobs,
  stopAllJobs,
  leaderboardJobs,
  notificationJobs,
  progressSnapshotJobs
};
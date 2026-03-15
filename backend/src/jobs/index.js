const leaderboardJobs = require('./leaderboard.job');
const notificationJobs = require('./notification.job');
const progressSnapshotJobs = require('./progressSnapshot.job');
const digestJob = require('./digestEmail.job');

const startAllJobs = () => {
  if (process.env.NODE_ENV === 'production') {
    leaderboardJobs.startLeaderboardJobs();
    notificationJobs.startNotificationJobs();
    progressSnapshotJobs.startSnapshotJobs();
    digestJob.startDigestJob();
  }
};

const stopAllJobs = () => {
  leaderboardJobs.stopLeaderboardJobs();
  notificationJobs.stopNotificationJobs();
  progressSnapshotJobs.stopSnapshotJobs();
  digestJob.stopDigestJob();
};

module.exports = {
  startAllJobs,
  stopAllJobs,
  leaderboardJobs,
  notificationJobs,
  progressSnapshotJobs,
  digestJob,
};
const leaderboardJobs = require('./leaderboard.job');
const notificationJobs = require('./notification.job');
const progressSnapshotJobs = require('./progressSnapshot.job');
const digestJob = require('./digestEmail.job');
const plannedGoalExpiry = require('./plannedGoalExpiry.job');
const expiredGoalsJob = require('./expiredGoals.job');
const heatmapFlushJob = require('./heatmapFlush.job');
const goalSnapshotJob = require('./goalSnapshot.job');
const dailyQuestionJob = require('./dailyQuestion.job');

const startAllJobs = () => {
  if (process.env.NODE_ENV === 'production') {
    leaderboardJobs.startLeaderboardJobs();
    notificationJobs.startNotificationJobs();
    progressSnapshotJobs.startSnapshotJobs();
    digestJob.startDigestJob();
    plannedGoalExpiry.startPlannedGoalExpiryJob();
    expiredGoalsJob.startExpiredGoalsJob();
    heatmapFlushJob.startHeatmapFlushJob();
    goalSnapshotJob.startGoalSnapshotJob();
    dailyQuestionJob.startDailyQuestionJob();
  }
};

const stopAllJobs = () => {
  leaderboardJobs.stopLeaderboardJobs();
  notificationJobs.stopNotificationJobs();
  progressSnapshotJobs.stopSnapshotJobs();
  digestJob.stopDigestJob();
  plannedGoalExpiry.stopPlannedGoalExpiryJob();
  expiredGoalsJob.stopExpiredGoalsJob();
  heatmapFlushJob.stopHeatmapFlushJob();
  goalSnapshotJob.stopGoalSnapshotJob();
  dailyQuestionJob.stopDailyQuestionJob();
};

module.exports = {
  startAllJobs,
  stopAllJobs,
  leaderboardJobs,
  notificationJobs,
  progressSnapshotJobs,
  digestJob,
  plannedGoalExpiry,
  expiredGoalsJob,
  heatmapFlushJob,
  goalSnapshotJob,
  dailyQuestionJob,                                   // NEW
};
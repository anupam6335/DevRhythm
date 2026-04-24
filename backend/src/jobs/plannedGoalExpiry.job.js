const cron = require("cron");
const Goal = require("../models/Goal");

const markExpiredPlannedGoals = async () => {
  try {
    const now = new Date();
    const result = await Goal.updateMany(
      {
        goalType: "planned",
        status: "active",
        endDate: { $lt: now },
      },
      {
        $set: { status: "failed", updatedAt: now },
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`Marked ${result.modifiedCount} expired planned goals as failed`);
    }
  } catch (error) {
    console.error("Failed to mark expired planned goals:", error);
  }
};

const plannedGoalExpiryJob = new cron.CronJob("0 0 * * *", markExpiredPlannedGoals); // daily at midnight

const startPlannedGoalExpiryJob = () => {
  plannedGoalExpiryJob.start();
  console.log("Planned goal expiry job started");
};

const stopPlannedGoalExpiryJob = () => {
  plannedGoalExpiryJob.stop();
  console.log("Planned goal expiry job stopped");
};

module.exports = { startPlannedGoalExpiryJob, stopPlannedGoalExpiryJob, markExpiredPlannedGoals };
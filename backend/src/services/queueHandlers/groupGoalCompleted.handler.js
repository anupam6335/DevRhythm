const Notification = require("../../models/Notification");
const ActivityLog = require("../../models/ActivityLog");
const { invalidateCache } = require("../../middleware/cache");

const handleGroupGoalCompleted = async (job) => {
  const { userId, groupId, goalId, completedAt, goalDescription, targetCount } =
    job.data;

  try {
    // 1. Create notification
    await Notification.create({
      userId,
      type: "goal_completion", // reuse existing type
      title: "Group Goal Completed!",
      message: `You completed the group goal: "${goalDescription}"`,
      data: { groupId, goalId, targetCount },
      channel: "both",
      status: "pending",
      scheduledAt: new Date(),
    });

    // 2. Create activity log
    await ActivityLog.create({
      userId,
      action: "group_goal_completed",
      targetId: groupId,
      targetModel: "StudyGroup",
      metadata: {
        goalId,
        goalDescription,
        targetCount,
      },
      timestamp: completedAt,
    });

    await invalidateCache(`notifications:${userId}:*`);
    console.log(`Group goal completion processed for user ${userId}`);
  } catch (error) {
    console.error("Error in groupGoalCompleted handler:", error);
    throw error;
  }
};

module.exports = { handleGroupGoalCompleted };

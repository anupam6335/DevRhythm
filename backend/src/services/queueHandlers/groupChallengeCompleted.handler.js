const Notification = require("../../models/Notification");
const ActivityLog = require("../../models/ActivityLog");
const { invalidateCache } = require("../../middleware/cache");

const handleGroupChallengeCompleted = async (job) => {
  const { userId, groupId, challengeId, completedAt, challengeName, target } =
    job.data;

  try {
    // 1. Create notification
    await Notification.create({
      userId,
      type: "goal_completion", // reuse existing type
      title: "Group Challenge Completed!",
      message: `You completed the group challenge: "${challengeName}"`,
      data: { groupId, challengeId, target },
      channel: "both",
      status: "pending",
      scheduledAt: new Date(),
    });

    // 2. Create activity log
    await ActivityLog.create({
      userId,
      action: "group_challenge_completed",
      targetId: groupId,
      targetModel: "StudyGroup",
      metadata: {
        challengeId,
        challengeName,
        target,
      },
      timestamp: completedAt,
    });

    await invalidateCache(`notifications:${userId}:*`);
    console.log(`Group challenge completion processed for user ${userId}`);
  } catch (error) {
    console.error("Error in groupChallengeCompleted handler:", error);
    throw error;
  }
};

module.exports = { handleGroupChallengeCompleted };

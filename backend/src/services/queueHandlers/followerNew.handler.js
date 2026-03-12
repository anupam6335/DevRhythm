const User = require('../../models/User');
const Notification = require('../../models/Notification');
const { invalidateCache } = require('../../middleware/cache');

const handleFollowerNew = async (job) => {
  const { followerId, followedId, createdAt } = job.data;

  try {
    const follower = await User.findById(followerId).select('username displayName');
    if (!follower) throw new Error('Follower not found');

    const followed = await User.findById(followedId).select('preferences');
    if (!followed) throw new Error('Followed user not found');

    // Check if user wants notifications for new followers
    if (followed.preferences?.notifications?.socialInteractions) {
      await Notification.create({
        userId: followedId,
        type: 'new_follower',
        title: 'New Follower',
        message: `${follower.displayName || follower.username} started following you`,
        data: { followerId, followerName: follower.username },
        channel: 'both',
        status: 'pending',
        scheduledAt: new Date(),
      });

      // Invalidate notification cache for the followed user
      await invalidateCache(`notifications:${followedId}:*`);
    }

    console.log(`New follower event processed for user ${followedId}`);
  } catch (error) {
    console.error('Error processing follower.new:', error);
    throw error;
  }
};

module.exports = { handleFollowerNew };
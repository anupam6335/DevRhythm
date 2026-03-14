const { client: redisClient } = require('../../config/redis');
const { jobQueue } = require('../../services/queue.service');

const ENQUEUE_COOLDOWN_SECONDS = 3600; // 1 hour

/**
 * Enqueue a user-stats update job if one hasn't been enqueued recently.
 * Uses Redis to track last enqueue time.
 */
const maybeEnqueueStatsUpdate = async (userId) => {
  const key = `devrhythm:stats:enqueued:${userId}`;
  const exists = await redisClient.get(key);
  if (!exists) {
    await redisClient.setEx(key, ENQUEUE_COOLDOWN_SECONDS, '1');
    await jobQueue.add({ type: 'user-stats.update', userId });
  }
};

module.exports = { maybeEnqueueStatsUpdate };
const HeatmapData = require('../../models/HeatmapData');
const heatmapService = require('../heatmap.service');
const { client: redisClient } = require('../../config/redis');

/**
 * Handle heatmap generation job
 * - Removes the pending flag after successful generation
 * - Stores an error flag with TTL if generation fails
 */
const handleHeatmapGenerate = async (job) => {
  const { userId, year, forceFullRefresh } = job.data;

  // Define Redis keys
  const pendingKey = `devrhythm:heatmap:pending:${userId}:${year}`;
  const errorKey = `devrhythm:heatmap:error:${userId}:${year}`;

  try {
    // Remove any existing error flag before starting
    await redisClient.del(errorKey);

    // Generate heatmap (this will upsert into DB)
    if (forceFullRefresh) {
      // Regenerate deletes existing data and recreates
      await heatmapService.regenerateHeatmapData(userId, year, true);
    } else {
      // Generate only if missing; this method also upserts
      await heatmapService.generateHeatmapData(userId, year);
    }

    // Success: remove the pending flag
    await redisClient.del(pendingKey);

    console.log(`[Heatmap] Generation completed for user ${userId}, year ${year}`);
  } catch (error) {
    console.error(`[Heatmap] Generation failed for user ${userId}, year ${year}:`, error);

    // Store error flag with a TTL (e.g., 1 hour) so clients can check
    await redisClient.setEx(errorKey, 3600, error.message);

    // Keep the pending flag? Optionally remove it to allow retry.
    // We remove it so a subsequent request can trigger a new job.
    await redisClient.del(pendingKey);

    // Re-throw so Bull can handle retries
    throw error;
  }
};

module.exports = { handleHeatmapGenerate };
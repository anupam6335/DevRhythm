const cron = require('cron');
const { flushDailyActivitiesToMongoDB } = require('../services/heatmap.service');
const { client: redisClient } = require('../config/redis');

const flushJob = new cron.CronJob('*/5 * * * *', async () => {
  try {
    const keys = await redisClient.keys('heatmap:daily:*');
    if (keys.length === 0) return;

    console.log(`[Heatmap Flush] Starting at ${new Date().toISOString()}`);
    await flushDailyActivitiesToMongoDB();
    console.log(`[Heatmap Flush] Completed at ${new Date().toISOString()}`);
  } catch (err) {
    console.error('[Heatmap Flush] Job failed:', err);
  }
});

const startHeatmapFlushJob = () => {
  flushJob.start();
  console.log('Heatmap flush cron job started (every 5 minutes, only when data exists)');
};

const stopHeatmapFlushJob = () => {
  flushJob.stop();
  console.log('Heatmap flush cron job stopped');
};

module.exports = { startHeatmapFlushJob, stopHeatmapFlushJob };
const Bull = require('bull');
const config = require('../config');

// Parse Redis URL to extract host, port, and optionally password
const redisOptions = (() => {
  if (!config.redis.url) {
    console.error('REDIS_URL not defined, queues will not work');
    return null;
  }
  try {
    const url = new URL(config.redis.url);
    const host = url.hostname;
    const port = parseInt(url.port) || 6379;
    const db = config.redis.db || 0;
    const password = config.redis.password || (url.password ? decodeURIComponent(url.password) : undefined);
    return { host, port, password, db };
  } catch (err) {
    console.error('Invalid Redis URL:', err);
    return null;
  }
})();

if (!redisOptions) {
  console.error('Redis configuration missing, queues will not work');
}

// Create a single queue for all job types
const jobQueue = new Bull('devrhythm-jobs', { redis: redisOptions });

// Add error event listeners
jobQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

jobQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} (${job.data.type}) failed:`, err);
});

// Import the main processor that will dispatch based on job type
const { processJob } = require('./queueHandlers');

const startQueueWorkers = () => {
  if (!jobQueue) {
    console.error('Queue not available, workers not started');
    return;
  }
  try {
    jobQueue.process(processJob);
    console.log('Queue workers started');
  } catch (error) {
    console.error('Failed to start queue workers:', error);
  }
};

const stopQueueWorkers = async () => {
  if (jobQueue) await jobQueue.close();
  console.log('Queue workers stopped');
};

module.exports = {
  jobQueue,
  startQueueWorkers,
  stopQueueWorkers,
};
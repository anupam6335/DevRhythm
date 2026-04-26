require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Bull = require('bull');

// Build Redis options from environment variables
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error('REDIS_URL not defined in .env');
  process.exit(1);
}

const url = new URL(redisUrl);
const redisOptions = {
  host: url.hostname,
  port: parseInt(url.port) || 6379,
  password: url.password || process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB) || 0,
};

const jobQueue = new Bull('devrhythm-jobs', { redis: redisOptions });

async function removeStaleJob() {
  const repeatableJobs = await jobQueue.getRepeatableJobs();
  console.log('Found repeatable jobs:', repeatableJobs.map(j => ({ name: j.name, key: j.key })));
  
  const staleJob = repeatableJobs.find(job => job.name === 'flush-heatmap');
  if (staleJob) {
    await jobQueue.removeRepeatableByKey(staleJob.key);
    console.log(`Removed stale flush-heatmap job with key: ${staleJob.key}`);
  } else {
    console.log('No stale flush-heatmap job found');
  }
  await jobQueue.close();
  process.exit(0);
}

removeStaleJob();
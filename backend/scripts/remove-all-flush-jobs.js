require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Bull = require('bull');

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error('REDIS_URL not defined');
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

async function removeAllFlushJobs() {
  const repeatableJobs = await jobQueue.getRepeatableJobs();
  console.log('All repeatable jobs:', repeatableJobs.map(j => ({ name: j.name, key: j.key })));

  const toRemove = repeatableJobs.filter(job => job.name === 'flush-heatmap');
  if (toRemove.length === 0) {
    console.log('No flush-heatmap repeatable jobs found.');
  } else {
    for (const job of toRemove) {
      await jobQueue.removeRepeatableByKey(job.key);
      console.log(`Removed job with key: ${job.key}`);
    }
  }

  await jobQueue.close();
  process.exit(0);
}

removeAllFlushJobs();
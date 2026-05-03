const cron = require('cron');
const axios = require('axios');
const config = require('../config');
const { client: redisClient } = require('../config/redis');

const getTodayKey = () => {
  const today = new Date().toISOString().split('T')[0];
  return `daily_question_fetched:${today}`;
};

const fetchDailyQuestion = async () => {
  const key = getTodayKey();
  const alreadyFetched = await redisClient.get(key);
  if (alreadyFetched) {
    return;
  }

  // Force refresh to bypass LeetCode cache
  const url = `${config.backendUrl}/api/v1/questions/daily?refresh=true`;
  try {
    const response = await axios.get(url, {
      headers: { 'X-Internal-Request': 'true' },
      timeout: 30000,
    });

    if (response.status === 200) {
      const dailyDate = response.data?.data?.dailyProblem?.date;
      const todayUTC = new Date().toISOString().split('T')[0];

      if (dailyDate === todayUTC) {
        await redisClient.setEx(key, 86400, '1');
      } else {
        console.warn(`[DailyQuestion] Fetched problem date ${dailyDate} does not match today (${todayUTC}). Will retry next hour.`);
        // Do NOT set the Redis key – job will run again next hour
      }
    } else {
      console.error(`[DailyQuestion] Unexpected HTTP status: ${response.status}`);
    }
  } catch (error) {
    console.error('[DailyQuestion] Request failed:', error.message);
  }
};

const dailyQuestionJob = new cron.CronJob('0 * * * *', fetchDailyQuestion);

const startDailyQuestionJob = async () => {
  if (!redisClient) {
    console.warn('[DailyQuestion] Redis client not available, job not started');
    return;
  }
  // Run immediately on startup (if not already fetched today)
  await fetchDailyQuestion();
  // Then start the cron schedule
  dailyQuestionJob.start();
};

const stopDailyQuestionJob = () => {
  dailyQuestionJob.stop();
};

module.exports = {
  startDailyQuestionJob,
  stopDailyQuestionJob,
  fetchDailyQuestion,
};
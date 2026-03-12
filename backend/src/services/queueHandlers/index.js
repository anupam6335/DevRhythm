const { handleQuestionSolved } = require('./questionSolved.handler');
const { handleQuestionMastered } = require('./questionMastered.handler');
const { handleGoalCompleted } = require('./goalCompleted.handler');
const { handleFollowerNew } = require('./followerNew.handler');
const { handleRevisionCompleted } = require('./revisionCompleted.handler');

const processJob = async (job) => {
  const { type } = job.data;
  console.log(`Processing job type: ${type}, jobId: ${job.id}`);

  switch (type) {
    case 'question.solved':
      await handleQuestionSolved(job);
      break;
    case 'question.mastered':
      await handleQuestionMastered(job);
      break;
    case 'goal.completed':
      await handleGoalCompleted(job);
      break;
    case 'follower.new':
      await handleFollowerNew(job);
      break;
    case 'revision.completed':
      await handleRevisionCompleted(job);
      break;
    default:
      console.error(`Unknown job type: ${type}`);
      throw new Error(`Unknown job type: ${type}`);
  }
};

module.exports = { processJob };
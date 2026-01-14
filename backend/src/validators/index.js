const authValidator = require('./auth.validator');
const dayValidator = require('./day.validator');
const knowledgeGraphValidator = require('./knowledgeGraph.validator');
const questionValidator = require('./question.validator');
const revisionValidator = require('./revision.validator');
const studyPlanValidator = require('./studyPlan.validator');
const timerValidator = require('./timer.validator');
const userValidator = require('./user.validator');

module.exports = {
  auth: authValidator,
  day: dayValidator,
  knowledgeGraph: knowledgeGraphValidator,
  question: questionValidator,
  revision: revisionValidator,
  studyPlan: studyPlanValidator,
  timer: timerValidator,
  user: userValidator
};
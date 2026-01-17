const authValidator = require('./auth.validator');
const dayValidator = require('./day.validator');
const knowledgeGraphValidator = require('./knowledgeGraph.validator');
const questionValidator = require('./question.validator');
const revisionValidator = require('./revision.validator');
const studyPlanValidator = require('./studyPlan.validator');
const timerValidator = require('./timer.validator');
const userValidator = require('./user.validator');

const validators = {
  auth: authValidator,
  day: dayValidator,
  knowledgeGraph: knowledgeGraphValidator,
  question: questionValidator,
  revision: revisionValidator,
  studyPlan: studyPlanValidator,
  timer: timerValidator,
  user: userValidator,

  getValidator(module) {
    if (!this[module]) {
      throw new Error(`Validator for module '${module}' not found`);
    }
    return this[module];
  },

  validate(module, validationMethod, req, res, next) {
    const validator = this.getValidator(module);
    
    if (!validator[validationMethod]) {
      throw new Error(`Validation method '${validationMethod}' not found in ${module} validator`);
    }

    return validator[validationMethod](req, res, next);
  },

  middleware(module, validationMethod) {
    return (req, res, next) => {
      return this.validate(module, validationMethod, req, res, next);
    };
  }
};

module.exports = validators;
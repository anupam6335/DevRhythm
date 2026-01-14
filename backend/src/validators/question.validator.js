const Joi = require('joi');
const validation = require('../middleware/validation.middleware');
const constants = require('../config/constants');

class QuestionValidator {
  constructor() {
    this.schemas = this.initializeSchemas();
  }

  initializeSchemas() {
    return {
      createQuestion: Joi.object({
        title: Joi.string().max(500).required(),
        description: Joi.string().max(5000),
        platform: Joi.string().valid(...Object.values(constants.QUESTION.PLATFORMS)).required(),
        platformId: Joi.string().max(100),
        primaryLink: Joi.string().uri().max(2000).required(),
        resourceLinks: Joi.array().items(Joi.string().uri().max(2000)),
        difficulty: Joi.string().valid(...Object.values(constants.QUESTION.DIFFICULTY)).required(),
        tags: Joi.array().items(Joi.string().max(50)),
        problemType: Joi.array().items(Joi.string().max(100)),
        dataStructure: Joi.array().items(Joi.string().max(100)),
        algorithmCategory: Joi.array().items(Joi.string().max(100)),
        companyTags: Joi.array().items(Joi.string().max(100)),
        frequencyTag: Joi.string().valid('high', 'medium', 'low'),
        inLists: Joi.array().items(
          Joi.object({
            listName: Joi.string().max(100),
            listId: Joi.string().max(100)
          })
        ),
        status: Joi.string().valid(...Object.values(constants.QUESTION.STATUS)).default('pending'),
        confidenceScore: Joi.number().integer().min(1).max(5),
        personalRating: Joi.number().integer().min(1).max(5),
        understandingLevel: Joi.string().valid('memorized', 'understood', 'mastered'),
        notes: Joi.string().max(10000),
        solutionCode: Joi.string().max(10000),
        solutionExplanation: Joi.string().max(10000),
        dayId: validation.getSchema('objectId'),
        prerequisites: Joi.array().items(validation.getSchema('objectId')),
        relatedQuestions: Joi.array().items(validation.getSchema('objectId')),
        orderIndex: Joi.number().integer().min(0),
        isPinned: Joi.boolean().default(false)
      }),

      updateQuestion: Joi.object({
        title: Joi.string().max(500),
        description: Joi.string().max(5000),
        platform: Joi.string().valid(...Object.values(constants.QUESTION.PLATFORMS)),
        platformId: Joi.string().max(100),
        primaryLink: Joi.string().uri().max(2000),
        resourceLinks: Joi.array().items(Joi.string().uri().max(2000)),
        difficulty: Joi.string().valid(...Object.values(constants.QUESTION.DIFFICULTY)),
        tags: Joi.array().items(Joi.string().max(50)),
        problemType: Joi.array().items(Joi.string().max(100)),
        dataStructure: Joi.array().items(Joi.string().max(100)),
        algorithmCategory: Joi.array().items(Joi.string().max(100)),
        companyTags: Joi.array().items(Joi.string().max(100)),
        frequencyTag: Joi.string().valid('high', 'medium', 'low'),
        status: Joi.string().valid(...Object.values(constants.QUESTION.STATUS)),
        solvedAt: Joi.date().iso(),
        firstAttemptTime: Joi.number().integer().min(0),
        confidenceScore: Joi.number().integer().min(1).max(5),
        personalRating: Joi.number().integer().min(1).max(5),
        understandingLevel: Joi.string().valid('memorized', 'understood', 'mastered'),
        notes: Joi.string().max(10000),
        solutionCode: Joi.string().max(10000),
        solutionExplanation: Joi.string().max(10000),
        prerequisites: Joi.array().items(validation.getSchema('objectId')),
        relatedQuestions: Joi.array().items(validation.getSchema('objectId')),
        orderIndex: Joi.number().integer().min(0),
        isPinned: Joi.boolean(),
        lastRevisedAt: Joi.date().iso(),
        revisionCount: Joi.number().integer().min(0),
        nextRevisionDue: Joi.date().iso()
      }),

      questionQuery: validation.getSchema('pagination').append({
        dayId: validation.getSchema('objectId'),
        status: Joi.string().valid(...Object.values(constants.QUESTION.STATUS)),
        difficulty: Joi.array().items(Joi.string().valid(...Object.values(constants.QUESTION.DIFFICULTY))),
        platform: Joi.array().items(Joi.string().valid(...Object.values(constants.QUESTION.PLATFORMS))),
        tags: Joi.array().items(Joi.string().max(50)),
        companyTags: Joi.array().items(Joi.string().max(100)),
        problemType: Joi.array().items(Joi.string().max(100)),
        confidenceMin: Joi.number().integer().min(1).max(5),
        confidenceMax: Joi.number().integer().min(1).max(5).min(Joi.ref('confidenceMin')),
        personalRatingMin: Joi.number().integer().min(1).max(5),
        personalRatingMax: Joi.number().integer().min(1).max(5).min(Joi.ref('personalRatingMin')),
        isPinned: Joi.boolean(),
        hasSolution: Joi.boolean(),
        hasRevisionDue: Joi.boolean(),
        sortBy: Joi.string().valid('createdAt', 'updatedAt', 'solvedAt', 'confidenceScore', 'personalRating', 'orderIndex').default('orderIndex'),
        order: Joi.string().valid('asc', 'desc').default('asc')
      }),

      questionStatus: Joi.object({
        status: Joi.string().valid(...Object.values(constants.QUESTION.STATUS)).required(),
        solvedAt: Joi.date().iso(),
        firstAttemptTime: Joi.number().integer().min(0)
      }),

      questionSolution: Joi.object({
        solutionCode: Joi.string().max(10000),
        solutionExplanation: Joi.string().max(10000),
        confidenceScore: Joi.number().integer().min(1).max(5),
        understandingLevel: Joi.string().valid('memorized', 'understood', 'mastered')
      }),

      bulkQuestionCreate: Joi.array().items(
        Joi.object({
          title: Joi.string().max(500).required(),
          platform: Joi.string().valid(...Object.values(constants.QUESTION.PLATFORMS)).required(),
          primaryLink: Joi.string().uri().max(2000).required(),
          difficulty: Joi.string().valid(...Object.values(constants.QUESTION.DIFFICULTY)).required(),
          tags: Joi.array().items(Joi.string().max(50))
        })
      ).max(50),

      questionImport: Joi.object({
        url: Joi.string().uri().max(2000).required(),
        platform: Joi.string().valid(...Object.values(constants.QUESTION.PLATFORMS)),
        dayId: validation.getSchema('objectId'),
        tags: Joi.array().items(Joi.string().max(50))
      })
    };
  }

  validateCreateQuestion() {
    return validation.validateBody(this.schemas.createQuestion);
  }

  validateUpdateQuestion() {
    return validation.validateBody(this.schemas.updateQuestion);
  }

  validateQuestionQuery() {
    return validation.validateQuery(this.schemas.questionQuery);
  }

  validateQuestionStatus() {
    return validation.validateBody(this.schemas.questionStatus);
  }

  validateQuestionSolution() {
    return validation.validateBody(this.schemas.questionSolution);
  }

  validateBulkQuestionCreate() {
    return validation.validateBody(this.schemas.bulkQuestionCreate);
  }

  validateQuestionImport() {
    return validation.validateBody(this.schemas.questionImport);
  }

  getSchema(name) {
    return this.schemas[name];
  }
}

const questionValidator = new QuestionValidator();
module.exports = questionValidator;
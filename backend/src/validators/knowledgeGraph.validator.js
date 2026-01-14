const Joi = require('joi');
const validation = require('../middleware/validation.middleware');
const constants = require('../config/constants');

class KnowledgeGraphValidator {
  constructor() {
    this.schemas = this.initializeSchemas();
  }

  initializeSchemas() {
    return {
      nodeCreate: Joi.object({
        nodeId: Joi.string().max(100),
        type: Joi.string().valid(...Object.values(constants.KNOWLEDGE_GRAPH.NODE_TYPES)).required(),
        label: Joi.string().max(255).required(),
        description: Joi.string().max(1000),
        hierarchyLevel: Joi.number().integer().min(0).default(0),
        topicData: Joi.object({
          category: Joi.string().max(100),
          parentTopic: Joi.string().max(100),
          childTopics: Joi.array().items(Joi.string().max(100)),
          prerequisiteTopics: Joi.array().items(Joi.string().max(100))
        }),
        progress: Joi.object({
          totalQuestions: Joi.number().integer().min(0),
          solvedQuestions: Joi.number().integer().min(0),
          completionPercentage: Joi.number().integer().min(0).max(100),
          confidenceScore: Joi.number().min(0).max(1),
          masteryLevel: Joi.string().valid(...Object.values(constants.KNOWLEDGE_GRAPH.MASTERY_LEVELS))
        }),
        visualization: Joi.object({
          position: Joi.object({
            x: Joi.number(),
            y: Joi.number()
          }),
          size: Joi.number().min(0.1).max(10),
          color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
          isExpanded: Joi.boolean(),
          isVisible: Joi.boolean()
        })
      }),

      nodeUpdate: Joi.object({
        label: Joi.string().max(255),
        description: Joi.string().max(1000),
        progress: Joi.object({
          totalQuestions: Joi.number().integer().min(0),
          solvedQuestions: Joi.number().integer().min(0),
          completionPercentage: Joi.number().integer().min(0).max(100),
          confidenceScore: Joi.number().min(0).max(1),
          masteryLevel: Joi.string().valid(...Object.values(constants.KNOWLEDGE_GRAPH.MASTERY_LEVELS))
        }),
        visualization: Joi.object({
          position: Joi.object({
            x: Joi.number(),
            y: Joi.number()
          }),
          size: Joi.number().min(0.1).max(10),
          color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
          isExpanded: Joi.boolean(),
          isVisible: Joi.boolean()
        }),
        customNotes: Joi.string().max(5000),
        isBookmarked: Joi.boolean(),
        priority: Joi.string().valid('high', 'medium', 'low')
      }),

      edgeCreate: Joi.object({
        edgeId: Joi.string().max(100),
        sourceNodeId: Joi.string().max(100).required(),
        targetNodeId: Joi.string().max(100).required(),
        type: Joi.string().valid(...Object.values(constants.KNOWLEDGE_GRAPH.EDGE_TYPES)).required(),
        strength: Joi.number().min(0).max(1).default(0.5),
        label: Joi.string().max(255),
        learningPathData: Joi.object({
          isRequired: Joi.boolean().default(true),
          recommendedOrder: Joi.number().integer().min(0),
          difficultyProgression: Joi.string().max(50)
        })
      }),

      graphQuery: validation.getSchema('pagination').append({
        nodeType: Joi.string().valid(...Object.values(constants.KNOWLEDGE_GRAPH.NODE_TYPES)),
        masteryLevel: Joi.string().valid(...Object.values(constants.KNOWLEDGE_GRAPH.MASTERY_LEVELS)),
        confidenceMin: Joi.number().min(0).max(1),
        confidenceMax: Joi.number().min(0).max(1).min(Joi.ref('confidenceMin')),
        completionMin: Joi.number().integer().min(0).max(100),
        completionMax: Joi.number().integer().min(0).max(100).min(Joi.ref('completionMin')),
        isBookmarked: Joi.boolean(),
        priority: Joi.string().valid('high', 'medium', 'low')
      }),

      gapAnalysis: Joi.object({
        severity: Joi.string().valid('high', 'medium', 'low'),
        gapType: Joi.string().valid('prerequisite', 'weakness', 'missing')
      }),

      recommendationQuery: Joi.object({
        priority: Joi.string().valid('high', 'medium', 'low'),
        recommendationType: Joi.string().valid('focus', 'prerequisite', 'next-step', 'review', 'challenge'),
        limit: Joi.number().integer().min(1).max(50).default(10)
      }),

      learningPath: Joi.object({
        startNodeId: Joi.string().max(100),
        includePrerequisites: Joi.boolean().default(true),
        maxDepth: Joi.number().integer().min(1).max(10).default(5)
      }),

      filterState: Joi.object({
        difficultyFilter: Joi.array().items(Joi.string().valid('easy', 'medium', 'hard')),
        statusFilter: Joi.array().items(Joi.string().valid('pending', 'done', 'not-solved', 'partially-solved', 'need-help')),
        confidenceRange: Joi.object({
          min: Joi.number().min(0).max(1),
          max: Joi.number().min(0).max(1).min(Joi.ref('min'))
        }),
        visibleNodeTypes: Joi.array().items(Joi.string().valid(...Object.values(constants.KNOWLEDGE_GRAPH.NODE_TYPES)))
      })
    };
  }

  validateNodeCreate() {
    return validation.validateBody(this.schemas.nodeCreate);
  }

  validateNodeUpdate() {
    return validation.validateBody(this.schemas.nodeUpdate);
  }

  validateEdgeCreate() {
    return validation.validateBody(this.schemas.edgeCreate);
  }

  validateGraphQuery() {
    return validation.validateQuery(this.schemas.graphQuery);
  }

  validateGapAnalysis() {
    return validation.validateQuery(this.schemas.gapAnalysis);
  }

  validateRecommendationQuery() {
    return validation.validateQuery(this.schemas.recommendationQuery);
  }

  validateLearningPath() {
    return validation.validateQuery(this.schemas.learningPath);
  }

  validateFilterState() {
    return validation.validateBody(this.schemas.filterState);
  }

  getSchema(name) {
    return this.schemas[name];
  }
}

const knowledgeGraphValidator = new KnowledgeGraphValidator();
module.exports = knowledgeGraphValidator;
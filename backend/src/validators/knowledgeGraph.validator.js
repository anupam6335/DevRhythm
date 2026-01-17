const Joi = require('joi');
const constants = require('../config/constants');

const knowledgeGraphValidator = {
  node: Joi.object({
    nodeId: Joi.string().optional(),
    type: Joi.string().valid('topic', 'subtopic', 'concept', 'question', 'skill', 'prerequisite').required(),
    label: Joi.string().required(),
    description: Joi.string().optional(),
    hierarchyLevel: Joi.number().integer().min(0).default(0),
    topicData: Joi.object({
      category: Joi.string().optional(),
      parentTopic: Joi.string().optional(),
      childTopics: Joi.array().items(Joi.string()).optional(),
      prerequisiteTopics: Joi.array().items(Joi.string()).optional()
    }).optional(),
    progress: Joi.object({
      totalQuestions: Joi.number().integer().min(0).default(0),
      solvedQuestions: Joi.number().integer().min(0).default(0),
      confidenceScore: Joi.number().min(0).max(1).default(0),
      masteryLevel: Joi.string().valid('novice', 'beginner', 'intermediate', 'advanced', 'master').default('novice')
    }).optional(),
    visualization: Joi.object({
      position: Joi.object({
        x: Joi.number().default(0),
        y: Joi.number().default(0)
      }).optional(),
      size: Joi.number().default(1),
      color: Joi.string().optional(),
      isExpanded: Joi.boolean().default(false),
      isVisible: Joi.boolean().default(true)
    }).optional(),
    customNotes: Joi.string().optional(),
    isBookmarked: Joi.boolean().default(false),
    priority: Joi.string().valid('high', 'medium', 'low').default('medium')
  }),

  edge: Joi.object({
    edgeId: Joi.string().optional(),
    sourceNodeId: Joi.string().required(),
    targetNodeId: Joi.string().required(),
    type: Joi.string().valid('prerequisite', 'related', 'child-parent', 'similar', 'dependency').required(),
    strength: Joi.number().min(0).max(1).default(1),
    label: Joi.string().optional(),
    learningPathData: Joi.object({
      isRequired: Joi.boolean().default(true),
      recommendedOrder: Joi.number().integer().optional(),
      difficultyProgression: Joi.string().optional()
    }).optional()
  }),

  gapAnalysis: Joi.object({
    nodeId: Joi.string().required(),
    gapType: Joi.string().valid('prerequisite', 'weakness', 'missing').required(),
    severity: Joi.string().valid('high', 'medium', 'low').required(),
    reason: Joi.string().required(),
    suggestedActions: Joi.array().items(Joi.string()).optional()
  }),

  filter: Joi.object({
    difficultyFilter: Joi.array().items(Joi.string()).optional(),
    statusFilter: Joi.array().items(Joi.string()).optional(),
    confidenceRange: Joi.object({
      min: Joi.number().min(0).max(1).default(0),
      max: Joi.number().min(0).max(1).default(1)
    }).optional(),
    visibleNodeTypes: Joi.array().items(Joi.string()).optional()
  }),

  learningPath: Joi.object({
    startNodeId: Joi.string().optional(),
    targetMastery: Joi.string().valid('novice', 'beginner', 'intermediate', 'advanced', 'master').optional(),
    timeLimit: Joi.number().integer().min(1).optional()
  }),

  validateNode(req, res, next) {
    const { error } = this.node.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid node data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateEdge(req, res, next) {
    const { error } = this.edge.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid edge data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateGapAnalysis(req, res, next) {
    const { error } = this.gapAnalysis.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid gap analysis data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateFilter(req, res, next) {
    const { error } = this.filter.validate(req.body);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid filter data',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  },

  validateLearningPath(req, res, next) {
    const { error } = this.learningPath.validate(req.query);
    if (error) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Invalid learning path parameters',
          code: constants.ERROR_CODES.VALIDATION_ERROR,
          details: error.details
        }
      });
    }
    next();
  }
};

module.exports = knowledgeGraphValidator;
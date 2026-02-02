const Joi = require('joi');

const getGoals = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  goalType: Joi.string().valid("daily", "weekly"),
  status: Joi.string().valid("active", "completed", "failed"),
  startDate: Joi.date(),
  endDate: Joi.date(),
  sortBy: Joi.string().valid("startDate", "endDate", "completionPercentage", "createdAt").default("startDate"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc")
});

const getGoalById = Joi.object({
  id: Joi.string().hex().length(24).required()
});

const createGoal = Joi.object({
  goalType: Joi.string().valid("daily", "weekly").required(),
  targetCount: Joi.number().integer().min(1).max(100).required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required().greater(Joi.ref("startDate"))
});

const updateGoal = Joi.object({
  targetCount: Joi.number().integer().min(1).max(100),
  startDate: Joi.date(),
  endDate: Joi.date()
});

const incrementGoal = Joi.object({
  amount: Joi.number().integer().min(1).max(10).default(1)
});

const decrementGoal = Joi.object({
  amount: Joi.number().integer().min(1).max(10).default(1)
});

const setGoalProgress = Joi.object({
  completedCount: Joi.number().integer().min(0).required()
});

const autoCreateGoals = Joi.object({
  date: Joi.date().default(() => new Date().toISOString().split("T")[0]),
  goalType: Joi.string().valid("daily", "weekly")
});

const deleteGoal = Joi.object({
  id: Joi.string().hex().length(24).required()
});

const getStats = Joi.object({
  startDate: Joi.date(),
  endDate: Joi.date(),
  goalType: Joi.string().valid("daily", "weekly")
});

const getHistory = Joi.object({
  period: Joi.alternatives().try(
    Joi.string().pattern(/^\d{2}-\d{4}$/).messages({
      'string.pattern.base': 'Period must be in MM-YYYY format (e.g., 01-2025)'
    }),
    Joi.string().pattern(/^\d{4}$/).messages({
      'string.pattern.base': 'Period must be in YYYY format (e.g., 2025)'
    })
  ),
  from: Joi.date().messages({
    'date.base': 'From date must be a valid date in YYYY-MM-DD format'
  }),
  to: Joi.date().messages({
    'date.base': 'To date must be a valid date in YYYY-MM-DD format'
  }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  goalType: Joi.string().valid("daily", "weekly")
}).custom((value, helpers) => {
  const { period, from, to } = value;
  
  if (period && (from || to)) {
    return helpers.error("any.invalid", {
      message: "Cannot use both 'period' and 'from/to' parameters together. Use either 'period' OR 'from' and 'to'."
    });
  }
  
  if (!period && (!from || !to)) {
    return helpers.error("any.required", {
      message: "Must provide either 'period' (MM-YYYY or YYYY) OR both 'from' and 'to' date parameters."
    });
  }
  
  if (from && to && new Date(from) > new Date(to)) {
    return helpers.error("any.invalid", {
      message: "'from' date must be before or equal to 'to' date."
    });
  }
  
  if (period && period.match(/^\d{2}-\d{4}$/)) {
    const [month, year] = period.split("-").map(Number);
    
    if (month < 1 || month > 12) {
      return helpers.error("any.invalid", {
        message: "Month must be between 01 and 12."
      });
    }
    
    const currentYear = new Date().getFullYear();
    if (year < 2025 || year > currentYear + 10) {
      return helpers.error("any.invalid", {
        message: `Year must be between 2025 and ${currentYear + 10}.`
      });
    }
  }
  
  if (period && period.match(/^\d{4}$/)) {
    const year = Number(period);
    const currentYear = new Date().getFullYear();
    
    if (year < 2025 || year > currentYear + 10) {
      return helpers.error("any.invalid", {
        message: `Year must be between 2025 and ${currentYear + 10}.`
      });
    }
  }
  
  return value;
}).messages({
  'any.invalid': '{{#label}} {{#message}}',
  'any.required': '{{#label}} {{#message}}',
  'any.custom': '{{#error.message}}'
});

const getToday = Joi.object({
  date: Joi.date().default(() => new Date().toISOString().split("T")[0])
});

const getProgress = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('Not Started', 'Attempted', 'Solved', 'Mastered'),
  questionId: Joi.string().hex().length(24),
  sortBy: Joi.string().valid('updatedAt', 'createdAt', 'lastRevisedAt', 'attempts.count', 'confidenceLevel').default('updatedAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  minConfidence: Joi.number().integer().min(1).max(5),
  maxConfidence: Joi.number().integer().min(1).max(5)
});

const getQuestionProgress = Joi.object({
  questionId: Joi.string().hex().length(24).required()
});

const createOrUpdateProgress = Joi.object({
  status: Joi.string().valid('Not Started', 'Attempted', 'Solved', 'Mastered'),
  notes: Joi.string().allow('').max(5000),
  keyInsights: Joi.string().allow('').max(1000),
  savedCode: Joi.object({
    language: Joi.string().required(),
    code: Joi.string().required()
  }),
  confidenceLevel: Joi.number().integer().min(1).max(5),
  timeSpent: Joi.number().integer().min(0).max(480)
});

const updateStatus = Joi.object({
  status: Joi.string().valid('Not Started', 'Attempted', 'Solved', 'Mastered').required()
});

const updateCode = Joi.object({
  language: Joi.string().required(),
  code: Joi.string().required()
});

const updateNotes = Joi.object({
  notes: Joi.string().allow('').max(5000),
  keyInsights: Joi.string().allow('').max(1000)
});

const updateConfidence = Joi.object({
  confidenceLevel: Joi.number().integer().min(1).max(5).required()
});

const recordAttempt = Joi.object({
  timeSpent: Joi.number().integer().min(0).max(480).default(0),
  successful: Joi.boolean().default(false)
});

const recordRevision = Joi.object({
  timeSpent: Joi.number().integer().min(0).max(480).default(0),
  confidenceLevel: Joi.number().integer().min(1).max(5)
});

const deleteProgress = Joi.object({
  questionId: Joi.string().hex().length(24).required()
});

const getRecentProgress = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(10)
});

const getRevisions = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('active', 'completed', 'overdue'),
  questionId: Joi.string().hex().length(24),
  sortBy: Joi.string().valid('schedule', 'baseDate', 'currentRevisionIndex', 'updatedAt').default('schedule'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

const getUpcoming = Joi.object({
  startDate: Joi.date().default(() => new Date().toISOString().split('T')[0]),
  endDate: Joi.date().default(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  })
});

const getQuestionRevision = Joi.object({
  questionId: Joi.string().hex().length(24).required()
});

const createRevision = Joi.object({
  baseDate: Joi.date().default(() => new Date()),
  schedule: Joi.array().items(Joi.date()).length(5).optional()
});

const completeRevision = Joi.object({
  completedAt: Joi.date().default(() => new Date()),
  status: Joi.string().valid('completed', 'skipped').default('completed'),
  confidenceLevel: Joi.number().integer().min(1).max(5)
});

const rescheduleRevision = Joi.object({
  newDate: Joi.date().required(),
  revisionIndex: Joi.number().integer().min(0).max(4).required()
});

const getOverdue = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

module.exports = {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  incrementGoal,
  decrementGoal,
  setGoalProgress,
  autoCreateGoals,
  deleteGoal,
  getStats,
  getHistory,
  getToday,
  getProgress,
  getQuestionProgress,
  createOrUpdateProgress,
  updateStatus,
  updateCode,
  updateNotes,
  updateConfidence,
  recordAttempt,
  recordRevision,
  deleteProgress,
  getRecentProgress,
  getRevisions,
  getUpcoming,
  getQuestionRevision,
  createRevision,
  completeRevision,
  rescheduleRevision,
  getOverdue
};